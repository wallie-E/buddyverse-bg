// 设置时区为UTC+8
process.env.TZ = 'Asia/Shanghai';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const categoryRoutes = require('./routes/categories');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const wechatExchangeRoutes = require('./routes/wechatExchange');

const app = express();
const port = process.env.PORT || 8080;

// 信任反向代理（nginx等），确保 req.ip 获取到真实客户端IP
app.set('trust proxy', 1);

// 基础中间件
app.use(helmet()); // 安全头

// CORS配置 - 允许跨域访问
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true, // 允许携带凭证
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-ID']
}));

app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10000, // 限制每个IP每个窗口期最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wechat-exchange', wechatExchangeRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '社交帖子平台 API',
    version: '1.0.0',
    docs: '/api-docs'
  });
});

// 错误处理中间件
app.use(notFound); // 404处理
app.use(errorHandler); // 全局错误处理

// 启动服务器
app.listen(port, '0.0.0.0', async () => {
  console.log(`服务器运行在端口 ${port}`);
  
  // 测试数据库连接
  await testConnection();
  
  console.log('='.repeat(50));
  console.log('社交帖子平台 API 服务已启动');
  console.log(`服务地址: http://0.0.0.0:${port}`);
  console.log(`健康检查: http://0.0.0.0:${port}/health`);
  console.log('='.repeat(50));
});

module.exports = app;
