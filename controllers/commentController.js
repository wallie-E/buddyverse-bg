const { pool } = require('../config/database');
const { success, error, paginate } = require('../utils/response');
const { validateCreateComment } = require('../utils/validation');

/**
 * 创建评论
 */
const createComment = async (req, res) => {
  try {
    const { error: validationError } = validateCreateComment(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    const userId = req.user.id;
    const { post_id, content, parent_id } = req.body;

    // 验证帖子是否存在
    const [posts] = await pool.execute(
      'SELECT id, user_id, comment_visibility FROM posts WHERE id = ? AND status = "active"',
      [post_id]
    );

    if (posts.length === 0) {
      return error(res, '帖子不存在', 404);
    }

    const post = posts[0];

    // 检查评论权限
    if (post.comment_visibility === 'private' && post.user_id !== userId) {
      return error(res, '该帖子评论仅作者可见', 403);
    }

    // 如果是回复，验证父评论是否存在且属于该帖子
    if (parent_id) {
      const [parentComments] = await pool.execute(
        'SELECT id, user_id FROM comments WHERE id = ? AND post_id = ? AND status = "active"',
        [parent_id, post_id]
      );

      if (parentComments.length === 0) {
        return error(res, '父评论不存在', 400);
      }
    }

    // 开启事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 创建评论
      const [result] = await connection.execute(
        'INSERT INTO comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
        [post_id, userId, parent_id || null, content]
      );

      const commentId = result.insertId;

      // 更新帖子评论数
      await connection.execute(
        'UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?',
        [post_id]
      );

      // 创建通知
      if (parent_id) {
        // 回复评论的通知
        const [parentComments] = await connection.execute(
          'SELECT user_id FROM comments WHERE id = ?',
          [parent_id]
        );
        const parentUserId = parentComments[0].user_id;

        if (parentUserId !== userId) {
          await connection.execute(
            'INSERT INTO notifications (user_id, type, title, content, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)',
            [parentUserId, 'reply', '评论回复', `有人回复了您的评论：${content}`, commentId, 'comment']
          );
        }
      } else {
        // 评论帖子的通知
        if (post.user_id !== userId) {
          await connection.execute(
            'INSERT INTO notifications (user_id, type, title, content, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)',
            [post.user_id, 'comment', '帖子评论', `有人评论了您的帖子：${content}`, commentId, 'comment']
          );
        }
      }

      await connection.commit();

      // 查询创建的评论详情
      const [comments] = await pool.execute(`
        SELECT 
          c.id, c.content, c.created_at, c.parent_id,
          u.nickname as author_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `, [commentId]);

      return success(res, comments[0], '评论成功', 201);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('创建评论失败:', err);
    return error(res, '评论失败', 500);
  }
};

/**
 * 获取帖子评论列表
 */
const getPostComments = async (req, res) => {
  try {
    const postId = req.params.postId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 验证帖子是否存在
    const [posts] = await pool.execute(
      'SELECT id, user_id, comment_visibility FROM posts WHERE id = ? AND status = "active"',
      [postId]
    );

    if (posts.length === 0) {
      return error(res, '帖子不存在', 404);
    }

    const post = posts[0];
    const userId = req.user ? req.user.id : null;

    // 检查评论权限
    if (post.comment_visibility === 'private' && post.user_id !== userId) {
      return error(res, '该帖子评论仅作者可见', 403);
    }

    // 查询一级评论总数
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM comments WHERE post_id = ? AND parent_id IS NULL AND status = "active"',
      [postId]
    );
    const total = countResult[0].total;

    // 查询一级评论
    const [comments] = await pool.execute(`
      SELECT 
        c.id, c.content, c.created_at,
        u.nickname as author_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? AND c.parent_id IS NULL AND c.status = "active"
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?
    `, [postId, limit, offset]);

    // 查询每个一级评论的回复
    for (let comment of comments) {
      const [replies] = await pool.execute(`
        SELECT 
          c.id, c.content, c.created_at,
          u.nickname as author_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.parent_id = ? AND c.status = "active"
        ORDER BY c.created_at ASC
      `, [comment.id]);

      comment.replies = replies;
    }

    return paginate(res, comments, total, page, limit);
  } catch (err) {
    console.error('获取评论列表失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 删除评论（仅作者或管理员）
 */
const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 查询评论信息
    const [comments] = await pool.execute(
      'SELECT user_id, post_id FROM comments WHERE id = ? AND status = "active"',
      [commentId]
    );

    if (comments.length === 0) {
      return error(res, '评论不存在', 404);
    }

    const comment = comments[0];

    // 检查权限（只有作者或管理员可以删除）
    if (comment.user_id !== userId && userRole !== 'admin') {
      return error(res, '没有权限删除此评论', 403);
    }

    // 开启事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 软删除评论及其回复
      await connection.execute(
        'UPDATE comments SET status = "deleted" WHERE id = ? OR parent_id = ?',
        [commentId, commentId]
      );

      // 更新帖子评论数（减去删除的评论数量）
      const [deletedCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM comments WHERE (id = ? OR parent_id = ?) AND status = "deleted"',
        [commentId, commentId]
      );

      await connection.execute(
        'UPDATE posts SET comment_count = comment_count - ? WHERE id = ?',
        [deletedCount[0].count, comment.post_id]
      );

      await connection.commit();

      return success(res, null, '删除成功');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('删除评论失败:', err);
    return error(res, '删除失败', 500);
  }
};

module.exports = {
  createComment,
  getPostComments,
  deleteComment
}; 