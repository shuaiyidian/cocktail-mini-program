/**
 * 特调配方 API
 */
import { request } from './request'
import type { Ingredient } from '../types/cocktail'

export interface IngredientItem {
  name: string
  category: string
  sweet: number
  sour: number
  bitter: number
  strong: number
  defaultAmount: number
}

export interface IngredientGroup {
  category: string
  label: string
  items: IngredientItem[]
}

export interface AnalysisResult {
  sweet: number
  sour: number
  bitter: number
  strong: number
  totalVolume: number
  recognizedCount: number
  unknownCount: number
  details: Array<{
    name: string
    amount: number
    category?: string
    contribution: { sweet: number; sour: number; bitter: number; strong: number }
    weight: number
    known: boolean
  }>
  dominant: Array<'sweet' | 'sour' | 'bitter' | 'strong'>
  warnings: string[]
}

export function getIngredientDict() {
  return request<{ data: IngredientGroup[]; total: number }>({ url: '/recipes/ingredients' })
}

export function analyzeRecipe(ingredients: Array<{ name: string; amount: number | string; unit?: string }>) {
  return request<{ data: AnalysisResult }>({
    url: '/recipes/analyze',
    method: 'POST',
    data: { ingredients }
  })
}

export interface CreateRecipeInput {
  name: string
  ingredients: Array<{ name: string; amount: number | string; unit?: string }>
  steps?: string[]
  note?: string
}

export function createRecipe(input: CreateRecipeInput, userId: string) {
  return request<{ data: any; analysis: AnalysisResult }>({
    url: '/recipes',
    method: 'POST',
    data: input,
    header: { 'x-user-id': userId }
  })
}

export function listRecipes(userId: string) {
  return request<{
    data: any[]
    pagination: { page: number; pageSize: number; total: number; totalPages: number }
  }>({ url: `/recipes?userId=${userId}` })
}

export function deleteRecipe(id: string, userId: string) {
  return request<{ data: { id: string; deleted: boolean } }>({
    url: `/recipes/${id}`,
    method: 'DELETE',
    header: { 'x-user-id': userId }
  })
}
