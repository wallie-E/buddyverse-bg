const Joi = require('joi');

// 用户注册验证
const validateRegister = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱不能为空'
    }),
    password: Joi.string().min(6).max(20).required().messages({
      'string.min': '密码长度至少6位',
      'string.max': '密码长度不能超过20位',
      'any.required': '密码不能为空'
    }),
    nickname: Joi.string().min(2).max(20).required().messages({
      'string.min': '昵称长度至少2位',
      'string.max': '昵称长度不能超过20位',
      'any.required': '昵称不能为空'
    })
  });
  return schema.validate(data);
};

// 用户登录验证
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱不能为空'
    }),
    password: Joi.string().required().messages({
      'any.required': '密码不能为空'
    })
  });
  return schema.validate(data);
};

// 用户信息更新验证
const validateUpdateProfile = (data) => {
  const schema = Joi.object({
    nickname: Joi.string().min(2).max(20).messages({
      'string.min': '昵称长度至少2位',
      'string.max': '昵称长度不能超过20位'
    }),
    gender: Joi.string().valid('male', 'female', 'other').messages({
      'any.only': '性别只能是male、female或other'
    }),
    signature: Joi.string().max(200).allow('').messages({
      'string.max': '签名长度不能超过200字符'
    })
  });
  return schema.validate(data);
};

// 帖子创建验证
const validateCreatePost = (data) => {
  const schema = Joi.object({
    content: Joi.string().min(1).max(150).required().messages({
      'string.min': '帖子内容不能为空',
      'string.max': '帖子内容不能超过150字',
      'any.required': '帖子内容不能为空'
    }),
    location: Joi.string().max(200).allow('').messages({
      'string.max': '位置信息不能超过200字符'
    }),
    category_id: Joi.number().integer().positive().required().messages({
      'number.base': '分类ID必须是数字',
      'number.positive': '分类ID必须是正数',
      'any.required': '分类ID不能为空'
    }),
    subcategory_id: Joi.number().integer().positive().required().messages({
      'number.base': '细分分类ID必须是数字',
      'number.positive': '细分分类ID必须是正数',
      'any.required': '细分分类ID不能为空'
    }),
    comment_visibility: Joi.string().valid('public', 'private').default('public').messages({
      'any.only': '评论可见性只能是public或private'
    })
  });
  return schema.validate(data);
};

// 评论创建验证
const validateCreateComment = (data) => {
  const schema = Joi.object({
    post_id: Joi.number().integer().positive().required().messages({
      'number.base': '帖子ID必须是数字',
      'number.positive': '帖子ID必须是正数',
      'any.required': '帖子ID不能为空'
    }),
    content: Joi.string().min(1).max(500).required().messages({
      'string.min': '评论内容不能为空',
      'string.max': '评论内容不能超过500字',
      'any.required': '评论内容不能为空'
    }),
    parent_id: Joi.number().integer().positive().allow(null).messages({
      'number.base': '父评论ID必须是数字',
      'number.positive': '父评论ID必须是正数'
    })
  });
  return schema.validate(data);
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateCreatePost,
  validateCreateComment
}; 