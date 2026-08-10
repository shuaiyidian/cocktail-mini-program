/**
 * 特调配方酸甜苦烈分析器
 *
 * 算法：累积贡献法
 *   对每个维度，累加该成分 score × amount（ml）
 *   score = clamp(Σ(score_i × amount_i) / REFERENCE_ML, 0, 10)
 *
 *   REFERENCE_ML = 30 表示"30ml 标准杯的累积贡献"
 *   - 30ml 8 度烈酒贡献 strong=8（合理）
 *   - 30ml 9 酸柠檬汁贡献 sour=9
 *   - 15ml 10 甜糖浆贡献 sweet=5（半杯就够甜）
 *
 * 装饰类成分（garnish）用量 < 5ml 时忽略贡献（不影响主体）
 * 未知成分：warning + 忽略贡献
 */

import { INGREDIENT_DICT, IngredientProfile, findIngredient } from '../data/ingredientDict'

export interface AnalysisInput {
  ingredients: Array<{ name: string; amount?: number | string; unit?: string }>
}

export interface IngredientContribution {
  name: string
  amount: number  // 标准化为 ml，0 表示装饰忽略
  category?: string
  contribution: {
    sweet: number
    sour: number
    bitter: number
    strong: number
  }
  /** 该成分的覆盖度（0-1）：占总体酸甜苦烈的贡献比 */
  weight: number
  known: boolean  // 是否在字典中
}

export interface AnalysisResult {
  sweet: number
  sour: number
  bitter: number
  strong: number
  totalVolume: number
  recognizedCount: number
  unknownCount: number
  details: IngredientContribution[]
  /** 主导味道标签 */
  dominant: Array<'sweet' | 'sour' | 'bitter' | 'strong'>
  warnings: string[]
}

/** 把任意用量归一为 ml 数。无法识别的（如"适量"）返回 null。 */
export function normalizeAmount(amount: number | string, unit?: string): number | null {
  if (typeof amount === 'number') {
    if (!unit) return amount
    const u = unit.toLowerCase()
    if (u.includes('ml') || u.includes('毫升')) return amount
    if (u.includes('l') && !u.includes('ml')) return amount * 1000
    if (u.includes('oz')) return Math.round(amount * 30)
    if (u.includes('茶匙') || u.includes('tsp')) return Math.round(amount * 5)
    if (u.includes('汤匙') || u.includes('tbsp')) return Math.round(amount * 15)
    if (u.includes('dash') || u.includes('dashes')) return Math.round(amount * 0.6)
    if (u.includes('drop') || u.includes('滴')) return Math.round(amount * 0.05 * 10) / 10
    if (u.includes('杯') || u.includes('cup')) return Math.round(amount * 240)
    if (u.includes('个') || u.includes('片') || u.includes('块') || u.includes('枝') || u.includes('撮')) {
      return null  // 装饰类无法用 ml 衡量
    }
    return amount  // 默认假设就是 ml
  }
  // 字符串"适量"等
  return null
}

/**
 * 分析配方
 * @param input 成分列表
 * @returns 0-10 评分 + 详情
 */
export function analyzeRecipe(input: AnalysisInput): AnalysisResult {
  const warnings: string[] = []
  const details: IngredientContribution[] = []

  let totalWeightedSweet = 0
  let totalWeightedSour = 0
  let totalWeightedBitter = 0
  let totalWeightedStrong = 0
  let totalVolume = 0
  let recognizedCount = 0
  let unknownCount = 0

  const REFERENCE_ML = 30

  for (const ing of input.ingredients) {
    const profile = findIngredient(ing.name)
    const ml = normalizeAmount(ing.amount as any, ing.unit)

    if (!profile) {
      unknownCount++
      warnings.push(`未识别成分：${ing.name}（已忽略贡献度计算）`)
      details.push({
        name: ing.name,
        amount: ml || 0,
        contribution: { sweet: 0, sour: 0, bitter: 0, strong: 0 },
        weight: 0,
        known: false
      })
      continue
    }

    recognizedCount++

    // 装饰类（garnish）且 ml 不确定：忽略主味道
    if (profile.category === 'garnish' && (ml === null || ml < 3)) {
      details.push({
        name: ing.name,
        amount: ml || 0,
        category: profile.category,
        contribution: { sweet: 0, sour: 0, bitter: 0, strong: 0 },
        weight: 0,
        known: true
      })
      continue
    }

    const effMl = ml || profile.defaultAmount
    totalVolume += effMl
    totalWeightedSweet += profile.sweet * effMl
    totalWeightedSour += profile.sour * effMl
    totalWeightedBitter += profile.bitter * effMl
    totalWeightedStrong += profile.strong * effMl

    details.push({
      name: ing.name,
      amount: effMl,
      category: profile.category,
      contribution: {
        sweet: profile.sweet,
        sour: profile.sour,
        bitter: profile.bitter,
        strong: profile.strong
      },
      weight: 0,  // 后面算
      known: true
    })
  }

  // 累积贡献法：score = clamp(Σ(score_i × amount_i) / 30, 0, 10)
  const sweet = clamp(roundScore(totalWeightedSweet / REFERENCE_ML), 0, 10)
  const sour = clamp(roundScore(totalWeightedSour / REFERENCE_ML), 0, 10)
  const bitter = clamp(roundScore(totalWeightedBitter / REFERENCE_ML), 0, 10)
  const strong = clamp(roundScore(totalWeightedStrong / REFERENCE_ML), 0, 10)

  // 算每个成分的"覆盖度"（贡献比）
  const totalScore = sweet + sour + bitter + strong
  for (const d of details) {
    if (totalScore === 0 || d.amount === 0) {
      d.weight = 0
    } else {
      d.weight = Math.round(((d.contribution.sweet + d.contribution.sour + d.contribution.bitter + d.contribution.strong) * d.amount) / (totalVolume * totalScore) * 100) / 100
    }
  }

  // 找主导味道
  const flavorEntries: Array<['sweet' | 'sour' | 'bitter' | 'strong', number]> = [
    ['sweet', sweet],
    ['sour', sour],
    ['bitter', bitter],
    ['strong', strong]
  ]
  const max = Math.max(...flavorEntries.map((e) => e[1]))
  const dominant = flavorEntries.filter((e) => e[1] >= max * 0.8 && e[1] > 0).map((e) => e[0])

  if (input.ingredients.length === 0) {
    warnings.push('配方为空')
  }
  if (recognizedCount === 0 && input.ingredients.length > 0) {
    warnings.push('所有成分都未识别，请检查名称（如"白朗姆酒"）')
  }

  return {
    sweet,
    sour,
    bitter,
    strong,
    totalVolume: Math.round(totalVolume * 10) / 10,
    recognizedCount,
    unknownCount,
    details,
    dominant,
    warnings
  }
}

function roundScore(v: number): number {
  return Math.round(v)
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
