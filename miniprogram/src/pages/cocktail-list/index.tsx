import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
// 顶部 preset 也用了 ScrollView
import Taro from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import { listCocktails, recommendCocktails } from '../../api/cocktail'
import { getToken } from '../../api/auth'
import { createCocktail } from '../../api/cocktail-ext'  // 扩展 API
import type { Cocktail, TasteProfile } from '../../types/cocktail'
import { track, Events } from '../../utils/analytics'
import './index.scss'

const FLAVOR_COLORS: Record<string, string> = {
  sweet: '#ffb3c1',
  sour: '#ffe066',
  bitter: '#8d6e63',
  strong: '#e94560'
}

const FLAVOR_LABELS: Record<string, string> = {
  sweet: '甜',
  sour: '酸',
  bitter: '苦',
  strong: '烈'
}

interface MatchInfo {
  score: number
  reason: string
}

export default function CocktailList() {
  const [list, setList] = useState<Cocktail[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [recommendMode, setRecommendMode] = useState(false)
  const [taste, setTaste] = useState<TasteProfile | null>(null)
  const [matchMap, setMatchMap] = useState<Record<string, MatchInfo>>({})

  // 加载全部
  const loadAll = useCallback(async (keyword: string) => {
    setLoading(true)
    setRecommendMode(false)
    setMatchMap({})
    try {
      const res = await listCocktails({ search: keyword || undefined, pageSize: 50 })
      setList(res.data)
      setTotal(res.pagination.total)
    } catch (err: any) {
      Taro.showToast({ title: '加载失败：' + (err.message || '未知错误'), icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [])

  // 推荐
  const loadRecommend = useCallback(async (t: TasteProfile) => {
    setLoading(true)
    setRecommendMode(true)
    setTaste(t)
    try {
      const res = await recommendCocktails({ ...t, limit: 50 })
      setList(res.data)
      setTotal(res.data.length)
      const map: Record<string, MatchInfo> = {}
      res.data.forEach((c: any) => {
        map[c.id] = { score: c.matchScore, reason: c.reason }
      })
      setMatchMap(map)
      Taro.setNavigationBarTitle({ title: '为你推荐' })
    } catch (err: any) {
      Taro.showToast({ title: '推荐失败：' + (err.message || ''), icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始化：从 URL 读四维参数决定走哪个流程
  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const params = instance?.router?.params || {}
    const sweet = Number(params.sweet)
    const sour = Number(params.sour)
    const bitter = Number(params.bitter)
    const strong = Number(params.strong)
    const hasTaste = [sweet, sour, bitter, strong].every((n) => !Number.isNaN(n))
    if (hasTaste) {
      loadRecommend({ sweet, sour, bitter, strong })
    } else {
      loadAll('')
    }
  }, [loadAll, loadRecommend])

  const onSearch = () => loadAll(search)

  const goDetail = (c: Cocktail) => {
    Taro.navigateTo({ url: `/pages/cocktail-detail/index?slug=${c.slug}` })
    track(Events.COCKTAIL_VIEW, { id: c.id, name: c.name, from: recommendMode ? 'recommend' : 'list' })
  }

  const saveToMyList = async (c: Cocktail) => {
    if (!getToken()) {
      Taro.showModal({
        title: '请先登录',
        content: '需要登录后才能保存到酒单',
        confirmText: '去登录',
        success: (res) => { if (res.confirm) Taro.switchTab({ url: '/pages/user/index' }) }
      })
      return
    }
    try {
      Taro.showLoading({ title: '保存中…' })
      await createCocktail({
        name: c.name,
        nameEn: c.nameEn || undefined,
        category: 'custom',
        glass: c.glass || undefined,
        sweet: c.sweet,
        sour: c.sour,
        bitter: c.bitter,
        strong: c.strong,
        ingredients: c.ingredients,
        steps: c.steps,
        garnish: c.garnish || undefined,
        description: c.description || undefined,
        tags: c.tags.join(','),
        isPublic: false
      })
      Taro.hideLoading()
      Taro.showToast({ title: '已保存到我的酒单', icon: 'success' })
      track(Events.COCKTAIL_CREATE, { source: 'recommend_save', id: c.id })
    } catch (err: any) {
      Taro.hideLoading()
      Taro.showToast({ title: '保存失败：' + (err.message || ''), icon: 'none' })
    }
  }

  const renderFlavorBar = (c: Cocktail) => {
    return (Object.keys(FLAVOR_LABELS) as Array<keyof typeof FLAVOR_LABELS>).map((key) => (
      <View key={key} className="flavor-cell">
        <View className="flavor-label" style={{ color: FLAVOR_COLORS[key] }}>
          {FLAVOR_LABELS[key]}
        </View>
        <View className="flavor-bar">
          <View
            className="flavor-fill"
            style={{ width: `${c[key] * 10}%`, background: FLAVOR_COLORS[key] }}
          />
        </View>
        <View className="flavor-value">{c[key]}</View>
      </View>
    ))
  }

  const renderSkeleton = () => {
    return [1, 2, 3].map((i) => (
      <View key={i} className="card skeleton">
        <View className="sk-line sk-title" />
        <View className="sk-line sk-sub" />
        <View className="sk-row">
          <View className="sk-line sk-bar" />
          <View className="sk-line sk-bar" />
        </View>
        <View className="sk-row">
          <View className="sk-line sk-bar" />
          <View className="sk-line sk-bar" />
        </View>
      </View>
    ))
  }

  return (
    <View className="page">
      <View className="search-bar">
        <Input
          className="search-input"
          placeholder="搜索鸡尾酒 / 配料 / 标签"
          value={search}
          onInput={(e) => setSearch(e.detail.value)}
          onConfirm={onSearch}
          confirmType="search"
          disabled={recommendMode}
        />
        <Button
          className="search-btn"
          onClick={onSearch}
          size="mini"
          disabled={recommendMode}
        >
          搜索
        </Button>
      </View>

      {recommendMode && taste && (
        <View className="taste-bar">
          <Text className="taste-bar-label">🎯 你的口味</Text>
          <View className="taste-bar-pills">
            {(['sweet', 'sour', 'bitter', 'strong'] as const).map((k) => (
              <Text key={k} className="taste-pill" style={{ color: FLAVOR_COLORS[k] }}>
                {FLAVOR_LABELS[k]} {taste[k]}
              </Text>
            ))}
            <View className="taste-bar-action" onClick={() => loadAll('')}>
              <Text>查看全部</Text>
            </View>
          </View>
        </View>
      )}

      <View className="stats">
        <Text>
          {recommendMode ? '🎯 按你的口味推荐' : '📚 全部酒单'} ·{' '}
          {loading ? '加载中…' : `共 ${total} 款`}
        </Text>
      </View>

      <ScrollView scrollY className="scroll">
        {loading ? (
          renderSkeleton()
        ) : list.length === 0 ? (
          <View className="empty">
            <Text className="empty-emoji">🍹</Text>
            <Text className="empty-title">没找到合适的</Text>
            <Text className="empty-desc">换个关键词或调一下口味试试</Text>
            <Button className="empty-btn" onClick={() => loadAll('')}>
              查看全部酒单
            </Button>
          </View>
        ) : (
          <>
            {list.map((c) => {
              const match = matchMap[c.id]
              return (
                <View key={c.id} className="card" onClick={() => goDetail(c)}>
                  <View className="card-header">
                    <View className="card-title-wrap">
                      <Text className="card-title">{c.name}</Text>
                      {c.nameEn && <Text className="card-subtitle">{c.nameEn}</Text>}
                    </View>
                    <View className="card-tags">
                      {match && (
                        <View className="match-badge">
                          <Text className="match-score">{match.score}%</Text>
                          <Text className="match-label">匹配</Text>
                        </View>
                      )}
                      {c.isClassic && <View className="classic-tag">经典</View>}
                    </View>
                  </View>
                  {c.description && <Text className="card-desc">{c.description}</Text>}
                  <View className="flavor-grid">{renderFlavorBar(c)}</View>
                  {match?.reason && (
                    <View className="reason-row">
                      <Text className="reason-icon">💡</Text>
                      <Text className="reason-text">{match.reason}</Text>
                    </View>
                  )}
                  {c.tags.length > 0 && (
                    <View className="tag-row">
                      {c.tags.map((t) => (
                        <Text key={t} className="tag">
                          #{t}
                        </Text>
                      ))}
                    </View>
                  )}
                  <View className="card-actions" onClick={(e) => e.stopPropagation()}>
                    <View className="btn-save-inline" onClick={() => saveToMyList(c)}>
                      <Text>＋ 保存到酒单</Text>
                    </View>
                  </View>
                </View>
              )
            })}
            <View className="footer">
              <Text>— 已经到底了 —</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}
