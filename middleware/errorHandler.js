const { error } = require('../utils/response');

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // 数据库错误
  if (err.code === 'ER_DUP_ENTRY') {
    return error(res, '数据已存在', 409);
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return error(res, '无效的token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return error(res, 'token已过期', 401);
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return error(res, err.message, 400);
  }

  // 默认服务器错误
  return error(res, '服务器内部错误', 500);
};

/**
 * 404错误处理
 */
const notFound = (req, res) => {
  return error(res, '接口不存在', 404);
};

module.exports = {
  errorHandler,
  notFound
}; 