const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// 获取通知列表
router.get('/', authenticate, notificationController.getNotifications);

// 获取未读通知数量
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// 标记通知为已读
router.put('/:id/read', authenticate, notificationController.markAsRead);

// 标记所有通知为已读
router.put('/read-all', authenticate, notificationController.markAllAsRead);

// 删除通知
router.delete('/:id', authenticate, notificationController.deleteNotification);

module.exports = router; 