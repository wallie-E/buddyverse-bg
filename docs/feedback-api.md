# 用户反馈接口文档

> Base URL: `https://your-api-host`  
> 所有接口均返回统一 JSON 格式

## 统一响应格式

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": "2026-05-10T07:27:40.788Z"
}
```

---

## 用户端接口

### 1. 提交反馈

**POST** `/api/feedback`

> 无需登录，支持匿名提交。若携带有效 Token，反馈将关联当前用户。

**请求头**

| Header | 是否必须 | 说明 |
|--------|--------|------|
| Content-Type | 必须 | `application/json` |
| Authorization | 可选 | `Bearer <token>`（已登录用户可携带） |

**请求体**

| 字段 | 类型 | 是否必须 | 说明 |
|------|------|--------|------|
| type | string | 必须 | 见下方枚举值 |
| description | string | 必须 | 详细描述，最多 300 个字符 |

**type 枚举值**

| 值 | 前端显示 |
|----|--------|
| `feature` | 功能建议 |
| `bug` | 问题反馈 |
| `report` | 内容举报 |
| `other` | 其他 |

**请求示例**

```http
POST /api/feedback
Content-Type: application/json

{
  "type": "feature",
  "description": "希望增加黑暗模式功能"
}
```

**成功响应（201）**

```json
{
  "success": true,
  "code": 201,
  "message": "反馈提交成功，感谢你的反馈！",
  "data": { "id": 1 },
  "timestamp": "2026-05-10T07:27:40.788Z"
}
```

**错误响应**

| HTTP 状态码 | 说明 |
|------------|------|
| 400 | type 无效 / description 为空 / description 超过 300 字 |
| 500 | 服务器内部错误 |

---

### 2. 获取我的反馈列表

**GET** `/api/feedback/mine`

> 需要登录，请求头携带 `Authorization: Bearer <token>`

**Query 参数**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|-------|------|
| page | number | 1 | 页码 |
| limit | number | 10 | 每页数量 |

**请求示例**

```http
GET /api/feedback/mine?page=1&limit=10
Authorization: Bearer <token>
```

**成功响应（200）**

```json
{
  "success": true,
  "code": 200,
  "message": "获取反馈列表成功",
  "data": {
    "list": [
      {
        "id": 1,
        "type": "feature",
        "description": "希望增加黑暗模式功能",
        "status": "pending",
        "admin_reply": null,
        "created_at": "2026-05-10T07:27:40.000Z",
        "updated_at": "2026-05-10T07:27:40.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  },
  "timestamp": "2026-05-10T07:30:00.000Z"
}
```

**status 字段说明**

| 值 | 含义 |
|----|------|
| `pending` | 待处理 |
| `reviewed` | 已查看 |
| `resolved` | 已解决 |

**错误响应**

| HTTP 状态码 | 说明 |
|------------|------|
| 401 | 未登录或 Token 无效 |
| 500 | 服务器内部错误 |

---

## 管理员接口

> 以下接口均需要管理员权限，请求头必须携带管理员账号的 `Authorization: Bearer <token>`

### 3. 获取所有反馈列表

**GET** `/api/admin/feedbacks`

**Query 参数**

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
|------|------|-------|-------|------|
| page | number | 1 | — | 页码 |
| limit | number | 20 | — | 每页数量 |
| type | string | 全部 | `feature` / `bug` / `report` / `other` | 按反馈类型筛选 |
| status | string | 全部 | `pending` / `reviewed` / `resolved` | 按处理状态筛选 |

**请求示例**

```http
GET /api/admin/feedbacks?page=1&limit=20&status=pending
Authorization: Bearer <token>
```

**成功响应（200）**

```json
{
  "success": true,
  "code": 200,
  "message": "获取反馈列表成功",
  "data": {
    "list": [
      {
        "id": 1,
        "type": "feature",
        "description": "希望增加黑暗模式功能",
        "status": "pending",
        "admin_reply": null,
        "created_at": "2026-05-10T07:27:40.000Z",
        "updated_at": "2026-05-10T07:27:40.000Z",
        "user_id": 42,
        "user_nickname": "张三",
        "user_email": "zhangsan@example.com"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "pages": 5
    }
  },
  "timestamp": "2026-05-10T07:30:00.000Z"
}
```

---

### 4. 更新反馈状态及回复

**PUT** `/api/admin/feedbacks/:id`

**Path 参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 反馈 ID |

**请求体**

| 字段 | 类型 | 是否必须 | 说明 |
|------|------|--------|------|
| status | string | 必须 | `pending` / `reviewed` / `resolved` |
| admin_reply | string | 可选 | 管理员回复内容，最多 500 字符 |

**请求示例**

```http
PUT /api/admin/feedbacks/1
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "resolved",
  "admin_reply": "感谢反馈，黑暗模式已在下个版本中支持！"
}
```

**成功响应（200）**

```json
{
  "success": true,
  "code": 200,
  "message": "反馈状态更新成功",
  "data": null,
  "timestamp": "2026-05-10T08:00:00.000Z"
}
```

**错误响应**

| HTTP 状态码 | 说明 |
|------------|------|
| 400 | status 无效 / admin_reply 超过 500 字 |
| 401 | 未登录 |
| 403 | 非管理员账号 |
| 404 | 反馈不存在 |
| 500 | 服务器内部错误 |

---

### 5. 删除反馈

**DELETE** `/api/admin/feedbacks/:id`

**Path 参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 反馈 ID |

**请求示例**

```http
DELETE /api/admin/feedbacks/1
Authorization: Bearer <token>
```

**成功响应（200）**

```json
{
  "success": true,
  "code": 200,
  "message": "删除成功",
  "data": null,
  "timestamp": "2026-05-10T08:00:00.000Z"
}
```

**错误响应**

| HTTP 状态码 | 说明 |
|------------|------|
| 401 | 未登录 |
| 403 | 非管理员账号 |
| 404 | 反馈不存在 |
| 500 | 服务器内部错误 |
