const { pool } = require('../config/database');
const { success, error } = require('../utils/response');
const moment = require('moment');

/**
 * 生成唯一的交换流水号
 */
const generateExchangeNo = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WX${timestamp}${random}`;
};

/**
 * 创建通知
 */
const createNotification = async (userId, type, content, senderId, relatedId = null) => {
  try {
    await pool.execute(
      `INSERT INTO notifications (user_id, sender_id, type, content, related_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, FALSE, NOW())`,
      [userId, senderId, type, content, relatedId]
    );
  } catch (err) {
    console.error('创建通知失败:', err);
  }
};

/**
 * 获取交换信息
 * GET /api/wechat-exchange/info
 */
const getExchangeInfo = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.query.targetUserId);

    if (!targetUserId) {
      return error(res, '目标用户ID不能为空', 400);
    }

    if (currentUserId === targetUserId) {
      return error(res, '不能与自己交换微信', 400);
    }

    // 查询交换记录（需要查询双向）
    const [exchanges] = await pool.execute(
      `SELECT 
        we.*,
        u1.nickname as initiator_nickname,
        u1.avatar as initiator_avatar,
        u2.nickname as receiver_nickname,
        u2.avatar as receiver_avatar
       FROM wechat_exchange we
       LEFT JOIN users u1 ON we.initiator_id = u1.id
       LEFT JOIN users u2 ON we.receiver_id = u2.id
       WHERE (we.initiator_id = ? AND we.receiver_id = ?) 
          OR (we.initiator_id = ? AND we.receiver_id = ?)
       ORDER BY we.created_at DESC
       LIMIT 1`,
      [currentUserId, targetUserId, targetUserId, currentUserId]
    );

    if (exchanges.length === 0) {
      return success(res, {
        exists: false,
        status: null,
        waitingFor: null
      }, '无交换记录');
    }

    const exchange = exchanges[0];
    const isInitiator = exchange.initiator_id === currentUserId;

    // 构建响应数据
    const responseData = {
      exists: true,
      status: exchange.status,
      exchangeNo: exchange.exchange_no,
      initiatorId: exchange.initiator_id,
      receiverId: exchange.receiver_id,
      myRole: isInitiator ? 'initiator' : 'receiver',
      subcategoryName: exchange.subcategory_name,
      createdAt: exchange.created_at,
      updatedAt: exchange.updated_at,
    };

    // 根据状态返回不同的信息
    if (exchange.status === 1) {
      // 已完成，返回对方微信号
      responseData.myWechat = isInitiator ? exchange.initiator_wechat : exchange.receiver_wechat;
      responseData.otherWechat = isInitiator ? exchange.receiver_wechat : exchange.initiator_wechat;
      responseData.otherNickname = isInitiator ? exchange.receiver_nickname : exchange.initiator_nickname;
      responseData.otherAvatar = isInitiator ? exchange.receiver_avatar : exchange.initiator_avatar;
      responseData.completedAt = exchange.completed_at;
      responseData.waitingFor = 'none';
    } else if (exchange.status === 0) {
      // 待确认
      const initiatorConfirmed = exchange.initiator_confirmed_at !== null;
      const receiverConfirmed = exchange.receiver_confirmed_at !== null;

      if (isInitiator) {
        responseData.waitingFor = receiverConfirmed ? 'none' : 'other';
        responseData.otherNickname = exchange.receiver_nickname;
        responseData.otherAvatar = exchange.receiver_avatar;
      } else {
        responseData.waitingFor = initiatorConfirmed ? 'me' : 'other';
        responseData.otherNickname = exchange.initiator_nickname;
        responseData.otherAvatar = exchange.initiator_avatar;
      }

      responseData.initiatorConfirmedAt = exchange.initiator_confirmed_at;
      responseData.receiverConfirmedAt = exchange.receiver_confirmed_at;
    } else {
      // 已拒绝或已过期
      responseData.waitingFor = 'none';
      responseData.otherNickname = isInitiator ? exchange.receiver_nickname : exchange.initiator_nickname;
      responseData.otherAvatar = isInitiator ? exchange.receiver_avatar : exchange.initiator_avatar;
    }

    return success(res, responseData, '获取成功');
  } catch (err) {
    console.error('获取交换信息失败:', err);
    return error(res, '获取失败', 500);
  }
};

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
      'SELECT id, nickname, wechat_id FROM users WHERE id = ? AND status = "active"',
      [targetUserId]
    );

    if (users.length === 0) {
      return error(res, '用户不存在', 404);
    }

    const user = users[0];
    return success(res, {
      userId: user.id,
      nickname: user.nickname,
      wechatId: user.wechat_id || null
    }, '获取成功');
  } catch (err) {
    console.error('查看微信号失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 发起/更新交换请求
 * POST /api/wechat-exchange/request
 */
const requestExchange = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const currentUserId = req.user.id;
    const { targetUserId, wechatId, isUpdate, subcategoryName } = req.body;

    // 验证参数
    if (!targetUserId) {
      await connection.rollback();
      return error(res, '目标用户ID不能为空', 400);
    }

    if (!wechatId || wechatId.trim() === '') {
      await connection.rollback();
      return error(res, '微信号不能为空', 400);
    }

    if (currentUserId === targetUserId) {
      await connection.rollback();
      return error(res, '不能与自己交换微信', 400);
    }

    // 验证目标用户是否存在
    const [targetUsers] = await connection.execute(
      'SELECT id, nickname FROM users WHERE id = ?',
      [targetUserId]
    );

    if (targetUsers.length === 0) {
      await connection.rollback();
      return error(res, '目标用户不存在', 404);
    }

    const targetUser = targetUsers[0];

    // 查询是否已存在交换记录
    const [existingExchanges] = await connection.execute(
      `SELECT * FROM wechat_exchange 
       WHERE (initiator_id = ? AND receiver_id = ?) 
          OR (initiator_id = ? AND receiver_id = ?)
       ORDER BY created_at DESC
       LIMIT 1`,
      [currentUserId, targetUserId, targetUserId, currentUserId]
    );

    let exchangeNo;
    let isNewRecord = false;

    if (existingExchanges.length > 0) {
      const existingExchange = existingExchanges[0];
      
      // 如果已完成，不允许重新发起
      if (existingExchange.status === 1) {
        await connection.rollback();
        return error(res, '已经完成交换，无需重新发起', 400);
      }

      const isOriginalInitiator = existingExchange.initiator_id === currentUserId;
      
      if (isUpdate && isOriginalInitiator) {
        // 更新现有记录
        exchangeNo = existingExchange.exchange_no;
        await connection.execute(
          `UPDATE wechat_exchange 
           SET initiator_wechat = ?, 
               subcategory_name = ?,
               initiator_confirmed_at = NOW(),
               updated_at = NOW()
           WHERE exchange_no = ?`,
          [wechatId, subcategoryName || null, exchangeNo]
        );
      } else if (!isOriginalInitiator) {
        // 对方重新发起，创建新记录
        exchangeNo = generateExchangeNo();
        await connection.execute(
          `INSERT INTO wechat_exchange 
           (exchange_no, initiator_id, initiator_wechat, receiver_id, subcategory_name, status, initiator_confirmed_at, created_at)
           VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`,
          [exchangeNo, currentUserId, wechatId, targetUserId, subcategoryName || null]
        );
        isNewRecord = true;
      } else {
        // 已经有记录但不允许重复发起
        await connection.rollback();
        return error(res, '已存在交换记录', 400);
      }
    } else {
      // 创建新的交换记录
      exchangeNo = generateExchangeNo();
      await connection.execute(
        `INSERT INTO wechat_exchange 
         (exchange_no, initiator_id, initiator_wechat, receiver_id, subcategory_name, status, initiator_confirmed_at, created_at)
         VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [exchangeNo, currentUserId, wechatId, targetUserId, subcategoryName || null]
      );
      isNewRecord = true;
    }

    // 创建通知给接收方
    await createNotification(
      targetUserId,
      'wechat_exchange_request',
      `${req.user.nickname} 想要与您交换微信`,
      currentUserId,
      null
    );

    await connection.commit();

    return success(res, {
      exchangeNo,
      status: 0,
      notificationSent: true,
      isNewRecord
    }, isUpdate ? '请求已更新' : '请求已发送');

  } catch (err) {
    await connection.rollback();
    console.error('发起交换请求失败:', err);
    return error(res, '操作失败', 500);
  } finally {
    connection.release();
  }
};

/**
 * 确认交换
 * POST /api/wechat-exchange/confirm
 */
const confirmExchange = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const currentUserId = req.user.id;
    const { exchangeNo, wechatId, action } = req.body;

    // 验证参数
    if (!exchangeNo) {
      await connection.rollback();
      return error(res, '交换流水号不能为空', 400);
    }

    if (action !== 'accept' && action !== 'reject') {
      await connection.rollback();
      return error(res, '操作类型无效', 400);
    }

    if (action === 'accept' && (!wechatId || wechatId.trim() === '')) {
      await connection.rollback();
      return error(res, '微信号不能为空', 400);
    }

    // 查询交换记录
    const [exchanges] = await connection.execute(
      'SELECT * FROM wechat_exchange WHERE exchange_no = ?',
      [exchangeNo]
    );

    if (exchanges.length === 0) {
      await connection.rollback();
      return error(res, '交换记录不存在', 404);
    }

    const exchange = exchanges[0];

    // 验证权限（必须是接收方）
    if (exchange.receiver_id !== currentUserId) {
      await connection.rollback();
      return error(res, '无权操作此交换记录', 403);
    }

    // 验证状态
    if (exchange.status !== 0) {
      await connection.rollback();
      return error(res, '该交换记录已处理', 400);
    }

    let responseData = {
      exchangeNo,
      notificationSent: false
    };

    if (action === 'reject') {
      // 拒绝交换
      await connection.execute(
        `UPDATE wechat_exchange 
         SET status = 2, updated_at = NOW()
         WHERE exchange_no = ?`,
        [exchangeNo]
      );

      responseData.status = 2;

      // 通知发起方
      await createNotification(
        exchange.initiator_id,
        'system',
        `对方拒绝了您的微信交换请求`,
        currentUserId,
        null
      );

      responseData.notificationSent = true;

      await connection.commit();
      return success(res, responseData, '已拒绝交换');
    } else {
      // 接受交换
      await connection.execute(
        `UPDATE wechat_exchange 
         SET receiver_wechat = ?,
             receiver_confirmed_at = NOW(),
             status = 1,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE exchange_no = ?`,
        [wechatId, exchangeNo]
      );

      // 获取发起方微信号
      const [updatedExchange] = await connection.execute(
        'SELECT initiator_wechat, initiator_id FROM wechat_exchange WHERE exchange_no = ?',
        [exchangeNo]
      );

      responseData.status = 1;
      responseData.otherWechat = updatedExchange[0].initiator_wechat;
      responseData.completedAt = new Date().toISOString();

      // 通知发起方
      await createNotification(
        exchange.initiator_id,
        'wechat_exchange_confirmed',
        `${req.user.nickname} 已确认与您交换微信`,
        currentUserId,
        null
      );

      responseData.notificationSent = true;

      await connection.commit();
      return success(res, responseData, '交换成功');
    }

  } catch (err) {
    await connection.rollback();
    console.error('确认交换失败:', err);
    return error(res, '操作失败', 500);
  } finally {
    connection.release();
  }
};

/**
 * 获取我的交换记录列表
 * GET /api/wechat-exchange/my-exchanges
 */
const getMyExchanges = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // 0-待确认，1-已完成，2-已拒绝
    const offset = (page - 1) * limit;

    let whereConditions = ['(we.initiator_id = ? OR we.receiver_id = ?)'];
    let queryParams = [currentUserId, currentUserId];

    if (status !== undefined && status !== '') {
      whereConditions.push('we.status = ?');
      queryParams.push(parseInt(status));
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM wechat_exchange we WHERE ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // 查询列表
    const [exchanges] = await pool.execute(
      `SELECT 
        we.*,
        u1.nickname as initiator_nickname,
        u1.avatar as initiator_avatar,
        u2.nickname as receiver_nickname,
        u2.avatar as receiver_avatar,
        CASE 
          WHEN we.initiator_id = ? THEN u2.nickname
          ELSE u1.nickname
        END as other_nickname,
        CASE 
          WHEN we.initiator_id = ? THEN u2.avatar
          ELSE u1.avatar
        END as other_avatar,
        CASE 
          WHEN we.initiator_id = ? THEN u2.id
          ELSE u1.id
        END as other_user_id
       FROM wechat_exchange we
       LEFT JOIN users u1 ON we.initiator_id = u1.id
       LEFT JOIN users u2 ON we.receiver_id = u2.id
       WHERE ${whereClause}
       ORDER BY we.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, currentUserId, currentUserId, currentUserId, `${limit}`, `${offset}`]
    );

    // 格式化数据
    const formattedExchanges = exchanges.map(exchange => {
      const isInitiator = exchange.initiator_id === currentUserId;
      return {
        id: exchange.id,
        exchangeNo: exchange.exchange_no,
        status: exchange.status,
        myRole: isInitiator ? 'initiator' : 'receiver',
        otherUserId: exchange.other_user_id,
        otherNickname: exchange.other_nickname,
        otherAvatar: exchange.other_avatar,
        myWechat: isInitiator ? exchange.initiator_wechat : exchange.receiver_wechat,
        otherWechat: exchange.status === 1 ? (isInitiator ? exchange.receiver_wechat : exchange.initiator_wechat) : null,
        subcategoryName: exchange.subcategory_name,
        createdAt: exchange.created_at,
        completedAt: exchange.completed_at,
      };
    });

    return success(res, {
      list: formattedExchanges,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }, '获取成功');

  } catch (err) {
    console.error('获取交换记录列表失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 更新已完成交换的微信号
 * POST /api/wechat-exchange/update-wechat
 */
const updateExchangeWechat = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const currentUserId = req.user.id;
    const { targetUserId } = req.body;

    // 验证参数
    if (!targetUserId) {
      await connection.rollback();
      return error(res, '目标用户ID不能为空', 400);
    }

    // 1. 查询目标用户的最新微信号
    const [users] = await connection.execute(
      'SELECT wechat_id FROM users WHERE id = ?',
      [targetUserId]
    );

    if (users.length === 0) {
      await connection.rollback();
      return error(res, '目标用户不存在', 404);
    }

    const targetWechatId = users[0].wechat_id;

    if (!targetWechatId) {
      await connection.rollback();
      return error(res, '目标用户尚未设置微信号', 400);
    }

    // 2. 查询已完成的交换记录
    const [exchanges] = await connection.execute(
      `SELECT * FROM wechat_exchange 
       WHERE ((initiator_id = ? AND receiver_id = ?) 
          OR (initiator_id = ? AND receiver_id = ?))
          AND status = 1
       LIMIT 1`,
      [currentUserId, targetUserId, targetUserId, currentUserId]
    );

    if (exchanges.length === 0) {
      await connection.rollback();
      return error(res, '未找到已完成的交换记录', 404);
    }

    const exchange = exchanges[0];
    const isInitiator = exchange.initiator_id === currentUserId;

    // 3. 更新交换记录中的微信号（更新对方的微信号）
    // 如果我是发起方，对方就是接收方，我要更新 receiver_wechat
    // 如果我是接收方，对方就是发起方，我要更新 initiator_wechat
    if (isInitiator) {
      await connection.execute(
        `UPDATE wechat_exchange 
         SET receiver_wechat = ?, updated_at = NOW()
         WHERE id = ?`,
        [targetWechatId, exchange.id]
      );
    } else {
      await connection.execute(
        `UPDATE wechat_exchange 
         SET initiator_wechat = ?, updated_at = NOW()
         WHERE id = ?`,
        [targetWechatId, exchange.id]
      );
    }

    await connection.commit();

    return success(res, {
      otherWechat: targetWechatId
    }, '更新成功');

  } catch (err) {
    await connection.rollback();
    console.error('更新交换微信号失败:', err);
    return error(res, '更新失败', 500);
  } finally {
    connection.release();
  }
};

module.exports = {
  getExchangeInfo,
  viewExchange,
  requestExchange,
  confirmExchange,
  getMyExchanges,
  updateExchangeWechat
};

