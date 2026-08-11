# 部署指南

## 目录

- [Render.com 部署（推荐，免费）](#rendercom-部署推荐免费)
- [Railway 部署（备选，付费）](#railway-部署备选付费)
- [小程序发布](#小程序发布)
- [真实微信支付接入](#真实微信支付接入)
- [运维与监控](#运维与监控)

---

## Render.com 部署（推荐，免费）

### 优势

- ✅ 免费层支持 **Web Service + PostgreSQL（90 天）**
- ✅ 自动 HTTPS、域名分配
- ✅ 不用信用卡（注册时不需要，部署时也不需要）
- ✅ 跟 GitHub 集成，push 自动部署

### 一键部署

#### 1. 注册 Render

打开 **https://render.com/** → Sign up with GitHub → 授权访问你的仓库

#### 2. 创建 Blueprint

1. Dashboard 右上 → **New** → **Blueprint**
2. Connect repository → 选 `shuaiyidian/cocktail-mini-program`
3. Render 自动检测到根目录的 `render.yaml` → 显示两个服务：
   - `cocktail-db` (PostgreSQL)
   - `cocktail-server` (Web Service)
4. 点 **Apply** → 等 5-10 分钟部署完成

#### 3. 拿到 URL

部署成功后你的服务类似：

```
https://cocktail-server-xxxx.onrender.com
```

打开浏览器访问：
- `https://cocktail-server-xxxx.onrender.com/api/health` → `{"status":"ok"}`
- `https://cocktail-server-xxxx.onrender.com/api/health/deep` → `{"db":"connected"}`

#### 4. 触发种子数据（可选）

服务起后数据库是空的（只 push 了 schema）。需要灌经典鸡尾酒数据：

**方法 A：本地连接到 Render PG 跑 seed**

1. Render Dashboard → `cocktail-db` → Connection → 复制 `External Database URL`
2. 本地：
   ```powershell
   cd D:/AI/minimax/program/cocktail-mini-program/server
   $env:DATABASE_URL = "postgresql://cocktail:xxxxx@xxx/.../cocktail"
   pnpm prisma:seed
   ```

**方法 B：临时启动一个 SSH 任务**

Render 免费 Web Service 不支持 SSH。免费 PG 实例可以装 `psql` 客户端连。

### 注意事项

| 项 | 限制 |
|---|---|
| Web Service 免费 | 750 小时/月、15 分钟无流量自动休眠（冷启动 ~30s） |
| PostgreSQL 免费 | 90 天，到期后要付费或迁移 |
| 冷启动 | 免费版不访问会休眠，再次访问会唤醒（30 秒延迟） |

### 解决冷启动

免费版 15 分钟无流量会休眠。生产环境建议：
- 升级到 Starter Plan（$7/月）：不休眠
- 或者用 [cron-job.org](https://cron-job.org) 每 10 分钟 ping 一次 `/api/health` 保持活跃

---

## Railway 部署（备选，付费）

Railway **免费版** 资源耗尽后无法创建 PostgreSQL，需要升级 Hobby Plan（$5/月）。已经写好 `railway.toml`，付费版用户可以直接用。

### Railway 部署步骤

1. Railway 控制台 → 项目 → New Service → GitHub Repo
2. Root Directory 设为 `server`
3. 添加 PostgreSQL：New → Database → PostgreSQL（自动注入 DATABASE_URL）
4. 设置环境变量：
   - `JWT_SECRET`：随便一串强密码
   - `CORS_ORIGIN=*`
5. Deploy

### Railway 配置文件

- 根目录 `railway.toml`：build/start 命令
- 根目录 `nixpacks.toml`：Nixpacks 阶段配置

---

## 小程序发布

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

1. Render 默认带 HTTPS，域名类似 `https://cocktail-server-xxxx.onrender.com`
2. 在微信公众平台 → 开发管理 → 开发设置 → 服务器域名：
   - request 合法域名：`https://cocktail-server-xxxx.onrender.com`
   - uploadFile 合法域名：同上（如需）
   - downloadFile 合法域名：同上

### 5. 真机调试

```bash
# 1. 启动后端（确保 HTTPS 域名已配好）
cd server && pnpm dev  # 或 Render 部署

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

Render 会自动用 `/api/health` 做健康检查，失败会自动重启。

### 日志

Render 控制台 → 选服务 → Logs，实时查看 stdout/stderr。

### 异常告警

推荐接入 Sentry：
```bash
pnpm add @sentry/node
# 在 app.ts 顶部加：
# import * as Sentry from '@sentry/node'
# Sentry.init({ dsn: process.env.SENTRY_DSN })
```

### 性能监控

简单方法：Render 控制台 → Metrics 看 CPU/内存/网络。

进阶：接 New Relic / Datadog。

---

## 常见问题

**Q: 小程序白名单里没配域名能直接调本地后端吗？**
A: 开发期可以，但要在微信开发者工具「详情 → 本地设置」勾上「不校验合法域名」。生产期必须配 HTTPS + 白名单。

**Q: Render 免费版的 90 天 PG 过期了怎么办？**
A: 三个选择：① 升级 Render 付费 plan（$7/月起含 PG）；② 迁移到 Neon/Supabase 免费 PG；③ 用 Upstash Redis 替代部分功能。

**Q: 沙箱支付能不能直接上线？**
A: 不能，沙箱只是测试用。真实上线必须接微信支付（需要商户号）。

**Q: JWT token 怎么续期？**
A: 30 天后过期，用户重新登录。可以加 refresh token 机制（不在当前 MVP 范围）。

**Q: Render 冷启动慢怎么办？**
A: 免费版 15 分钟无流量会休眠。可用 cron-job.org 每 10 分钟 ping 一次保持活跃。
