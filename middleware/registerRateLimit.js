const rateLimit = require('express-rate-limit');

const ipRegisterLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  keyGenerator: (req) => req.ip,
  message: { success: false, message: '该IP今日注册次数已达上限，请24小时后再试' },
  skipSuccessfulRequests: false,
});

const deviceRegisterLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  keyGenerator: (req) => {
    const deviceId = req.headers['x-device-id'];
    if (deviceId) return `device:${deviceId}`;
    const ua = req.headers['user-agent'] || 'unknown';
    return `fingerprint:${req.ip}:${ua}`;
  },
  message: { success: false, message: '该设备今日注册次数已达上限，请24小时后再试' },
  skipSuccessfulRequests: false,
});

module.exports = { ipRegisterLimiter, deviceRegisterLimiter };
