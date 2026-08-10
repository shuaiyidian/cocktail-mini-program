import { View, Text, Input, Button, Picker, ScrollView, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useMemo } from 'react'
import { getIngredientDict, analyzeRecipe, createRecipe, IngredientItem, AnalysisResult } from '../../api/recipe'
import { getToken } from '../../api/auth'
import './index.scss'

interface DraftIngredient {
  name: string
  amount: number | string
  unit: string
}

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

export default function Custom() {
  const [dict, setDict] = useState<IngredientItem[]>([])
  const [dictLoaded, setDictLoaded] = useState(false)
  const [recipeName, setRecipeName] = useState('')
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([])
  const [stepsText, setStepsText] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pickerIdx, setPickerIdx] = useState(-1) // 当前正在选择成分的行

  // 加载字典
  useEffect(() => {
    ;(async () => {
      try {
        const res = await getIngredientDict()
        setDict(res.data.flatMap((g) => g.items))
        setDictLoaded(true)
      } catch (err: any) {
        Taro.showToast({ title: '加载字典失败：' + (err.message || ''), icon: 'none' })
      }
    })()
  }, [])

  // 实时分析（节流 800ms）
  useEffect(() => {
    if (ingredients.length === 0) {
      setAnalysis(null)
      return
    }
    setAnalyzing(true)
    const timer = setTimeout(async () => {
      try {
        const res = await analyzeRecipe(ingredients)
        setAnalysis(res.data)
      } catch (err: any) {
        // 静默
      } finally {
        setAnalyzing(false)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [ingredients])

  // 字典按分类（用字典自带 category 排序）
  const dictOptions = useMemo(() => dict.map((i) => i.name), [dict])

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: 30, unit: 'ml' }])
  }

  const updateIngredient = (idx: number, patch: Partial<DraftIngredient>) => {
    setIngredients(ingredients.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx))
  }

  const onPickIngredient = (idx: number, e: any) => {
    const val = e.detail.value
    setPickerIdx(-1)
    const picked = dict[val]
    if (picked) {
      updateIngredient(idx, { name: picked.name, amount: picked.defaultAmount, unit: 'ml' })
    }
  }

  const onSave = async () => {
    if (!getToken()) {
      Taro.showModal({
        title: '请先登录',
        content: '需要登录后才能保存特调',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) Taro.switchTab({ url: '/pages/user/index' })
        }
      })
      return
    }
    if (!recipeName.trim()) {
      Taro.showToast({ title: '请先取个名字', icon: 'none' })
      return
    }
    if (ingredients.length === 0) {
      Taro.showToast({ title: '请至少加一个成分', icon: 'none' })
      return
    }
    if (ingredients.some((i) => !i.name)) {
      Taro.showToast({ title: '有成分未选择', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      const steps = stepsText.split('\n').map((s) => s.trim()).filter(Boolean)
      await createRecipe(
        {
          name: recipeName.trim(),
          ingredients: ingredients.map((i) => ({
            name: i.name,
            amount: i.amount,
            unit: i.unit
          })),
          steps
        },
        ''  // 不再传 userId，从 JWT 解析
      )
      Taro.showToast({ title: '已保存到我的酒单', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/user/index' })
      }, 1200)
    } catch (err: any) {
      // 付费墙：免费用户超 3 个特调
      if (err.message?.includes('3') || err.message?.includes('限制') || err.message?.includes('quota')) {
        Taro.showModal({
          title: '已达免费用户上限',
          content: '免费用户最多保存 3 个特调，开通会员解锁无限配额',
          confirmText: '去看看',
          success: (res) => {
            if (res.confirm) Taro.navigateTo({ url: '/pages/member/index' })
          }
        })
        return
      }
      Taro.showToast({ title: '保存失败：' + (err.message || ''), icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const renderFlavorBar = () => {
    if (!analysis) {
      return (
        <View className="analysis-empty">
          <Text>添加成分后自动分析</Text>
        </View>
      )
    }
    return (
      <View>
        {(Object.keys(FLAVOR_LABELS) as Array<keyof typeof FLAVOR_LABELS>).map((key) => (
          <View key={key} className="flavor-row">
            <Text className="flavor-label" style={{ color: FLAVOR_COLORS[key] }}>
              {FLAVOR_LABELS[key]}
            </Text>
            <View className="flavor-bar">
              <View
                className="flavor-fill"
                style={{
                  width: `${analysis[key] * 10}%`,
                  background: FLAVOR_COLORS[key]
                }}
              />
            </View>
            <Text className="flavor-value">{analysis[key]}</Text>
          </View>
        ))}
        {analysis.dominant.length > 0 && (
          <View className="dominant-row">
            <Text className="dominant-label">主导味道：</Text>
            {analysis.dominant.map((d) => (
              <Text key={d} className="dominant-pill" style={{ color: FLAVOR_COLORS[d] }}>
                {FLAVOR_LABELS[d]}
              </Text>
            ))}
          </View>
        )}
        {analysis.warnings.length > 0 && (
          <View className="warnings">
            {analysis.warnings.map((w, i) => (
              <Text key={i} className="warning">
                ⚠️ {w}
              </Text>
            ))}
          </View>
        )}
      </View>
    )
  }

  return (
    <View className="page">
      <View className="name-card">
        <Text className="label">给你的特调取个名字</Text>
        <Input
          className="name-input"
          placeholder="如：夏日微风"
          value={recipeName}
          onInput={(e) => setRecipeName(e.detail.value)}
          maxlength={20}
        />
      </View>

      {/* 成分列表 */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">成分</Text>
          <Button className="btn-add" size="mini" onClick={addIngredient}>
            + 添加
          </Button>
        </View>

        {ingredients.length === 0 ? (
          <View className="empty">
            <Text>还没有成分，点 + 添加吧</Text>
          </View>
        ) : (
          <View className="ing-list">
            {ingredients.map((it, idx) => (
              <View key={idx} className="ing-row">
                <View className="ing-col-ing">
                  {pickerIdx === idx ? (
                    <Picker
                      mode="selector"
                      range={dictOptions}
                      onChange={(e) => onPickIngredient(idx, e)}
                      onCancel={() => setPickerIdx(-1)}
                    >
                      <View className="ing-name ing-name-empty">选择成分…</View>
                    </Picker>
                  ) : (
                    <View className="ing-name" onClick={() => setPickerIdx(idx)}>
                      {it.name || (
                        <Text className="ing-name-empty">点我选择</Text>
                      )}
                    </View>
                  )}
                </View>
                <View className="ing-col-amount">
                  <Input
                    className="ing-amount"
                    type="digit"
                    value={String(it.amount)}
                    onInput={(e) => updateIngredient(idx, { amount: e.detail.value })}
                  />
                  <Text className="ing-unit">{it.unit || 'ml'}</Text>
                </View>
                <View className="ing-col-del" onClick={() => removeIngredient(idx)}>
                  <Text className="ing-del">×</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 步骤 */}
      <View className="section">
        <Text className="section-title">调制步骤（可选）</Text>
        <Textarea
          className="steps-input"
          placeholder="每行一步，如：&#10;1. 杯中加冰&#10;2. 倒入朗姆酒和青柠汁&#10;3. 搅拌均匀，薄荷装饰"
          value={stepsText}
          onInput={(e) => setStepsText(e.detail.value)}
          maxlength={300}
          autoHeight
        />
      </View>

      {/* 实时分析 */}
      <View className="section analysis-section">
        <View className="section-header">
          <Text className="section-title">实时分析</Text>
          {analyzing && <Text className="analyzing">分析中…</Text>}
        </View>
        {renderFlavorBar()}
        {analysis && (
          <View className="meta">
            <Text className="meta-item">已识别 {analysis.recognizedCount} 味</Text>
            <Text className="meta-item">总容积 {analysis.totalVolume} ml</Text>
            {analysis.unknownCount > 0 && (
              <Text className="meta-item warn">未识别 {analysis.unknownCount} 味</Text>
            )}
          </View>
        )}
      </View>

      {/* 保存按钮 */}
      <View className="action-card">
        <Button
          className="btn-save"
          onClick={onSave}
          loading={saving}
          disabled={saving || !dictLoaded}
        >
          💾 保存到我的酒单
        </Button>
        <Text className="hint">保存后可在「我的」Tab 查看和管理</Text>
      </View>
    </View>
  )
}
