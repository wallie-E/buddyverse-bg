import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WechatExchangeModal from './WechatExchangeModal';

/**
 * 通知列表组件示例
 * 包含微信交换通知的处理
 */
const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // 微信交换弹窗状态
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 获取通知列表
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications', {
        params: { page, limit: 20 },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setNotifications(response.data.data.list);
        setTotal(response.data.data.pagination.total);
      }
    } catch (err) {
      console.error('获取通知失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 标记通知已读
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      // 更新本地状态
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('标记已读失败:', err);
    }
  };

  // 处理通知点击
  const handleNotificationClick = async (notification) => {
    // 标记为已读
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // 根据通知类型处理
    switch (notification.type) {
      case 'wechat_exchange_request':
        // 打开微信交换弹窗
        setSelectedUser({
          id: notification.related_user_id || notification.related_id,
          name: extractUserNameFromContent(notification.content)
        });
        setShowExchangeModal(true);
        break;

      case 'wechat_exchange_confirmed':
        // 可以打开弹窗查看对方微信号
        setSelectedUser({
          id: notification.related_user_id || notification.related_id,
          name: extractUserNameFromContent(notification.content)
        });
        setShowExchangeModal(true);
        break;

      case 'comment':
      case 'reply':
        // 跳转到帖子详情
        if (notification.post_id) {
          window.location.href = `/posts/${notification.post_id}`;
        }
        break;

      default:
        // 其他通知类型的处理
        break;
    }
  };

  // 从通知内容中提取用户名（简单实现）
  const extractUserNameFromContent = (content) => {
    const match = content.match(/^(.+?)\s/);
    return match ? match[1] : '用户';
  };

  // 获取通知图标
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'wechat_exchange_request':
        return '💬';
      case 'wechat_exchange_confirmed':
        return '✅';
      case 'comment':
        return '💭';
      case 'reply':
        return '↩️';
      case 'system':
        return '📢';
      default:
        return '🔔';
    }
  };

  // 获取通知类型文本
  const getNotificationTypeText = (type) => {
    switch (type) {
      case 'wechat_exchange_request':
        return '微信交换请求';
      case 'wechat_exchange_confirmed':
        return '微信交换确认';
      case 'comment':
        return '评论';
      case 'reply':
        return '回复';
      case 'system':
        return '系统通知';
      default:
        return '通知';
    }
  };

  // 格式化时间
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="notification-list">
      <div className="notification-header">
        <h2>通知中心</h2>
        <button 
          onClick={() => {
            axios.put('/api/notifications/read-all', {}, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }).then(() => {
              setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            });
          }}
        >
          全部已读
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <p>暂无通知</p>
        </div>
      ) : (
        <div className="notifications">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <div className="notification-header-row">
                  <span className="notification-type">
                    {getNotificationTypeText(notification.type)}
                  </span>
                  <span className="notification-time">
                    {formatTime(notification.created_at)}
                  </span>
                </div>
                <div className="notification-title">{notification.title}</div>
                <div className="notification-text">{notification.content}</div>
              </div>
              {!notification.is_read && <div className="unread-dot"></div>}
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {total > 20 && (
        <div className="pagination">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            上一页
          </button>
          <span>第 {page} 页</span>
          <button 
            onClick={() => setPage(p => p + 1)}
            disabled={page * 20 >= total}
          >
            下一页
          </button>
        </div>
      )}

      {/* 微信交换弹窗 */}
      <WechatExchangeModal
        visible={showExchangeModal}
        targetUserId={selectedUser?.id}
        targetUserName={selectedUser?.name}
        onClose={() => {
          setShowExchangeModal(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          // 刷新通知列表
          fetchNotifications();
        }}
      />
    </div>
  );
};

export default NotificationList;

/* CSS 样式示例 */
/*
.notification-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.notification-header h2 {
  margin: 0;
  font-size: 24px;
}

.notification-header button {
  padding: 8px 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.notification-header button:hover {
  background: #e0e0e0;
}

.notifications {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.notification-item:hover {
  background: #f9f9f9;
}

.notification-item.unread {
  background: #f0f7ff;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 50%;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.notification-type {
  font-size: 12px;
  color: #07c160;
  font-weight: 500;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.notification-text {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.unread-dot {
  position: absolute;
  top: 20px;
  right: 16px;
  width: 8px;
  height: 8px;
  background: #07c160;
  border-radius: 50%;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.pagination button:hover:not(:disabled) {
  background: #f0f0f0;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}
*/

