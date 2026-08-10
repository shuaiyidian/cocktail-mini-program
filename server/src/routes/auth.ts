/**
 * 鉴权 / 用户路由
 * 路由前缀：/api/auth
 *
 *   POST /mock-login   - 开发期用，body: { nickname?, avatar? } → 返回 JWT + user
 *   POST /wx-login     - 微信登录（生产用，body: { code, nickname?, avatar? }）
 *   GET  /me           - 获取当前用户（基于 JWT）
 *   POST /logout       - 退出登录（前端清 token 即可，后端无状态）
 */
import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../utils/db'
import { signToken, requireAuth, AuthedRequest } from '../middleware/auth'

const router = Router()

function toUserDTO(u: any) {
  return {
    id: u.id,
    openid: u.openid,
    nickname: u.nickname,
    avatar: u.avatar,
    memberTier: u.memberTier,
    memberExpiresAt: u.memberExpiresAt?.toISOString() || null,
    isMember: u.memberTier !== 'free' && (!u.memberExpiresAt || u.memberExpiresAt > new Date()),
    createdAt: u.createdAt.toISOString()
  }
}

const mockLoginSchema = z.object({
  nickname: z.string().min(1).max(20).optional(),
  avatar: z.string().url().optional()
})

/**
 * POST /api/auth/mock-login
 * 开发期：生成一个稳定的 userId（基于设备或随机），签发 JWT
 * 注意：生产环境要替换为 /wx-login
 */
router.post('/mock-login', async (req, res) => {
  const parsed = mockLoginSchema.safeParse(req.body || {})
  const nickname = parsed.success ? parsed.data.nickname || '酒友' : '酒友'
  const avatar = parsed.success ? parsed.data.avatar : undefined

  // 用一个简单策略：每次 mock-login 都生成新用户（开发期方便看到隔离）
  // 生产期用 openid 关联
  const user = await prisma.user.create({
    data: {
      nickname,
      avatar,
      // 随机 mock openid
      openid: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    }
  })
  const token = signToken(user.id, user.openid || undefined)
  res.json({ data: { token, user: toUserDTO(user) } })
})

/**
 * POST /api/auth/wx-login
 * 生产用：客户端用 wx.login 拿到 code，传给后端换 openid
 * 这里只是 stub：把 code 当 openid 处理（开发期可以测）
 */
const wxLoginSchema = z.object({
  code: z.string().min(1),
  nickname: z.string().max(20).optional(),
  avatar: z.string().url().optional()
})
router.post('/wx-login', async (req, res) => {
  const parsed = wxLoginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() })
  }
  const { code, nickname, avatar } = parsed.data

  const WX_APPID = process.env.WX_APPID
  const WX_SECRET = process.env.WX_SECRET
  let openid: string

  if (WX_APPID && WX_SECRET) {
    // 生产环境：调用微信接口换 openid
    try {
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_SECRET}&js_code=${code}&grant_type=authorization_code`
      const wxRes = await fetch(url)
      const wxData: any = await wxRes.json()
      if (wxData.errcode) {
        return res.status(400).json({
          error: `微信登录失败：${wxData.errmsg || '未知错误'} (errcode=${wxData.errcode})`
        })
      }
      openid = wxData.openid
      if (!openid) {
        return res.status(500).json({ error: '微信返回数据缺少 openid' })
      }
    } catch (err: any) {
      return res.status(502).json({ error: '调用微信接口失败：' + err.message })
    }
  } else {
    // 开发环境（未配置 WX_APPID/WX_SECRET）：用 code 作为 openid
    // 提示：每次冷启动会得到不同的 openid（code 每次不同），所以开发期会持续创建新用户
    // 生产一定要配置 WX_APPID/WX_SECRET！
    console.warn('[wx-login] WX_APPID/WX_SECRET 未配置，使用 stub 模式')
    openid = `dev_${code}`
  }

  let user = await prisma.user.findUnique({ where: { openid } })
  if (!user) {
    user = await prisma.user.create({
      data: { openid, nickname: nickname || '鸡尾酒爱好者', avatar }
    })
  } else if ((nickname && nickname !== user.nickname) || (avatar && avatar !== user.avatar)) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { ...(nickname ? { nickname } : {}), ...(avatar ? { avatar } : {}) }
    })
  }
  const token = signToken(user.id, user.openid || undefined)
  res.json({ data: { token, user: toUserDTO(user) } })
})

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth(), (req: AuthedRequest, res: Response) => {
  // req.user 由 requireAuth 注入，但只含基本字段，重新查最新
  prisma.user
    .findUnique({ where: { id: req.user!.id } })
    .then((u) => {
      if (!u) return res.status(404).json({ error: 'User not found' })
      res.json({ data: toUserDTO(u) })
    })
    .catch((err) => res.status(500).json({ error: err.message }))
})

export default router
