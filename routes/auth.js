const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { ipRegisterLimiter, deviceRegisterLimiter } = require('../middleware/registerRateLimit');

// 用户注册
router.post('/register', ipRegisterLimiter, deviceRegisterLimiter, authController.register);

// 用户登录
router.post('/login', authController.login);

// 获取当前用户信息
router.get('/profile', authenticate, authController.getProfile);

module.exports = router; 