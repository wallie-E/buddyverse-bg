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

    // 检查用户今天是否已经发布过帖子
    const [todayPosts] = await pool.execute(
      'SELECT id FROM posts WHERE user_id = ? AND status = "active" AND DATE(created_at) = CURDATE()',
      [userId]
    );

    if (todayPosts.length > 0) {
      return error(res, '每天只能发布一条帖子，请明天再试', 403);
    }

    // 查询用户信息（用于冗余存储）
    const [users] = await pool.execute(
      'SELECT nickname, gender FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return error(res, '用户不存在', 404);
    }

    const user = users[0];

    // 创建帖子（包含冗余的用户信息）
    const [result] = await pool.execute(
      'INSERT INTO posts (user_id, author_nickname, author_gender, content, location, category_id, subcategory_id, comment_visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, user.nickname, user.gender, content, location || null, category_id, subcategory_id, comment_visibility || 'public']
    );

    const postId = result.insertId;

    // 查询创建的帖子详情
    const [posts] = await pool.execute(`
      SELECT 
        p.id, p.content, p.location, p.comment_visibility, p.comment_count, p.created_at,
        p.author_nickname as author_name,
        p.author_gender as author_gender,
        pc.name as category_name,
        ps.name as subcategory_name
      FROM posts p
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
    const location = req.query.location;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];

    // 始终包含基础条件
    whereConditions.push('p.status = "active"');

    if (category_id) {
      whereConditions.push('p.category_id = ?');
      queryParams.push(category_id);
    }

    if (subcategory_id) {
      whereConditions.push('p.subcategory_id = ?');
      queryParams.push(subcategory_id);
    }

    if (location) {
      whereConditions.push('p.location LIKE ?');
      queryParams.push(`%${location}%`);
    }

    // 处理空WHERE子句的情况
    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // 查询总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM posts p ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;
   

    // 查询帖子列表（使用冗余存储的用户信息）
    const sqlQuery = `
      SELECT 
        p.id, p.user_id, p.content, p.location, p.comment_count, p.comment_visibility, p.created_at,
        p.author_nickname as author_name,
        p.author_gender as author_gender,
        pc.name as category_name,
        ps.name as subcategory_name
      FROM posts p
      LEFT JOIN post_categories pc ON p.category_id = pc.id
      LEFT JOIN post_subcategories ps ON p.subcategory_id = ps.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;


    // 正确传递参数：基础参数 + limit/offset
    const [posts] = await pool.execute(
      sqlQuery,
      [...queryParams, `${limit}`, `${offset}`] // 保持参数顺序
    );

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
        p.author_nickname as author_name,
        p.author_gender as author_gender,
        pc.name as category_name,
        ps.name as subcategory_name
      FROM posts p
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