-- 在 posts 表中添加作者信息字段
ALTER TABLE posts 
ADD COLUMN author_nickname VARCHAR(100) DEFAULT NULL COMMENT '作者昵称（冗余存储）' AFTER user_id,
ADD COLUMN author_gender ENUM('male', 'female', 'other') DEFAULT NULL COMMENT '作者性别（冗余存储）' AFTER author_nickname;
