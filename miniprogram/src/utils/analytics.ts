/**
 * 埋点客户端
 * 调用 /api/events 上报用户行为
 * 失败不影响主流程
 */
import Taro from '@tarojs/taro'
import { request } from '../api/request'

const CLIENT_ID_KEY = 'cocktail_client_id'

function getClientId(): string {
  try {
    let id = Taro.getStorageSync(CLIENT_ID_KEY)
    if (!id) {
      id = `cli_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      Taro.setStorageSync(CLIENT_ID_KEY, id)
    }
    return id
  } catch {
    return 'anon'
  }
}

export function track(type: string, data?: Record<string, any>) {
  // fire-and-forget，不 await
  request({
    url: '/events',
    method: 'POST',
    data: { type, data, clientId: getClientId() }
  }).catch(() => {
    // 静默
  })
}

// 常用事件类型常量（避免拼写错误）
export const Events = {
  APP_LAUNCH: 'app_launch',
  PAGE_VIEW: 'page_view',
  LOGIN: 'login',
  RECOMMEND: 'recommend',
  COCKTAIL_VIEW: 'cocktail_view',
  COCKTAIL_CREATE: 'cocktail_create',
  COCKTAIL_DELETE: 'cocktail_delete',
  RECIPE_CREATE: 'recipe_create',
  RECIPE_ANALYZE: 'recipe_analyze',
  MEMBER_VIEW: 'member_view',
  PAYMENT_START: 'payment_start',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAIL: 'payment_fail',
  QUOTA_EXCEEDED: 'quota_exceeded'
} as const
