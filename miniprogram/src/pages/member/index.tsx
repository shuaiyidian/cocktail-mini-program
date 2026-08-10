import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { listPlans, sandboxPay, listOrders, getBenefits, MemberPlan, Order, Benefits } from '../../api/auth'
import { getToken } from '../../api/auth'
import './index.scss'

export default function Member() {
  const [plans, setPlans] = useState<MemberPlan[]>([])
  const [benefits, setBenefits] = useState<Benefits | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [planRes, orderRes] = await Promise.all([listPlans(), listOrders()])
      setPlans(planRes.data)
      setOrders(orderRes.data)
      if (getToken()) {
        const bRes = await getBenefits()
        setBenefits(bRes.data)
      }
    } catch (err: any) {
      Taro.showToast({ title: '加载失败：' + (err.message || ''), icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const onPay = async (plan: MemberPlan) => {
    if (!getToken()) {
      Taro.showModal({
        title: '请先登录',
        content: '需要登录后才能开通会员',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) Taro.switchTab({ url: '/pages/user/index' })
        }
      })
      return
    }

    Taro.showLoading({ title: '正在支付...', mask: true })
    setPaying(plan.id)
    try {
      const r = await sandboxPay(plan.id)
      Taro.hideLoading()
      Taro.showToast({ title: '🎉 开通成功', icon: 'success', duration: 1500 })
      // 刷新
      await load()
      setTimeout(() => {
        Taro.showModal({
          title: '已开通会员',
          content: `${plan.name}已开通，到期时间：${new Date(r.data.member.expiresAt!).toLocaleDateString('zh-CN')}`,
          showCancel: false,
          confirmText: '好的'
        })
      }, 1600)
    } catch (err: any) {
      Taro.hideLoading()
      Taro.showModal({
        title: '支付失败',
        content: err.message || '未知错误，请重试',
        showCancel: false
      })
    } finally {
      setPaying(null)
    }
  }

  const formatYuan = (cents: number) => (cents / 100).toFixed(2)
  const dayLabel = (days: number) => (days >= 365 ? '年' : '月')

  return (
    <View className="page">
      {/* 当前会员状态卡 */}
      <View className="status-card">
        {benefits?.isMember ? (
          <>
            <View className="status-tier">
              <Text className="tier-emoji">
                {benefits.memberTier === 'svip' ? '👑' : '⭐'}
              </Text>
              <Text className="tier-name">
                {benefits.memberTier === 'svip' ? '年度 SVIP' : '月卡 PRO'}
              </Text>
            </View>
            <Text className="status-expiry">
              到期：{new Date(benefits.memberExpiresAt!).toLocaleDateString('zh-CN')}
            </Text>
            <View className="status-quota">
              <View className="quota-item">
                <Text className="quota-label">特调配方</Text>
                <Text className="quota-value">无限</Text>
              </View>
              <View className="quota-divider" />
              <View className="quota-item">
                <Text className="quota-label">私人酒单</Text>
                <Text className="quota-value">无限</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View className="status-tier">
              <Text className="tier-emoji">🍹</Text>
              <Text className="tier-name">免费用户</Text>
            </View>
            <Text className="status-expiry">开通会员解锁全部权益</Text>
            {benefits && (
              <View className="status-quota">
                <View className="quota-item">
                  <Text className="quota-label">特调</Text>
                  <Text className={`quota-value ${benefits.limits.recipes.exceeded ? 'quota-warn' : ''}`}>
                    {benefits.limits.recipes.used}/{benefits.limits.recipes.limit}
                  </Text>
                </View>
                <View className="quota-divider" />
                <View className="quota-item">
                  <Text className="quota-label">酒单</Text>
                  <Text className={`quota-value ${benefits.limits.cocktails.exceeded ? 'quota-warn' : ''}`}>
                    {benefits.limits.cocktails.used}/{benefits.limits.cocktails.limit}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* 套餐列表 */}
      <View className="section">
        <Text className="section-title">选择套餐</Text>
        {loading ? (
          <Text className="loading">加载中…</Text>
        ) : plans.length === 0 ? (
          <Text className="empty">暂无可用套餐</Text>
        ) : (
          <View className="plan-list">
            {plans.map((p) => {
              const isPro = p.tier === 'pro'
              return (
                <View key={p.id} className={`plan-card ${isPro ? 'plan-popular' : ''}`}>
                  {isPro && <View className="plan-badge">最受欢迎</View>}
                  <View className="plan-header">
                    <Text className="plan-name">{p.name}</Text>
                    <View className="plan-price">
                      <Text className="plan-currency">¥</Text>
                      <Text className="plan-amount">{formatYuan(p.priceCents)}</Text>
                      <Text className="plan-period">/{dayLabel(p.durationDays)}</Text>
                    </View>
                  </View>
                  <View className="plan-benefits">
                    {Array.isArray(p.benefits) &&
                      p.benefits.map((b, i) => (
                        <View key={i} className="benefit-item">
                          <Text className="benefit-check">✓</Text>
                          <Text className="benefit-text">{b}</Text>
                        </View>
                      ))}
                  </View>
                  <Button
                    className={`btn-pay ${isPro ? 'btn-pay-primary' : ''}`}
                    onClick={() => onPay(p)}
                    loading={paying === p.id}
                    disabled={!!paying}
                  >
                    {benefits?.memberTier === p.tier ? '已开通' : '立即开通'}
                  </Button>
                </View>
              )
            })}
          </View>
        )}
      </View>

      {/* 订单历史 */}
      {getToken() && orders.length > 0 && (
        <View className="section">
          <Text className="section-title">订单记录</Text>
          <View className="order-list">
            {orders.map((o) => {
              const paid = o.status === 'paid'
              return (
                <View key={o.id} className="order-row">
                  <View className="order-info">
                    <Text className="order-name">{o.plan.name}</Text>
                    <Text className="order-time">
                      {new Date(o.createdAt).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                  <View className="order-right">
                    <Text className="order-amount">¥{formatYuan(o.amountCents)}</Text>
                    <Text className={`order-status order-${o.status}`}>
                      {paid ? '已支付' : o.status === 'failed' ? '失败' : o.status === 'pending' ? '处理中' : o.status}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      )}

      <View className="footer">
        <Text>沙箱支付 · 真实上线需对接微信支付</Text>
      </View>
    </View>
  )
}
