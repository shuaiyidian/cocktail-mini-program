/**
 * 埋点 / 监控路由
 * 路由前缀：/api
 *
 *   POST /events           - 客户端埋点
 *   GET  /metrics          - 简单的服务指标（DAU/订单数 等）
 *   GET  /health/deep      - 深度健康检查（DB 连接等）
 */
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/db'

const router = Router()

const eventSchema = z.object({
  type: z.string().min(1).max(40),
  data: z.record(z.any()).optional(),
  // 客户端标识（可选，用于聚合）
  clientId: z.string().optional()
})

/**
 * POST /api/events
 * 简单埋点：目前写到 stdout（生产可换成 Sentry / 自建后端 / DB）
 */
router.post('/events', (req, res) => {
  const parsed = eventSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid event', details: parsed.error.flatten() })
  }
  const { type, data, clientId } = parsed.data
  if (process.env.ANALYTICS_ENABLED !== 'false') {
    console.log(`[event] type=${type} client=${clientId || 'anon'} data=${JSON.stringify(data || {})}`)
  }
  res.json({ data: { ok: true } })
})

/**
 * GET /api/metrics
 * 简单的服务指标（无鉴权，生产可加白名单）
 */
router.get('/metrics', async (_req, res) => {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const [totalUsers, activeUsers, totalCocktails, totalRecipes, paidOrders, totalRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.cocktail.count(),
    prisma.customRecipe.count(),
    prisma.order.count({ where: { status: 'paid' } }),
    prisma.order.aggregate({ where: { status: 'paid' }, _sum: { amountCents: true } })
  ])
  res.json({
    data: {
      totalUsers,
      newUsers24h: activeUsers,
      totalCocktails,
      totalRecipes,
      paidOrders,
      totalRevenueCents: totalRevenue._sum.amountCents || 0,
      serverTime: now.toISOString()
    }
  })
})

export default router
