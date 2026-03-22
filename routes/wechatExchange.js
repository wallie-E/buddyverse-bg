const express = require('express');
const router = express.Router();
const wechatExchangeController = require('../controllers/wechatExchangeController');
const { authenticate } = require('../middleware/auth');

// 根据用户ID查看微信号（POST，body: { targetUserId }）
router.post('/view', authenticate, wechatExchangeController.viewExchange);

module.exports = router;

