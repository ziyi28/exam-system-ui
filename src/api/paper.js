import request from '@/utils/request'

// 获取试卷列表
export const listPapers = (params) => request.get('/api/papers/list', { params })

// 创建试卷
export const createPaper = (data) => request.post('/api/papers', data)

// 更新试卷
export const updatePaper = (id, data) => request.put(`/api/papers/${id}`, data)

// AI智能组卷
export const createPaperWithAI = (data) => request.post('/api/papers/ai', data)

// 获取试卷详情
export const getPaperById = (id) => request.get(`/api/papers/${id}`)

// 更新试卷状态
export const updatePaperStatus = (id, status) => request.post(`/api/papers/${id}/status`, null, { params: { status } })

// 删除试卷
export const deletePaper = (id) => request.delete(`/api/papers/${id}`)
