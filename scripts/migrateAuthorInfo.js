// 设置时区为UTC+8
process.env.TZ = 'Asia/Shanghai';

const mysql = require('mysql2/promise');

const migrateAuthorInfo = async () => {
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
    
    // 检查字段是否存在
    const [postColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'social_platform' 
      AND TABLE_NAME = 'posts' 
      AND COLUMN_NAME = 'author_nickname'
    `);
    
    if (postColumns.length === 0) {
      console.log('字段 author_nickname 不存在，请先运行数据库迁移脚本');
      return;
    }
    
    // 迁移 posts 表的 author_nickname 和 author_gender
    console.log('开始迁移 posts 表的作者信息...');
    const [postResult] = await connection.execute(`
      UPDATE posts p
      INNER JOIN users u ON p.user_id = u.id
      SET p.author_nickname = u.nickname,
          p.author_gender = u.gender
      WHERE p.author_nickname IS NULL OR p.author_gender IS NULL
    `);
    console.log(`成功更新 ${postResult.affectedRows} 条帖子记录`);
    
    // 迁移 comments 表的 author_nickname 和 author_gender
    console.log('开始迁移 comments 表的评论者信息...');
    const [commentResult] = await connection.execute(`
      UPDATE comments c
      INNER JOIN users u ON c.user_id = u.id
      SET c.author_nickname = u.nickname,
          c.author_gender = u.gender
      WHERE c.author_nickname IS NULL OR c.author_gender IS NULL
    `);
    console.log(`成功更新 ${commentResult.affectedRows} 条评论记录`);
    
    // 处理已删除的用户（如果用户不存在，保留 NULL 或设置为默认值）
    const [deletedUserPosts] = await connection.execute(`
      UPDATE posts p
      LEFT JOIN users u ON p.user_id = u.id
      SET p.author_nickname = COALESCE(p.author_nickname, '已删除用户'),
          p.author_gender = COALESCE(p.author_gender, 'other')
      WHERE u.id IS NULL AND (p.author_nickname IS NULL OR p.author_gender IS NULL)
    `);
    if (deletedUserPosts.affectedRows > 0) {
      console.log(`处理了 ${deletedUserPosts.affectedRows} 条已删除用户的帖子记录`);
    }
    
    const [deletedUserComments] = await connection.execute(`
      UPDATE comments c
      LEFT JOIN users u ON c.user_id = u.id
      SET c.author_nickname = COALESCE(c.author_nickname, '已删除用户'),
          c.author_gender = COALESCE(c.author_gender, 'other')
      WHERE u.id IS NULL AND (c.author_nickname IS NULL OR c.author_gender IS NULL)
    `);
    if (deletedUserComments.affectedRows > 0) {
      console.log(`处理了 ${deletedUserComments.affectedRows} 条已删除用户的评论记录`);
    }
    
    console.log('数据迁移完成！');
    
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
  migrateAuthorInfo()
    .then(() => {
      console.log('迁移完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

module.exports = migrateAuthorInfo;
