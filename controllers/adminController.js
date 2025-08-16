const { pool } = require('../config/database');
const { success, error, paginate } = require('../utils/response');

/**
 * 获取所有用户列表
 */
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // active, inactive, banned
    const role = req.query.role; // user, admin
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];

    if (status) {
      whereConditions.push('status = ?');
      queryParams.push(status);
    }

    if (role) {
      whereConditions.push('role = ?');
      queryParams.push(role);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 查询用户总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // 查询用户列表
    const [users] = await pool.execute(`
      SELECT id, email, nickname, gender, role, status, created_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, `${limit}`, `${offset}`]);

    return paginate(res, users, total, page, limit);
  } catch (err) {
    console.error('获取用户列表失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 获取所有帖子列表
 */
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // active, deleted
    const category_id = req.query.category_id;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];

    if (status) {
      whereConditions.push('p.status = ?');
      queryParams.push(status);
    }

    if (category_id) {
      whereConditions.push('p.category_id = ?');
      queryParams.push(category_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 查询帖子总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM posts p ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // 查询帖子列表
    const [posts] = await pool.execute(`
      SELECT 
        p.id, p.content, p.location, p.comment_count, p.comment_visibility, p.status, p.created_at,
        u.nickname as author_name, u.email as author_email,
        pc.name as category_name,
        ps.name as subcategory_name
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN post_categories pc ON p.category_id = pc.id
      LEFT JOIN post_subcategories ps ON p.subcategory_id = ps.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, `${limit}`, `${offset}`]);

    return paginate(res, posts, total, page, limit);
  } catch (err) {
    console.error('获取帖子列表失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 获取所有评论列表
 */
const getComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // active, deleted
    const post_id = req.query.post_id;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];

    if (status) {
      whereConditions.push('c.status = ?');
      queryParams.push(status);
    }

    if (post_id) {
      whereConditions.push('c.post_id = ?');
      queryParams.push(post_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 查询评论总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM comments c ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // 查询评论列表
    const [comments] = await pool.execute(`
      SELECT 
        c.id, c.content, c.parent_id, c.status, c.created_at,
        u.nickname as author_name, u.email as author_email,
        p.id as post_id, p.content as post_content
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN posts p ON c.post_id = p.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, `${limit}`, `${offset}`]);

    return paginate(res, comments, total, page, limit);
  } catch (err) {
    console.error('获取评论列表失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 删除用户
 */
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // 检查用户是否存在
    const [users] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return error(res, '用户不存在', 404);
    }

    // 不能删除管理员
    if (users[0].role === 'admin') {
      return error(res, '不能删除管理员账户', 403);
    }

    // 开启事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 软删除用户的帖子
      await connection.execute(
        'UPDATE posts SET status = "deleted" WHERE user_id = ?',
        [userId]
      );

      // 软删除用户的评论
      await connection.execute(
        'UPDATE comments SET status = "deleted" WHERE user_id = ?',
        [userId]
      );

      // 删除用户的通知
      await connection.execute(
        'DELETE FROM notifications WHERE user_id = ?',
        [userId]
      );

      // 删除用户
      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );

      await connection.commit();

      return success(res, null, '删除成功');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('删除用户失败:', err);
    return error(res, '删除失败', 500);
  }
};

/**
 * 禁用/启用用户
 */
const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body; // active, inactive, banned

    if (!['active', 'inactive', 'banned'].includes(status)) {
      return error(res, '状态值无效', 400);
    }

    // 检查用户是否存在
    const [users] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return error(res, '用户不存在', 404);
    }

    // 不能修改管理员状态
    if (users[0].role === 'admin') {
      return error(res, '不能修改管理员状态', 403);
    }

    // 更新用户状态
    await pool.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );

    return success(res, null, '状态更新成功');
  } catch (err) {
    console.error('更新用户状态失败:', err);
    return error(res, '更新失败', 500);
  }
};

/**
 * 删除帖子
 */
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    // 检查帖子是否存在
    const [posts] = await pool.execute(
      'SELECT id FROM posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return error(res, '帖子不存在', 404);
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

/**
 * 删除评论
 */
const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;

    // 检查评论是否存在
    const [comments] = await pool.execute(
      'SELECT id, post_id FROM comments WHERE id = ?',
      [commentId]
    );

    if (comments.length === 0) {
      return error(res, '评论不存在', 404);
    }

    const comment = comments[0];

    // 开启事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 软删除评论及其回复
      await connection.execute(
        'UPDATE comments SET status = "deleted" WHERE id = ? OR parent_id = ?',
        [commentId, commentId]
      );

      // 更新帖子评论数
      const [deletedCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM comments WHERE (id = ? OR parent_id = ?) AND status = "deleted"',
        [commentId, commentId]
      );

      await connection.execute(
        'UPDATE posts SET comment_count = comment_count - ? WHERE id = ?',
        [deletedCount[0].count, comment.post_id]
      );

      await connection.commit();

      return success(res, null, '删除成功');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('删除评论失败:', err);
    return error(res, '删除失败', 500);
  }
};

/**
 * 获取统计数据
 */
const getStats = async (req, res) => {
  try {
    // 获取用户统计
    const [userStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users
      FROM users
    `);

    // 获取帖子统计
    const [postStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_posts,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_posts
      FROM posts
    `);

    // 获取评论统计
    const [commentStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_comments,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_comments,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_comments
      FROM comments
    `);

    const stats = {
      users: userStats[0],
      posts: postStats[0],
      comments: commentStats[0]
    };

    return success(res, stats, '获取统计数据成功');
  } catch (err) {
    console.error('获取统计数据失败:', err);
    return error(res, '获取失败', 500);
  }
};

module.exports = {
  getUsers,
  getPosts,
  getComments,
  deleteUser,
  toggleUserStatus,
  deletePost,
  deleteComment,
  getStats
}; 