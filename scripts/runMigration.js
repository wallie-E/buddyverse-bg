// 设置时区为UTC+8
process.env.TZ = 'Asia/Shanghai';

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
  let connection;
  
  try {
    // 连接到数据库
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'prod-db-mysql.ns-z580ek8h.svc',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'ddqwh95j',
      database: 'social_platform',
      timezone: '+08:00',
      multipleStatements: true // 允许执行多条SQL语句
    });
    
    console.log('连接到数据库成功');
    
    // 读取迁移脚本
    const migrationPath = path.join(__dirname, '../database/migrations/add_author_info_to_posts_and_comments.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('开始执行数据库迁移...');
    
    // 检查字段是否已存在
    const [postColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'social_platform' 
      AND TABLE_NAME = 'posts' 
      AND COLUMN_NAME IN ('author_nickname', 'author_gender')
    `);
    
    if (postColumns.length > 0) {
      console.log('字段已存在，跳过迁移');
      const existingColumns = postColumns.map(col => col.COLUMN_NAME).join(', ');
      console.log(`已存在的字段: ${existingColumns}`);
      return;
    }
    
    // 执行迁移脚本
    await connection.query(migrationSQL);
    
    console.log('数据库迁移成功！');
    console.log('- 已在 posts 表中添加 author_nickname 和 author_gender 字段');
    console.log('- 已在 comments 表中添加 author_nickname 和 author_gender 字段');
    
  } catch (error) {
    console.error('迁移失败:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('字段已存在，迁移可能已经执行过');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('迁移完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

module.exports = runMigration;
