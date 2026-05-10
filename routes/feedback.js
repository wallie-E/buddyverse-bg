const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 提交反馈（登录可选，未登录也可提交）
router.post('/', optionalAuth, feedbackController.submitFeedback);

// 查看当前用户自己的反馈记录（需要登录）
router.get('/mine', authenticate, feedbackController.getMyFeedbacks);

module.exports = router;
