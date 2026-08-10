/**
 * 鸡尾酒 CRUD 路由
 * 路由前缀：/api/cocktails
 *
 *   GET    /                  - 列表（支持 query: category / search / page / pageSize / ownerId）
 *   GET    /:id               - 详情（id 或 slug）
 *   POST   /                  - 创建（用户自定义）
 *   PUT    /:id               - 更新（仅 owner 可改自定义款）
 *   DELETE /:id               - 删除（仅 owner 可删自定义款）
 *   POST   /recommend         - 基于四维评分推荐（M3 用，签名先暴露）
 */
import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/db'
import { toCocktailDTO, CocktailDTO } from '../utils/serializers'

const router = Router()

// 工具：字符串生成 slug
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'cocktail'
}

// 列表查询参数 schema
const listQuery = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  ownerId: z.union([z.string(), z.literal('')]).optional(),
  isClassic: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true'))
})

/**
 * GET /api/cocktails
 */
router.get('/', async (req: any, res: Response) => {
  const parsed = listQuery.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten() })
  }
  const { category, search, page, pageSize, ownerId, isClassic } = parsed.data

  // ownerId 为空时，从 JWT 拿（"我的私人酒单"用）
  let realOwnerId = ownerId
  if (realOwnerId === '' && req.user?.id) realOwnerId = req.user.id
  // 如果 isClassic=false 但没传 ownerId，自动用当前用户
  let where: any = {}
  if (category) where.category = category
  if (realOwnerId) where.ownerId = realOwnerId
  if (isClassic !== undefined) where.isClassic = isClassic
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { nameEn: { contains: search } },
      { tags: { contains: search } }
    ]
  }

  const [total, rows] = await Promise.all([
    prisma.cocktail.count({ where }),
    prisma.cocktail.findMany({
      where,
      orderBy: [{ isClassic: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])

  res.json({
    data: rows.map(toCocktailDTO),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  })
})

/**
 * GET /api/cocktails/:id  （id 或 slug）
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const row = await prisma.cocktail.findFirst({
    where: { OR: [{ id }, { slug: id }] }
  })
  if (!row) return res.status(404).json({ error: 'Cocktail not found' })
  res.json({ data: toCocktailDTO(row) })
})

// 创建 / 更新 schema
const upsertSchema = z.object({
  name: z.string().min(1).max(50),
  nameEn: z.string().max(80).optional(),
  category: z.string().default('custom'),
  glass: z.string().max(40).optional(),
  sweet: z.number().int().min(0).max(10),
  sour: z.number().int().min(0).max(10),
  bitter: z.number().int().min(0).max(10),
  strong: z.number().int().min(0).max(10),
  ingredients: z.array(z.any()).default([]),
  steps: z.array(z.string()).default([]),
  garnish: z.string().max(80).optional(),
  description: z.string().max(500).optional(),
  tags: z.string().max(200).optional(),
  image: z.string().url().optional(),
  isPublic: z.boolean().default(false),
  // 临时用一个 header 携带 userId（M5 接入鉴权后从 token 拿）
  ownerId: z.string().optional()
})

/**
 * POST /api/cocktails
 */
router.post('/', async (req: any, res: Response) => {
  const parsed = upsertSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
  }
  const data = parsed.data
  // 优先 JWT（req.user），fallback 到 x-user-id header（M4 兼容）
  const userId = req.user?.id || (req.header('x-user-id') as string | undefined) || data.ownerId || null
  if (!userId) {
    return res.status(401).json({ error: '请先登录' })
  }

  // 付费墙：免费用户最多保存 3 个私人酒单
  const FREE_COCKTAIL_LIMIT = 3
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user) {
    const isMember =
      user.memberTier !== 'free' && user.memberExpiresAt && user.memberExpiresAt > new Date()
    if (!isMember) {
      const count = await prisma.cocktail.count({
        where: { ownerId: userId, isClassic: false }
      })
      if (count >= FREE_COCKTAIL_LIMIT) {
        return res.status(403).json({
          error: `免费用户最多保存 ${FREE_COCKTAIL_LIMIT} 款私人酒单，开通会员解锁无限配额`,
          code: 'QUOTA_EXCEEDED',
          data: { used: count, limit: FREE_COCKTAIL_LIMIT }
        })
      }
    }
  }
  // 自动创建缺失的 User（开发期友好，M5 接入真实鉴权后会去掉）
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, nickname: `User-${userId.slice(0, 6)}` }
  })
  // 生成唯一 slug
  const baseSlug = slugify(`${data.name}-${data.nameEn ?? ''}`)
  let slug = baseSlug
  let i = 1
  while (await prisma.cocktail.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`
  }

  const row = await prisma.cocktail.create({
    data: {
      slug,
      name: data.name,
      nameEn: data.nameEn,
      category: data.category,
      glass: data.glass,
      sweet: data.sweet,
      sour: data.sour,
      bitter: data.bitter,
      strong: data.strong,
      ingredients: JSON.stringify(data.ingredients),
      steps: JSON.stringify(data.steps),
      garnish: data.garnish,
      description: data.description,
      tags: data.tags || '',
      image: data.image,
      isClassic: false,
      isPublic: data.isPublic,
      ownerId: userId
    }
  })
  res.status(201).json({ data: toCocktailDTO(row) })
})

/**
 * PUT /api/cocktails/:id
 */
router.put('/:id', async (req: any, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id || req.header('x-user-id')
  const existing = await prisma.cocktail.findFirst({
    where: { OR: [{ id }, { slug: id }] }
  })
  if (!existing) return res.status(404).json({ error: 'Cocktail not found' })
  if (existing.isClassic) return res.status(403).json({ error: '经典预置款不可修改' })
  if (userId && existing.ownerId !== userId) {
    return res.status(403).json({ error: '只能修改自己的酒单' })
  }

  const parsed = upsertSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
  }
  const data = parsed.data

  const row = await prisma.cocktail.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      nameEn: data.nameEn ?? existing.nameEn,
      category: data.category ?? existing.category,
      glass: data.glass ?? existing.glass,
      sweet: data.sweet ?? existing.sweet,
      sour: data.sour ?? existing.sour,
      bitter: data.bitter ?? existing.bitter,
      strong: data.strong ?? existing.strong,
      ingredients: data.ingredients ? JSON.stringify(data.ingredients) : existing.ingredients,
      steps: data.steps ? JSON.stringify(data.steps) : existing.steps,
      garnish: data.garnish ?? existing.garnish,
      description: data.description ?? existing.description,
      tags: data.tags ?? existing.tags,
      image: data.image ?? existing.image,
      isPublic: data.isPublic ?? existing.isPublic
    }
  })
  res.json({ data: toCocktailDTO(row) })
})

/**
 * DELETE /api/cocktails/:id
 */
router.delete('/:id', async (req: any, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id || req.header('x-user-id')
  const existing = await prisma.cocktail.findFirst({
    where: { OR: [{ id }, { slug: id }] }
  })
  if (!existing) return res.status(404).json({ error: 'Cocktail not found' })
  if (existing.isClassic) return res.status(403).json({ error: '经典预置款不可删除' })
  if (userId && existing.ownerId !== userId) {
    return res.status(403).json({ error: '只能删除自己的酒单' })
  }
  await prisma.cocktail.delete({ where: { id } })
  res.json({ data: { id, deleted: true } })
})

/**
 * POST /api/cocktails/recommend
 *  根据甜酸苦烈四维评分推荐最匹配的鸡尾酒
 *  body: { sweet, sour, bitter, strong }（0-10）
 *  返回按欧氏距离升序排列的 top N
 *
 *  M3 阶段会扩展：加入权重、过滤、个性化等
 */
const recommendSchema = z.object({
  sweet: z.number().min(0).max(10),
  sour: z.number().min(0).max(10),
  bitter: z.number().min(0).max(10),
  strong: z.number().min(0).max(10),
  limit: z.number().int().min(1).max(20).default(5)
})

router.post('/recommend', async (req: Request, res: Response) => {
  const parsed = recommendSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
  }
  const { sweet, sour, bitter, strong, limit } = parsed.data
  const target = { sweet, sour, bitter, strong }
  const rows = await prisma.cocktail.findMany({
    where: { isPublic: true }
  })

  // 工具：根据用户偏好和鸡尾酒参数，生成"为什么推荐"文字说明
  function buildReason(row: typeof rows[number]) {
    const FLAVOR_NAMES: Record<string, string> = {
      sweet: '甜度',
      sour: '酸度',
      bitter: '苦度',
      strong: '酒精度'
    }
    const diffs = (Object.keys(target) as Array<keyof typeof target>).map((k) => ({
      key: k,
      diff: Math.abs(row[k] - target[k]),
      name: FLAVOR_NAMES[k]
    }))
    // 找差异最小的维度（最佳匹配维度）
    const best = diffs.reduce((a, b) => (a.diff <= b.diff ? a : b))
    // 找差异最大的维度（主要反差）
    const worst = diffs.reduce((a, b) => (a.diff >= b.diff ? a : b))

    const parts: string[] = []
    if (best.diff === 0) {
      parts.push(`${best.name}精准匹配`)
    } else if (best.diff <= 1) {
      parts.push(`${best.name}非常贴近`)
    } else if (best.diff <= 2) {
      parts.push(`${best.name}接近`)
    }

    if (worst.diff >= 3 && worst.key !== best.key) {
      parts.push(`${worst.name}与你偏好相差 ${worst.diff}`)
    }

    // 整体距离
    const total = Math.sqrt(diffs.reduce((s, d) => s + d.diff * d.diff, 0))
    if (total < 3) parts.push('整体非常契合')
    else if (total < 6) parts.push('整体接近')

    return parts.join('，') || '为你精心挑选'
  }

  const ranked = rows
    .map((row) => {
      const dist = Math.sqrt(
        (row.sweet - sweet) ** 2 +
        (row.sour - sour) ** 2 +
        (row.bitter - bitter) ** 2 +
        (row.strong - strong) ** 2
      )
      return { row, dist }
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)

  res.json({
    data: ranked.map(({ row, dist }) => ({
      ...toCocktailDTO(row),
      matchScore: Math.max(0, Math.round(100 - (dist / 20) * 100)),
      matchDistance: Math.round(dist * 100) / 100,
      reason: buildReason(row)
    })),
    query: { sweet, sour, bitter, strong }
  })
})

export default router
