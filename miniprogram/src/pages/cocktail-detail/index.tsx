import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { getCocktail } from '../../api/cocktail'
import type { Cocktail } from '../../types/cocktail'
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

export default function CocktailDetail() {
  const [cocktail, setCocktail] = useState<Cocktail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const slug = instance?.router?.params?.slug
    if (!slug) {
      setError('缺少参数')
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const res = await getCocktail(slug)
        setCocktail(res.data)
        Taro.setNavigationBarTitle({ title: res.data.name })
      } catch (err: any) {
        setError(err.message || '加载失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <View className="page">
        <View className="hero skeleton-hero">
          <View className="sk sk-bg" />
          <View className="hero-content">
            <View className="sk sk-title" />
            <View className="sk sk-subtitle" />
          </View>
        </View>
        <View className="section skeleton">
          <View className="sk sk-section-title" />
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="sk sk-flavor-row" />
          ))}
        </View>
        <View className="section skeleton">
          <View className="sk sk-section-title" />
          {[1, 2, 3].map((i) => (
            <View key={i} className="sk sk-ingredient" />
          ))}
        </View>
      </View>
    )
  }

  if (error || !cocktail) {
    return (
      <View className="page error-page">
        <Text className="error-emoji">😢</Text>
        <Text className="error-title">没找到这款鸡尾酒</Text>
        <Text className="error-desc">{error || '试试回到酒单'}</Text>
        <Button className="btn-back" onClick={() => Taro.navigateBack()}>
          返回酒单
        </Button>
      </View>
    )
  }

  return (
    <View className="page">
      <View className="hero">
        <View className="hero-bg">
          <View className="emoji">🍸</View>
        </View>
        <View className="hero-content">
          <View className="title-row">
            <Text className="title">{cocktail.name}</Text>
            {cocktail.isClassic && <View className="tag-classic">经典</View>}
          </View>
          {cocktail.nameEn && <Text className="subtitle">{cocktail.nameEn}</Text>}
          {cocktail.glass && <Text className="glass">🥃 {cocktail.glass}</Text>}
        </View>
      </View>

      <View className="section">
        <Text className="section-title">风味曲线</Text>
        <View className="flavor-list">
          {(Object.keys(FLAVOR_LABELS) as Array<keyof typeof FLAVOR_LABELS>).map((key) => (
            <View key={key} className="flavor-row">
              <View className="flavor-label-wrap">
                <Text className="flavor-label" style={{ color: FLAVOR_COLORS[key] }}>
                  {FLAVOR_LABELS[key]}
                </Text>
              </View>
              <View className="flavor-bar">
                <View
                  className="flavor-fill"
                  style={{ width: `${cocktail[key] * 10}%`, background: FLAVOR_COLORS[key] }}
                />
              </View>
              <Text className="flavor-value">{cocktail[key]}</Text>
            </View>
          ))}
        </View>
      </View>

      {cocktail.description && (
        <View className="section">
          <Text className="section-title">关于这杯</Text>
          <Text className="desc">{cocktail.description}</Text>
        </View>
      )}

      <View className="section">
        <Text className="section-title">配方</Text>
        <View className="ingredients">
          {cocktail.ingredients.map((ing, idx) => (
            <View key={idx} className="ingredient-row">
              <Text className="ingredient-name">{ing.name}</Text>
              <Text className="ingredient-amount">
                {ing.amount} {ing.unit}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {cocktail.steps.length > 0 && (
        <View className="section">
          <Text className="section-title">调制步骤</Text>
          <View className="steps">
            {cocktail.steps.map((s, idx) => (
              <View key={idx} className="step">
                <View className="step-num">
                  <Text>{idx + 1}</Text>
                </View>
                <Text className="step-text">{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {cocktail.garnish && (
        <View className="section">
          <Text className="section-title">装饰</Text>
          <Text className="desc">🌿 {cocktail.garnish}</Text>
        </View>
      )}

      {cocktail.tags.length > 0 && (
        <View className="section">
          <View className="tag-row">
            {cocktail.tags.map((t) => (
              <Text key={t} className="tag">#{t}</Text>
            ))}
          </View>
        </View>
      )}

      <View className="footer">
        <Button className="btn-back" onClick={() => Taro.navigateBack()}>
          返回酒单
        </Button>
      </View>
    </View>
  )
}
