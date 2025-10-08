const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// 更新用户信息
router.put('/profile', authenticate, userController.updateProfile);

// 获取用户资料（公开信息）
router.post('/profile', userController.getUserProfile);

// 获取用户发布的帖子
router.get('/posts', authenticate, userController.getUserPosts);

module.exports = router; 