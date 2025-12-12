// 设置时区为UTC+8
process.env.TZ = 'Asia/Shanghai';

const mysql = require('mysql2/promise');

const checkAuthorGender = async () => {
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
    
    console.log('连接到数据库成功\n');
    
    // 查询 posts 表中的数据
    console.log('=== 检查 posts 表 ===');
    const [posts] = await connection.execute(`
      SELECT 
        p.id, 
        p.user_id,
        p.author_nickname,
        p.author_gender,
        u.nickname as user_nickname,
        u.gender as user_gender
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.status = 'active'
      ORDER BY p.id DESC
      LIMIT 10
    `);
    
    console.log(`找到 ${posts.length} 条帖子记录：\n`);
    posts.forEach((post, index) => {
      console.log(`帖子 #${post.id}:`);
      console.log(`  用户ID: ${post.user_id}`);
      console.log(`  冗余存储 - author_nickname: ${post.author_nickname}, author_gender: ${post.author_gender}`);
      console.log(`  用户表 - user_nickname: ${post.user_nickname}, user_gender: ${post.user_gender}`);
      if (post.author_gender !== post.user_gender) {
        console.log(`  ⚠️  警告：冗余字段与用户表不一致！`);
      }
      console.log('');
    });
    
    // 查询 comments 表中的数据
    console.log('=== 检查 comments 表 ===');
    const [comments] = await connection.execute(`
      SELECT 
        c.id, 
        c.user_id,
        c.author_nickname,
        c.author_gender,
        u.nickname as user_nickname,
        u.gender as user_gender
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.status = 'active'
      ORDER BY c.id DESC
      LIMIT 10
    `);
    
    console.log(`找到 ${comments.length} 条评论记录：\n`);
    comments.forEach((comment, index) => {
      console.log(`评论 #${comment.id}:`);
      console.log(`  用户ID: ${comment.user_id}`);
      console.log(`  冗余存储 - author_nickname: ${comment.author_nickname}, author_gender: ${comment.author_gender}`);
      console.log(`  用户表 - user_nickname: ${comment.user_nickname}, user_gender: ${comment.user_gender}`);
      if (comment.author_gender !== comment.user_gender) {
        console.log(`  ⚠️  警告：冗余字段与用户表不一致！`);
      }
      console.log('');
    });
    
    // 检查字段定义
    console.log('=== 检查字段定义 ===');
    const [postColumns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'social_platform' 
      AND TABLE_NAME = 'posts' 
      AND COLUMN_NAME = 'author_gender'
    `);
    
    if (postColumns.length > 0) {
      console.log('posts.author_gender 字段定义:');
      console.log(`  类型: ${postColumns[0].COLUMN_TYPE}`);
      console.log(`  默认值: ${postColumns[0].COLUMN_DEFAULT}`);
    }
    
  } catch (error) {
    console.error('检查失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  checkAuthorGender()
    .then(() => {
      console.log('\n检查完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('检查失败:', error);
      process.exit(1);
    });
}

module.exports = checkAuthorGender;
