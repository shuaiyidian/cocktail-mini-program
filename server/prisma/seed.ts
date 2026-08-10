/**
 * Prisma seed 脚本：填充经典鸡尾酒数据
 * 运行：pnpm prisma:seed
 */
import { PrismaClient } from '@prisma/client'
import { CLASSIC_COCKTAILS } from '../src/data/classicCocktails'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始填充经典鸡尾酒种子数据...')

  // 清空已有的经典款（保留用户自定义）
  await prisma.cocktail.deleteMany({
    where: { isClassic: true }
  })

  let inserted = 0
  for (const c of CLASSIC_COCKTAILS) {
    await prisma.cocktail.create({
      data: {
        slug: c.slug,
        name: c.name,
        nameEn: c.nameEn,
        category: c.category,
        glass: c.glass,
        sweet: c.sweet,
        sour: c.sour,
        bitter: c.bitter,
        strong: c.strong,
        ingredients: JSON.stringify(c.ingredients),
        steps: JSON.stringify(c.steps),
        garnish: c.garnish,
        description: c.description,
        tags: c.tags,
        isClassic: true,
        isPublic: true
      }
    })
    inserted++
    console.log(`  ✓ ${c.name} (${c.nameEn}) - 甜${c.sweet} 酸${c.sour} 苦${c.bitter} 烈${c.strong}`)
  }

  // 会员套餐（M5 准备，先放数据）
  const planCount = await prisma.memberPlan.count()
  if (planCount === 0) {
    await prisma.memberPlan.createMany({
      data: [
        {
          name: '体验月卡',
          tier: 'pro',
          priceCents: 1900,
          durationDays: 30,
          benefits: JSON.stringify(['解锁全部经典鸡尾酒配方', '解锁特调酸甜苦烈分析', '云端保存自定义酒单']),
          sortOrder: 1,
          isActive: true
        },
        {
          name: '年度会员',
          tier: 'svip',
          priceCents: 18800,
          durationDays: 365,
          benefits: JSON.stringify(['月卡所有权益', '专属客服', '每月新配方推送', '无限自定义酒单']),
          sortOrder: 2,
          isActive: true
        }
      ]
    })
    console.log(`  ✓ 会员套餐 (2 套)`)
  }

  console.log(`\n🎉 种子完成：插入 ${inserted} 款经典鸡尾酒`)
}

main()
  .catch((e) => {
    console.error('❌ seed 失败：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
