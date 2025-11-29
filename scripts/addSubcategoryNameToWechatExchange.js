// 设置时区为UTC+8
process.env.TZ = 'Asia/Shanghai';

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const addSubcategoryNameToWechatExchange = async () => {
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
      AND TABLE_NAME = 'wechat_exchange' 
      AND COLUMN_NAME = 'subcategory_name'
    `);
    
    if (columns.length > 0) {
      console.log('字段 subcategory_name 已存在，跳过迁移');
      return;
    }
    
    // 读取SQL文件并执行
    const sqlPath = path.join(__dirname, '../database/migrations/add_subcategory_name_to_wechat_exchange.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await connection.execute(sql);
    
    console.log('成功添加 subcategory_name 字段到 wechat_exchange 表');
    
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
  addSubcategoryNameToWechatExchange()
    .then(() => {
      console.log('迁移完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

module.exports = addSubcategoryNameToWechatExchange;

