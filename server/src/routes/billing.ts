/**
 * 会员 / 支付 / 订单路由
 * 路由前缀：/api
 *
 *   GET  /plans           - 列出会员套餐
 *   POST /payments/sandbox - 沙箱支付（开发期），body: { planId }
 *   GET  /orders          - 当前用户订单历史
 *   GET  /benefits        - 当前用户会员权益状态
 */
import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/db'
import { requireAuth, AuthedRequest } from '../middleware/auth'

const router = Router()

function toOrderDTO(o: any) {
  return {
    id: o.id,
    userId: o.userId,
    planId: o.planId,
    amountCents: o.amountCents,
    status: o.status,
    sandboxRef: o.sandboxRef,
    paidAt: o.paidAt?.toISOString() || null,
    createdAt: o.createdAt.toISOString()
  }
}

function toPlanDTO(p: any) {
  return {
    id: p.id,
    name: p.name,
    tier: p.tier,
    priceCents: p.priceCents,
    durationDays: p.durationDays,
    benefits: typeof p.benefits === 'string' ? JSON.parse(p.benefits) : p.benefits,
    sortOrder: p.sortOrder,
    isActive: p.isActive
  }
}

/**
 * GET /api/plans
 * 公开接口：列出所有上架的会员套餐
 */
router.get('/plans', async (_req, res) => {
  const rows = await prisma.memberPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  })
  res.json({ data: rows.map(toPlanDTO) })
})

/**
 * POST /api/payments/sandbox
 * 沙箱支付：直接模拟"支付成功"
 * 实际生产应调用 wx.requestPayment → 回调后端 → 验签 → 开通
 */
const sandboxSchema = z.object({
  planId: z.string().min(1)
})
router.post('/payments/sandbox', requireAuth(), async (req: AuthedRequest, res: Response) => {
  const parsed = sandboxSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
  }
  const { planId } = parsed.data
  const userId = req.user!.id

  const plan = await prisma.memberPlan.findUnique({ where: { id: planId } })
  if (!plan || !plan.isActive) {
    return res.status(404).json({ error: '套餐不存在或已下架' })
  }

  // 模拟 1.2s 支付延迟
  await new Promise((r) => setTimeout(r, 1200))

  // 模拟支付可能失败（5% 概率）— 测试重试逻辑
  if (Math.random() < 0.05) {
    const order = await prisma.order.create({
      data: {
        userId,
        planId: plan.id,
        amountCents: plan.priceCents,
        status: 'failed',
        sandboxRef: `sandbox_fail_${Date.now()}`
      }
    })
    return res.status(402).json({
      error: '沙箱支付失败（模拟 5% 失败率）',
      data: toOrderDTO(order)
    })
  }

  // 成功：创建订单 + 开通会员
  const now = new Date()
  const newExpiry = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const baseExpiry = user?.memberExpiresAt && user.memberExpiresAt > now ? user.memberExpiresAt : now
  const finalExpiry = new Date(Math.max(baseExpiry.getTime() + 1, now.getTime()) + plan.durationDays * 24 * 60 * 60 * 1000)
  // 简化：直接覆盖到期时间（不做累加；实际产品可加"剩余时间顺延"）
  const finalExpiry2 = newExpiry

  const [order, updatedUser] = await prisma.$transaction([
    prisma.order.create({
      data: {
        userId,
        planId: plan.id,
        amountCents: plan.priceCents,
        status: 'paid',
        sandboxRef: `sandbox_${Date.now()}`,
        paidAt: now
      }
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        memberTier: plan.tier,
        memberExpiresAt: finalExpiry2
      }
    })
  ])

  res.json({
    data: {
      order: toOrderDTO(order),
      member: {
        tier: updatedUser.memberTier,
        expiresAt: updatedUser.memberExpiresAt?.toISOString()
      }
    }
  })
})

/**
 * GET /api/orders
 * 当前用户订单历史
 */
router.get('/orders', requireAuth(), async (req: AuthedRequest, res: Response) => {
  const userId = req.user!.id
  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { plan: true }
  })
  res.json({
    data: rows.map((o) => ({
      ...toOrderDTO(o),
      plan: { id: o.plan.id, name: o.plan.name, tier: o.plan.tier, priceCents: o.plan.priceCents, durationDays: o.plan.durationDays }
    }))
  })
})

/**
 * GET /api/benefits
 * 返回当前用户会员权益状态
 */
router.get('/benefits', requireAuth(), async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) return res.status(404).json({ error: 'User not found' })
  const now = new Date()
  const isActive = user.memberTier !== 'free' && user.memberExpiresAt && user.memberExpiresAt > now

  // 统计用户的"用量"（特调配方数 + 私人酒单数）
  const [recipeCount, cocktailCount] = await Promise.all([
    prisma.customRecipe.count({ where: { userId: user.id } }),
    prisma.cocktail.count({ where: { ownerId: user.id, isClassic: false } })
  ])

  // 免费用户限制
  const FREE_RECIPE_LIMIT = 3
  const FREE_COCKTAIL_LIMIT = 3
  const isMember = isActive

  res.json({
    data: {
      memberTier: isActive ? user.memberTier : 'free',
      memberExpiresAt: user.memberExpiresAt?.toISOString() || null,
      isMember,
      limits: {
        recipes: { used: recipeCount, limit: isMember ? Infinity : FREE_RECIPE_LIMIT, exceeded: !isMember && recipeCount >= FREE_RECIPE_LIMIT },
        cocktails: { used: cocktailCount, limit: isMember ? Infinity : FREE_COCKTAIL_LIMIT, exceeded: !isMember && cocktailCount >= FREE_COCKTAIL_LIMIT }
      }
    }
  })
})

export default router
