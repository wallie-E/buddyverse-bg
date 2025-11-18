# 微信交换功能 💬

> 完整实现的用户微信号交换功能，采用双向确认机制，集成通知系统

## 🎯 功能概述

用户之间可以互相交换微信号，采用双向确认机制确保双方都同意交换。只有当双方都提供微信号并确认后，才能查看对方的微信号。

### 核心特性

- ✅ **双向确认** - 发起人和接收人都需要确认
- ✅ **实时通知** - 发起和确认时自动发送通知
- ✅ **隐私保护** - 只有完成后才能看到对方微信号
- ✅ **重新发起** - 支持更新微信号和重新发送
- ✅ **状态管理** - 待确认、已完成、已拒绝、已过期
- ✅ **完整记录** - 可查看所有交换历史

## 🚀 快速开始

### 1. 数据库迁移（已完成 ✅）

```bash
node scripts/addWechatExchange.js
```

### 2. 启动服务

```bash
npm start
```

### 3. 测试 API

选择以下任一方式：

**方式 1: 使用 Postman**
- 导入 `微信交换API测试集合.postman_collection.json`
- 设置环境变量（token, baseUrl, targetUserId）
- 按顺序执行测试

**方式 2: 使用 curl**
```bash
# 获取交换信息
curl -X GET "http://localhost:8080/api/wechat-exchange/info?targetUserId=2" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 发起交换请求
curl -X POST "http://localhost:8080/api/wechat-exchange/request" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"targetUserId": 2, "wechatId": "my_wechat_123"}'
```

**方式 3: 使用测试脚本**
```bash
# 编辑脚本设置 token
vi scripts/testWechatExchange.js
# 运行测试
node scripts/testWechatExchange.js
```

## 📋 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/wechat-exchange/info` | 获取交换信息 |
| POST | `/api/wechat-exchange/request` | 发起/更新交换请求 |
| POST | `/api/wechat-exchange/confirm` | 确认交换（接受/拒绝）|
| GET | `/api/wechat-exchange/my-exchanges` | 获取我的交换记录 |

详细 API 文档请查看：[微信交换功能文档.md](./微信交换功能文档.md)

## 💻 前端集成

### 使用 React 组件

```jsx
import WechatExchangeModal from './components/WechatExchangeModal';

function UserProfile({ userId, userName }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        交换微信
      </button>

      <WechatExchangeModal
        visible={showModal}
        targetUserId={userId}
        targetUserName={userName}
        onClose={() => setShowModal(false)}
        onSuccess={() => alert('操作成功')}
      />
    </>
  );
}
```

更多集成示例请查看：[examples/使用示例.md](./examples/使用示例.md)

## 📂 项目文件

```
project/
├── controllers/
│   └── wechatExchangeController.js    # 业务逻辑
├── routes/
│   └── wechatExchange.js              # API 路由
├── database/migrations/
│   └── add_wechat_exchange.sql        # 数据库迁移
├── scripts/
│   ├── addWechatExchange.js           # 迁移执行脚本
│   └── testWechatExchange.js          # 自动化测试
├── examples/
│   ├── WechatExchangeModal.jsx        # React 弹窗组件
│   ├── NotificationList.jsx           # 通知列表组件
│   └── 使用示例.md                    # 使用文档
└── 文档/
    ├── 微信交换功能文档.md             # 完整文档
    ├── 微信交换功能快速开始.md         # 快速指南
    └── 微信交换功能实现总结.md         # 实现总结
```

完整文件清单：[PROJECT_FILES.md](./PROJECT_FILES.md)

## 🔄 业务流程

### 场景 1: 首次交换

```
用户A [发起] → 输入微信号 → 创建记录 → 通知用户B
                                         ↓
                          用户B收到通知 → 点击确认 → 输入微信号
                                                      ↓
                          完成交换 → 通知用户A → 双方可查看微信号
```

### 场景 2: 查看已完成的交换

```
用户点击"交换微信" → 查询状态 → 发现已完成 → 直接展示对方微信号
```

## 📖 文档导航

- 📘 [完整功能文档](./微信交换功能文档.md) - 详细的 API 和业务说明
- 🚀 [快速开始指南](./微信交换功能快速开始.md) - 快速上手指南
- 📝 [实现总结](./微信交换功能实现总结.md) - 实现细节和技术总结
- 💡 [使用示例](./examples/使用示例.md) - 实际场景的代码示例
- 📋 [文件清单](./PROJECT_FILES.md) - 完整的文件列表

## ✅ 完成状态

- ✅ 数据库表创建并迁移成功
- ✅ 4 个后端 API 接口完成
- ✅ 前端 React 组件完成
- ✅ 通知系统集成完成
- ✅ 测试工具和文档完成
- ✅ 代码无 linter 错误
- ✅ 服务运行正常

**功能已 100% 完成，可立即投入使用！** 🎉

## 🧪 测试

### 健康检查
```bash
curl http://localhost:8080/health
```

### 运行自动化测试
```bash
node scripts/testWechatExchange.js
```

### 使用 Postman
导入 `微信交换API测试集合.postman_collection.json`

## 🔐 安全性

- ✅ JWT 认证保护所有接口
- ✅ 用户权限验证
- ✅ 参数验证和过滤
- ✅ SQL 注入防护
- ✅ 事务处理保证数据一致性
- ✅ 隐私保护（微信号权限控制）

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **数据库**: MySQL 8.0
- **认证**: JWT
- **前端**: React（示例）
- **测试**: Postman + 自定义脚本

## 📊 统计信息

- **新增文件**: 13 个
- **代码行数**: ≈1,420 行
- **文档字数**: ≈28,000 字
- **API 接口**: 4 个
- **测试用例**: 9 个
- **React 组件**: 2 个

## ❓ 常见问题

**Q: 如何获取 JWT token？**

A: 通过登录接口获取：
```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

**Q: 数据库迁移失败？**

A: 检查数据库连接配置，确保 MySQL 服务正常运行。

**Q: 如何在前端使用？**

A: 复制 `examples` 目录下的组件到你的项目，参考使用示例文档进行集成。

更多问题请查看：[微信交换功能文档.md#常见问题](./微信交换功能文档.md#常见问题)

## 🤝 支持

如有问题或建议，欢迎反馈！

## 📄 许可

本项目代码仅供参考和学习使用。

---

**祝开发顺利！** 🚀

*最后更新: 2025-11-16*

