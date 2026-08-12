# Dockerfile for CloudBase 云托管
# 多阶段构建，减小镜像体积

# ===== Stage 1: 构建 =====
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

# 复制 manifest
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./

# 安装依赖（包含 devDependencies 用于构建）
RUN pnpm install --frozen-lockfile

# 复制源码 + Prisma schema
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# 生成 Prisma Client
RUN pnpm prisma generate

# TypeScript 编译
RUN pnpm build

# 清理 dev deps，减小最终镜像
RUN pnpm prune --prod

# ===== Stage 2: 运行时 =====
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# 安装 dumb-init（处理 PID 1 信号）+ tini 替代
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init curl \
  && rm -rf /var/lib/apt/lists/*

# 复制必要文件
COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma

# 切换到非 root 用户
USER node

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

EXPOSE 8080

# 启动：先 push schema，再起服务
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --accept-data-loss --schema=./prisma/schema.prisma && node dist/server.js"]
