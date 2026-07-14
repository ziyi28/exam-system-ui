import { get, post, put, del } from './request'
import type { AiPaperForm, Paper, PaperForm } from '@/types'

/** 试卷管理 API（/api/papers） */

/** 试卷列表：学生只会返回已发布试卷 */
export function listPapers(params?: { name?: string; status?: string }) {
  return get<Paper[]>('/api/papers/list', params)
}

/** 试卷详情（含题目与答案，仅管理员/教师） */
export function getPaperDetail(id: number) {
  return get<Paper>(`/api/papers/${id}`)
}

export function createPaper(data: PaperForm) {
  return post<Paper>('/api/papers', data)
}

export function updatePaper(id: number, data: PaperForm) {
  return put<Paper>(`/api/papers/${id}`, data)
}

export function createPaperWithAI(data: AiPaperForm) {
  return post<Paper>('/api/papers/ai', data)
}

export function updatePaperStatus(id: number, status: 'PUBLISHED' | 'STOPPED') {
  return post(`/api/papers/${id}/status?status=${status}`)
}

export function deletePaper(id: number) {
  return del(`/api/papers/${id}`)
}
