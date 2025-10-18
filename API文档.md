# 社交帖子平台 API 文档

## 概述

基于RESTful风格的社交帖子平台后端API，支持用户注册登录、帖子发布、评论互动、通知系统和管理功能。

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **编码**: UTF-8

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {}, // 响应数据
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 错误响应
```json
{
  "success": false,
  "code": 400,
  "message": "错误信息",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 分页响应
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [], // 数据列表
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 认证相关 API

### 1. 用户注册
**POST** `/auth/register`

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "123456",
  "nickname": "用户昵称"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "用户昵称",
      "gender": "other",
      "avatar": null,
      "signature": null,
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. 用户登录
**POST** `/auth/login`

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

### 3. 获取当前用户信息
**GET** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

## 用户管理 API

### 1. 更新用户信息
**PUT** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**请求体:**
```json
{
  "nickname": "新昵称",
  "gender": "male", // male, female, other
  "signature": "个人签名"
}
```

### 2. 获取用户发布的帖子
**GET** `/users/posts?page=1&limit=10`

**Headers:** `Authorization: Bearer <token>`

## 帖子管理 API

### 1. 创建帖子
**POST** `/posts`

**Headers:** `Authorization: Bearer <token>`

**请求体:**
```json
{
  "content": "帖子内容",
  "location": "发布位置",
  "category_id": 1,
  "subcategory_id": 1,
  "comment_visibility": "public" // public, private
}
```

### 2. 获取帖子列表
**GET** `/posts?page=1&limit=10&category_id=1&subcategory_id=1`

**查询参数:**
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)
- `category_id`: 分类ID (可选)
- `subcategory_id`: 细分类型ID (可选)

### 3. 获取帖子详情
**GET** `/posts/:id`

### 4. 删除帖子
**DELETE** `/posts/:id`

**Headers:** `Authorization: Bearer <token>`

## 评论管理 API

### 1. 创建评论
**POST** `/comments`

**Headers:** `Authorization: Bearer <token>`

**请求体:**
```json
{
  "post_id": 1,
  "content": "评论内容"
}
```

### 2. 获取帖子评论列表
**GET** `/comments/post/:postId?page=1&limit=10`

### 3. 删除评论
**DELETE** `/comments/:id`

**Headers:** `Authorization: Bearer <token>`

## 分类管理 API

### 1. 获取所有分类
**GET** `/categories`

**响应:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "干饭搭子",
      "description": "寻找一起吃饭的伙伴",
      "subcategories": [
        {
          "id": 1,
          "name": "火锅",
          "description": null
        }
      ]
    }
  ]
}
```

### 2. 获取指定分类的细分类型
**GET** `/categories/:categoryId/subcategories`

## 通知管理 API

### 1. 获取通知列表
**GET** `/notifications?page=1&limit=20&type=comment`

**Headers:** `Authorization: Bearer <token>`

**查询参数:**
- `type`: 通知类型 (comment, reply, system)

### 2. 获取未读通知数量
**GET** `/notifications/unread-count`

**Headers:** `Authorization: Bearer <token>`

### 3. 标记通知为已读
**PUT** `/notifications/:id/read`

**Headers:** `Authorization: Bearer <token>`

### 4. 标记所有通知为已读
**PUT** `/notifications/read-all`

**Headers:** `Authorization: Bearer <token>`

### 5. 删除通知
**DELETE** `/notifications/:id`

**Headers:** `Authorization: Bearer <token>`

## 管理员 API

> 所有管理员API都需要管理员权限

### 1. 获取统计数据
**GET** `/admin/stats`

**Headers:** `Authorization: Bearer <token>`

### 2. 用户管理

#### 获取用户列表
**GET** `/admin/users?page=1&limit=20&status=active&role=user`

#### 删除用户
**DELETE** `/admin/users/:id`

#### 修改用户状态
**PUT** `/admin/users/:id/status`

**请求体:**
```json
{
  "status": "banned" // active, inactive, banned
}
```

### 3. 帖子管理

#### 获取帖子列表
**GET** `/admin/posts?page=1&limit=20&status=active&category_id=1`

#### 删除帖子
**DELETE** `/admin/posts/:id`

### 4. 评论管理

#### 获取评论列表
**GET** `/admin/comments?page=1&limit=20&status=active&post_id=1`

#### 删除评论
**DELETE** `/admin/comments/:id`

## 状态码说明

- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证或认证失败
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 资源冲突
- `429` - 请求过于频繁
- `500` - 服务器内部错误

## 错误码说明

常见错误信息：
- `邮箱已被注册`
- `邮箱或密码错误`
- `请先登录`
- `需要管理员权限`
- `帖子不存在`
- `评论不存在`
- `没有权限删除此帖子`

## 数据库表结构

### 用户表 (users)
- `id` - 主键
- `email` - 邮箱 (唯一)
- `password` - 密码 (加密)
- `nickname` - 昵称
- `gender` - 性别 (male/female/other)
- `avatar` - 头像
- `signature` - 签名
- `role` - 角色 (user/admin)
- `status` - 状态 (active/inactive/banned)
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 帖子表 (posts)
- `id` - 主键
- `user_id` - 用户ID
- `content` - 内容 (最大150字)
- `location` - 位置
- `category_id` - 分类ID
- `subcategory_id` - 细分类型ID
- `comment_visibility` - 评论可见性 (public/private)
- `comment_count` - 评论数量
- `status` - 状态 (active/deleted)
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 评论表 (comments)
- `id` - 主键
- `post_id` - 帖子ID
- `user_id` - 用户ID
- `content` - 内容
- `status` - 状态 (active/deleted)
- `created_at` - 创建时间
- `updated_at` - 更新时间

## 环境变量

```bash
# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=3000
NODE_ENV=production
```

## 部署说明

1. 安装依赖: `npm install`
2. 配置环境变量
3. 初始化数据库: 执行 `database/init.sql`
4. 启动服务: `npm start`
5. 开发模式: `npm run dev`

## 测试用户

默认管理员账户：
- 邮箱: `admin@example.com`
- 密码: `password` (请及时修改)

## 注意事项

1. 所有接口都有频率限制 (15分钟内最多100次请求)
2. 帖子内容限制150字
3. 评论内容限制500字
4. 文件上传功能尚未实现
5. 请在生产环境中修改JWT密钥和数据库密码 