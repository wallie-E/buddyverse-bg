const express = require('express');
const router = express.Router();
const wechatExchangeController = require('../controllers/wechatExchangeController');
const { authenticate } = require('../middleware/auth');

// 获取交换信息
router.get('/info', authenticate, wechatExchangeController.getExchangeInfo);

// 根据用户ID查看微信号（POST，body: { targetUserId }）
router.post('/view', authenticate, wechatExchangeController.viewExchange);

// 发起/更新交换请求
router.post('/request', authenticate, wechatExchangeController.requestExchange);

// 确认交换
router.post('/confirm', authenticate, wechatExchangeController.confirmExchange);

// 获取我的交换记录列表
router.get('/my-exchanges', authenticate, wechatExchangeController.getMyExchanges);

// 更新已完成交换的微信号
router.post('/update-wechat', authenticate, wechatExchangeController.updateExchangeWechat);

module.exports = router;

