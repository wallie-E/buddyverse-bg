// 设置时区为UTC+8
process.env.TZ = 'Asia/Shanghai';

const mysql = require('mysql2/promise');

const addWechatIdField = async () => {
  let connection;
  
  try {
    // 连接到数据库
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'prod-db-mysql.ns-z580ek8h.svc',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'ddqwh95j',
      database: 'social_platform',
      timezone: '+08:00'
    });
    
    console.log('连接到数据库成功');
    
    // 检查字段是否已存在
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'social_platform' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'wechat_id'
    `);
    
    if (columns.length > 0) {
      console.log('字段 wechat_id 已存在，跳过迁移');
      return;
    }
    
    // 添加 wechat_id 字段
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN wechat_id VARCHAR(100) DEFAULT NULL 
      AFTER signature
    `);
    
    console.log('成功添加 wechat_id 字段到 users 表');
    
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  addWechatIdField()
    .then(() => {
      console.log('迁移完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

module.exports = addWechatIdField;

