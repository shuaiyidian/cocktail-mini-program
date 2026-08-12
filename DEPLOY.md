# 部署指南

## 目录

- [微信云开发 CloudBase 部署（最推荐，国内）](#微信云开发-cloudbase-部署最推荐国内)
- [Render.com 部署（备选，国外）](#rendercom-部署备选国外)
- [Railway 部署（备选，付费）](#railway-部署备选付费)
- [小程序发布](#小程序发布)
- [真实微信支付接入](#真实微信支付接入)
- [运维与监控](#运维与监控)

---

## 微信云开发 CloudBase 部署（最推荐，国内）

### 优势（对比 Render/Railway）

| 维度 | CloudBase | Render |
|---|---|---|
| 国内访问速度 | 🟢 飞快（CDN） | 🟡 一般（海外节点） |
| 微信生态集成 | 🟢 wx.login 原生打通 | 🟡 自己接 jscode2session |
| 免备案 | ✅ | ✅ |
| 免费额度 | 5GB 数据库 + 40GB 流量/月 | 750h/月 Web + 90 天 PG |
| 价格 | 按量付费（很小） | 24/7 跑要 $7/月起 |
| 数据库 | MySQL（30 天试用） / NoSQL（永久免费） | PostgreSQL 90 天 |
| 部署方式 | 关联 GitHub 自动 | 关联 GitHub 自动 |

### 准备工作

1. **小程序 AppID**：在 https://mp.weixin.qq.com/ 注册小程序获得
2. **CloudBase 环境**：登录 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) → 顶部「云开发」按钮 → 开通云开发（免费）→ 获得环境 ID
3. **本机 cloudbase CLI**（已装）：

```powershell
npm install -g @cloudbase/cli --registry=https://registry.npmmirror.com
cloudbase login  # 浏览器扫码授权
```

### 一键部署

#### 方法 A：CLI 部署（推荐，我能直接帮你执行）

```powershell
cd D:/AI/minimax/program/cocktail-mini-program/server

# 关联云开发环境（需要环境 ID）
cloudbase env:list                                    # 看你的环境 ID
cloudbase service:create -e <env-id> cocktail-server  # 创建云托管

# 一键部署（Dockerfile 自动构建）
cloudbase service:deploy -e <env-id> cocktail-server --dir .
```

#### 方法 B：GitHub 自动部署（生产期省事）

1. CloudBase 控制台 → 云托管 → 新建服务 → 关联 GitHub
2. 选 `shuaiyidian/cocktail-mini-program` 仓库
3. 配置：
   - 入口目录：`server`
   - Dockerfile 路径：`server/Dockerfile`
   - 端口：`8080`
4. 配置环境变量（DATABASE_URL 在下一步创建 MySQL 后填）
5. 点部署

### 创建 MySQL 数据库

1. CloudBase 控制台 → 数据库 → MySQL → 新建
   - 实例名：`cocktail-db`
   - 免费试用 30 天（30 天后可能需要迁移）
2. 创建成功后拿到连接信息：
   - 主机、内网地址、端口、用户名、密码、数据库名
3. 构造 DATABASE_URL：
   ```
   mysql://用户名:密码@内网地址:3306/数据库名
   ```
4. 加到云托管环境变量 `DATABASE_URL`

### 灌入种子数据

部署完后（schema 已 push），需要灌 25 款经典鸡尾酒：

**方法 A：本地连 CloudBase MySQL 跑 seed**

```powershell
$env:DATABASE_URL = "mysql://user:pass@host:3306/db"
pnpm prisma:seed
```

**方法 B：用 CloudBase 控制台的 MySQL 客户端**

控制台 → 数据库 → MySQL → `cocktail-db` → 客户端 → 导入 SQL（需要先把 seed 数据转成 INSERT 语句）

### 配置生产环境变量

云托管 → `cocktail-server` → 环境变量：

| Key | Value |
|---|---|
| `DATABASE_URL` | `mysql://user:pass@host:3306/cocktail` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | 用 `openssl rand -base64 32` 生成的强随机字符串 |
| `CORS_ORIGIN` | `*` 或你的小程序前端域名 |
| `WX_APPID` | （可选）小程序 AppID |
| `WX_SECRET` | （可选）小程序 AppSecret |

### 拿到访问 URL

部署完成后，CloudBase 会分配一个 URL：

```
https://cocktail-server-xxxx.ap-shanghai.run.tcloudbase.com
```

打开浏览器：
- ✅ `/api/health` → `{"status":"ok",...}`
- ✅ `/api/health/deep` → `{"db":"connected",...}`

把这个 URL 配到微信公众平台 → 开发管理 → 服务器域名。

---

## Render.com 部署（备选，国外）

如果 CloudBase 改造太复杂，或想更简单，Render 是稳妥选择。

### 一键部署

#### 1. 注册 Render

打开 **https://render.com/** → Sign up with GitHub → 授权

#### 2. 创建 Blueprint

1. Dashboard → **New +** → **Blueprint**
2. Connect repository → 选 `shuaiyidian/cocktail-mini-program`
3. Render 自动读根目录 `render.yaml` → 显示两个服务：
   - `cocktail-db` (PostgreSQL)
   - `cocktail-server` (Web Service)
4. 点 **Apply** → 等 5-10 分钟

#### 3. 灌种子数据

部署完数据库是空的。复制 External Database URL，本地跑：

```powershell
cd D:/AI/minimax/program/cocktail-mini-program/server
$env:DATABASE_URL = "postgresql://cocktail:xxxxx@dpg-xxx.oregon-postgres.render.com/cocktail_xxxx"
pnpm prisma:seed
```

### 注意事项

| 项 | 限制 |
|---|---|
| 冷启动 | 免费版 15 分钟无流量会休眠（30 秒唤醒） |
| PG 90 天 | 90 天后免费 PG 过期（可升级或迁移 Neon/Supabase） |
| 域名 | `*.onrender.com` 子域名 |

### 解决冷启动

```powershell
# 用 cron-job.org 每 10 分钟 ping 一次
Invoke-WebRequest -Uri "https://your-app/api/health" -UseBasicParsing
```

或升级到 Starter Plan（$7/月，不休眠）。

---

## Railway 部署（备选，付费）

Railway 免费版已资源耗尽。Hobby Plan $5/月起。已有 `railway.toml` 配置，付费用户可直接用。

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

1. CloudBase / Render 默认带 HTTPS
   - CloudBase: `https://xxx.ap-shanghai.run.tcloudbase.com`
   - Render: `https://xxx.onrender.com`
2. 在微信公众平台 → 开发管理 → 开发设置 → 服务器域名：
   - request 合法域名：你的后端 URL
   - uploadFile 合法域名：同上
   - downloadFile 合法域名：同上

### 5. 真机调试

```bash
# 1. 启动后端
cd server && pnpm dev  # 本地开发

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
   - 沙箱模式（`sandbox=true`）可跳过真实扣款

3. **小程序前端**：
   ```js
   const order = await api.createOrder(planId)
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
   - 保留 `payments/sandbox` 路由作为开发测试
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

### 日志

- **CloudBase**：控制台 → 云托管 → `cocktail-server` → 日志
- **Render**：控制台 → 服务 → Logs

### 异常告警

推荐接入 Sentry：
```bash
pnpm add @sentry/node
# 在 app.ts 顶部加：
# import * as Sentry from '@sentry/node'
# Sentry.init({ dsn: process.env.SENTRY_DSN })
```

---

## 常见问题

**Q: CloudBase MySQL 30 天后过期怎么办？**
A: 三选一：① 升级 CloudBase（按量付费，约几元/月）；② 迁移到 Neon/Supabase 免费 PG；③ 改用 CloudBase 原生 NoSQL 数据库（永久免费，但要重写 server 数据层）。

**Q: Render 免费版的 90 天 PG 过期了怎么办？**
A: 同上。

**Q: 沙箱支付能不能直接上线？**
A: 不能，沙箱只是测试用。真实上线必须接微信支付（需要商户号）。

**Q: JWT token 怎么续期？**
A: 30 天后过期，用户重新登录。可以加 refresh token 机制。

**Q: CloudBase 冷启动？**
A: 云托管**不会冷启动**（不像 Render 免费层），按量计费。

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
