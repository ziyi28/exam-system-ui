import request from '@/utils/request'

// 获取启用的轮播图（前台）
export const getActiveBanners = () => request.get('/api/banners/active')

// 获取所有轮播图（后台）
export const getAllBanners = () => request.get('/api/banners/list')

// 获取轮播图详情
export const getBannerById = (id) => request.get(`/api/banners/${id}`)

// 上传轮播图图片
export const uploadBannerImage = (formData) => request.post('/api/banners/upload-image', formData)

// 添加轮播图
export const addBanner = (data) => request.post('/api/banners/add', data)

// 更新轮播图
export const updateBanner = (data) => request.put('/api/banners/update', data)

// 删除轮播图
export const deleteBanner = (id) => request.delete(`/api/banners/delete/${id}`)

// 切换轮播图状态
export const toggleBannerStatus = (id, isActive) => request.put(`/api/banners/toggle/${id}`, null, { params: { isActive } })
