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

## 本地启动流程

本项目是 monorepo，后端在 `apps/server`，前端在 `apps/web`，共享类型在 `packages/types`。

本地启动按固定顺序执行：安装依赖 -> 配置环境变量 -> 启动数据库 -> 初始化表结构 -> 创建管理员 -> 启动后端 -> 启动前端。

### 0. 环境要求

- Node.js 20.x
- pnpm 9+
- MySQL 8
- 可选：阿里云 OSS 配置，用于图片/文件上传

### 第一步：安装依赖

在仓库根目录执行：

```bash
pnpm install
```

### 第二步：配置本地环境变量

在仓库根目录执行：

```bash
cp apps/server/.env.example apps/server/.env
```

编辑 `apps/server/.env`，本地开发至少需要这些配置：

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

DATABASE_URL="mysql://chenxu:<你的MYSQL_PASSWORD>@localhost:3306/chenxu_space"

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

本地和生产通过 `DATABASE_URL` 区分数据库实例。本地通常连接 `localhost:3306`，生产容器连接 Docker 网络里的 `mysql:3306`。不要把生产库地址写进本地 `.env`。

### 第三步：启动数据库

如果你用 Homebrew 安装 MySQL：

```bash
brew services start mysql
```

创建本地数据库和应用账号：

```bash
mysql -uroot -p -e "CREATE DATABASE IF NOT EXISTS chenxu_space;"
mysql -uroot -p -e "CREATE USER IF NOT EXISTS 'chenxu'@'localhost' IDENTIFIED BY '<你的MYSQL_PASSWORD>'; GRANT ALL PRIVILEGES ON chenxu_space.* TO 'chenxu'@'localhost'; FLUSH PRIVILEGES;"
```

`<你的MYSQL_PASSWORD>` 要和 `apps/server/.env` 里的 `DATABASE_URL` 保持一致。

如果只是想看数据库：

```bash
cd apps/server
npx prisma studio
```

Prisma Studio 默认会打开一个本地网页，用于查看和编辑当前 `DATABASE_URL` 指向的数据库。

### 第四步：初始化表结构

```bash
cd apps/server
npx prisma migrate dev
npx prisma generate
cd ../..
```

`migrate dev` 用于本地开发，会根据 `prisma/migrations` 初始化或更新本地表结构。

### 第五步：创建管理员账号

```bash
# 在 monorepo 根目录执行
pnpm seed

# 可通过环境变量覆盖：
ADMIN_PHONE=12200001116 ADMIN_PASSWORD=MyPass123! ADMIN_NICKNAME=chenxu pnpm seed
```

手机号校验规则为 `1` 开头的 11 位数字。seed 只会创建不存在的手机号，不会覆盖已有账号。

### 第六步：启动后端服务

在仓库根目录执行：

```bash
pnpm --filter server start:dev
```

后端地址：

```text
http://localhost:3000
```

健康检查：

```bash
curl http://localhost:3000/api/health
```

### 第七步：启动前端服务

另开一个终端，在仓库根目录执行：

```bash
pnpm --filter web dev
```

前端地址：

```text
http://localhost:5173
```

前端的 `/api/*` 请求会通过 Vite 代理到本地后端 `http://localhost:3000`。

### 第八步：访问项目

```text
前端：http://localhost:5173
后端：http://localhost:3000
接口健康检查：http://localhost:3000/api/health
```

### 共享类型变更

如果你改了 `packages/types`，先构建共享类型：

```bash
pnpm --filter @chenxu/types build
```

然后重启前端或后端。

### 本地常见问题

| 问题 | 处理方式 |
|------|----------|
| `Can't reach database server at localhost:3306` | MySQL 没启动，或 `DATABASE_URL` 密码不对 |
| `Access denied for user 'chenxu'@'localhost'` | 本地 MySQL 用户密码和 `DATABASE_URL` 不一致 |
| `listen EADDRINUSE :::3000` | 3000 端口被占用，先 `lsof -i :3000`，再停止对应进程 |
| 登录后不是管理员 | 确认 `users.role` 是 `admin`，或重新用正确手机号 seed |
| 上传图片失败 | 检查 OSS 相关环境变量是否配置 |

### 本地启动命令速查

```bash
# 依赖
pnpm install

# 数据库迁移
cd apps/server && npx prisma migrate dev && cd ../..

# 创建管理员
pnpm seed

# 后端
pnpm --filter server start:dev

# 前端
pnpm --filter web dev

# 查看数据库
cd apps/server && npx prisma studio
```

## 服务端部署流程

生产环境通过 Docker Compose 运行 `mysql`、`server`、`web`、`nginx` 四个服务。部署按固定顺序执行：准备服务器 -> 配置生产环境变量 -> 准备证书 -> 本地构建前端 -> 上传发布包 -> 服务器构建镜像并启动容器 -> 验证服务。

### 第一步：准备服务器

服务器需要安装：

- Docker
- Docker Compose 或 `docker-compose`
- Nginx 证书目录 `nginx/ssl`
- 已解析到服务器的域名

生产目录默认：

```text
/opt/chenxu-space
```

### 第二步：配置生产环境变量

生产环境变量位于服务器：

```text
/opt/chenxu-space/.env
```

关键配置：

```env
MYSQL_ROOT_PASSWORD=强密码_root
MYSQL_PASSWORD=强密码_app

JWT_SECRET=至少32位随机字符串
JWT_REFRESH_SECRET=另一个至少32位随机字符串

OSS_ACCESS_KEY_ID=阿里云AccessKeyId
OSS_ACCESS_KEY_SECRET=阿里云AccessKeySecret
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

生产数据库由 Docker Compose 创建，后端连接串在 `docker-compose.yml` 中生成：

```text
mysql://chenxu:${MYSQL_PASSWORD}@mysql:3306/chenxu_space
```

### 第三步：准备 SSL 证书

证书文件放在：

```text
nginx/ssl/fullchain.pem
nginx/ssl/privkey.pem
```

如果需要重新申请证书，可在服务器执行：

```bash
certbot certonly --standalone -d peanutwcx.xyz -d www.peanutwcx.xyz
cp /etc/letsencrypt/live/peanutwcx.xyz/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/peanutwcx.xyz/privkey.pem nginx/ssl/
```

### 第四步：执行部署脚本

在本地仓库根目录执行：

```bash
pnpm run deploy
```

脚本会自动执行：

1. 本地构建共享类型：`pnpm --filter @chenxu/types build`
2. 本地构建前端：`pnpm --filter web build`
3. 打包代码并上传到服务器
4. 保留服务器 `.env` 和 `nginx/ssl`
5. 在服务器构建 Docker 镜像
6. 重建并启动 `mysql`、`server`、`web`、`nginx`
7. 检查 `https://peanutwcx.xyz/api/health`

前端必须本地构建。当前服务器内存较低，不建议在服务器上跑 Vite 构建。

### 第五步：验证生产服务

在服务器上查看容器：

```bash
cd /opt/chenxu-space
docker-compose ps
```

验证后端：

```bash
curl -sk --resolve peanutwcx.xyz:443:127.0.0.1 https://peanutwcx.xyz/api/health
```

验证前端资源：

```bash
curl -sk --resolve peanutwcx.xyz:443:127.0.0.1 https://peanutwcx.xyz/ | grep -o 'assets/[^"]*'
```

### 第六步：生产数据库迁移

服务端容器启动时会自动执行：

```bash
pnpm exec prisma migrate deploy
```

如需手动执行：

```bash
cd /opt/chenxu-space
docker-compose exec server npx prisma migrate deploy
```

### 第七步：常用服务端命令

```bash
cd /opt/chenxu-space

# 查看容器
docker-compose ps

# 查看后端日志
docker-compose logs -f server

# 重启后端
docker-compose restart server

# 查看生产数据库
docker-compose exec mysql mysql -uchenxu -p chenxu_space
```

## 构建

```bash
pnpm --filter @chenxu/types build
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
| GET | `/api/thoughts/insights` | 获取运动/投资数据面板汇总 | 公开 |
| GET | `/api/thoughts/:id` | 获取动态详情 | 公开 |
| POST | `/api/thoughts` | 发布动态（支持图片、运动字段） | 需 admin |
| PATCH | `/api/thoughts/:id` | 编辑动态 | 需 admin |
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
