const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'social_platform_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成JWT token
 * @param {Object} payload - 载荷数据
 * @returns {String} token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * 验证JWT token
 * @param {String} token - JWT token
 * @returns {Object} 解码后的载荷
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * 从请求头中提取token
 * @param {Object} req - Express请求对象
 * @returns {String|null} token
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

module.exports = {
  generateToken,
  verifyToken,
  extractToken
};