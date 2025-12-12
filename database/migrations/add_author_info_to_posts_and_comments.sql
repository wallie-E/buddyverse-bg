-- 在 posts 表中添加作者信息字段
ALTER TABLE posts 
ADD COLUMN author_nickname VARCHAR(100) DEFAULT NULL COMMENT '作者昵称（冗余存储）' AFTER user_id,
ADD COLUMN author_gender ENUM('male', 'female', 'other') DEFAULT NULL COMMENT '作者性别（冗余存储）' AFTER author_nickname;

-- 在 comments 表中添加评论者信息字段
ALTER TABLE comments 
ADD COLUMN author_nickname VARCHAR(100) DEFAULT NULL COMMENT '评论者昵称（冗余存储）' AFTER user_id,
ADD COLUMN author_gender ENUM('male', 'female', 'other') DEFAULT NULL COMMENT '评论者性别（冗余存储）' AFTER author_nickname;

-- 添加索引以提升查询性能（如果需要按作者昵称查询）
-- ALTER TABLE posts ADD INDEX idx_author_nickname (author_nickname);
-- ALTER TABLE comments ADD INDEX idx_author_nickname (author_nickname);
