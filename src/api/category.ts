import { get, post, put, del } from './request'
import type { Category } from '@/types'

/** 题目分类 API（/api/categories，仅管理员/教师） */

export function listCategories() {
  return get<Category[]>('/api/categories')
}

export function getCategoryTree() {
  return get<Category[]>('/api/categories/tree')
}

export function addCategory(data: Category) {
  return post('/api/categories', data)
}

export function updateCategory(data: Category) {
  return put('/api/categories', data)
}

export function deleteCategory(id: number) {
  return del(`/api/categories/${id}`)
}
