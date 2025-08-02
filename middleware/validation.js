const { error } = require('../utils/response');

/**
 * 通用验证中间件
 * @param {Function} validateFunction - 验证函数
 * @returns {Function} 中间件函数
 */
const validate = (validateFunction) => {
  return (req, res, next) => {
    const { error: validationError, value } = validateFunction(req.body);
    
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }
    
    req.body = value;
    next();
  };
};

module.exports = { validate }; 