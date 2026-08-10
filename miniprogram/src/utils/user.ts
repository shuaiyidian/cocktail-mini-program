/**
 * 用户身份工具
 * M5 阶段接入微信登录后会替换为真实 userId
 * 当前开发期用一个稳定的 mockId 保持体验
 */
import Taro from '@tarojs/taro'

const STORAGE_KEY = 'cocktail_user_id'
const MOCK_USER_ID = 'demo-user-001'

export function getCurrentUserId(): string {
  try {
    // 微信小程序用 Taro.getStorageSync
    const cached = Taro.getStorageSync(STORAGE_KEY)
    if (cached) return cached
  } catch {}
  try {
    Taro.setStorageSync(STORAGE_KEY, MOCK_USER_ID)
  } catch {}
  return MOCK_USER_ID
}
