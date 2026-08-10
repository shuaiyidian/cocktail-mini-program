/**
 * API 请求封装
 * 微信小程序调试时需要把 localhost 换成电脑 IP，或者在「详情 → 本地设置」中关闭域名校验
 */
import Taro from '@tarojs/taro'
import { getToken } from './auth'

// 开发期地址：小程序调试器访问电脑本机
// 真实设备调试时改为电脑 IP（如 192.168.1.10）
const API_BASE = 'http://localhost:3000/api'

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}

export async function request<T = any>(options: RequestOptions): Promise<T> {
  // 自动注入 JWT
  const token = getToken()
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  const res = await Taro.request({
    url: `${API_BASE}${options.url}`,
    method: options.method || 'GET',
    data: options.data,
    header: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.header
    },
    timeout: 15000
  })
  if (res.statusCode >= 200 && res.statusCode < 300) {
    return res.data as T
  }
  if (res.statusCode === 401) {
    // 清掉过期 token
    Taro.removeStorageSync('cocktail_token')
  }
  // 解析错误
  const errBody: any = res.data
  const msg = errBody?.error || `HTTP ${res.statusCode}`
  throw new Error(msg)
}

