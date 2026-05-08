import request from '@/utils/request'

// 分页查询考试记录
export const getExamRecords = (params) => request.get('/api/exam-records/list', { params })

// 获取考试记录详情
export const getExamRecordDetail = (id) => request.get(`/api/exam-records/${id}`)

// 删除考试记录
export const deleteExamRecord = (id) => request.delete(`/api/exam-records/${id}`)

// 获取考试排行榜
export const getExamRanking = (params) => request.get('/api/exam-records/ranking', { params })
