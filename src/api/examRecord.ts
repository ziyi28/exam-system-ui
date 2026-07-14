import { get, del } from './request'
import type { ExamRanking, ExamRecord, MpPage } from '@/types'

/** 考试记录管理 API（/api/exam-records） */

/** 分页查询考试记录（学生自动限定本人） */
export function pageExamRecords(params: {
  page?: number
  size?: number
  studentName?: string
  /** 0 进行中 / 1 已完成 / 2 已批阅 */
  status?: number
  startDate?: string
  endDate?: string
}) {
  return get<MpPage<ExamRecord>>('/api/exam-records/list', params)
}

/** 考试记录详情（学生仅本人） */
export function getExamRecordDetail(id: number) {
  return get<ExamRecord>(`/api/exam-records/${id}`)
}

/** 删除考试记录（仅管理员/教师） */
export function deleteExamRecord(id: number) {
  return del(`/api/exam-records/${id}`)
}

/** 考试排行榜 */
export function getRanking(params?: { paperId?: number; limit?: number }) {
  return get<ExamRanking[]>('/api/exam-records/ranking', params)
}
