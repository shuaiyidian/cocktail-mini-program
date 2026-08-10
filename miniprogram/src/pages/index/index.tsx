import { View, Text, Button, Slider } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useCallback } from 'react'
import './index.scss'

interface TasteProfile {
  sweet: number
  sour: number
  bitter: number
  strong: number
}

const DEFAULT_TASTE: TasteProfile = { sweet: 5, sour: 5, bitter: 5, strong: 5 }

export default function Index() {
  const [taste, setTaste] = useState<TasteProfile>(DEFAULT_TASTE)

  // Slider 在拖动过程中频繁 setState 会触发整页 re-render，影响体验
  // 解决方案：把"滑动中"的值存在 ref 不触发 re-render，松手时再 commit
  // 这里为了简单，拖动中也实时 setState，但用 useCallback 优化
  const onSlide = useCallback((key: keyof TasteProfile, value: number) => {
    setTaste((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetTaste = () => setTaste(DEFAULT_TASTE)

  // 预设快速按钮
  const presets: { label: string; emoji: string; taste: TasteProfile }[] = [
    { label: '清爽', emoji: '🌊', taste: { sweet: 4, sour: 8, bitter: 2, strong: 3 } },
    { label: '浓郁', emoji: '🍫', taste: { sweet: 7, sour: 2, bitter: 5, strong: 7 } },
    { label: '甜蜜', emoji: '🍓', taste: { sweet: 9, sour: 3, bitter: 1, strong: 3 } },
    { label: '酸烈', emoji: '🔥', taste: { sweet: 2, sour: 7, bitter: 4, strong: 8 } },
    { label: '平衡', emoji: '⚖️', taste: { sweet: 5, sour: 5, bitter: 5, strong: 5 } }
  ]

  const goRecommend = () => {
    const qs = new URLSearchParams({
      sweet: String(taste.sweet),
      sour: String(taste.sour),
      bitter: String(taste.bitter),
      strong: String(taste.strong)
    })
    Taro.navigateTo({ url: `/pages/cocktail-list/index?${qs.toString()}` })
  }

  const goAllList = () => {
    Taro.switchTab({ url: '/pages/cocktail-list/index' })
  }

  const labels = { sweet: '甜', sour: '酸', bitter: '苦', strong: '烈' }
  const colors = { sweet: '#ffb3c1', sour: '#ffe066', bitter: '#8d6e63', strong: '#e94560' }
  const tipText = {
    sweet: '糖浆 / 利口酒 / 果汁',
    sour: '柠檬 / 青柠 / 醋',
    bitter: '苦精 / 味美思 / 咖啡',
    strong: '高度数烈酒'
  }

  return (
    <View className="index-page">
      <View className="hero">
        <Text className="title">🍸 调一杯你的</Text>
        <Text className="subtitle">拖动滑块，调整你想要的风味</Text>
      </View>

      {/* 预设快速选择 */}
      <ScrollView scrollX className="preset-row" enhanced showScrollbar={false}>
        {presets.map((p) => (
          <View
            key={p.label}
            className="preset-chip"
            onClick={() => setTaste(p.taste)}
          >
            <Text className="preset-emoji">{p.emoji}</Text>
            <Text className="preset-label">{p.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 风味滑块 */}
      <View className="taste-card">
        {(Object.keys(labels) as Array<keyof typeof labels>).map((key) => (
          <View key={key} className="taste-row">
            <View className="taste-header">
              <Text className="taste-label" style={{ color: colors[key] }}>
                {labels[key]}
              </Text>
              <Text className="taste-value">{taste[key]}</Text>
            </View>
            <Slider
              className="taste-slider"
              min={0}
              max={10}
              step={1}
              value={taste[key]}
              activeColor={colors[key]}
              backgroundColor="#0f3460"
              blockColor={colors[key]}
              blockSize={20}
              onChanging={(e) => onSlide(key, e.detail.value)}
              onChange={(e) => onSlide(key, e.detail.value)}
            />
            <Text className="taste-tip">来源：{tipText[key]}</Text>
          </View>
        ))}
      </View>

      <View className="action-card">
        <Button className="btn-primary" onClick={goRecommend}>
          🎯 为我推荐
        </Button>
        <View className="btn-row">
          <Button className="btn-secondary" onClick={goAllList}>
            📚 全部酒单
          </Button>
          <Button className="btn-secondary" onClick={resetTaste}>
            ↺ 重置
          </Button>
        </View>
        <Button
          className="btn-link"
          onClick={() => Taro.switchTab({ url: '/pages/custom/index' })}
        >
          ＋ 自创特调配方
        </Button>
      </View>

      <View className="footer">
        <Text>M4 完成 · 特调配方 + 我的酒单</Text>
      </View>
    </View>
  )
}
