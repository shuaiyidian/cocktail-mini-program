/**
 * JWT 鉴权中间件
 *
 *   - requireAuth: 必须登录，否则 401
 *   - optionalAuth: 解析了就用，没解析也能过
 *
 * 解析顺序：Authorization: Bearer <token> → JWT
 * 失败 fallback：x-user-id header（M4 兼容）
 */
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../utils/db'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN as any) || '30d'

export interface AuthPayload {
  userId: string
  openid?: string
  /** 颁发时间（毫秒） */
  iat?: number
  /** 过期时间（毫秒） */
  exp?: number
}

export interface AuthedRequest extends Request {
  user?: { id: string; openid?: string; memberTier: string; memberExpiresAt: Date | null }
}

export function signToken(userId: string, openid?: string): string {
  return jwt.sign({ userId, openid } as AuthPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload
  } catch {
    return null
  }
}

/** 解析当前请求的 userId（不查 DB） */
export function getUserIdFromRequest(req: Request): string | null {
  // 1) Authorization: Bearer <token>
  const auth = req.header('authorization')
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim()
    const payload = verifyToken(token)
    if (payload?.userId) return payload.userId
  }
  // 2) x-user-id header（M4 兼容）
  const legacy = req.header('x-user-id')
  if (legacy) return legacy
  return null
}

async function loadUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } })
}

export function optionalAuth() {
  return async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    const userId = getUserIdFromRequest(req)
    if (userId) {
      const u = await loadUser(userId)
      if (u) {
        req.user = {
          id: u.id,
          openid: u.openid || undefined,
          memberTier: u.memberTier,
          memberExpiresAt: u.memberExpiresAt
        }
      }
    }
    next()
  }
}

export function requireAuth() {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', hint: '请先登录' })
    }
    const u = await loadUser(userId)
    if (!u) {
      return res.status(401).json({ error: 'User not found' })
    }
    req.user = {
      id: u.id,
      openid: u.openid || undefined,
      memberTier: u.memberTier,
      memberExpiresAt: u.memberExpiresAt
    }
    next()
  }
}
