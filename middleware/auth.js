const { verifyToken, extractToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const { pool } = require('../config/database');

/**
 * 验证用户是否已登录
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return error(res, '请先登录', 401);
    }

    const decoded = verifyToken(token);
    
    // 查询用户信息
    const [users] = await pool.execute(
      'SELECT id, email, nickname, role, status FROM users WHERE id = ? AND status = "active"',
      [decoded.id]
    );

    if (users.length === 0) {
      return error(res, '用户不存在或已被禁用', 401);
    }

    req.user = users[0];
    next();
  } catch (err) {
    return error(res, '认证失败', 401);
  }
};

/**
 * 验证管理员权限
 */
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return error(res, '需要管理员权限', 403);
  }
};

/**
 * 可选认证中间件（不强制要求登录）
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = verifyToken(token);
      
      const [users] = await pool.execute(
        'SELECT id, email, nickname, role, status FROM users WHERE id = ? AND status = "active"',
        [decoded.id]
      );

      if (users.length > 0) {
        req.user = users[0];
      }
    }
    
    next();
  } catch (err) {
    // 忽略错误，继续执行
    next();
  }
};

module.exports = {
  authenticate,
  requireAdmin,
  optionalAuth
}; 