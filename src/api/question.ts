import { get, post, put, del } from './request'
import type { MpPage, Question } from '@/types'

/** 题库管理 API（/api/questions，仅管理员/教师） */

export function pageQuestions(params: {
  page?: number
  size?: number
  categoryId?: number
  difficulty?: string
  type?: string
  keyword?: string
}) {
  return get<MpPage<Question>>('/api/questions/list', params)
}

export function getQuestion(id: number) {
  return get<Question>(`/api/questions/${id}`)
}

export function createQuestion(data: Question) {
  return post<Question>('/api/questions', data)
}

export function updateQuestion(id: number, data: Question) {
  return put<Question>(`/api/questions/${id}`, data)
}

export function deleteQuestion(id: number) {
  return del(`/api/questions/${id}`)
}

export function getPopularQuestions(limit = 10) {
  return get<Question[]>('/api/questions/popular', { limit })
}
