import { get, post, put, del } from './request'
import type { Notice } from '@/types'

/** 公告 API（/api/notices） */

export function getActiveNotices() {
  return get<Notice[]>('/api/notices/active')
}

export function getLatestNotices(limit = 5) {
  return get<Notice[]>('/api/notices/latest', { limit })
}

/** 全部公告（仅管理员/教师） */
export function listNotices() {
  return get<Notice[]>('/api/notices/list')
}

export function getNotice(id: number) {
  return get<Notice>(`/api/notices/${id}`)
}

export function addNotice(data: Notice) {
  return post('/api/notices/add', data)
}

export function updateNotice(data: Notice) {
  return put('/api/notices/update', data)
}

export function deleteNotice(id: number) {
  return del(`/api/notices/delete/${id}`)
}

export function toggleNotice(id: number, isActive: boolean) {
  return put(`/api/notices/toggle/${id}?isActive=${isActive}`)
}
