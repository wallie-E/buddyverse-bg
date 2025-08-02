/**
 * 统一的API响应格式
 */

// 成功响应
const success = (res, data = null, message = '操作成功', code = 200) => {
  return res.status(code).json({
    success: true,
    code,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// 错误响应
const error = (res, message = '操作失败', code = 400, data = null) => {
  return res.status(code).json({
    success: false,
    code,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// 分页响应
const paginate = (res, data, total, page, limit, message = '获取成功') => {
  return res.json({
    success: true,
    code: 200,
    message,
    data: {
      list: data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  success,
  error,
  paginate
}; 