/**
 * 鸡尾酒扩展 API
 * - createCocktail: 用户从推荐结果一键保存
 */
import { request } from './request'
import type { Cocktail, Ingredient } from '../types/cocktail'

export interface CreateCocktailInput {
  name: string
  nameEn?: string
  category?: string
  glass?: string
  sweet: number
  sour: number
  bitter: number
  strong: number
  ingredients: Ingredient[]
  steps: string[]
  garnish?: string
  description?: string
  tags?: string
  isPublic?: boolean
}

export function createCocktail(input: CreateCocktailInput) {
  return request<{ data: Cocktail }>({
    url: '/cocktails',
    method: 'POST',
    data: input
  })
}

export function deleteCocktailById(idOrSlug: string) {
  return request<{ data: { id: string; deleted: boolean } }>({
    url: `/cocktails/${idOrSlug}`,
    method: 'DELETE'
  })
}
