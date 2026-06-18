# peanutwcx.xyz — 后端

基于 NestJS + Prisma + MySQL 8 的个人网站后端 API。

## 技术栈

| 技术 | 用途 |
|------|------|
| NestJS | Node.js 服务端框架 |
| Prisma 5 | ORM + 数据库迁移 |
| MySQL 8 | 主数据库 |
| JWT | 双 Token 认证（access 15m + refresh 7d） |
| Passport | 认证中间件 |
| ali-oss | 阿里云 OSS 预签名上传 |
| class-validator | 请求参数校验 |

## 目录结构

```
src/
├── auth/             # 登录、注册、Token 刷新、JWT 策略
├── users/            # 用户资料（GET/PATCH /users/me）
├── thoughts/         # 日常动态（日常/运动/饮食/投资/文献/想法）
├── articles/         # 文章（CRUD + 分类/标签/浏览数）
├── resources/        # 资源（OSS 预签名 + 资源记录）
├── cats/             # 猫猫照片墙（媒体上传 + 展示）
├── folders/          # 资源文件夹
├── common/
│   ├── decorators/   # @Public()、@CurrentUser()
│   ├── filters/      # 全局异常过滤器
│   ├── guards/       # JwtAuthGuard（全局默认启用）
│   └── interceptors/ # 响应包装拦截器
└── app.module.ts
prisma/
├── schema.prisma     # 数据库模型定义
├── migrations/       # 迁移历史
└── seed.ts           # 初始化管理员账号
```

## 本地开发

### 1. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

DATABASE_URL="mysql://chenxu:yourpassword@localhost:3306/chenxu_space"

JWT_SECRET=至少32位随机字符串
JWT_REFRESH_SECRET=另一个至少32位随机字符串

OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_BUCKET=my-pan-disk
OSS_REGION=oss-cn-beijing
OSS_ENDPOINT=oss-cn-beijing.aliyuncs.com

FEISHU_ALERT_WEBHOOK=
FEISHU_ALERT_SECRET=
FEISHU_ALERT_INTERVAL_MS=60000

ADMIN_PHONE=12200001116
ADMIN_PASSWORD=<管理员密码>
ADMIN_NICKNAME=chenxu
```

### 2. 初始化数据库

```bash
# 执行迁移（建表）
npx prisma migrate dev

# 生成 Prisma Client
npx prisma generate

# 查看数据库（可选）
npx prisma studio
```

### 3. 创建管理员账号

```bash
# 在 monorepo 根目录执行
pnpm seed

# 可通过环境变量覆盖：
ADMIN_PHONE=12200001116 ADMIN_PASSWORD=MyPass123! ADMIN_NICKNAME=chenxu pnpm seed
```

手机号校验规则为 `1` 开头的 11 位数字。seed 只会创建不存在的手机号，不会覆盖已有账号。

### 4. 启动开发服务器

```bash
# 在 monorepo 根目录（推荐）
pnpm dev:server

# 或在 apps/server 目录
pnpm start:dev
```

API 运行在：http://localhost:3000

## 构建

```bash
pnpm --filter server run build
# 产物在 apps/server/dist/
```

## API 接口

### 认证

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册 | 公开 |
| POST | `/api/auth/login` | 登录，返回 access/refresh token | 公开 |
| POST | `/api/auth/refresh` | 刷新 access token | 需 refresh token |
| POST | `/api/auth/logout` | 登出（清除 refresh token） | 需登录 |

### 用户

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/users/me` | 获取当前用户信息 | 需登录 |
| PATCH | `/api/users/me` | 更新昵称/头像 | 需登录 |

### 日常动态

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/thoughts` | 获取动态列表，支持分页和类型筛选 | 公开 |
| GET | `/api/thoughts/:id` | 获取动态详情 | 公开 |
| POST | `/api/thoughts` | 发布动态（支持图片、运动字段） | 需 admin |
| POST | `/api/thoughts/:id/like` | 点赞/取消点赞 | 需登录 |
| POST | `/api/thoughts/:id/dislike` | 踩一下/取消 | 需登录 |
| GET | `/api/thoughts/:id/comments` | 获取评论 | 公开 |
| POST | `/api/thoughts/:id/comments` | 发表评论 | 需登录 |
| DELETE | `/api/thoughts/:id` | 软删除动态 | 需 admin |

动态类型：`daily`、`sport`、`diet`、`investment`、`literature`、`idea`。运动动态可附带 `sportType`、`sportDuration`、`sportCalories`。

### 文章

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/articles` | 文章列表（分页、分类筛选） | 公开 |
| GET | `/api/articles/:slug` | 文章详情 | 公开 |
| POST | `/api/articles` | 创建文章 | 需 admin |
| PATCH | `/api/articles/:id` | 更新文章 | 需 admin |
| DELETE | `/api/articles/:id` | 删除文章 | 需 admin |
| GET | `/api/categories` | 分类列表 | 公开 |

### 资源

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/resources` | 资源列表（分页、类型筛选） | 公开 |
| GET | `/api/resources/categories` | 资源分类列表 | 公开 |
| POST | `/api/resources/upload` | 获取 OSS 上传信息（返回 `uploadUrl` 和 `publicUrl`） | 需登录 |
| POST | `/api/resources/presign` | 获取 OSS 预签名上传 URL | 需登录 |
| POST | `/api/resources/avatar/presign` | 获取头像上传 URL | 需登录 |
| POST | `/api/resources` | 上传完成后保存资源记录 | 需登录 |
| DELETE | `/api/resources/:id` | 删除资源 | 需 admin |

### 猫猫照片墙

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/cats` | 获取猫猫资料（蛋黄、六六） | 公开 |
| GET | `/api/cats/media` | 获取照片墙媒体列表 | 公开 |
| POST | `/api/cats/media/upload` | 获取猫猫媒体上传信息 | 需 admin |
| POST | `/api/cats/media/presign` | 获取猫猫媒体预签名 URL | 需 admin |
| POST | `/api/cats/media` | 保存猫猫媒体记录 | 需 admin |
| DELETE | `/api/cats/media/:id` | 删除猫猫媒体 | 需 admin |

猫猫资料固定为：蛋黄（短毛金渐层，母猫，2023-04-08）和六六（长毛橘猫，公猫，2024-06-06）。

## 响应格式

所有接口统一返回：

```json
{
  "code": 200,
  "message": "ok",
  "data": { ... }
}
```

错误时：

```json
{
  "code": 400,
  "message": "错误描述",
  "data": null
}
```

## 认证机制

- 默认所有路由需要 JWT 认证（全局 `JwtAuthGuard`）
- 用 `@Public()` 装饰器标记公开路由
- access token 有效期 15 分钟，refresh token 有效期 7 天
- access token 和 refresh token 通过 HttpOnly Cookie 下发
- 业务异常统一返回 HTTP 200，并通过响应体 `code` 表示错误码；未被业务包装的异常仍可能返回对应 HTTP 状态码

## 飞书告警

生产环境配置 `FEISHU_ALERT_WEBHOOK` 后，全局异常过滤器会在接口出现 500 级错误时发送飞书机器人提醒。提醒内容包含环境、状态码、接口、用户、错误信息和截断后的堆栈。

可选配置：

| 变量 | 说明 |
|------|------|
| `FEISHU_ALERT_WEBHOOK` | 飞书机器人 webhook |
| `FEISHU_ALERT_SECRET` | 飞书机器人签名密钥，未开启签名时留空 |
| `FEISHU_ALERT_INTERVAL_MS` | 相同异常的限流间隔，默认 60000 毫秒 |

告警只在 `NODE_ENV=production` 下生效，并且只处理 `code >= 500` 的服务端错误。参数错误、登录失败等 4xx 业务异常不会发送告警。

## 数据库迁移（生产环境）

容器启动时自动执行 `prisma migrate deploy`，无需手动操作。

手动执行：

```bash
docker compose exec server npx prisma migrate deploy
```
