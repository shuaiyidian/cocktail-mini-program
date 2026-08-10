/**
 * 鉴权 / 会员 / 支付 API
 */
import Taro from '@tarojs/taro'
import { request } from './request'

const TOKEN_KEY = 'cocktail_token'

export function getToken(): string | null {
  try { return Taro.getStorageSync(TOKEN_KEY) || null } catch { return null }
}
export function setToken(token: string) {
  try { Taro.setStorageSync(TOKEN_KEY, token) } catch {}
}
export function clearToken() {
  try { Taro.removeStorageSync(TOKEN_KEY) } catch {}
}

export interface UserInfo {
  id: string
  openid: string | null
  nickname: string | null
  avatar: string | null
  memberTier: string
  memberExpiresAt: string | null
  isMember: boolean
  createdAt: string
}

/**
 * 微信登录
 * 自动调用 wx.login → 拿 code → 走后端 wx-login → 存 token
 */
export async function loginWithWechat(): Promise<{ token: string; user: UserInfo }> {
  // 1. wx.login 拿 code
  const loginRes = await Taro.login()
  if (!loginRes.code) {
    throw new Error('微信登录失败：未拿到 code')
  }
  // 2. 拿用户信息（头像昵称）- 可选
  let userInfo: { nickName?: string; avatarUrl?: string } | null = null
  try {
    const profileRes = await Taro.getUserProfile({ desc: '用于完善会员资料' })
    userInfo = profileRes.userInfo
  } catch {
    // 用户拒绝授权也能登录，只是不拿昵称头像
  }
  // 3. 调后端
  const r = await request<{ data: { token: string; user: UserInfo } }>({
    url: '/auth/wx-login',
    method: 'POST',
    data: {
      code: loginRes.code,
      nickname: userInfo?.nickName,
      avatar: userInfo?.avatarUrl
    }
  })
  setToken(r.data.token)
  return r.data
}

/**
 * 开发期登录（仅当 WX_APPID 未配置时可用）
 */
export function mockLogin(nickname?: string) {
  return request<{ data: { token: string; user: UserInfo } }>({
    url: '/auth/mock-login',
    method: 'POST',
    data: { nickname }
  })
}

/**
 * 智能登录：生产用 wx.login，开发用 mock-login
 * 检测方法：尝试 wx.login 拿 code，如果后端返回"未配置 WX_APPID"，fallback 到 mock
 */
export async function smartLogin(): Promise<{ token: string; user: UserInfo; isDev: boolean }> {
  try {
    // 先尝试微信登录
    const data = await loginWithWechat()
    return { ...data, isDev: false }
  } catch (err: any) {
    // 如果后端提示 WX_APPID 未配置 → mock 登录
    if (err.message?.includes('未配置') || err.message?.includes('WX_APPID') || err.message?.includes('502')) {
      const r = await mockLogin('酒友')
      setToken(r.data.token)
      return { ...r.data, isDev: true }
    }
    throw err
  }
}

export function getMe() {
  return request<{ data: UserInfo }>({ url: '/auth/me' })
}

export interface MemberPlan {
  id: string
  name: string
  tier: string
  priceCents: number
  durationDays: number
  benefits: string[]
  sortOrder: number
  isActive: boolean
}

export function listPlans() {
  return request<{ data: MemberPlan[] }>({ url: '/plans' })
}

export interface Benefits {
  memberTier: string
  memberExpiresAt: string | null
  isMember: boolean
  limits: {
    recipes: { used: number; limit: number; exceeded: boolean }
    cocktails: { used: number; limit: number; exceeded: boolean }
  }
}

export function getBenefits() {
  return request<{ data: Benefits }>({ url: '/benefits' })
}

export interface Order {
  id: string
  userId: string
  planId: string
  amountCents: number
  status: string
  sandboxRef: string | null
  paidAt: string | null
  createdAt: string
  plan: { id: string; name: string; tier: string; priceCents: number; durationDays: number }
}

export function sandboxPay(planId: string) {
  return request<{ data: { order: Order; member: { tier: string; expiresAt: string | null } } }>({
    url: '/payments/sandbox',
    method: 'POST',
    data: { planId }
  })
}

export function listOrders() {
  return request<{ data: Order[] }>({ url: '/orders' })
}
