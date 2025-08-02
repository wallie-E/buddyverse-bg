-- 创建数据库
CREATE DATABASE IF NOT EXISTS social_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE social_platform;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  gender ENUM('male', 'female', 'other') DEFAULT 'other',
  avatar VARCHAR(500) DEFAULT NULL,
  signature VARCHAR(200) DEFAULT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
);

-- 帖子主分类表
CREATE TABLE IF NOT EXISTS post_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(200),
  sort_order INT DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_sort (sort_order)
);

-- 帖子细分类型表
CREATE TABLE IF NOT EXISTS post_subcategories (
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
);

-- 帖子表
CREATE TABLE IF NOT EXISTS posts (
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
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id INT DEFAULT NULL,
  content TEXT NOT NULL,
  status ENUM('active', 'deleted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_post (post_id),
  INDEX idx_user (user_id),
  INDEX idx_parent (parent_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('comment', 'reply', 'system') NOT NULL,
  title VARCHAR(100) NOT NULL,
  content VARCHAR(500) NOT NULL,
  related_id INT DEFAULT NULL,
  related_type ENUM('post', 'comment') DEFAULT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_type (type),
  INDEX idx_read (is_read),
  INDEX idx_created (created_at)
);

-- 插入默认分类数据
INSERT INTO post_categories (name, description, sort_order) VALUES
('干饭搭子', '寻找一起吃饭的伙伴', 1),
('运动搭子', '寻找运动伙伴', 2),
('学习搭子', '寻找学习伙伴', 3),
('游戏搭子', '寻找游戏伙伴', 4);

-- 插入细分类型数据
INSERT INTO post_subcategories (category_id, name, sort_order) VALUES
-- 干饭搭子
(1, '火锅', 1),
(1, '烧烤', 2),
(1, '炒菜', 3),
(1, '面条', 4),
(1, '其他', 99),
-- 运动搭子
(2, '羽毛球', 1),
(2, '篮球', 2),
(2, '乒乓球', 3),
(2, '跑步', 4),
(2, '其他', 99),
-- 学习搭子
(3, '编程', 1),
(3, '英文', 2),
(3, '数学', 3),
(3, '物理', 4),
(3, '金融', 5),
(3, '创业', 6),
(3, '其他', 99),
-- 游戏搭子
(4, '王者荣耀', 1),
(4, '和平精英', 2),
(4, 'LOL', 3),
(4, '其他', 99);

-- 创建默认管理员账户
INSERT INTO users (email, password, nickname, role) VALUES
('admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'admin'); 