import request from '@/utils/request'

// 获取启用的公告（前台）
export const getActiveNotices = () => request.get('/api/notices/active')

// 获取最新公告
export const getLatestNotices = (limit = 5) => request.get('/api/notices/latest', { params: { limit } })

// 获取所有公告（后台）
export const getAllNotices = () => request.get('/api/notices/list')

// 获取公告详情
export const getNoticeById = (id) => request.get(`/api/notices/${id}`)

// 添加公告
export const addNotice = (data) => request.post('/api/notices/add', data)

// 更新公告
export const updateNotice = (data) => request.put('/api/notices/update', data)

// 删除公告
export const deleteNotice = (id) => request.delete(`/api/notices/delete/${id}`)

// 切换公告状态
export const toggleNoticeStatus = (id, isActive) => request.put(`/api/notices/toggle/${id}`, null, { params: { isActive } })
