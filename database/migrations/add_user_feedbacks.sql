-- 用户反馈表
CREATE TABLE IF NOT EXISTS user_feedbacks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  type ENUM('feature', 'bug', 'report', 'other') NOT NULL COMMENT '功能建议/问题反馈/内容举报/其他',
  description TEXT NOT NULL COMMENT '详细描述',
  status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending' COMMENT '处理状态',
  admin_reply VARCHAR(500) DEFAULT NULL COMMENT '管理员回复',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);
