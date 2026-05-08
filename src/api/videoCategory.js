import request from '@/utils/request'

// 获取分类列表
export const getVideoCategories = () => request.get('/api/video-categories')

// 获取分类树
export const getVideoCategoryTree = () => request.get('/api/video-categories/tree')

// 获取顶级分类
export const getTopVideoCategories = () => request.get('/api/video-categories/top')

// 获取子分类
export const getChildVideoCategories = (parentId) => request.get(`/api/video-categories/children/${parentId}`)

// 获取分类详情
export const getVideoCategoryById = (id) => request.get(`/api/video-categories/${id}`)

// 添加分类
export const addVideoCategory = (data) => request.post('/api/video-categories', data)

// 更新分类
export const updateVideoCategory = (data) => request.put('/api/video-categories', data)

// 删除分类
export const deleteVideoCategory = (id) => request.delete(`/api/video-categories/${id}`)
