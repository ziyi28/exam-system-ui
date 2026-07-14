import { get, post } from './request'
import type { ExamRecord, SubmitAnswer } from '@/types'

/** 考试流程 API（/api/exams，登录即可） */

/** 开始考试：创建/返回进行中的考试记录（考生身份取自登录态） */
export function startExam(paperId: number) {
  return post<ExamRecord>('/api/exams/start', { paperId })
}

/** 提交答案（提交后后端自动触发批阅） */
export function submitAnswers(examRecordId: number, answers: SubmitAnswer[]) {
  return post(`/api/exams/${examRecordId}/submit`, answers)
}

/** 手动触发 AI 批阅 */
export function gradeExam(examRecordId: number) {
  return post<ExamRecord>(`/api/exams/${examRecordId}/grade`)
}

/** 考试记录详情（含试卷、题目与答题记录） */
export function getExamDetail(id: number) {
  return get<ExamRecord>(`/api/exams/${id}`)
}

/** 我的考试记录（学生本人 / 管理员教师全部） */
export function listMyRecords() {
  return get<ExamRecord[]>('/api/exams/records')
}

/** 上报切屏行为（考试中切出页面时调用） */
export function reportWindowSwitch(examRecordId: number) {
  return post(`/api/exams/${examRecordId}/window-switch`)
}
