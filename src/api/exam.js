import request from '@/utils/request'

// 开始考试
export const startExam = (data) => request.post('/api/exams/start', data)

// 提交答案
export const submitAnswers = (examRecordId, answers) => request.post(`/api/exams/${examRecordId}/submit`, answers)

// AI批阅
export const gradeExam = (examRecordId) => request.post(`/api/exams/${examRecordId}/grade`)

// 获取考试记录详情
export const getExamRecordById = (id) => request.get(`/api/exams/${id}`)

// 获取考试记录列表
export const getMyRecords = () => request.get('/api/exams/records')
