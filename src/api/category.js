import request from '@/utils/request'

// 获取分类列表（含题目数量）
export const getCategories = () => request.get('/api/categories')

// 获取分类树形结构
export const getCategoryTree = () => request.get('/api/categories/tree')

// 添加分类
export const addCategory = (data) => request.post('/api/categories', data)

// 更新分类
export const updateCategory = (data) => request.put('/api/categories', data)

// 删除分类
export const deleteCategory = (id) => request.delete(`/api/categories/${id}`)
