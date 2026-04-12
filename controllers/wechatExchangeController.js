const { pool } = require('../config/database');
const { success, error } = require('../utils/response');

/**
 * 根据用户ID从用户表获取微信号
 * POST /api/wechat-exchange/view
 */
const viewExchange = async (req, res) => {
  try {
    const targetUserId = parseInt(req.body.targetUserId);

    if (!targetUserId) {
      return error(res, '目标用户ID不能为空', 400);
    }

    const [users] = await pool.execute(
      'SELECT id, nickname, wechat_id, qq_id FROM users WHERE id = ? AND status = "active"',
      [targetUserId]
    );

    if (users.length === 0) {
      return error(res, '用户不存在', 404);
    }

    const user = users[0];
    return success(res, {
      userId: user.id,
      nickname: user.nickname,
      wechatId: user.wechat_id || null,
      qqId: user.qq_id || null
    }, '获取成功');
  } catch (err) {
    console.error('查看微信号失败:', err);
    return error(res, '获取失败', 500);
  }
};

module.exports = {
  viewExchange
};
