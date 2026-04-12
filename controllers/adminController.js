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
    const search = req.query.search; // 搜索关键词（用户名称或邮箱）
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];

    if (status) {
      whereConditions.push('u.status = ?');
      queryParams.push(status);
    }

    if (role) {
      whereConditions.push('u.role = ?');
      queryParams.push(role);
    }

    // 添加搜索条件
    if (search) {
      whereConditions.push('(u.nickname LIKE ? OR u.email LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 查询用户总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // 查询用户列表（包含帖子数量）
    const [users] = await pool.execute(`
      SELECT 
        u.id, u.email, u.nickname, u.gender, u.wechat_id, u.qq_id, u.role, u.status, u.created_at,
        COALESCE(p.post_count, 0) as post_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as post_count 
        FROM posts 
        WHERE status = 'active'
        GROUP BY user_id
      ) p ON u.id = p.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, `${limit}`, `${offset}`]);

    return paginate(res, users, total, page, limit);
  } catch (err) {
    console.error('获取用户列表失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 获取帖子列表（支持按用户ID筛选）
 */
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // active, deleted
    const category_id = req.query.category_id;
    const user_id = req.query.user_id; // 新增：按用户ID筛选
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];

    // 默认只显示活跃的帖子，除非明确指定要查看已删除的帖子
    if (status) {
      whereConditions.push('p.status = ?');
      queryParams.push(status);
    } else {
      // 如果没有指定状态，默认只显示活跃的帖子
      whereConditions.push('p.status = ?');
      queryParams.push('active');
    }

    if (category_id) {
      whereConditions.push('p.category_id = ?');
      queryParams.push(category_id);
    }

    if (user_id) {
      whereConditions.push('p.user_id = ?');
      queryParams.push(user_id);
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
        p.id, p.content, p.location, p.status, p.created_at,
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

    // 如果指定了用户ID，返回用户信息和帖子信息两部分数据
    if (user_id) {
      // 查询用户基本信息
      const [users] = await pool.execute(
        'SELECT id, email, nickname, gender, wechat_id, qq_id, role, status, created_at FROM users WHERE id = ?',
        [user_id]
      );

      if (users.length === 0) {
        return error(res, '用户不存在', 404);
      }

      const user = users[0];

      // 返回用户信息和帖子信息
      return res.json({
        success: true,
        code: 200,
        message: '获取成功',
        data: {
          user: user,
          posts: {
            list: posts,
            pagination: {
              total,
              page: parseInt(page),
              limit: parseInt(limit),
              pages: Math.ceil(total / limit)
            }
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    // 如果没有指定用户ID，返回原来的格式
    return paginate(res, posts, total, page, limit);
  } catch (err) {
    console.error('获取帖子列表失败:', err);
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
      // 删除用户的通知（需要手动删除，因为没有外键约束）
      await connection.execute(
        'DELETE FROM notifications WHERE user_id = ?',
        [userId]
      );

      // 删除用户（由于数据库设置了 ON DELETE CASCADE，会自动删除相关的帖子和评论）
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

    // 开启事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 软删除帖子
      await connection.execute(
        'UPDATE posts SET status = "deleted" WHERE id = ?',
        [postId]
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
    console.error('删除帖子失败:', err);
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

    const stats = {
      users: userStats[0],
      posts: postStats[0]
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
  deleteUser,
  toggleUserStatus,
  deletePost,
  getStats
}; 