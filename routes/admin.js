const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// 所有管理员路由都需要认证和管理员权限
router.use(authenticate, requireAdmin);

// 获取统计数据
router.get('/stats', adminController.getStats);

// 用户管理
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/status', adminController.toggleUserStatus);

// 帖子管理
router.get('/posts', adminController.getPosts);
router.delete('/posts/:id', adminController.deletePost);

module.exports = router; 