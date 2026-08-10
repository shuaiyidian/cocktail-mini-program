/**
 * 25 款经典鸡尾酒种子数据
 * 风味四维评分（0-10）：
 *   sweet  - 甜度
 *   sour   - 酸度
 *   bitter - 苦度
 *   strong - 烈度
 * 数据来源：经典调酒配方 + 风味常识
 */

export interface SeedIngredient {
  name: string
  amount: number | string
  unit: string
}

export interface SeedCocktail {
  slug: string
  name: string
  nameEn: string
  category: string
  glass: string
  sweet: number
  sour: number
  bitter: number
  strong: number
  ingredients: SeedIngredient[]
  steps: string[]
  garnish: string
  description: string
  tags: string
}

export const CLASSIC_COCKTAILS: SeedCocktail[] = [
  {
    slug: 'mojito',
    name: '莫吉托',
    nameEn: 'Mojito',
    category: 'classic',
    glass: '高球杯',
    sweet: 7, sour: 6, bitter: 2, strong: 4,
    ingredients: [
      { name: '白朗姆酒', amount: 60, unit: 'ml' },
      { name: '新鲜青柠汁', amount: 30, unit: 'ml' },
      { name: '白糖', amount: 2, unit: '茶匙' },
      { name: '苏打水', amount: '适量', unit: '' },
      { name: '新鲜薄荷叶', amount: 10, unit: '片' }
    ],
    steps: [
      '薄荷叶放入杯中，用吧勺轻拍释放香气',
      '加入白糖和青柠汁，搅拌至糖溶解',
      '加入朗姆酒和大量碎冰',
      '用苏打水补满杯身',
      '用搅拌勺上下提拉 3 次，薄荷枝装饰'
    ],
    garnish: '薄荷枝、青柠角',
    description: '诞生于古巴哈瓦那的国民鸡尾酒，海明威的最爱。',
    tags: '古巴,清爽,薄荷,夏日'
  },
  {
    slug: 'margarita',
    name: '玛格丽特',
    nameEn: 'Margarita',
    category: 'classic',
    glass: '玛格丽特杯',
    sweet: 3, sour: 8, bitter: 2, strong: 6,
    ingredients: [
      { name: '龙舌兰', amount: 45, unit: 'ml' },
      { name: '君度橙酒', amount: 20, unit: 'ml' },
      { name: '新鲜青柠汁', amount: 25, unit: 'ml' },
      { name: '海盐', amount: '适量', unit: '' }
    ],
    steps: [
      '杯沿用青柠片擦湿，蘸上海盐',
      '雪克壶中加入所有液体和冰块',
      '用力摇和 10 秒',
      '双层过滤倒入杯中',
      '青柠片装饰杯沿'
    ],
    garnish: '青柠片',
    description: '墨西哥国民鸡尾酒，酸爽的经典代表。',
    tags: '墨西哥,酸爽,龙舌兰,海盐'
  },
  {
    slug: 'long-island-iced-tea',
    name: '长岛冰茶',
    nameEn: 'Long Island Iced Tea',
    category: 'classic',
    glass: '高球杯',
    sweet: 5, sour: 3, bitter: 3, strong: 9,
    ingredients: [
      { name: '伏特加', amount: 15, unit: 'ml' },
      { name: '白朗姆酒', amount: 15, unit: 'ml' },
      { name: '金酒', amount: 15, unit: 'ml' },
      { name: '龙舌兰', amount: 15, unit: 'ml' },
      { name: '白柑橘酒', amount: 15, unit: 'ml' },
      { name: '柠檬汁', amount: 30, unit: 'ml' },
      { name: '糖浆', amount: 15, unit: 'ml' },
      { name: '可乐', amount: '适量', unit: '' }
    ],
    steps: [
      '高球杯装满冰块',
      '加入所有烈酒和柠檬汁、糖浆',
      '搅拌均匀',
      '用可乐补满杯身（呈现茶色）',
      '柠檬片装饰'
    ],
    garnish: '柠檬片',
    description: '看似温柔的茶色，藏着五种烈酒的猛兽。',
    tags: '高酒精度,派对,易醉'
  },
  {
    slug: 'martini',
    name: '马天尼',
    nameEn: 'Martini',
    category: 'classic',
    glass: '马天尼杯',
    sweet: 1, sour: 1, bitter: 6, strong: 8,
    ingredients: [
      { name: '金酒', amount: 60, unit: 'ml' },
      { name: '干味美思', amount: 10, unit: 'ml' },
      { name: '橄榄盐水', amount: 1, unit: '吧勺' }
    ],
    steps: [
      '搅拌杯中加满冰块',
      '倒入金酒和味美思，搅拌 30 秒至充分冰透',
      '滤入冰镇过的马天尼杯',
      '穿入橄榄或柠檬皮'
    ],
    garnish: '橄榄或柠檬皮',
    description: '鸡尾酒之王，007 詹姆斯·邦德的最爱。',
    tags: '经典,烈性,优雅'
  },
  {
    slug: 'cosmopolitan',
    name: '大都会',
    nameEn: 'Cosmopolitan',
    category: 'classic',
    glass: '马天尼杯',
    sweet: 5, sour: 7, bitter: 2, strong: 5,
    ingredients: [
      { name: '柠檬味伏特加', amount: 45, unit: 'ml' },
      { name: '君度橙酒', amount: 15, unit: 'ml' },
      { name: '蔓越莓汁', amount: 30, unit: 'ml' },
      { name: '新鲜青柠汁', amount: 15, unit: 'ml' }
    ],
    steps: [
      '所有材料加入雪克壶加冰',
      '用力摇和 12 秒',
      '双层过滤倒入冰镇马天尼杯',
      '橙皮或柠檬皮装饰'
    ],
    garnish: '橙皮',
    description: '《欲望都市》女主角们的都市名片，粉红魅惑。',
    tags: '都市,粉红,优雅,女性'
  },
  {
    slug: 'tequila-sunrise',
    name: '龙舌兰日出',
    nameEn: 'Tequila Sunrise',
    category: 'classic',
    glass: '高球杯',
    sweet: 8, sour: 2, bitter: 1, strong: 6,
    ingredients: [
      { name: '龙舌兰', amount: 45, unit: 'ml' },
      { name: '新鲜橙汁', amount: 120, unit: 'ml' },
      { name: '红石榴糖浆', amount: 15, unit: 'ml' }
    ],
    steps: [
      '高球杯装满冰块',
      '倒入龙舌兰和橙汁，搅拌',
      '缓慢沿杯壁倒入红石榴糖浆',
      '呈现日出色分层效果',
      '橙片和樱桃装饰'
    ],
    garnish: '橙片、马拉斯奇诺樱桃',
    description: '如同加勒比海上冉冉升起的朝阳，色彩绚丽。',
    tags: '墨西哥,日出,渐变,派对'
  },
  {
    slug: 'whiskey-sour',
    name: '威士忌酸',
    nameEn: 'Whiskey Sour',
    category: 'classic',
    glass: '古典杯',
    sweet: 5, sour: 8, bitter: 2, strong: 6,
    ingredients: [
      { name: '波本威士忌', amount: 60, unit: 'ml' },
      { name: '新鲜柠檬汁', amount: 30, unit: 'ml' },
      { name: '糖浆', amount: 15, unit: 'ml' },
      { name: '蛋清', amount: 1, unit: '个（可选）' }
    ],
    steps: [
      '所有材料（不加冰）干摇 10 秒起泡',
      '加入冰块再摇 10 秒',
      '滤入冰镇古典杯',
      '表面点几滴安格斯特拉苦精，划花',
      '柠檬皮和樱桃装饰'
    ],
    garnish: '柠檬皮、马拉斯奇诺樱桃',
    description: '酸甜平衡的经典，1862 年首版配方传承至今。',
    tags: '威士忌,酸,经典,丝绸'
  },
  {
    slug: 'manhattan',
    name: '曼哈顿',
    nameEn: 'Manhattan',
    category: 'classic',
    glass: '马天尼杯',
    sweet: 4, sour: 1, bitter: 7, strong: 8,
    ingredients: [
      { name: '黑麦威士忌', amount: 60, unit: 'ml' },
      { name: '甜味美思', amount: 30, unit: 'ml' },
      { name: '安格斯特拉苦精', amount: 2, unit: 'dash' }
    ],
    steps: [
      '搅拌杯加冰预冷',
      '加入所有材料，搅拌 30 秒',
      '滤入冰镇马天尼杯',
      '马拉斯奇诺樱桃装饰'
    ],
    garnish: '马拉斯奇诺樱桃',
    description: '纽约曼哈顿俱乐部出品，绅士的最爱。',
    tags: '纽约,威士忌,苦,优雅'
  },
  {
    slug: 'negroni',
    name: '内格罗尼',
    nameEn: 'Negroni',
    category: 'classic',
    glass: '古典杯',
    sweet: 3, sour: 2, bitter: 8, strong: 8,
    ingredients: [
      { name: '金酒', amount: 30, unit: 'ml' },
      { name: '金巴利', amount: 30, unit: 'ml' },
      { name: '甜味美思', amount: 30, unit: 'ml' }
    ],
    steps: [
      '古典杯中加入大冰块',
      '倒入所有材料',
      '搅拌 10 秒至冰透',
      '橙皮擦杯口挤出精油，丢入杯中'
    ],
    garnish: '橙皮',
    description: '意大利米兰的苦味传奇，三种烈酒完美平衡。',
    tags: '意大利,苦,金巴利,烈'
  },
  {
    slug: 'old-fashioned',
    name: '古典鸡尾酒',
    nameEn: 'Old Fashioned',
    category: 'classic',
    glass: '古典杯',
    sweet: 6, sour: 1, bitter: 6, strong: 8,
    ingredients: [
      { name: '波本威士忌', amount: 60, unit: 'ml' },
      { name: '方糖', amount: 1, unit: '块' },
      { name: '安格斯特拉苦精', amount: 3, unit: 'dash' },
      { name: '橙皮', amount: 1, unit: '片' }
    ],
    steps: [
      '方糖放入古典杯，加苦精浸润',
      '捣棒轻压方糖',
      '加入大冰块和威士忌',
      '搅拌 20 秒',
      '橙皮擦杯口装饰'
    ],
    garnish: '橙皮、马拉斯奇诺樱桃',
    description: '鸡尾酒之父，1880 年代威士忌的原始喝法。',
    tags: '威士忌,古典,苦,浓郁'
  },
  {
    slug: 'bloody-mary',
    name: '血腥玛丽',
    nameEn: 'Bloody Mary',
    category: 'classic',
    glass: '高球杯',
    sweet: 3, sour: 4, bitter: 3, strong: 5,
    ingredients: [
      { name: '伏特加', amount: 45, unit: 'ml' },
      { name: '番茄汁', amount: 120, unit: 'ml' },
      { name: '新鲜柠檬汁', amount: 15, unit: 'ml' },
      { name: '伍斯特酱', amount: 4, unit: 'dash' },
      { name: '塔巴斯科辣酱', amount: 3, unit: 'dash' },
      { name: '芹菜盐', amount: 1, unit: '撮' }
    ],
    steps: [
      '杯口用柠檬擦湿，蘸芹菜盐',
      '所有材料加入雪克壶加冰轻摇',
      '倒入高球杯',
      '插入芹菜梗和柠檬片'
    ],
    garnish: '芹菜梗、柠檬片、橄榄',
    description: '早午餐必备，咸鲜微辣带劲的解宿醉神器。',
    tags: '早午餐,咸,辣,番茄'
  },
  {
    slug: 'sidecar',
    name: '边车',
    nameEn: 'Sidecar',
    category: 'classic',
    glass: '马天尼杯',
    sweet: 5, sour: 5, bitter: 2, strong: 6,
    ingredients: [
      { name: '干邑白兰地', amount: 50, unit: 'ml' },
      { name: '君度橙酒', amount: 30, unit: 'ml' },
      { name: '新鲜柠檬汁', amount: 20, unit: 'ml' },
      { name: '细砂糖', amount: '适量', unit: '' }
    ],
    steps: [
      '杯口用柠檬擦湿，蘸细砂糖',
      '所有材料加入雪克壶加冰',
      '摇和后滤入杯中',
      '橙皮装饰'
    ],
    garnish: '橙皮或柠檬皮',
    description: '巴黎丽兹酒店的传奇，一战时摩托边车的命名。',
    tags: '法国,白兰地,酸甜'
  },
  {
    slug: 'dry-martini',
    name: '干马天尼',
    nameEn: 'Dry Martini',
    category: 'classic',
    glass: '马天尼杯',
    sweet: 1, sour: 1, bitter: 5, strong: 9,
    ingredients: [
      { name: '金酒', amount: 75, unit: 'ml' },
      { name: '干味美思', amount: 5, unit: 'ml' }
    ],
    steps: [
      '搅拌杯加满冰块预冷',
      '倒入金酒和味美思',
      '搅拌 30 秒至充分冰透',
      '滤入冰镇马天尼杯',
      '柠檬皮擦杯口装饰'
    ],
    garnish: '柠檬皮或橄榄',
    description: '极简主义的巅峰，纯粹金酒的力量。',
    tags: '烈性,极简,经典'
  },
  {
    slug: 'aviation',
    name: '飞行',
    nameEn: 'Aviation',
    category: 'classic',
    glass: '马天尼杯',
    sweet: 3, sour: 5, bitter: 4, strong: 7,
    ingredients: [
      { name: '金酒', amount: 45, unit: 'ml' },
      { name: '马拉斯加酸樱桃酒', amount: 15, unit: 'ml' },
      { name: '紫罗兰甜酒', amount: 7, unit: 'ml' },
      { name: '新鲜柠檬汁', amount: 22, unit: 'ml' }
    ],
    steps: [
      '所有材料加入雪克壶加冰',
      '用力摇和 12 秒',
      '双层过滤倒入冰镇马天尼杯',
      '马拉斯奇诺樱桃装饰'
    ],
    garnish: '马拉斯奇诺樱桃',
    description: '1916 年的飞行鸡尾酒，呈现天空的淡紫蓝色。',
    tags: '金酒,花香,复古'
  },
  {
    slug: 'godfather',
    name: '教父',
    nameEn: 'Godfather',
    category: 'classic',
    glass: '古典杯',
    sweet: 7, sour: 1, bitter: 4, strong: 7,
    ingredients: [
      { name: '苏格兰威士忌', amount: 45, unit: 'ml' },
      { name: '杏仁利口酒', amount: 22, unit: 'ml' }
    ],
    steps: [
      '古典杯加入大冰块',
      '倒入威士忌和杏仁利口酒',
      '搅拌均匀'
    ],
    garnish: '无',
    description: '1972 年同名电影上映后诞生，杏仁与泥煤的对话。',
    tags: '电影,杏仁,威士忌'
  },
  {
    slug: 'mimosa',
    name: '含羞草',
    nameEn: 'Mimosa',
    category: 'classic',
    glass: '香槟杯',
    sweet: 7, sour: 4, bitter: 1, strong: 3,
    ingredients: [
      { name: '干型香槟或起泡酒', amount: 75, unit: 'ml' },
      { name: '新鲜橙汁', amount: 75, unit: 'ml' }
    ],
    steps: [
      '香槟杯预冷',
      '先倒入橙汁',
      '缓慢倒入香槟',
      '不要搅拌，自然混合'
    ],
    garnish: '橙片',
    description: '早午餐的优雅标配，气泡与橙香的清晨舞曲。',
    tags: '早午餐,起泡,轻盈,庆典'
  },
  {
    slug: 'bellini',
    name: '贝里尼',
    nameEn: 'Bellini',
    category: 'classic',
    glass: '香槟杯',
    sweet: 8, sour: 2, bitter: 1, strong: 3,
    ingredients: [
      { name: '白桃果泥', amount: 30, unit: 'ml' },
      { name: '干型起泡酒', amount: 90, unit: 'ml' }
    ],
    steps: [
      '香槟杯预冷',
      '先倒入白桃果泥',
      '缓慢倒入起泡酒',
      '轻轻搅匀'
    ],
    garnish: '一片新鲜桃子',
    description: '威尼斯哈利酒吧 1948 年的发明，桃红气泡的浪漫。',
    tags: '意大利,桃子,起泡,浪漫'
  },
  {
    slug: 'daiquiri',
    name: '黛克瑞',
    nameEn: 'Daiquiri',
    category: 'classic',
    glass: '马天尼杯',
    sweet: 4, sour: 7, bitter: 1, strong: 6,
    ingredients: [
      { name: '白朗姆酒', amount: 60, unit: 'ml' },
      { name: '新鲜青柠汁', amount: 25, unit: 'ml' },
      { name: '糖浆', amount: 15, unit: 'ml' }
    ],
    steps: [
      '所有材料加入雪克壶加冰',
      '用力摇和 10 秒',
      '双层过滤倒入冰镇马天尼杯',
      '青柠片装饰'
    ],
    garnish: '青柠片',
    description: '海明威最爱的酸爽朗姆，简洁即是极致。',
    tags: '古巴,朗姆,酸,简洁'
  },
  {
    slug: 'white-russian',
    name: '白俄罗斯',
    nameEn: 'White Russian',
    category: 'classic',
    glass: '古典杯',
    sweet: 7, sour: 1, bitter: 3, strong: 5,
    ingredients: [
      { name: '伏特加', amount: 50, unit: 'ml' },
      { name: '咖啡利口酒', amount: 25, unit: 'ml' },
      { name: '淡奶油', amount: 25, unit: 'ml' }
    ],
    steps: [
      '古典杯加入大冰块',
      '倒入伏特加和咖啡利口酒',
      '缓慢倒入淡奶油浮在上层',
      '不搅拌直接饮用'
    ],
    garnish: '无',
    description: '《谋杀绿脚趾》主角的最爱，奶香与咖啡的醉人组合。',
    tags: '咖啡,奶油,甜,电影'
  },
  {
    slug: 'black-russian',
    name: '黑俄罗斯',
    nameEn: 'Black Russian',
    category: 'classic',
    glass: '古典杯',
    sweet: 6, sour: 1, bitter: 4, strong: 7,
    ingredients: [
      { name: '伏特加', amount: 50, unit: 'ml' },
      { name: '咖啡利口酒', amount: 25, unit: 'ml' }
    ],
    steps: [
      '古典杯加入大冰块',
      '倒入伏特加和咖啡利口酒',
      '搅拌均匀'
    ],
    garnish: '柠檬皮（可选）',
    description: '白俄罗斯的无奶版本，纯粹深邃。',
    tags: '咖啡,苦,烈'
  },
  {
    slug: 'screwdriver',
    name: '螺丝刀',
    nameEn: 'Screwdriver',
    category: 'classic',
    glass: '高球杯',
    sweet: 6, sour: 3, bitter: 1, strong: 5,
    ingredients: [
      { name: '伏特加', amount: 50, unit: 'ml' },
      { name: '新鲜橙汁', amount: 120, unit: 'ml' }
    ],
    steps: [
      '高球杯加满冰块',
      '倒入伏特加和橙汁',
      '搅拌均匀',
      '橙片装饰'
    ],
    garnish: '橙片',
    description: '据说调酒师用螺丝刀搅拌而得名，简单粗暴。',
    tags: '简单,橙汁,伏特加'
  },
  {
    slug: 'gin-tonic',
    name: '金汤力',
    nameEn: 'Gin & Tonic',
    category: 'classic',
    glass: '高球杯',
    sweet: 3, sour: 4, bitter: 5, strong: 5,
    ingredients: [
      { name: '金酒', amount: 50, unit: 'ml' },
      { name: '汤力水', amount: 150, unit: 'ml' },
      { name: '青柠角', amount: 1, unit: '块' }
    ],
    steps: [
      '高球杯装满大冰块',
      '挤入青柠角',
      '倒入金酒',
      '缓慢倒入汤力水',
      '轻柔搅拌一次'
    ],
    garnish: '青柠角',
    description: '英国殖民时代的疟疾预防药，如今的世界级经典。',
    tags: '英国,清爽,气泡,简单'
  },
  {
    slug: 'pina-colada',
    name: '椰林飘香',
    nameEn: 'Piña Colada',
    category: 'classic',
    glass: '飓风杯',
    sweet: 9, sour: 2, bitter: 0, strong: 4,
    ingredients: [
      { name: '白朗姆酒', amount: 50, unit: 'ml' },
      { name: '椰浆', amount: 60, unit: 'ml' },
      { name: '菠萝汁', amount: 90, unit: 'ml' },
      { name: '椰子奶油', amount: 15, unit: 'ml（可选）' }
    ],
    steps: [
      '所有材料加入搅拌机',
      '加入 1 杯碎冰',
      '高速搅拌至顺滑',
      '倒入飓风杯',
      '菠萝叶和樱桃装饰'
    ],
    garnish: '菠萝叶、马拉斯奇诺樱桃、菠萝角',
    description: '波多黎各的国饮，带你进入热带海滩。',
    tags: '热带,椰子,菠萝,甜'
  },
  {
    slug: 'cuba-libre',
    name: '自由古巴',
    nameEn: 'Cuba Libre',
    category: 'classic',
    glass: '高球杯',
    sweet: 7, sour: 2, bitter: 1, strong: 5,
    ingredients: [
      { name: '白朗姆酒', amount: 50, unit: 'ml' },
      { name: '可乐', amount: 120, unit: 'ml' },
      { name: '新鲜青柠汁', amount: 15, unit: 'ml' }
    ],
    steps: [
      '高球杯加入冰块和青柠角',
      '挤入青柠汁',
      '倒入朗姆酒',
      '用可乐补满',
      '搅拌均匀'
    ],
    garnish: '青柠角',
    description: '1900 年古巴独立后的欢庆之酒，可乐与朗姆的革命。',
    tags: '古巴,可乐,简单,派对'
  },
  {
    slug: 'tom-collins',
    name: '汤姆柯林斯',
    nameEn: 'Tom Collins',
    category: 'classic',
    glass: '高球杯',
    sweet: 5, sour: 6, bitter: 1, strong: 5,
    ingredients: [
      { name: '老汤姆金酒', amount: 45, unit: 'ml' },
      { name: '新鲜柠檬汁', amount: 25, unit: 'ml' },
      { name: '糖浆', amount: 15, unit: 'ml' },
      { name: '苏打水', amount: '适量', unit: '' }
    ],
    steps: [
      '高球杯加满冰块',
      '倒入金酒、柠檬汁和糖浆',
      '搅拌均匀',
      '用苏打水补满',
      '柠檬片和马拉斯奇诺樱桃装饰'
    ],
    garnish: '柠檬片、樱桃',
    description: '1876 年诞生，午后微醺的最佳搭档。',
    tags: '金酒,清爽,气泡,经典'
  }
]
