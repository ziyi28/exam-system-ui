import request from '@/utils/request'

// 分页查询题目
export const getQuestionList = (params) => request.get('/api/questions/list', { params })

// 题目详情
export const getQuestionById = (id) => request.get(`/api/questions/${id}`)

// 创建题目
export const createQuestion = (data) => request.post('/api/questions', data)

// 更新题目
export const updateQuestion = (id, data) => request.put(`/api/questions/${id}`, data)

// 删除题目
export const deleteQuestion = (id) => request.delete(`/api/questions/${id}`)

// 按分类查询
export const getQuestionsByCategory = (categoryId) => request.get(`/api/questions/category/${categoryId}`)

// 按难度查询
export const getQuestionsByDifficulty = (difficulty) => request.get(`/api/questions/difficulty/${difficulty}`)

// 随机题目
export const getRandomQuestions = (params) => request.get('/api/questions/random', { params })

// 热门题目
export const getPopularQuestions = (size = 6) => request.get('/api/questions/popular', { params: { size } })

// 刷新热门缓存
export const refreshPopularQuestions = () => request.post('/api/questions/popular/refresh')

// 下载导入模板
export const downloadTemplate = () => request.get('/api/questions/batch/template', { responseType: 'blob' })

// 预览Excel
export const previewExcel = (formData) => request.post('/api/questions/batch/preview-excel', formData)

// Excel导入
export const importFromExcel = (formData) => request.post('/api/questions/batch/import-excel', formData)

// AI生成题目
export const aiGenerateQuestions = (data) => request.post('/api/questions/batch/ai-generate', data)

// 批量导入题目
export const importQuestions = (data) => request.post('/api/questions/batch/import-questions', data)

// 验证题目
export const validateQuestions = (data) => request.post('/api/questions/batch/validate', data)
