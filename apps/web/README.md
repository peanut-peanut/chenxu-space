# chenxu.xyz — 前端

基于 React 19 + Vite 6 + Tailwind CSS v4 的个人网站前端。

## 技术栈

| 技术 | 用途 |
|------|------|
| React 19 | UI 框架 |
| Vite 6 | 构建工具 |
| Tailwind CSS v4 | 样式 |
| TanStack Router | 客户端路由 |
| TanStack Query | 服务端状态管理 |
| Framer Motion | 动画 |
| Zustand | 客户端状态（Auth） |
| Lucide React | 图标 |
| Radix UI | 无障碍基础组件 |

## 目录结构

```
src/
├── components/
│   ├── common/       # ParticleCanvas 等通用组件
│   ├── layout/       # Navbar、PageLayout
│   └── ui/           # Button、Card、Input、Avatar 等基础组件
├── lib/
│   ├── api.ts        # Axios 实例（自动注入 JWT、处理 401）
│   └── utils.ts      # formatDate、formatFileSize、cn
├── pages/            # 各页面
│   ├── home/         # 首页（粒子动效 Hero）
│   ├── thoughts/     # 想法（朋友圈）
│   ├── articles/     # 文章列表 + 详情（Markdown 渲染）
│   ├── resources/    # 资源库（图片/视频/文件）
│   ├── auth/         # 登录、注册
│   └── profile/      # 个人资料
├── routes/
│   └── index.tsx     # TanStack Router 路由表
├── store/
│   └── auth.ts       # Zustand auth store（localStorage 持久化）
└── styles/
    └── globals.css   # Tailwind v4 主题变量 + 全局样式
```

## 本地开发

```bash
# 在 monorepo 根目录安装依赖
pnpm install

# 同时启动前后端（推荐）
pnpm dev

# 仅启动前端（需后端已在 3000 端口运行）
pnpm dev:web
```

访问：http://localhost:5173

> Vite 已配置 `/api` 代理 → `http://localhost:3000`，无需额外配置跨域。

## 构建

```bash
pnpm --filter web run build
# 产物输出到 apps/web/dist/
```

## 路由

| 路径 | 页面 | 访问权限 |
|------|------|------|
| `/` | 首页 | 公开 |
| `/thoughts` | 想法 | 公开浏览；登录后可点赞/评论 |
| `/articles` | 文章列表 | 公开 |
| `/articles/:slug` | 文章详情 | 公开 |
| `/resources` | 资源库 | 公开 |
| `/login` | 登录 | — |
| `/register` | 注册 | — |
| `/profile` | 个人资料 | 需登录 |
| `/admin` | 管理后台 | 需 admin 角色 |

## 设计 Token

主题变量定义在 `src/styles/globals.css` 的 `@theme` 块，全局通过 CSS 变量引用：

```
--color-background: #080808     主背景
--color-accent:     #a78bfa     主色（紫）
--color-cyan:       #22d3ee     辅色（青）
--font-sans:        Inter + Noto Sans SC
--font-serif:       LXGW WenKai（文章正文）
--font-mono:        JetBrains Mono
```

## API 约定

所有接口响应格式：

```json
{ "code": 0, "message": "ok", "data": { ... } }
```

`src/lib/api.ts` 的响应拦截器自动解包 `data` 字段；HTTP 401 时自动清除本地登录状态并跳转 `/login`。

Token 存储在 `localStorage`，每次请求通过 `Authorization: Bearer <token>` 携带。
