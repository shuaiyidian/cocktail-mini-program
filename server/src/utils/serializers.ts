/**
 * 数据库行 → API 响应 DTO
 * 解析 SQLite 中以 String 存储的 JSON 字段
 */
import type { Cocktail as DbCocktail, CustomRecipe as DbCustomRecipe } from '@prisma/client'

function safeParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

export interface CocktailDTO {
  id: string
  slug: string
  name: string
  nameEn: string | null
  category: string
  glass: string | null
  sweet: number
  sour: number
  bitter: number
  strong: number
  ingredients: any[]
  steps: string[]
  garnish: string | null
  description: string | null
  tags: string[]
  image: string | null
  isClassic: boolean
  isPublic: boolean
  ownerId: string | null
  createdAt: string
  updatedAt: string
}

export function toCocktailDTO(row: DbCocktail): CocktailDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameEn: row.nameEn,
    category: row.category,
    glass: row.glass,
    sweet: row.sweet,
    sour: row.sour,
    bitter: row.bitter,
    strong: row.strong,
    ingredients: safeParse<any[]>(row.ingredients, []),
    steps: safeParse<string[]>(row.steps, []),
    garnish: row.garnish,
    description: row.description,
    tags: row.tags ? row.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    image: row.image,
    isClassic: row.isClassic,
    isPublic: row.isPublic,
    ownerId: row.ownerId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

export interface CustomRecipeDTO {
  id: string
  name: string
  ingredients: any[]
  steps: string[]
  sweet: number
  sour: number
  bitter: number
  strong: number
  note: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

export function toCustomRecipeDTO(row: DbCustomRecipe): CustomRecipeDTO {
  return {
    id: row.id,
    name: row.name,
    ingredients: safeParse<any[]>(row.ingredients, []),
    steps: safeParse<string[]>(row.steps, []),
    sweet: row.sweet,
    sour: row.sour,
    bitter: row.bitter,
    strong: row.strong,
    note: row.note,
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}
