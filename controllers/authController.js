const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const { validateRegister, validateLogin } = require('../utils/validation');

/**
 * 用户注册
 */
const register = async (req, res) => {
  try {
    const { error: validationError } = validateRegister(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    const { email, password, nickname } = req.body;

    // 检查邮箱是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return error(res, '邮箱已被注册', 409);
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)',
      [email, hashedPassword, nickname]
    );

    const userId = result.insertId;

    // 生成token
    const token = generateToken({ id: userId, email, role: 'user' });

    // 返回用户信息（不包含密码）
    const userData = {
      id: userId,
      email,
      nickname,
      gender: 'other',
      avatar: null,
      signature: null,
      role: 'user'
    };

    return success(res, { user: userData, token }, '注册成功', 201);
  } catch (err) {
    console.error('注册失败:', err);
    return error(res, '注册失败', 500);
  }
};

/**
 * 用户登录
 */
const login = async (req, res) => {
  try {
    const { error: validationError } = validateLogin(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    const { email, password } = req.body;

    // 查询用户
    const [users] = await pool.execute(
      'SELECT id, email, password, nickname, gender, avatar, signature, role, status FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return error(res, '邮箱或密码错误', 401);
    }

    const user = users[0];

    // 检查用户状态
    if (user.status !== 'active') {
      return error(res, '账户已被禁用', 401);
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return error(res, '邮箱或密码错误', 401);
    }

    // 生成token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    // 返回用户信息（不包含密码）
    const userData = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      gender: user.gender,
      avatar: user.avatar,
      signature: user.signature,
      role: user.role
    };

    return success(res, { user: userData, token }, '登录成功');
  } catch (err) {
    console.error('登录失败:', err);
    return error(res, '登录失败', 500);
  }
};

/**
 * 获取当前用户信息
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.execute(
      'SELECT id, email, nickname, gender, avatar, signature, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return error(res, '用户不存在', 404);
    }

    return success(res, users[0], '获取用户信息成功');
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return error(res, '获取用户信息失败', 500);
  }
};

module.exports = {
  register,
  login,
  getProfile
}; 