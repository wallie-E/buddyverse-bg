const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

async function addWechatExchange() {
  try {
    console.log('开始执行微信交换表迁移...');

    // 读取 SQL 文件
    const sqlFile = path.join(__dirname, '../database/migrations/add_wechat_exchange.sql');
    const sql = await fs.readFile(sqlFile, 'utf8');

    // 分割 SQL 语句（按分号分割）
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // 执行每条 SQL 语句
    for (const statement of statements) {
      try {
        await pool.execute(statement);
        console.log('✓ 执行成功:', statement.substring(0, 50) + '...');
      } catch (err) {
        // 如果表已存在或字段已存在，忽略错误
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠ 跳过（已存在）:', statement.substring(0, 50) + '...');
        } else {
          throw err;
        }
      }
    }

    console.log('✓ 微信交换表迁移完成！');
  } catch (error) {
    console.error('✗ 迁移失败:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// 执行迁移
addWechatExchange();

