const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 创建评论
router.post('/', authenticate, commentController.createComment);

// 获取帖子的评论列表
router.get('/post/:postId', optionalAuth, commentController.getPostComments);

// 删除评论
router.delete('/:id', authenticate, commentController.deleteComment);

module.exports = router; 