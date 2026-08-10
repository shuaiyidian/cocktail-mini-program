// 共享类型：与后端 DTO 对齐
// 修改后端时务必同步此文件

export interface Ingredient {
  name: string
  amount: number | string
  unit: string
}

export interface Cocktail {
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
  ingredients: Ingredient[]
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
  /** 推荐接口扩展字段 */
  matchScore?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface TasteProfile {
  sweet: number
  sour: number
  bitter: number
  strong: number
}
