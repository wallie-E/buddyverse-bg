const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'test-db-mysql.ns-kuoqmx4b.svc',
  port: 3306,
  user: 'root',
  password: 'zt6s45rk',
  database: 'social_platform',
  charset: 'utf8mb4',
  timezone: '+08:00',
  // MySQL2 connection pool options
  connectionLimit: 10,
  queueLimit: 0,
  waitForConnections: true,
  // Connection timeout options
  connectTimeout: 60000,
  // Reconnection options
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 设置连接池的时区
pool.on('connection', (connection) => {
  connection.execute("SET time_zone = '+08:00'");
});

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
  } catch (error) {
    console.error('数据库连接失败:', error.message);
  }
};

module.exports = {
  pool,
  testConnection
}; 