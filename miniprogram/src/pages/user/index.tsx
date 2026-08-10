import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import { listRecipes, deleteRecipe, getIngredientDict } from '../../api/recipe'
import { listCocktails } from '../../api/cocktail'
import {
  smartLogin, getMe, getToken, setToken, clearToken,
  getBenefits, UserInfo, Benefits
} from '../../api/auth'
import './index.scss'

const FLAVOR_COLORS: Record<string, string> = {
  sweet: '#ffb3c1', sour: '#ffe066', bitter: '#8d6e63', strong: '#e94560'
}
const FLAVOR_LABELS: Record<string, string> = {
  sweet: '甜', sour: '酸', bitter: '苦', strong: '烈'
}

interface Recipe {
  id: string
  name: string
  ingredients: Array<{ name: string; amount: number | string; unit?: string }>
  sweet: number; sour: number; bitter: number; strong: number
  createdAt: string
}
interface CustomCocktail {
  id: string
  name: string
  nameEn: string | null
  sweet: number; sour: number; bitter: number; strong: number
  isClassic: boolean
  createdAt: string
}

export default function User() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [benefits, setBenefits] = useState<Benefits | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [cocktails, setCocktails] = useState<CustomCocktail[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'recipe' | 'cocktail'>('recipe')
  const [loggingIn, setLoggingIn] = useState(false)

  // 登录（自动选择微信 / mock）
  const onLogin = async () => {
    setLoggingIn(true)
    try {
      const r = await smartLogin()
      setToken(r.token)
      setUser(r.user)
      Taro.showToast({
        title: r.isDev ? '登录成功（开发模式）' : '微信登录成功',
        icon: 'success'
      })
      await load()
    } catch (err: any) {
      Taro.showToast({ title: '登录失败：' + (err.message || ''), icon: 'none' })
    } finally {
      setLoggingIn(false)
    }
  }

  const onLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出吗？',
      confirmColor: '#e94560',
      success: (res) => {
        if (res.confirm) {
          clearToken()
          setUser(null)
          setBenefits(null)
          setRecipes([])
          setCocktails([])
        }
      }
    })
  }

  const load = useCallback(async () => {
    if (!getToken()) return
    setLoading(true)
    try {
      // 拉特调配方
      const recipeRes = await listRecipes('').catch(() => ({ data: [] as any[], pagination: { total: 0 } }))
      setRecipes(recipeRes.data)

      // 拉自定义鸡尾酒酒单
      const cocktailRes = await listCocktails({ ownerId: '', pageSize: 50, isClassic: false }).catch(() => ({ data: [] as any[], pagination: { total: 0 } }))
      setCocktails(cocktailRes.data as any)

      // 拉用户信息 + 权益
      const [me, b] = await Promise.all([getMe(), getBenefits()])
      setUser(me.data)
      setBenefits(b.data)
    } catch (err: any) {
      // 401 自动清 token
      if (err.message?.includes('Unauthorized') || err.message?.includes('请先登录')) {
        clearToken()
        setUser(null)
      }
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [])

  // 初始：检查是否已登录
  useEffect(() => {
    if (getToken()) {
      load()
    }
  }, [load])

  // 切换 tab 不重拉，避免刷掉
  useEffect(() => {
    if (!getToken()) return
    if (tab === 'cocktail' && cocktails.length === 0) load()
    if (tab === 'recipe' && recipes.length === 0) load()
  }, [tab, load, cocktails.length, recipes.length])

  // 从其他页跳回时刷新（onShow）
  useEffect(() => {
    const handler = Taro.eventCenter.on as any
    if (typeof handler === 'function') {
      // 占位：让 onShow 触发
    }
  }, [])

  const onDeleteRecipe = async (r: Recipe) => {
    const res = await Taro.showModal({
      title: '删除确认',
      content: `确定删除「${r.name}」吗？`,
      confirmColor: '#e94560'
    })
    if (!res.confirm) return
    try {
      await deleteRecipe(r.id, '')
      Taro.showToast({ title: '已删除', icon: 'success' })
      load()
    } catch (err: any) {
      Taro.showToast({ title: '删除失败：' + (err.message || ''), icon: 'none' })
    }
  }

  const onDeleteCocktail = async (c: CustomCocktail) => {
    const res = await Taro.showModal({
      title: '删除确认',
      content: `确定删除「${c.name}」吗？`,
      confirmColor: '#e94560'
    })
    if (!res.confirm) return
    try {
      await Taro.request({
        url: `http://localhost:3000/api/cocktails/${c.id}`,
        method: 'DELETE',
        header: { Authorization: `Bearer ${getToken()}` }
      })
      Taro.showToast({ title: '已删除', icon: 'success' })
      load()
    } catch (err: any) {
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  const goMember = () => Taro.navigateTo({ url: '/pages/member/index' })

  const renderFlavorMini = (s: number, key: string) => (
    <View key={key} className="mini-cell">
      <View className="mini-label" style={{ color: FLAVOR_COLORS[key] }}>
        {FLAVOR_LABELS[key]}
      </View>
      <View className="mini-bar">
        <View
          className="mini-fill"
          style={{ width: `${s * 10}%`, background: FLAVOR_COLORS[key] }}
        />
      </View>
      <Text className="mini-value">{s}</Text>
    </View>
  )

  // 未登录态
  if (!getToken() || !user) {
    return (
      <View className="page">
        <View className="user-card user-card-empty">
          <View className="avatar">👤</View>
          <View className="user-info">
            <Text className="user-name">未登录</Text>
            <Text className="user-id">登录后开启特调、会员等功能</Text>
          </View>
        </View>
        <View className="login-prompt">
          <Text className="prompt-emoji">🔐</Text>
          <Text className="prompt-title">登录开启完整功能</Text>
          <Text className="prompt-desc">
            · 创建和保存特调配方{'\n'}
            · 云端同步你的私人酒单{'\n'}
            · 开通会员解锁无限配额
          </Text>
          <Button
            className="btn-login"
            onClick={onLogin}
            loading={loggingIn}
            disabled={loggingIn}
          >
            微信一键登录
          </Button>
          <Text className="prompt-hint">
            {`首次登录会请求获取你的微信头像昵称\n未配置 WX_APPID 时自动 fallback 到开发登录`}
          </Text>
        </View>
      </View>
    )
  }

  // 已登录态
  return (
    <View className="page">
      <View className="user-card">
        <View className="avatar">👤</View>
        <View className="user-info">
          <Text className="user-name">{user.nickname}</Text>
          <Text className="user-id">ID: {user.id.slice(0, 12)}…</Text>
        </View>
        <View className={`tier-badge ${user.isMember ? 'tier-vip' : ''}`}>
          <Text className="tier-text">
            {user.memberTier === 'svip' ? '👑 SVIP' : user.memberTier === 'pro' ? '⭐ PRO' : '免费'}
          </Text>
        </View>
      </View>

      {/* 会员入口 + 配额 */}
      <View className="member-entry" onClick={goMember}>
        <View className="member-entry-left">
          {user.isMember ? (
            <>
              <Text className="member-entry-title">会员已开通</Text>
              <Text className="member-entry-sub">
                到期 {new Date(user.memberExpiresAt!).toLocaleDateString('zh-CN')}
              </Text>
            </>
          ) : (
            <>
              <Text className="member-entry-title">开通会员</Text>
              <Text className="member-entry-sub">
                特调/酒单无限配额 + 全部权益
              </Text>
            </>
          )}
        </View>
        <View className="member-entry-right">
          <Text className="entry-arrow">›</Text>
        </View>
      </View>

      {benefits && !user.isMember && (
        <View className="quota-row">
          <View className="quota-cell">
            <Text className="quota-name">特调配方</Text>
            <Text className={`quota-num ${benefits.limits.recipes.exceeded ? 'quota-warn' : ''}`}>
              {benefits.limits.recipes.used} / {benefits.limits.recipes.limit}
            </Text>
          </View>
          <View className="quota-cell">
            <Text className="quota-name">私人酒单</Text>
            <Text className={`quota-num ${benefits.limits.cocktails.exceeded ? 'quota-warn' : ''}`}>
              {benefits.limits.cocktails.used} / {benefits.limits.cocktails.limit}
            </Text>
          </View>
        </View>
      )}

      {/* Tab 切换 */}
      <View className="tab-row">
        <View
          className={`tab ${tab === 'recipe' ? 'tab-active' : ''}`}
          onClick={() => setTab('recipe')}
        >
          <Text>🍹 特调配方 ({recipes.length})</Text>
        </View>
        <View
          className={`tab ${tab === 'cocktail' ? 'tab-active' : ''}`}
          onClick={() => setTab('cocktail')}
        >
          <Text>📋 私人酒单 ({cocktails.length})</Text>
        </View>
      </View>

      {loading ? (
        <View className="loading">
          <Text>加载中…</Text>
        </View>
      ) : tab === 'recipe' ? (
        recipes.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-emoji">🍹</Text>
            <Text className="empty-title">还没有特调</Text>
            <Text className="empty-desc">去「特调」Tab 创建你的第一杯</Text>
            <Button
              className="empty-btn"
              onClick={() => Taro.switchTab({ url: '/pages/custom/index' })}
            >
              立即创建
            </Button>
          </View>
        ) : (
          <View className="list">
            {recipes.map((r) => (
              <View key={r.id} className="card">
                <View className="card-header">
                  <Text className="card-title">{r.name}</Text>
                  <View className="card-del" onClick={() => onDeleteRecipe(r)}>
                    <Text>×</Text>
                  </View>
                </View>
                <View className="flavor-mini">
                  {(['sweet', 'sour', 'bitter', 'strong'] as const).map((k) =>
                    renderFlavorMini(r[k], k)
                  )}
                </View>
                <View className="ing-preview">
                  {r.ingredients.slice(0, 4).map((i, idx) => (
                    <Text key={idx} className="ing-tag">
                      {i.name} {i.amount}
                      {i.unit || 'ml'}
                    </Text>
                  ))}
                  {r.ingredients.length > 4 && (
                    <Text className="ing-tag">+{r.ingredients.length - 4}</Text>
                  )}
                </View>
                <Text className="time">
                  创建于 {new Date(r.createdAt).toLocaleDateString('zh-CN')}
                </Text>
              </View>
            ))}
          </View>
        )
      ) : cocktails.length === 0 ? (
        <View className="empty-state">
          <Text className="empty-emoji">📋</Text>
          <Text className="empty-title">还没有私人酒单</Text>
          <Text className="empty-desc">经典款不能满足你？自己加一个</Text>
        </View>
      ) : (
        <View className="list">
          {cocktails.map((c) => (
            <View key={c.id} className="card">
              <View className="card-header">
                <View>
                  <Text className="card-title">{c.name}</Text>
                  {c.nameEn && <Text className="card-sub">{c.nameEn}</Text>}
                </View>
                <View className="card-del" onClick={() => onDeleteCocktail(c)}>
                  <Text>×</Text>
                </View>
              </View>
              <View className="flavor-mini">
                {(['sweet', 'sour', 'bitter', 'strong'] as const).map((k) =>
                  renderFlavorMini(c[k], k)
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <View className="logout-row">
        <Button className="btn-logout" onClick={onLogout}>
          退出登录
        </Button>
      </View>

      <View className="footer">
        <Text>下拉刷新 · 点 × 删除</Text>
      </View>
    </View>
  )
}
