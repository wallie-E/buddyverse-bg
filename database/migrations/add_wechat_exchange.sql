-- 微信交换记录表
CREATE TABLE IF NOT EXISTS wechat_exchange (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微信交换记录表';

-- 修改通知表的类型枚举，添加微信交换相关通知类型
ALTER TABLE notifications 
MODIFY COLUMN type ENUM('comment', 'reply', 'system', 'wechat_exchange_request', 'wechat_exchange_confirmed') NOT NULL;

