# 部署指南

## 目录

- [后端部署（Railway）](#后端部署railway)
- [数据库切换（SQLite → PostgreSQL）](#数据库切换sqlite--postgresql)
- [微信小程序发布](#微信小程序发布)
- [真实微信支付接入](#真实微信支付接入)
- [运维与监控](#运维与监控)

---

## 后端部署（Railway）

### 1. 准备工作

- GitHub 仓库（推荐）
- Railway 账号：https://railway.app/
- 微信小程序 AppID + AppSecret

### 2. 创建项目

```bash
# 安装 Railway CLI（可选）
npm i -g @railway/cli

# 登录
railway login

# 在 server 目录下初始化
cd server
railway init
```

或在 Railway 控制台：
1. New Project → Deploy from GitHub repo → 选你的仓库
2. Root Directory 设为 `server`
3. Railway 自动识别 Node.js + pnpm

### 3. 添加 PostgreSQL

在 Railway 项目里：
1. New → Database → PostgreSQL
2. 创建后自动注入 `DATABASE_URL` 到环境变量

### 4. 切换数据库 Schema

Prisma 不支持一个 schema 多 provider，需要分两步：

```bash
# 在本地先确认生产 schema 没问题
DATABASE_URL="postgresql://..." pnpm prisma db push --schema=./prisma/schema.postgres.prisma
DATABASE_URL="postgresql://..." pnpm prisma generate --schema=./prisma/schema.postgres.prisma
```

或者用 `railway run` 在 Railway 容器里执行：

```bash
railway run pnpm prisma db push --schema=./prisma/schema.postgres.prisma
railway run pnpm prisma:seed
```

### 5. 配置环境变量（Railway Variables）

| 变量 | 说明 | 示例 |
|---|---|---|
| `DATABASE_URL` | Railway 自动注入 | `postgresql://...` |
| `JWT_SECRET` | JWT 签名密钥（生产用强随机） | `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | Token 过期时间 | `30d` |
| `WX_APPID` | 微信 AppID | `wxabc123...` |
| `WX_SECRET` | 微信 AppSecret | `abcdef...` |
| `CORS_ORIGIN` | CORS 白名单 | `*` 或 `https://...` |
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 监听端口（Railway 自动） | 3000 |

### 6. 部署

```bash
git push origin main
# Railway 自动 build + deploy
```

或者：
```bash
railway up
```

### 7. 验证

```bash
# Railway 会分配一个域名，类似 https://cocktail-server-production.up.railway.app
curl https://your-app.up.railway.app/api/health
# 期望: {"status":"ok",...}

curl https://your-app.up.railway.app/api/health/deep
# 期望: {"status":"ok","db":"connected",...}
```

### 部署失败排查

| 现象 | 排查 |
|---|---|
| `prisma generate` 失败 | 确认 DATABASE_URL 已设置 + pnpm 已安装 |
| `db push` 失败 | 看 Railway logs，通常是 schema 不兼容 |
| 健康检查 503 | DB 连接问题，看 `health/deep` 输出 |
| 502/503 | 看 Railway logs → Deploy |

---

## 数据库切换（SQLite → PostgreSQL）

开发期用 SQLite 方便，生产期换 PostgreSQL（Railway 一键创建）。

### 步骤

1. **创建 PostgreSQL schema 文件**（已包含在 `prisma/schema.postgres.prisma`）

2. **本地测试切换**（可选）：
   ```bash
   # 在 .env 里临时改 DATABASE_URL
   DATABASE_URL="postgresql://user:pass@localhost:5432/cocktail"
   
   pnpm prisma db push --schema=./prisma/schema.postgres.prisma
   pnpm prisma:seed
   pnpm dev  # 测试
   ```

3. **生产环境**：
   ```bash
   # Railway 上设 DATABASE_URL
   # 部署后会自动跑 prisma db push + seed（见 railway.toml）
   ```

### Schema 差异

| 项 | SQLite | PostgreSQL |
|---|---|---|
| Provider | `sqlite` | `postgresql` |
| `String` 字段 | TEXT | varchar/text |
| `Int` 字段 | INTEGER | integer |
| `Boolean` | 0/1 | bool |
| `Json` 字段 | 不支持，用 String | 支持 jsonb |
| `DateTime` | TEXT (ISO 8601) | timestamp |
| 默认值 | 不支持函数 | 支持 `now()` |

我们 schema 故意保持简单（JSON 都用 String），切换时只需改 `provider`。

---

## 微信小程序发布

### 1. 准备工作

- 已认证的小程序账号（https://mp.weixin.qq.com/）
- 准备好图标、截图、类目
- 体验版需要至少 1 个开发者微信号

### 2. 申请小程序

1. 微信公众平台 → 注册小程序 → 选择「企业」或「个人」主体
   - **企业**才能开通支付、会员
   - 个人主体能发布但不能用支付接口
2. 填写基本信息 → 获得 AppID

### 3. 配置小程序

在 `miniprogram/project.config.json` 里：

```json
{
  "appid": "你的真实 AppID（替换 touristappid）",
  ...
}
```

### 4. 后端 HTTPS + 域名白名单

小程序要求后端必须 HTTPS（不能 HTTP）。

1. Railway 默认带 HTTPS，域名类似 `https://xxx.up.railway.app`
2. 在微信公众平台 → 开发管理 → 开发设置 → 服务器域名：
   - request 合法域名：`https://xxx.up.railway.app`
   - uploadFile 合法域名：同上（如需）
   - downloadFile 合法域名：同上

### 5. 真机调试

```bash
# 1. 启动后端（确保 HTTPS 域名已配好）
cd server && pnpm dev  # 或 Railway 部署

# 2. 编译小程序
cd miniprogram && pnpm build:weapp

# 3. 微信开发者工具
#    - 导入 miniprogram/dist
#    - 工具栏：预览 → 扫码 → 真机预览
```

### 6. 提交审核

1. 微信开发者工具 → 上传 → 填写版本号 + 项目备注
2. 微信公众平台 → 版本管理 → 提交审核
3. 类目选择：工具 → 效率（推荐）
4. 等待审核（一般 1-3 个工作日）
5. 审核通过后发布

### 7. 审核要点

避免被拒：
- ✅ 不得诱导分享/关注公众号
- ✅ 用户授权要明示用途（登录、个人信息）
- ✅ 虚拟商品支付要走微信支付（不能用其他支付方式）
- ✅ 内容不能违规（酒类需注意"未成年人禁止"提示）
- ✅ 类目要选对（效率/工具类，含酒类内容）
- ✅ 测试账号要提供（审核员能登录体验完整流程）

### 8. 体验版 / 正式版差异

| 项 | 体验版 | 正式版 |
|---|---|---|
| 谁能进 | 白名单开发者 | 所有用户 |
| 域名校验 | 关闭 | 开启 |
| 支付 | 沙箱 | 真实（需商户号） |

---

## 真实微信支付接入

### 前置条件

- **微信支付商户号**（https://pay.weixin.qq.com/）
  - 需要营业执照 + 法人身份证 + 对公账户
  - 申请周期 1-7 天
- **小程序 AppID**（已申请）
- **商户 API 密钥**（V2 或 V3 任一）

### 接入流程

1. **小程序关联商户号**：
   微信支付 → 商户号管理 → 关联 AppID

2. **后端改造**：
   - 用 `wechatpay-node-v3` 或 `wechatpay-axios-plugin`
   - 创建订单 API 改为调用 `wxpay.unifiedOrder`
   - 接收支付回调，验签后开通会员
   - 沙箱模式（`sandbox=true`）可跳过真实扣款，测通流程

3. **小程序前端**：
   ```js
   // 创建订单
   const order = await api.createOrder(planId)
   // 调起支付
   Taro.requestPayment({
     timeStamp: order.timeStamp,
     nonceStr: order.nonceStr,
     package: order.package,
     signType: 'MD5',
     paySign: order.paySign
   })
   ```

4. **回调处理**：
   - 用户支付后微信回调后端 `/api/payments/callback`
   - 验签 → 标记订单 paid → 开通会员
   - 返回 200 给微信（必须）

5. **切换沙箱到正式**：
   - 后端 `.env` 加 `WXPAY_MCH_ID=...` + `WXPAY_API_KEY=...`
   - 把 `payments/sandbox` 路由保留作为开发测试
   - 上线用 `payments/create` + `payments/callback`

### 注意事项

- 支付金额单位是「分」
- 异步回调必须返回 JSON 或 XML 格式的"成功"
- 同一订单只能回调一次，要做好幂等
- 退款接口单独开发

---

## 运维与监控

### 业务指标

```bash
curl https://your-app/api/metrics
```

返回：
```json
{
  "data": {
    "totalUsers": 100,
    "newUsers24h": 5,
    "totalCocktails": 25,
    "totalRecipes": 12,
    "paidOrders": 3,
    "totalRevenueCents": 5700,
    "serverTime": "2026-08-09T13:30:00Z"
  }
}
```

### 健康检查

- `/api/health` - 轻量级（200ms 内返回）
- `/api/health/deep` - 验证 DB 连接

Railway 会自动用 `/api/health` 做健康检查，失败会自动重启。

### 日志

Railway 控制台 → 选服务 → Logs，实时查看 stdout/stderr。

关键日志：
- `[event] type=xxx client=xxx data=xxx` - 埋点
- `[error] xxx` - 错误
- `[uncaughtException] xxx` - 未捕获异常

### 异常告警

推荐接入 Sentry：
```bash
pnpm add @sentry/node
# 在 app.ts 顶部加：
# import * as Sentry from '@sentry/node'
# Sentry.init({ dsn: process.env.SENTRY_DSN })
```

### 性能监控

简单方法：Railway 控制台 → Metrics 看 CPU/内存/网络。

进阶：接 New Relic / Datadog。

---

## 常见问题

**Q: 小程序白名单里没配域名能直接调本地后端吗？**
A: 开发期可以，但要在微信开发者工具「详情 → 本地设置」勾上「不校验合法域名」。生产期必须配 HTTPS + 白名单。

**Q: Railway 免费额度够用吗？**
A: 免费 500 小时/月 + 5GB 流量。早期够用，用户多了升级 Pro（$5/月起）。

**Q: 数据库选 PostgreSQL 还是继续用 SQLite？**
A: 多人用必上 PG。SQLite 适合本地 demo。

**Q: 沙箱支付能不能直接上线？**
A: 不能，沙箱只是测试用。真实上线必须接微信支付（需要商户号）。

**Q: JWT token 怎么续期？**
A: 30 天后过期，用户重新登录。可以加 refresh token 机制（不在当前 MVP 范围）。
