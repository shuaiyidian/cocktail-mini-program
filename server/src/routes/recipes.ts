/**
 * 特调配方路由
 * 路由前缀：/api/recipes
 *
 *   POST  /analyze        - 分析配方酸甜苦烈（不入库）
 *   POST  /              - 创建特调（M4 阶段不带 userId；M5 接入鉴权后要求）
 *   GET   /              - 列表（按用户过滤）
 *   GET   /:id           - 详情
 *   PUT   /:id           - 更新
 *   DELETE /:id           - 删除
 *   GET   /ingredients   - 获取成分字典（供前端选择器）
 */
import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/db'
import { toCustomRecipeDTO } from '../utils/serializers'
import { analyzeRecipe } from '../utils/analysis'
import { INGREDIENT_DICT, CATEGORY_LABELS, groupByCategory } from '../data/ingredientDict'

const router = Router()

const ingredientSchema = z.object({
  name: z.string().min(1).max(40),
  amount: z.union([z.number(), z.string()]).optional(),
  unit: z.string().optional()
})

/**
 * POST /api/recipes/analyze
 */
router.post('/analyze', (req: Request, res: Response) => {
  const schema = z.object({ ingredients: z.array(ingredientSchema).max(30) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
  }
  const result = analyzeRecipe({ ingredients: parsed.data.ingredients })
  res.json({ data: result })
})

/**
 * GET /api/recipes/ingredients
 * 返回成分字典供前端选择器
 */
router.get('/ingredients', (_req: Request, res: Response) => {
  const groups = groupByCategory()
  const data = Object.entries(groups).map(([category, items]) => ({
    category,
    label: CATEGORY_LABELS[category] || category,
    items: items.map((i) => ({
      name: i.name,
      category: i.category,
      sweet: i.sweet,
      sour: i.sour,
      bitter: i.bitter,
      strong: i.strong,
      defaultAmount: i.defaultAmount
    }))
  }))
  res.json({ data, total: INGREDIENT_DICT.length })
})

/**
 * POST /api/recipes
 */
const upsertSchema = z.object({
  name: z.string().min(1).max(50),
  ingredients: z.array(ingredientSchema).min(1).max(20),
  steps: z.array(z.string()).default([]),
  note: z.string().max(500).optional()
})

router.post('/', async (req: any, res: Response) => {
  const userId = req.user?.id || req.header('x-user-id')
  if (!userId) return res.status(401).json({ error: '请先登录' })

  // 付费墙：免费用户最多保存 3 个特调
  const FREE_RECIPE_LIMIT = 3
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user) {
    const isMember =
      user.memberTier !== 'free' && user.memberExpiresAt && user.memberExpiresAt > new Date()
    if (!isMember) {
      const count = await prisma.customRecipe.count({ where: { userId } })
      if (count >= FREE_RECIPE_LIMIT) {
        return res.status(403).json({
          error: `免费用户最多保存 ${FREE_RECIPE_LIMIT} 个特调，开通会员解锁无限配额`,
          code: 'QUOTA_EXCEEDED',
          data: { used: count, limit: FREE_RECIPE_LIMIT }
        })
      }
    }
  }

  // 自动创建 User
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, nickname: `User-${userId.slice(0, 6)}` }
  })

  const parsed = upsertSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
  }
  const { name, ingredients, steps, note } = parsed.data

  // 自动分析
  const analysis = analyzeRecipe({ ingredients })

  const row = await prisma.customRecipe.create({
    data: {
      name,
      userId,
      ingredients: JSON.stringify(ingredients),
      steps: JSON.stringify(steps),
      sweet: analysis.sweet,
      sour: analysis.sour,
      bitter: analysis.bitter,
      strong: analysis.strong,
      note: note
    }
  })
  res.status(201).json({ data: { ...toCustomRecipeDTO(row), analysis } })
})

/**
 * GET /api/recipes?userId=xxx
 */
const listQuery = z.object({
  userId: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
})
router.get('/', async (req: any, res: Response) => {
  // userId 可选：优先 query，传了就用；否则从 JWT 拿
  let userId = req.query.userId as string | undefined
  if (!userId && req.user?.id) userId = req.user.id
  if (!userId) return res.status(400).json({ error: 'userId required' })

  const page = Number(req.query.page) || 1
  const pageSize = Math.min(Number(req.query.pageSize) || 20, 100)
  const [total, rows] = await Promise.all([
    prisma.customRecipe.count({ where: { userId } }),
    prisma.customRecipe.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])
  res.json({
    data: rows.map(toCustomRecipeDTO),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  })
})

/**
 * GET /api/recipes/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  const row = await prisma.customRecipe.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Recipe not found' })
  res.json({ data: toCustomRecipeDTO(row) })
})

/**
 * PUT /api/recipes/:id
 */
router.put('/:id', async (req: any, res: Response) => {
  const userId = req.user?.id || req.header('x-user-id')
  const existing = await prisma.customRecipe.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Recipe not found' })
  if (userId && existing.userId !== userId) {
    return res.status(403).json({ error: '只能修改自己的配方' })
  }
  const parsed = upsertSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
  }
  const { name, ingredients, steps, note } = parsed.data

  // 重新分析
  let analysis
  if (ingredients) {
    analysis = analyzeRecipe({ ingredients })
  }

  const row = await prisma.customRecipe.update({
    where: { id: req.params.id },
    data: {
      name: name ?? existing.name,
      ingredients: ingredients ? JSON.stringify(ingredients) : existing.ingredients,
      steps: steps ? JSON.stringify(steps) : existing.steps,
      note: note ?? existing.note,
      sweet: analysis?.sweet ?? existing.sweet,
      sour: analysis?.sour ?? existing.sour,
      bitter: analysis?.bitter ?? existing.bitter,
      strong: analysis?.strong ?? existing.strong
    }
  })
  res.json({ data: toCustomRecipeDTO(row) })
})

/**
 * DELETE /api/recipes/:id
 */
router.delete('/:id', async (req: any, res: Response) => {
  const userId = req.user?.id || req.header('x-user-id')
  const existing = await prisma.customRecipe.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Recipe not found' })
  if (userId && existing.userId !== userId) {
    return res.status(403).json({ error: '只能删除自己的配方' })
  }
  await prisma.customRecipe.delete({ where: { id: req.params.id } })
  res.json({ data: { id: req.params.id, deleted: true } })
})

export default router
