// 设置时区为UTC+8
process.env.TZ = 'Asia/Shanghai';

const mysql = require('mysql2/promise');

const initDatabase = async () => {
  let connection;
  
  try {
    // 先连接到数据库服务器（不指定数据库）
    const tempConnection = await mysql.createConnection({
      host: 'prod-db-mysql.ns-z580ek8h.svc',
      port: 3306,
      user: 'root',
      password: 'ddqwh95j'
    });

    console.log('开始初始化数据库...');
    
    // 创建数据库
    await tempConnection.execute('CREATE DATABASE IF NOT EXISTS social_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('数据库创建成功');
    
    // 关闭临时连接
    await tempConnection.end();
    
    // 重新连接到目标数据库
    connection = await mysql.createConnection({
      host: 'prod-db-mysql.ns-z580ek8h.svc',
      port: 3306,
      user: 'root',
      password: 'ddqwh95j',
      database: 'social_platform',
      timezone: '+08:00'
    });
    console.log('连接到数据库成功');
    
    // 设置数据库时区为UTC+8
    await connection.execute("SET time_zone = '+08:00'");
    console.log('数据库时区设置为UTC+8');
    
    // 先删除所有表（按依赖关系顺序）
    await connection.execute('DROP TABLE IF EXISTS notifications');
    await connection.execute('DROP TABLE IF EXISTS wechat_exchange');
    await connection.execute('DROP TABLE IF EXISTS comments');
    await connection.execute('DROP TABLE IF EXISTS posts');
    await connection.execute('DROP TABLE IF EXISTS post_subcategories');
    await connection.execute('DROP TABLE IF EXISTS post_categories');
    await connection.execute('DROP TABLE IF EXISTS users');
    console.log('删除所有现有表');
    
    // 创建用户表
    await connection.execute(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nickname VARCHAR(100) NOT NULL,
        gender ENUM('male', 'female') DEFAULT 'male',
        avatar VARCHAR(500) DEFAULT NULL,
        signature VARCHAR(200) DEFAULT NULL,
        wechat_id VARCHAR(100) DEFAULT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_status (status)
      )
    `);
    console.log('用户表创建成功');

    // 创建帖子主分类表
    await connection.execute(`
      CREATE TABLE post_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(200),
        sort_order INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_sort (sort_order)
      )
    `);
    console.log('帖子主分类表创建成功');

    // 创建帖子细分类型表
    await connection.execute(`
      CREATE TABLE post_subcategories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category_id INT NOT NULL,
        name VARCHAR(50) NOT NULL,
        description VARCHAR(200),
        sort_order INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES post_categories(id) ON DELETE CASCADE,
        INDEX idx_category (category_id),
        INDEX idx_status (status),
        INDEX idx_sort (sort_order)
      )
    `);
    console.log('帖子细分类型表创建成功');

    // 创建帖子表
    await connection.execute(`
      CREATE TABLE posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        location VARCHAR(200),
        category_id INT NOT NULL,
        subcategory_id INT NOT NULL,
        comment_visibility ENUM('public', 'private') DEFAULT 'public',
        comment_count INT DEFAULT 0,
        status ENUM('active', 'deleted') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES post_categories(id),
        FOREIGN KEY (subcategory_id) REFERENCES post_subcategories(id),
        INDEX idx_user (user_id),
        INDEX idx_category (category_id),
        INDEX idx_subcategory (subcategory_id),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      )
    `);
    console.log('帖子表创建成功');

    // 创建评论表
    await connection.execute(`
      CREATE TABLE comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        status ENUM('active', 'deleted') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_post (post_id),
        INDEX idx_user (user_id),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      )
    `);
    console.log('评论表创建成功');

    // 创建通知表
    await connection.execute(`
      CREATE TABLE notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        sender_id INT DEFAULT NULL,
        type ENUM('comment', 'reply', 'system', 'wechat_exchange_request', 'wechat_exchange_confirmed') NOT NULL,
        content VARCHAR(500) NOT NULL,
        post_id INT DEFAULT NULL,
        related_id INT DEFAULT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_sender (sender_id),
        INDEX idx_post (post_id),
        INDEX idx_type (type),
        INDEX idx_read (is_read),
        INDEX idx_created (created_at)
      )
    `);
    console.log('通知表创建成功');

    // 创建微信交换表
    await connection.execute(`
      CREATE TABLE wechat_exchange (
        id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
        exchange_no VARCHAR(64) NOT NULL UNIQUE COMMENT '交换流水号',
        initiator_id INT NOT NULL COMMENT '发起人ID',
        initiator_wechat VARCHAR(100) DEFAULT NULL COMMENT '发起人微信号',
        receiver_id INT NOT NULL COMMENT '接收人ID',
        receiver_wechat VARCHAR(100) DEFAULT NULL COMMENT '接收人微信号',
        status TINYINT NOT NULL DEFAULT 0 COMMENT '交换状态：0-待确认，1-已完成，2-已拒绝，3-已过期',
        initiator_confirmed_at TIMESTAMP NULL DEFAULT NULL COMMENT '发起人确认时间',
        receiver_confirmed_at TIMESTAMP NULL DEFAULT NULL COMMENT '接收人确认时间',
        completed_at TIMESTAMP NULL DEFAULT NULL COMMENT '完成时间',
        expired_at TIMESTAMP NULL DEFAULT NULL COMMENT '过期时间',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_exchange_no (exchange_no),
        INDEX idx_initiator_receiver (initiator_id, receiver_id),
        INDEX idx_receiver_initiator (receiver_id, initiator_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('微信交换表创建成功');

    // 按照外键依赖顺序清空数据
    console.log('开始清空所有数据...');
    
    // 1. 先清空通知数据
    await connection.execute('DELETE FROM notifications');
    await connection.execute('ALTER TABLE notifications AUTO_INCREMENT = 1');
    console.log('清空通知数据');
    
    // 2. 清空微信交换数据
    await connection.execute('DELETE FROM wechat_exchange');
    await connection.execute('ALTER TABLE wechat_exchange AUTO_INCREMENT = 1');
    console.log('清空微信交换数据');
    
    // 3. 清空评论数据  
    await connection.execute('DELETE FROM comments');
    await connection.execute('ALTER TABLE comments AUTO_INCREMENT = 1');
    console.log('清空评论数据');
    
    // 4. 清空帖子数据
    await connection.execute('DELETE FROM posts');
    await connection.execute('ALTER TABLE posts AUTO_INCREMENT = 1');
    console.log('清空帖子数据');
    
    // 5. 清空用户数据
    await connection.execute('DELETE FROM users');
    await connection.execute('ALTER TABLE users AUTO_INCREMENT = 1');
    console.log('清空用户数据');
    
    // 6. 清空细分类型数据
    await connection.execute('DELETE FROM post_subcategories');
    await connection.execute('ALTER TABLE post_subcategories AUTO_INCREMENT = 1');
    console.log('清空细分类型数据');
    
    // 7. 清空主分类数据
    await connection.execute('DELETE FROM post_categories');
    await connection.execute('ALTER TABLE post_categories AUTO_INCREMENT = 1');
    console.log('清空主分类数据');

    // 重新插入默认分类数据
    await connection.execute(`
      INSERT INTO post_categories (name, description, sort_order) VALUES
      ('干饭搭子', '寻找一起吃饭的伙伴', 1),
      ('运动搭子', '寻找运动伙伴', 2),
      ('学习搭子', '寻找学习伙伴', 3),
      ('游戏搭子', '寻找游戏伙伴', 4),
      ('旅行搭子', '寻找旅行伙伴', 5)
    `);
    console.log('默认分类数据插入成功');

    // 插入细分类型数据
    await connection.execute(`
      INSERT INTO post_subcategories (category_id, name, sort_order) VALUES
      (1, '火锅', 1), (1, '烧烤', 2), (1, '炒菜', 3), (1, '面条', 4), (1, '烤肉', 5), (1, '西餐', 6), (1, '海鲜', 7), (1, '日料', 8), (1, '韩式', 9), (1, '其他', 99),
      (2, '羽毛球', 1), (2, '篮球', 2), (2, '乒乓球', 3), (2, '跑步', 4), (2, '游泳', 5), (2, '健身', 6), (2, '骑行', 7), (2, '其他', 99),
      (3, '编程', 1), (3, '英文', 2), (3, '数学', 3), (3, '物理', 4), (3, '金融', 5), (3, '创业', 6), (3, '其他', 99),
      (4, '王者荣耀', 1), (4, '和平精英', 2), (4, 'LOL', 3), (4, '元神', 4), (4, '金铲铲', 5), (4, '其他', 99),
      (5, '国内游', 1), (5, '出国游', 2), (5, '周末游', 3), (5, '自驾游', 4), (5, '徒步', 5), (5, '摄影', 6), (5, '露营', 7), (5, '其他', 99)
    `);
    console.log('细分类型数据插入成功');

    // 创建默认管理员账户
    await connection.execute(`
      INSERT INTO users (email, password, nickname, role) VALUES
      ('admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'admin')
    `);
    console.log('默认管理员账户创建成功');

    // 创建测试用户
    await connection.execute(`
      INSERT INTO users (email, password, nickname, role) VALUES
      ('test@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '测试用户', 'user')
    `);
    console.log('测试用户创建成功');

    // 创建测试帖子
    await connection.execute(`
      INSERT INTO posts (user_id, content, location, category_id, subcategory_id, created_at) VALUES
      (2, '这是我的第一篇帖子，寻找火锅搭子！', '北京市朝阳区', 1, 1, '2025-08-02 08:24:20')
    `);
    console.log('测试帖子创建成功');

    // 创建测试评论
    await connection.execute(`
      INSERT INTO comments (post_id, user_id, content, created_at) VALUES
      (1, 1, '我也想去吃火锅！', '2025-08-02 08:30:00')
    `);
    
    // 更新帖子的评论数量
    await connection.execute(`
      UPDATE posts SET comment_count = 1 WHERE id = 1
    `);
    console.log('测试评论创建成功');

    console.log('数据库初始化完成！');
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

initDatabase(); 