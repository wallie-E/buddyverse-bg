const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 创建帖子
router.post('/', authenticate, postController.createPost);

// 获取帖子列表（可选登录）
router.get('/', optionalAuth, postController.getPosts);

// 获取帖子详情（可选登录）
router.get('/:id', optionalAuth, postController.getPostDetail);

// 删除帖子
router.delete('/:id', authenticate, postController.deletePost);

module.exports = router; 