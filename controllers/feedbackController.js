const { pool } = require('../config/database');
const { success, error, paginate } = require('../utils/response');

const VALID_TYPES = ['feature', 'bug', 'report', 'other'];
const TYPE_LABELS = {
  feature: '功能建议',
  bug: '问题反馈',
  report: '内容举报',
  other: '其他'
};

/**
 * 提交用户反馈
 */
const submitFeedback = async (req, res) => {
  try {
    const { type, description } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!type || !VALID_TYPES.includes(type)) {
      return error(res, `反馈类型无效，有效值为：${VALID_TYPES.join(', ')}`, 400);
    }

    if (!description || description.trim().length === 0) {
      return error(res, '详细描述不能为空', 400);
    }

    if (description.trim().length > 300) {
      return error(res, '详细描述不能超过300个字符', 400);
    }

    const [result] = await pool.execute(
      'INSERT INTO user_feedbacks (user_id, type, description) VALUES (?, ?, ?)',
      [userId, type, description.trim()]
    );

    return success(res, { id: result.insertId }, '反馈提交成功，感谢你的反馈！', 201);
  } catch (err) {
    console.error('提交反馈失败:', err);
    return error(res, '提交失败', 500);
  }
};

/**
 * 获取当前用户的反馈列表
 */
const getMyFeedbacks = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM user_feedbacks WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].total;

    const [feedbacks] = await pool.execute(
      `SELECT id, type, description, status, admin_reply, created_at, updated_at
       FROM user_feedbacks WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, `${limit}`, `${offset}`]
    );

    return paginate(res, feedbacks, total, page, limit, '获取反馈列表成功');
  } catch (err) {
    console.error('获取反馈列表失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 管理员获取所有反馈列表
 */
const adminGetFeedbacks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    const whereConditions = [];
    const queryParams = [];

    if (type && VALID_TYPES.includes(type)) {
      whereConditions.push('f.type = ?');
      queryParams.push(type);
    }

    if (status && ['pending', 'reviewed', 'resolved'].includes(status)) {
      whereConditions.push('f.status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM user_feedbacks f ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    const [feedbacks] = await pool.execute(
      `SELECT f.id, f.type, f.description, f.status, f.admin_reply, f.created_at, f.updated_at,
              u.id as user_id, u.nickname as user_nickname, u.email as user_email
       FROM user_feedbacks f
       LEFT JOIN users u ON f.user_id = u.id
       ${whereClause}
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, `${limit}`, `${offset}`]
    );

    return paginate(res, feedbacks, total, page, limit, '获取反馈列表成功');
  } catch (err) {
    console.error('管理员获取反馈列表失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 管理员更新反馈状态及回复
 */
const adminUpdateFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const { status, admin_reply } = req.body;

    const validStatuses = ['pending', 'reviewed', 'resolved'];
    if (!status || !validStatuses.includes(status)) {
      return error(res, `状态值无效，有效值为：${validStatuses.join(', ')}`, 400);
    }

    const [feedbacks] = await pool.execute(
      'SELECT id FROM user_feedbacks WHERE id = ?',
      [feedbackId]
    );

    if (feedbacks.length === 0) {
      return error(res, '反馈不存在', 404);
    }

    const updateFields = ['status = ?'];
    const updateValues = [status];

    if (admin_reply !== undefined) {
      if (admin_reply.length > 500) {
        return error(res, '管理员回复不能超过500个字符', 400);
      }
      updateFields.push('admin_reply = ?');
      updateValues.push(admin_reply || null);
    }

    updateValues.push(feedbackId);

    await pool.execute(
      `UPDATE user_feedbacks SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return success(res, null, '反馈状态更新成功');
  } catch (err) {
    console.error('更新反馈状态失败:', err);
    return error(res, '更新失败', 500);
  }
};

/**
 * 管理员删除反馈
 */
const adminDeleteFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;

    const [feedbacks] = await pool.execute(
      'SELECT id FROM user_feedbacks WHERE id = ?',
      [feedbackId]
    );

    if (feedbacks.length === 0) {
      return error(res, '反馈不存在', 404);
    }

    await pool.execute('DELETE FROM user_feedbacks WHERE id = ?', [feedbackId]);

    return success(res, null, '删除成功');
  } catch (err) {
    console.error('删除反馈失败:', err);
    return error(res, '删除失败', 500);
  }
};

module.exports = {
  submitFeedback,
  getMyFeedbacks,
  adminGetFeedbacks,
  adminUpdateFeedback,
  adminDeleteFeedback
};
