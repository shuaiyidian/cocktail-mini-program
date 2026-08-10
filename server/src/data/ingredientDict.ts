/**
 * 调酒原料字典
 * 每个原料的 sweet/sour/bitter/strong 评分（0-10）
 * 数据来源：调酒常识 + 实际口感估算
 *
 * 评分含义（0-10）：
 *   sweet  - 糖浆、果汁、利口酒等带来的甜味
 *   sour   - 柠檬、青柠、醋等的酸味
 *   bitter - 苦精、咖啡、药草等的苦味
 *   strong - 酒精浓度（按体积百分比近似）
 *
 * 注意：分数是"贡献度"，不是绝对浓度。
 *   例如糖浆 sweet=10，1ml 糖浆 ≈ 1g 糖；
 *   伏特加 strong=9，30ml 烈酒会让成品酒精度约 15%；
 *   柠檬汁 sour=9，30ml 柠檬汁酸味主导。
 */

export interface IngredientProfile {
  name: string
  category: 'spirit' | 'liqueur' | 'juice' | 'syrup' | 'bitter' | 'soda' | 'dairy' | 'garnish' | 'other'
  sweet: number
  sour: number
  bitter: number
  strong: number
  /** 默认用量（ml）— 没填时用这个 */
  defaultAmount: number
  /** 别名用于搜索 */
  aliases?: string[]
}

export const INGREDIENT_DICT: IngredientProfile[] = [
  // ============ 烈酒（spirit）============
  { name: '白朗姆酒', category: 'spirit', sweet: 0, sour: 0, bitter: 0, strong: 8, defaultAmount: 30, aliases: ['白朗姆', '朗姆酒', 'rum'] },
  { name: '黑朗姆酒', category: 'spirit', sweet: 2, sour: 0, bitter: 1, strong: 8, defaultAmount: 30, aliases: ['黑朗姆', 'dark rum'] },
  { name: '伏特加', category: 'spirit', sweet: 0, sour: 0, bitter: 0, strong: 9, defaultAmount: 30, aliases: ['vodka'] },
  { name: '金酒', category: 'spirit', sweet: 0, sour: 0, bitter: 3, strong: 8, defaultAmount: 30, aliases: ['gin', '杜松子酒'] },
  { name: '老汤姆金酒', category: 'spirit', sweet: 3, sour: 0, bitter: 2, strong: 8, defaultAmount: 30, aliases: ['old tom gin'] },
  { name: '龙舌兰', category: 'spirit', sweet: 0, sour: 0, bitter: 1, strong: 8, defaultAmount: 30, aliases: ['tequila', '特基拉'] },
  { name: '波本威士忌', category: 'spirit', sweet: 3, sour: 0, bitter: 3, strong: 8, defaultAmount: 30, aliases: ['bourbon', '波本'] },
  { name: '黑麦威士忌', category: 'spirit', sweet: 2, sour: 0, bitter: 4, strong: 8, defaultAmount: 30, aliases: ['rye', '黑麦'] },
  { name: '苏格兰威士忌', category: 'spirit', sweet: 3, sour: 0, bitter: 4, strong: 8, defaultAmount: 30, aliases: ['scotch', '苏格兰'] },
  { name: '干邑白兰地', category: 'spirit', sweet: 3, sour: 0, bitter: 2, strong: 7, defaultAmount: 30, aliases: ['cognac', '干邑'] },
  { name: '白兰地', category: 'spirit', sweet: 3, sour: 0, bitter: 2, strong: 7, defaultAmount: 30, aliases: ['brandy'] },

  // ============ 利口酒（liqueur）============
  { name: '君度橙酒', category: 'liqueur', sweet: 8, sour: 1, bitter: 1, strong: 7, defaultAmount: 15, aliases: ['cointreau', '君度', '橙酒'] },
  { name: '白柑橘酒', category: 'liqueur', sweet: 7, sour: 1, bitter: 1, strong: 6, defaultAmount: 15, aliases: ['triple sec'] },
  { name: '金巴利', category: 'liqueur', sweet: 4, sour: 1, bitter: 8, strong: 5, defaultAmount: 30, aliases: ['campari'] },
  { name: '甜味美思', category: 'liqueur', sweet: 6, sour: 0, bitter: 4, strong: 4, defaultAmount: 30, aliases: ['sweet vermouth'] },
  { name: '干味美思', category: 'liqueur', sweet: 1, sour: 0, bitter: 4, strong: 4, defaultAmount: 15, aliases: ['dry vermouth'] },
  { name: '咖啡利口酒', category: 'liqueur', sweet: 8, sour: 0, bitter: 4, strong: 4, defaultAmount: 20, aliases: ['kahtua', '咖啡酒', '甘露'] },
  { name: '杏仁利口酒', category: 'liqueur', sweet: 7, sour: 0, bitter: 4, strong: 5, defaultAmount: 20, aliases: ['amaretto'] },
  { name: '马拉斯加酸樱桃酒', category: 'liqueur', sweet: 6, sour: 2, bitter: 1, strong: 4, defaultAmount: 15, aliases: ['maraschino'] },
  { name: '紫罗兰甜酒', category: 'liqueur', sweet: 7, sour: 1, bitter: 1, strong: 4, defaultAmount: 10, aliases: ['creme de violette'] },
  { name: '白薄荷酒', category: 'liqueur', sweet: 6, sour: 0, bitter: 1, strong: 5, defaultAmount: 15, aliases: ['creme de menthe'] },
  { name: '柠檬酒', category: 'liqueur', sweet: 8, sour: 3, bitter: 0, strong: 5, defaultAmount: 15, aliases: ['limoncello'] },
  { name: '百香果利口酒', category: 'liqueur', sweet: 8, sour: 3, bitter: 0, strong: 4, defaultAmount: 15, aliases: ['passoa'] },

  // ============ 果汁（juice）============
  { name: '新鲜柠檬汁', category: 'juice', sweet: 1, sour: 9, bitter: 0, strong: 0, defaultAmount: 25, aliases: ['柠檬汁', 'lemon juice'] },
  { name: '新鲜青柠汁', category: 'juice', sweet: 1, sour: 9, bitter: 0, strong: 0, defaultAmount: 20, aliases: ['青柠汁', 'lime juice'] },
  { name: '新鲜橙汁', category: 'juice', sweet: 6, sour: 2, bitter: 0, strong: 0, defaultAmount: 90, aliases: ['橙汁', 'orange juice'] },
  { name: '蔓越莓汁', category: 'juice', sweet: 6, sour: 5, bitter: 1, strong: 0, defaultAmount: 60, aliases: ['cranberry'] },
  { name: '菠萝汁', category: 'juice', sweet: 7, sour: 3, bitter: 0, strong: 0, defaultAmount: 90, aliases: ['pineapple'] },
  { name: '葡萄柚汁', category: 'juice', sweet: 4, sour: 6, bitter: 2, strong: 0, defaultAmount: 60, aliases: ['grapefruit'] },
  { name: '番茄汁', category: 'juice', sweet: 3, sour: 4, bitter: 1, strong: 0, defaultAmount: 120, aliases: ['tomato'] },
  { name: '白桃果泥', category: 'juice', sweet: 8, sour: 1, bitter: 0, strong: 0, defaultAmount: 30, aliases: ['peach puree'] },
  { name: '椰浆', category: 'juice', sweet: 4, sour: 0, bitter: 0, strong: 0, defaultAmount: 60, aliases: ['coconut cream'] },
  { name: '椰子奶油', category: 'juice', sweet: 5, sour: 0, bitter: 0, strong: 0, defaultAmount: 15, aliases: ['coconut milk'] },

  // ============ 糖浆（syrup）============
  { name: '糖浆', category: 'syrup', sweet: 10, sour: 0, bitter: 0, strong: 0, defaultAmount: 15, aliases: ['simple syrup', '单糖浆'] },
  { name: '白糖', category: 'syrup', sweet: 10, sour: 0, bitter: 0, strong: 0, defaultAmount: 5, aliases: ['sugar'] },
  { name: '红石榴糖浆', category: 'syrup', sweet: 9, sour: 1, bitter: 0, strong: 0, defaultAmount: 15, aliases: ['grenadine'] },
  { name: '蜂蜜糖浆', category: 'syrup', sweet: 9, sour: 0, bitter: 0, strong: 0, defaultAmount: 15, aliases: ['honey syrup'] },
  { name: '枫糖浆', category: 'syrup', sweet: 9, sour: 0, bitter: 0, strong: 0, defaultAmount: 10, aliases: ['maple'] },
  { name: '龙舌兰花蜜', category: 'syrup', sweet: 9, sour: 0, bitter: 0, strong: 0, defaultAmount: 10, aliases: ['agave'] },

  // ============ 苦精（bitter）============
  { name: '安格斯特拉苦精', category: 'bitter', sweet: 0, sour: 0, bitter: 10, strong: 1, defaultAmount: 2, aliases: ['angostura', '苦精'] },
  { name: '橙味苦精', category: 'bitter', sweet: 1, sour: 0, bitter: 8, strong: 1, defaultAmount: 2, aliases: ['orange bitters'] },
  { name: '巧克力苦精', category: 'bitter', sweet: 2, sour: 0, bitter: 7, strong: 1, defaultAmount: 2, aliases: ['chocolate bitters'] },

  // ============ 苏打 / 加水（soda）============
  { name: '苏打水', category: 'soda', sweet: 0, sour: 0, bitter: 0, strong: 0, defaultAmount: 90, aliases: ['soda water', '气泡水'] },
  { name: '汤力水', category: 'soda', sweet: 5, sour: 0, bitter: 4, strong: 0, defaultAmount: 120, aliases: ['tonic'] },
  { name: '可乐', category: 'soda', sweet: 9, sour: 0, bitter: 1, strong: 0, defaultAmount: 120, aliases: ['cola', 'coke'] },
  { name: '干型香槟', category: 'soda', sweet: 1, sour: 2, bitter: 0, strong: 2, defaultAmount: 90, aliases: ['champagne', '香槟', '起泡酒'] },
  { name: '姜汁汽水', category: 'soda', sweet: 6, sour: 0, bitter: 2, strong: 0, defaultAmount: 90, aliases: ['ginger beer'] },

  // ============ 乳制品（dairy）============
  { name: '淡奶油', category: 'dairy', sweet: 2, sour: 0, bitter: 0, strong: 0, defaultAmount: 25, aliases: ['cream'] },
  { name: '牛奶', category: 'dairy', sweet: 3, sour: 0, bitter: 0, strong: 0, defaultAmount: 60, aliases: ['milk'] },
  { name: '蛋清', category: 'dairy', sweet: 0, sour: 0, bitter: 0, strong: 0, defaultAmount: 15, aliases: ['egg white'] },

  // ============ 装饰（garnish）============
  { name: '新鲜薄荷叶', category: 'garnish', sweet: 0, sour: 0, bitter: 0, strong: 0, defaultAmount: 5, aliases: ['薄荷叶', 'mint'] },
  { name: '橙片', category: 'garnish', sweet: 2, sour: 1, bitter: 0, strong: 0, defaultAmount: 1, aliases: ['orange slice'] },
  { name: '柠檬片', category: 'garnish', sweet: 1, sour: 4, bitter: 0, strong: 0, defaultAmount: 1, aliases: ['lemon slice'] },
  { name: '青柠角', category: 'garnish', sweet: 1, sour: 4, bitter: 0, strong: 0, defaultAmount: 1, aliases: ['lime wedge'] },
  { name: '橄榄', category: 'garnish', sweet: 0, sour: 1, bitter: 2, strong: 0, defaultAmount: 1, aliases: ['olive'] },
  { name: '马拉斯奇诺樱桃', category: 'garnish', sweet: 5, sour: 0, bitter: 0, strong: 0, defaultAmount: 1, aliases: ['maraschino cherry', '樱桃'] },
  { name: '芹菜梗', category: 'garnish', sweet: 0, sour: 0, bitter: 1, strong: 0, defaultAmount: 1, aliases: ['celery'] },
  { name: '海盐', category: 'garnish', sweet: 0, sour: 0, bitter: 0, strong: 0, defaultAmount: 1, aliases: ['salt'] },
  { name: '细砂糖', category: 'garnish', sweet: 10, sour: 0, bitter: 0, strong: 0, defaultAmount: 1, aliases: ['sugar rim'] },
  { name: '伍斯特酱', category: 'garnish', sweet: 1, sour: 2, bitter: 1, strong: 0, defaultAmount: 1, aliases: ['worcestershire'] },
  { name: '塔巴斯科辣酱', category: 'garnish', sweet: 0, sour: 1, bitter: 0, strong: 0, defaultAmount: 1, aliases: ['tabasco'] }
]

/** 工具：按 name 或 alias 找成分 */
export function findIngredient(name: string): IngredientProfile | undefined {
  const n = name.trim().toLowerCase()
  return INGREDIENT_DICT.find(
    (i) =>
      i.name === name.trim() ||
      i.name.toLowerCase() === n ||
      (i.aliases || []).some((a) => a.toLowerCase() === n)
  )
}

/** 工具：按分类分组（前端选择器用） */
export function groupByCategory() {
  const groups: Record<string, IngredientProfile[]> = {}
  for (const i of INGREDIENT_DICT) {
    if (!groups[i.category]) groups[i.category] = []
    groups[i.category].push(i)
  }
  return groups
}

export const CATEGORY_LABELS: Record<string, string> = {
  spirit: '烈酒',
  liqueur: '利口酒',
  juice: '果汁',
  syrup: '糖浆',
  bitter: '苦精',
  soda: '气泡/加水',
  dairy: '乳制品',
  garnish: '装饰/调味',
  other: '其他'
}
