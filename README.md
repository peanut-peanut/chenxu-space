# peanutwcx.xyz

个人网站，包含想法、文章、资源等模块。

**技术栈：** React 19 + Vite 6 + Tailwind CSS v4 + TanStack Router/Query（前端）；NestJS + Prisma + MySQL 8（后端）；Docker Compose + Nginx + SSL（部署）

---

## 目录结构

```
chenxu-space/
├── apps/
│   ├── web/          # 前端 React 应用
│   └── server/       # 后端 NestJS 应用
├── packages/
│   └── types/        # 前后端共享 TypeScript 类型
├── nginx/            # Nginx 生产配置
├── mysql/            # MySQL 配置
├── docker-compose.yml
└── package.json      # Monorepo 根脚本
```

---

## 本地开发

### 环境要求

- Node.js 20.x（注意：需 < 20.19，已测试 20.13.1）
- pnpm 9+
- MySQL 8（本地运行或 Docker）

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

根目录环境变量（供 Docker Compose 等场景使用）：

```bash
cp .env.example .env
```

后端本地环境变量：

```bash
cp apps/server/.env.example apps/server/.env
```

编辑 `apps/server/.env`，至少保证以下配置正确：

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL="mysql://chenxu:<你的MYSQL_PASSWORD>@localhost:3306/chenxu_space"
JWT_SECRET=<任意长随机字符串>
JWT_REFRESH_SECRET=<任意长随机字符串>
ADMIN_EMAIL=admin@peanutwcx.xyz
ADMIN_PASSWORD=<管理员密码>
ADMIN_NICKNAME=chenxu
```

### 3. 准备本地 MySQL（不使用 Docker）

```bash
# 1) 启动 MySQL（未安装时先 brew install mysql）
brew services start mysql

# 2) 创建数据库
mysql -uroot -p -e "CREATE DATABASE IF NOT EXISTS chenxu_space;"

# 3) 创建应用账号并授权（密码要与 apps/server/.env 的 DATABASE_URL 一致）
mysql -uroot -p -e "CREATE USER IF NOT EXISTS 'chenxu'@'localhost' IDENTIFIED BY '<你的MYSQL_PASSWORD>'; GRANT ALL PRIVILEGES ON chenxu_space.* TO 'chenxu'@'localhost'; FLUSH PRIVILEGES;"
```

### 4. 初始化表结构与管理员账号

```bash
cd apps/server
npx prisma migrate dev
cd ../..
pnpm seed
```

### 5. 启动开发服务器（推荐分开启动）

```bash
# 终端 1：前端
pnpm --filter web dev

# 终端 2：后端
pnpm --filter server start:dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3000
- 前端 `/api/*` 请求通过 Vite 代理到后端

### 6. 常见本地启动问题

- `PrismaClientInitializationError: Can't reach database server at localhost:3306`
  - MySQL 未启动，或 `DATABASE_URL` 密码与 MySQL 账号密码不一致。
- `Error: listen EADDRINUSE: address already in use :::3000`
  - 3000 端口已被占用，先执行 `lsof -i :3000`，再 `kill -9 <PID>` 后重启后端。

---

## 单独命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 同时启动前后端（含 types 构建） |
| `pnpm dev:web` | 仅启动前端 |
| `pnpm dev:server` | 仅启动后端 |
| `pnpm build` | 构建所有包 |
| `pnpm seed` | 创建管理员账号 |
| `pnpm lint` | 全仓库 lint |

---

## 生产部署（Docker Compose）

### 环境要求

- Docker & Docker Compose v2
- 域名已解析到服务器 IP
- 开放 80、443 端口

### 1. 克隆代码

```bash
git clone <repo> chenxu-space
cd chenxu-space
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

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
```

### 3. 申请 SSL 证书

```bash
# 先临时启动 nginx（仅 HTTP）让 certbot 验证域名
mkdir -p nginx/ssl

# 在服务器安装 certbot
apt install -y certbot

# 申请证书（certbot standalone 模式，确保 80 端口未被占用）
certbot certonly --standalone -d peanutwcx.xyz -d www.peanutwcx.xyz

# 复制证书到项目目录
cp /etc/letsencrypt/live/peanutwcx.xyz/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/peanutwcx.xyz/privkey.pem nginx/ssl/

# 设置权限
chmod 644 nginx/ssl/fullchain.pem
chmod 600 nginx/ssl/privkey.pem
```

### 4. 启动服务

```bash
docker compose up -d --build
```

启动顺序：MySQL → Server（自动 migrate）→ Web → Nginx

### 5. 创建管理员账号

```bash
docker compose exec server sh -c "node node_modules/.bin/prisma db seed"
# 或指定账号信息：
docker compose exec -e ADMIN_EMAIL=you@example.com \
  -e ADMIN_PASSWORD=YourPassword123! \
  server sh -c "node node_modules/.bin/prisma db seed"
```

### 6. 验证服务

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f server
docker compose logs -f nginx

# 测试 API
curl https://peanutwcx.xyz/api/health
```

---

## 本地一键部署

如果 GitHub Actions 暂时不可用，可以在本地通过 SSH 直接发布到服务器：

```bash
pnpm deploy          # 全量发布
pnpm deploy:web      # 只发布前端 web
pnpm deploy:server   # 只发布后端 server
```

默认发布到 `root@47.94.146.17:/opt/chenxu-space`，会保留服务器上的生产 `.env`、SSL 证书和 MySQL volume，并在发布后检查 `https://peanutwcx.xyz/api/health`。

也可以用环境变量覆盖目标服务器：

```bash
DEPLOY_HOST=1.2.3.4 DEPLOY_USER=root DEPLOY_PORT=22 pnpm deploy:web
```

---

## 常用运维命令

```bash
# 查看所有容器日志
docker compose logs -f

# 重启单个服务
docker compose restart server

# 仅重新构建并重启后端（代码更新后）
docker compose up -d --build server

# 仅重新构建并重启前端
docker compose up -d --build web

# 进入后端容器执行命令
docker compose exec server sh

# 数据库备份
docker compose exec mysql sh -c \
  "mysqldump -u chenxu -p\$MYSQL_PASSWORD chenxu_space" > backup_$(date +%Y%m%d).sql

# 恢复备份
cat backup_20240101.sql | docker compose exec -T mysql sh -c \
  "mysql -u chenxu -p\$MYSQL_PASSWORD chenxu_space"

# SSL 证书续期
certbot renew --quiet
cp /etc/letsencrypt/live/peanutwcx.xyz/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/peanutwcx.xyz/privkey.pem nginx/ssl/
docker compose exec nginx nginx -s reload
```

---

## 环境变量一览

### 根目录 `.env`（Docker Compose 使用）

| 变量 | 说明 |
|------|------|
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 |
| `MYSQL_PASSWORD` | MySQL 应用账号密码 |
| `JWT_SECRET` | JWT access token 签名密钥 |
| `JWT_REFRESH_SECRET` | JWT refresh token 签名密钥 |
| `OSS_ACCESS_KEY_ID` | 阿里云 OSS AccessKey ID |
| `OSS_ACCESS_KEY_SECRET` | 阿里云 OSS AccessKey Secret |
| `OSS_BUCKET` | OSS Bucket 名称 |
| `OSS_REGION` | OSS 地域（如 `oss-cn-beijing`） |
| `OSS_ENDPOINT` | OSS Endpoint（如 `oss-cn-beijing.aliyuncs.com`） |

### `apps/server/.env`（本地开发使用）

同上，额外需要：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | MySQL 连接串 |
| `CORS_ORIGIN` | 允许的前端域名 |
| `PORT` | 后端监听端口（默认 3000） |
