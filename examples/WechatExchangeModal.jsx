import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * 微信交换弹窗组件示例
 * 
 * Props:
 * - visible: boolean - 是否显示弹窗
 * - targetUserId: number - 目标用户ID
 * - targetUserName: string - 目标用户名称
 * - onClose: function - 关闭弹窗回调
 * - onSuccess: function - 交换成功回调
 */
const WechatExchangeModal = ({ 
  visible, 
  targetUserId, 
  targetUserName, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(true);
  const [exchangeInfo, setExchangeInfo] = useState(null);
  const [wechatId, setWechatId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 获取交换信息
  const fetchExchangeInfo = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/wechat-exchange/info', {
        params: { targetUserId },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setExchangeInfo(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || '获取交换信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 发起交换请求
  const handleRequestExchange = async () => {
    if (!wechatId.trim()) {
      setError('请输入微信号');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const isUpdate = exchangeInfo?.exists && exchangeInfo?.status === 0;
      
      const response = await axios.post(
        '/api/wechat-exchange/request',
        {
          targetUserId,
          wechatId: wechatId.trim(),
          isUpdate
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        alert(isUpdate ? '已重新发送交换请求' : '交换请求已发送');
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || '发送请求失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 确认交换
  const handleConfirmExchange = async (action) => {
    if (action === 'accept' && !wechatId.trim()) {
      setError('请输入微信号');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await axios.post(
        '/api/wechat-exchange/confirm',
        {
          exchangeNo: exchangeInfo.exchangeNo,
          wechatId: wechatId.trim(),
          action
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        if (action === 'accept') {
          alert(`交换成功！对方微信号：${response.data.data.otherWechat}`);
        } else {
          alert('已拒绝交换');
        }
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (visible && targetUserId) {
      fetchExchangeInfo();
    }
  }, [visible, targetUserId]);

  if (!visible) return null;

  // 渲染内容
  const renderContent = () => {
    if (loading) {
      return <div className="loading">加载中...</div>;
    }

    // 情况1：已经交换成功
    if (exchangeInfo?.exists && exchangeInfo?.status === 1) {
      return (
        <div className="exchange-completed">
          <h3>✓ 已交换微信</h3>
          <div className="wechat-info">
            <p><strong>对方昵称：</strong>{exchangeInfo.otherNickname}</p>
            <p><strong>对方微信号：</strong>{exchangeInfo.otherWechat}</p>
            <p className="tip">可以复制微信号去添加好友了</p>
          </div>
          <button onClick={onClose}>关闭</button>
        </div>
      );
    }

    // 情况2：等待对方确认（我是发起人）
    if (exchangeInfo?.exists && 
        exchangeInfo?.status === 0 && 
        exchangeInfo?.myRole === 'initiator' && 
        exchangeInfo?.waitingFor === 'other') {
      return (
        <div className="waiting-other">
          <h3>等待对方确认</h3>
          <p>您已向 {targetUserName} 发送交换请求</p>
          <p className="tip">对方确认后，您将收到通知</p>
          <div className="input-group">
            <label>您的微信号：</label>
            <input
              type="text"
              value={wechatId}
              onChange={(e) => setWechatId(e.target.value)}
              placeholder="输入微信号以重新发送"
            />
          </div>
          {error && <p className="error">{error}</p>}
          <div className="button-group">
            <button onClick={handleRequestExchange} disabled={submitting}>
              {submitting ? '发送中...' : '重新发送请求'}
            </button>
            <button onClick={onClose}>关闭</button>
          </div>
        </div>
      );
    }

    // 情况3：等待我确认（我是接收人）
    if (exchangeInfo?.exists && 
        exchangeInfo?.status === 0 && 
        exchangeInfo?.myRole === 'receiver' && 
        exchangeInfo?.waitingFor === 'me') {
      return (
        <div className="confirm-exchange">
          <h3>{targetUserName} 想与您交换微信</h3>
          <div className="input-group">
            <label>您的微信号：</label>
            <input
              type="text"
              value={wechatId}
              onChange={(e) => setWechatId(e.target.value)}
              placeholder="输入您的微信号"
            />
          </div>
          {error && <p className="error">{error}</p>}
          <div className="button-group">
            <button 
              onClick={() => handleConfirmExchange('accept')} 
              disabled={submitting}
              className="accept-btn"
            >
              {submitting ? '处理中...' : '同意交换'}
            </button>
            <button 
              onClick={() => handleConfirmExchange('reject')} 
              disabled={submitting}
              className="reject-btn"
            >
              拒绝
            </button>
            <button onClick={onClose}>取消</button>
          </div>
        </div>
      );
    }

    // 情况4：首次发起交换
    return (
      <div className="new-exchange">
        <h3>与 {targetUserName} 交换微信</h3>
        <p>输入您的微信号发起交换请求</p>
        <div className="input-group">
          <label>您的微信号：</label>
          <input
            type="text"
            value={wechatId}
            onChange={(e) => setWechatId(e.target.value)}
            placeholder="输入您的微信号"
          />
        </div>
        {error && <p className="error">{error}</p>}
        <div className="button-group">
          <button onClick={handleRequestExchange} disabled={submitting}>
            {submitting ? '发送中...' : '发送交换请求'}
          </button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {renderContent()}
      </div>
    </div>
  );
};

export default WechatExchangeModal;

/* CSS 样式示例 */
/*
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
  color: #333;
}

.input-group {
  margin: 16px 0;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.input-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.button-group {
  display: flex;
  gap: 8px;
  margin-top: 20px;
}

.button-group button {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.button-group button:first-child {
  background: #07c160;
  color: white;
}

.button-group button:first-child:hover:not(:disabled) {
  background: #06ad56;
}

.accept-btn {
  background: #07c160 !important;
  color: white !important;
}

.reject-btn {
  background: #ee0a24 !important;
  color: white !important;
}

.button-group button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #ee0a24;
  font-size: 14px;
  margin-top: 8px;
}

.tip {
  color: #999;
  font-size: 13px;
  margin-top: 8px;
}

.wechat-info {
  background: #f7f7f7;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
}

.wechat-info p {
  margin: 8px 0;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}
*/

