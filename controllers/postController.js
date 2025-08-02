const { pool } = require('../config/database');
const { success, error, paginate } = require('../utils/response');
const { validateCreatePost } = require('../utils/validation');

/**
 * 创建帖子
 */
const createPost = async (req, res) => {
  try {
    const { error: validationError } = validateCreatePost(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    const userId = req.user.id;
    const { content, location, category_id, subcategory_id, comment_visibility } = req.body;

    // 验证分类是否存在
    const [categories] = await pool.execute(
      'SELECT id FROM post_categories WHERE id = ? AND status = "active"',
      [category_id]
    );

    if (categories.length === 0) {
      return error(res, '分类不存在', 400);
    }

    // 验证细分类型是否存在且属于该分类
    const [subcategories] = await pool.execute(
      'SELECT id FROM post_subcategories WHERE id = ? AND category_id = ? AND status = "active"',
      [subcategory_id, category_id]
    );

    if (subcategories.length === 0) {
      return error(res, '细分类型不存在或不属于该分类', 400);
    }

    // 创建帖子
    const [result] = await pool.execute(
      'INSERT INTO posts (user_id, content, location, category_id, subcategory_id, comment_visibility) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, content, location || null, category_id, subcategory_id, comment_visibility || 'public']
    );

    const postId = result.insertId;

    // 查询创建的帖子详情
    const [posts] = await pool.execute(`
      SELECT 
        p.id, p.content, p.location, p.comment_visibility, p.comment_count, p.created_at,
        u.nickname as author_name,
        pc.name as category_name,
        ps.name as subcategory_name
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN post_categories pc ON p.category_id = pc.id
      LEFT JOIN post_subcategories ps ON p.subcategory_id = ps.id
      WHERE p.id = ?
    `, [postId]);

    return success(res, posts[0], '发布成功', 201);
  } catch (err) {
    console.error('创建帖子失败:', err);
    return error(res, '发布失败', 500);
  }
};

/**
 * 获取帖子列表
 */
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category_id = req.query.category_id;
    const subcategory_id = req.query.subcategory_id;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereConditions = ['p.status = "active"'];
    let queryParams = [];

    if (category_id) {
      whereConditions.push('p.category_id = ?');
      queryParams.push(category_id);
    }

    if (subcategory_id) {
      whereConditions.push('p.subcategory_id = ?');
      queryParams.push(subcategory_id);
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询帖子总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM posts p WHERE ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // 查询帖子列表
    const [posts] = await pool.execute(`
      SELECT 
        p.id, p.content, p.location, p.comment_count, p.created_at,
        u.nickname as author_name,
        pc.name as category_name,
        ps.name as subcategory_name
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN post_categories pc ON p.category_id = pc.id
      LEFT JOIN post_subcategories ps ON p.subcategory_id = ps.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    return paginate(res, posts, total, page, limit);
  } catch (err) {
    console.error('获取帖子列表失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 获取帖子详情
 */
const getPostDetail = async (req, res) => {
  try {
    const postId = req.params.id;

    const [posts] = await pool.execute(`
      SELECT 
        p.id, p.content, p.location, p.comment_visibility, p.comment_count, p.created_at,
        p.user_id,
        u.nickname as author_name,
        pc.name as category_name,
        ps.name as subcategory_name
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN post_categories pc ON p.category_id = pc.id
      LEFT JOIN post_subcategories ps ON p.subcategory_id = ps.id
      WHERE p.id = ? AND p.status = "active"
    `, [postId]);

    if (posts.length === 0) {
      return error(res, '帖子不存在', 404);
    }

    return success(res, posts[0], '获取成功');
  } catch (err) {
    console.error('获取帖子详情失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 删除帖子（仅作者或管理员）
 */
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 查询帖子信息
    const [posts] = await pool.execute(
      'SELECT user_id FROM posts WHERE id = ? AND status = "active"',
      [postId]
    );

    if (posts.length === 0) {
      return error(res, '帖子不存在', 404);
    }

    const post = posts[0];

    // 检查权限（只有作者或管理员可以删除）
    if (post.user_id !== userId && userRole !== 'admin') {
      return error(res, '没有权限删除此帖子', 403);
    }

    // 软删除帖子
    await pool.execute(
      'UPDATE posts SET status = "deleted" WHERE id = ?',
      [postId]
    );

    return success(res, null, '删除成功');
  } catch (err) {
    console.error('删除帖子失败:', err);
    return error(res, '删除失败', 500);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostDetail,
  deletePost
}; 