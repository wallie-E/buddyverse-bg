-- 在 users 表中添加 QQ 号字段
ALTER TABLE users
  ADD COLUMN qq_id VARCHAR(15) DEFAULT NULL COMMENT 'QQ号（纯数字）' AFTER wechat_id;
