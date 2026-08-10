/**
 * 鸡尾酒相关 API
 */
import { request } from './request'
import type { Cocktail, PaginatedResponse, TasteProfile } from '../types/cocktail'

export interface ListParams {
  page?: number
  pageSize?: number
  category?: string
  search?: string
  isClassic?: boolean
}

export function listCocktails(params: ListParams = {}) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.pageSize) qs.set('pageSize', String(params.pageSize))
  if (params.category) qs.set('category', params.category)
  if (params.search) qs.set('search', params.search)
  if (params.isClassic !== undefined) qs.set('isClassic', String(params.isClassic))
  const q = qs.toString() ? `?${qs.toString()}` : ''
  return request<PaginatedResponse<Cocktail>>({ url: `/cocktails${q}` })
}

export function getCocktail(idOrSlug: string) {
  return request<{ data: Cocktail }>({ url: `/cocktails/${idOrSlug}` })
}

export interface RecommendParams extends TasteProfile {
  limit?: number
}

export function recommendCocktails(params: RecommendParams) {
  return request<{ data: (Cocktail & { matchScore: number })[]; query: TasteProfile }>({
    url: '/cocktails/recommend',
    method: 'POST',
    data: params
  })
}
