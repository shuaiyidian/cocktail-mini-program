# 鸡尾酒调参推荐小程序 🍸

基于「甜 · 酸 · 苦 · 烈」四维调节的鸡尾酒推荐小程序，支持用户自定义酒单、特调配方酸甜苦烈自动分析、会员体系。

## 技术栈

- **小程序前端**：Taro 4 + React 18 + TypeScript + SCSS
- **后端服务**：Node.js + Express + TypeScript
- **ORM/数据库**：Prisma + SQLite（开发期）/ PostgreSQL（生产，Railway）
- **部署**：后端 → Railway；前端 → 微信开发者工具导入 `miniprogram/dist`

## 目录结构

```
cocktail-mini-program/
├── miniprogram/        # Taro 小程序
│   ├── src/            # 页面与组件
│   ├── config/         # Taro 编译配置
│   ├── dist/           # 编译产物（gitignore）
│   └── package.json
├── server/             # Node.js 后端
│   ├── src/
│   │   ├── app.ts      # Express 入口
│   │   └── server.ts   # 监听端口
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env            # 本地环境变量
│   └── package.json
└── README.md
```

## 快速开始

### 1. 启动后端

```powershell
cd D:/AI/minimax/program/cocktail-mini-program/server
pnpm install            # 首次运行
pnpm prisma:generate    # 生成 Prisma Client
pnpm exec prisma db push --skip-generate  # 初始化数据库
pnpm dev                # 启动后端（默认 3000 端口）
```

启动后访问 `http://localhost:3000/api/health` 应返回 `{"status":"ok",...}`。

### 2. 启动小程序编译

```powershell
cd D:/AI/minimax/program/cocktail-mini-program/miniprogram
pnpm install            # 首次运行
pnpm dev:weapp          # 微信小程序 watch 模式
```

编译产物输出到 `miniprogram/dist/`。用**微信开发者工具**导入此目录即可预览。

### 3. 联调测试

小程序首页有「🔍 测试后端连接」按钮，点击后会请求 `http://localhost:3000/api/health` 验证前后端打通。

> ⚠️ 微信开发者工具需要在「详情 → 本地设置」中勾选「不校验合法域名」才能访问本地后端。

## 里程碑

| 阶段 | 内容 | 状态 |
|---|---|---|
| M1 | 脚手架（Taro + Express + Prisma） | ✅ 完成 |
| M2 | 数据库 + 经典鸡尾酒种子 + CRUD API + 列表/详情页 | ✅ 完成 |
| M3 | 拖动滑块 + 推荐「为什么」 + 骨架屏 + 空状态 | ✅ 完成 |
| M4 | 特调配方 + 成分字典 + 酸甜苦烈分析 + 「我的」管理 | ✅ 完成 |
| M5 | JWT 鉴权 + 会员体系 + 沙箱支付 + 付费墙 | ✅ 完成 |
| M6 | 真实 wx.login + Railway 部署 + 埋点 + 文档 | ✅ 完成 |

## M6 验收

- ✅ Prisma 双 provider：开发 SQLite / 生产 PG（schema.postgres.prisma）
- ✅ Railway 部署文件：`railway.toml` + `Procfile` + `nixpacks` 识别
- ✅ 真实 wx-login：调 `api.weixin.qq.com/sns/jscode2session` 拿 openid
- ✅ 前端 smartLogin：优先 wx.login，自动 fallback mock（无 AppID 时）
- ✅ 埋点系统：客户端 `track()` + 服务端 `/api/events` 接收
- ✅ 业务指标：`/api/metrics`（总用户 / 订单数 / 累计收入）
- ✅ 深度健康检查：`/api/health/deep` 验证 DB 连接
- ✅ 列表页"保存到酒单"按钮：推荐模式下可一键入库
- ✅ 部署文档：DEPLOY.md（Railway + 小程序 + 真实支付 + 运维）

## M5 验收

（保留）

## 项目交付清单

### 文件结构
```
cocktail-mini-program/
├── miniprogram/          # Taro 小程序
│   ├── src/
│   │   ├── pages/        # index, cocktail-list, cocktail-detail, custom, user, member
│   │   ├── api/          # request, cocktail, cocktail-ext, recipe, auth
│   │   ├── types/        # cocktail
│   │   └── utils/        # analytics, user
│   └── dist/             # 编译产物（gitignore）
├── server/               # Node.js 后端
│   ├── src/
│   │   ├── routes/       # cocktails, recipes, auth, billing, events
│   │   ├── middleware/   # auth (JWT)
│   │   ├── utils/        # db, serializers, analysis
│   │   ├── data/         # classicCocktails, ingredientDict
│   │   └── app.ts
│   ├── prisma/
│   │   ├── schema.prisma          # SQLite
│   │   └── schema.postgres.prisma # PostgreSQL
│   ├── railway.toml
│   ├── Procfile
│   └── .env.example
├── DEPLOY.md             # 完整部署文档
└── README.md
```

### API 一览（20+ 端点）

| 类别 | 端点 |
|---|---|
| **健康** | `GET /api/health`、`GET /api/health/deep` |
| **鸡尾酒** | `GET/POST/PUT/DELETE /api/cocktails[/:id]`、`POST /api/cocktails/recommend` |
| **特调** | `GET/POST/PUT/DELETE /api/recipes[/:id]`、`POST /api/recipes/analyze`、`GET /api/recipes/ingredients` |
| **鉴权** | `POST /api/auth/mock-login`、`POST /api/auth/wx-login`、`GET /api/auth/me` |
| **会员** | `GET /api/plans`、`POST /api/payments/sandbox`、`GET /api/orders`、`GET /api/benefits` |
| **监控** | `POST /api/events`、`GET /api/metrics` |

## M4 验收

- ✅ 成分字典：61 款常见原料 × 8 分类（烈酒/利口酒/果汁/糖浆/苦精/气泡/乳制品/装饰）
- ✅ 分析算法：累积贡献法（Σ score × amount / 30），输出甜酸苦烈 + 主导味道 + 警告
- ✅ 后端 7 个新 API：
  - `GET /api/recipes/ingredients` - 字典（按分类）
  - `POST /api/recipes/analyze` - 实时分析
  - `POST /api/recipes` - 创建特调（自动分析入库）
  - `GET /api/recipes?userId=xxx` - 列出某用户特调
  - `GET/PUT/DELETE /api/recipes/:id` - 详情/更新/删除
- ✅ 前端：
  - `pages/custom` 特调页：取名 + 添加成分（Picker 选择 + 用量输入） + 步骤 + 实时分析 + 保存
  - `pages/user` 我的页：用户卡 + Tab 切换「特调配方 / 私人酒单」+ 列表 + 删除
  - tabBar 升级为 4 项：调参 / 酒单 / 特调 / 我的
  - 首页加「＋ 自创特调配方」入口
- ✅ 权限：跨用户修改/删除被 403 拒绝
- ✅ 用户隔离：alice/bob 各自只能看到自己的特调

## M3 验收

（保留）

## API 一览

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| GET | `/api/cocktails?...` | 鸡尾酒列表（分页/搜索/分类/owner） |
| GET | `/api/cocktails/:idOrSlug` | 鸡尾酒详情 |
| POST | `/api/cocktails` | 创建鸡尾酒（需 `x-user-id`） |
| PUT | `/api/cocktails/:idOrSlug` | 更新自己的 |
| DELETE | `/api/cocktails/:idOrSlug` | 删除自己的 |
| POST | `/api/cocktails/recommend` | 四维推荐（返回 `matchScore` + `reason`） |
| GET | `/api/recipes/ingredients` | 成分字典 |
| POST | `/api/recipes/analyze` | 实时分析酸甜苦烈 |
| POST | `/api/recipes` | 保存特调配方 |
| GET | `/api/recipes?userId=xxx` | 用户的特调列表 |
| GET/PUT/DELETE | `/api/recipes/:id` | 详情/更新/删除 |
