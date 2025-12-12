const { pool } = require('../config/database');
const { success, error } = require('../utils/response');
const { validateUpdateProfile } = require('../utils/validation');

/**
 * 更新用户信息
 */
const updateProfile = async (req, res) => {
  try {
    const { error: validationError } = validateUpdateProfile(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    const userId = req.user.id;
    const { nickname, gender, signature, wechat_id } = req.body;

    // 检查用户最近一次修改个人资料的时间（每周只能修改一次）
    const [userInfo] = await pool.execute(
      'SELECT updated_at, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (userInfo.length === 0) {
      return error(res, '用户不存在', 404);
    }

    const user = userInfo[0];
    const now = new Date();
    const lastUpdated = new Date(user.updated_at);
    const createdAt = new Date(user.created_at);
    
    // 如果 updated_at 和 created_at 相同，说明用户从未修改过资料（注册时不算修改）
    // 否则检查距离上次修改是否不足 7 天
    if (lastUpdated.getTime() !== createdAt.getTime()) {
      const daysSinceLastUpdate = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
      if (daysSinceLastUpdate < 7) {
        const remainingDays = 7 - daysSinceLastUpdate;
        return error(res, `每周只能修改一次个人资料，请 ${remainingDays} 天后再试`, 403);
      }
    }

    // 构建更新字段
    const updateFields = [];
    const updateValues = [];

    if (nickname !== undefined) {
      updateFields.push('nickname = ?');
      updateValues.push(nickname);
    }
    if (gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(gender);
    }
    if (signature !== undefined) {
      updateFields.push('signature = ?');
      updateValues.push(signature);
    }
    if (wechat_id !== undefined) {
      updateFields.push('wechat_id = ?');
      updateValues.push(wechat_id);
    }

    if (updateFields.length === 0) {
      return error(res, '没有要更新的字段', 400);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);

    // 执行更新
    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 查询更新后的用户信息
    const [users] = await pool.execute(
      'SELECT id, email, nickname, gender, avatar, signature, wechat_id, role FROM users WHERE id = ?',
      [userId]
    );

    return success(res, users[0], '更新成功');
  } catch (err) {
    console.error('更新用户信息失败:', err);
    return error(res, '更新失败', 500);
  }
};

/**
 * 获取用户资料（公开信息）
 */
const getUserProfile = async (req, res) => {
  try {
    const { user_id, page = 1, limit = 10 } = req.body;
    const offset = (page - 1) * limit;

    // 验证用户ID是否为有效数字
    if (!user_id || isNaN(user_id)) {
      return error(res, '用户ID无效', 400);
    }

    // 查询用户基本信息（只返回公开信息）
    const [users] = await pool.execute(
      'SELECT id, nickname, gender, avatar, signature, wechat_id, created_at FROM users WHERE id = ? AND status = "active"',
      [user_id]
    );

    if (users.length === 0) {
      return error(res, '用户不存在', 404);
    }

    const userInfo = users[0];

    // 查询用户发布的帖子总数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM posts WHERE user_id = ? AND status = "active"',
      [user_id]
    );
    const total = countResult[0].total;

    // 查询用户发布的帖子列表
    const [posts] = await pool.execute(`
      SELECT 
        p.id, p.content, p.location, p.comment_count, p.comment_visibility, p.created_at,
        pc.name as category_name,
        ps.name as subcategory_name
      FROM posts p
      LEFT JOIN post_categories pc ON p.category_id = pc.id
      LEFT JOIN post_subcategories ps ON p.subcategory_id = ps.id
      WHERE p.user_id = ? AND p.status = "active"
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [user_id, `${limit}`, `${offset}`]);

    // 构建返回数据
    const responseData = {
      ...userInfo,
      posts: {
        list: posts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    };

    return success(res, responseData, '获取用户资料成功');
  } catch (err) {
    console.error('获取用户资料失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 获取用户发布的帖子列表
 */
const getUserPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 查询帖子总数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM posts WHERE user_id = ? AND status = "active"',
      [`${userId}`]
    );
    const total = countResult[0].total;

    // 查询帖子列表
    const [posts] = await pool.execute(`
      SELECT 
        p.id, p.content, p.location, p.comment_count, p.comment_visibility, p.created_at,
        pc.name as category_name,
        ps.name as subcategory_name
      FROM posts p
      LEFT JOIN post_categories pc ON p.category_id = pc.id
      LEFT JOIN post_subcategories ps ON p.subcategory_id = ps.id
      WHERE p.user_id = ? AND p.status = "active"
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [`${userId}`, `${limit}`, `${offset}`]);

    return success(res, {
      list: posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, '获取成功');
  } catch (err) {
    console.error('获取用户帖子失败:', err);
    return error(res, '获取失败', 500);
  }
};

module.exports = {
  updateProfile,
  getUserProfile,
  getUserPosts
}; 