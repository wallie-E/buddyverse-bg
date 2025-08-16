const { pool } = require('../config/database');
const { success, error, paginate } = require('../utils/response');

/**
 * 获取用户通知列表
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type; // comment, reply, system
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereConditions = ['n.user_id = ?'];
    let queryParams = [userId];

    if (type) {
      whereConditions.push('n.type = ?');
      queryParams.push(type);
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询通知总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM notifications n WHERE ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // 查询通知列表，通过LEFT JOIN获取对应的帖子ID
    const [notifications] = await pool.execute(`
      SELECT 
        n.id, 
        n.type, 
        n.title, 
        n.content, 
        n.related_id, 
        n.related_type, 
        n.is_read, 
        n.created_at,
        CASE 
          WHEN n.related_type = 'post' THEN n.related_id
          WHEN n.related_type = 'comment' THEN c.post_id
          ELSE NULL
        END as post_id
      FROM notifications n
      LEFT JOIN comments c ON n.related_type = 'comment' AND n.related_id = c.id
      WHERE ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, `${limit}`, `${offset}`]);

    return paginate(res, notifications, total, page, limit);
  } catch (err) {
    console.error('获取通知列表失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 获取未读通知数量
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    return success(res, { count: result[0].count }, '获取成功');
  } catch (err) {
    console.error('获取未读通知数量失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 标记通知为已读
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // 验证通知是否属于当前用户
    const [notifications] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (notifications.length === 0) {
      return error(res, '通知不存在', 404);
    }

    // 标记为已读
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [notificationId]
    );

    return success(res, null, '标记成功');
  } catch (err) {
    console.error('标记通知失败:', err);
    return error(res, '标记失败', 500);
  }
};

/**
 * 标记所有通知为已读
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    return success(res, null, '全部标记成功');
  } catch (err) {
    console.error('标记所有通知失败:', err);
    return error(res, '标记失败', 500);
  }
};

/**
 * 删除通知
 */
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // 验证通知是否属于当前用户
    const [notifications] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (notifications.length === 0) {
      return error(res, '通知不存在', 404);
    }

    // 删除通知
    await pool.execute('DELETE FROM notifications WHERE id = ?', [notificationId]);

    return success(res, null, '删除成功');
  } catch (err) {
    console.error('删除通知失败:', err);
    return error(res, '删除失败', 500);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
}; 