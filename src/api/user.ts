import { get, post, put, del } from './request'
import type { LoginUser, PageResult, User } from '@/types'

/** 用户认证与用户管理 API（/api/user） */

export function login(data: { username: string; password: string }) {
  return post<LoginUser>('/api/user/login', data)
}

export function register(data: { username: string; password: string; realName: string }) {
  return post('/api/user/register', data)
}

export function getUserInfo() {
  return get<LoginUser>('/api/user/info')
}

export function logout() {
  return post('/api/user/logout')
}

export function updatePassword(data: { oldPassword: string; newPassword: string }) {
  return put('/api/user/password', data)
}

// ---- 以下为管理员接口 ----

export function pageUsers(params: {
  current: number
  size: number
  username?: string
  realName?: string
  role?: string
  status?: string
}) {
  return get<PageResult<User>>('/api/user/list', params)
}

export function addUser(data: Partial<User>) {
  return post('/api/user', data)
}

export function updateUser(id: number, data: Partial<User>) {
  return put(`/api/user/${id}`, data)
}

export function deleteUser(id: number) {
  return del(`/api/user/${id}`)
}

export function toggleUserStatus(id: number) {
  return put(`/api/user/${id}/status`)
}

export function resetUserPassword(id: number) {
  return put(`/api/user/${id}/reset-password`)
}
