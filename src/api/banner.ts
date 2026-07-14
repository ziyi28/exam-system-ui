import { get, post, put, del } from './request'
import type { Banner } from '@/types'

/** 轮播图 API（/api/banners） */

export function getActiveBanners() {
  return get<Banner[]>('/api/banners/active')
}

/** 全部轮播图（仅管理员/教师） */
export function listBanners() {
  return get<Banner[]>('/api/banners/list')
}

export function uploadBannerImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return post<string>('/api/banners/upload-image', formData)
}

export function addBanner(data: Banner) {
  return post('/api/banners/add', data)
}

export function updateBanner(data: Banner) {
  return put('/api/banners/update', data)
}

export function deleteBanner(id: number) {
  return del(`/api/banners/delete/${id}`)
}

export function toggleBanner(id: number, isActive: boolean) {
  return put(`/api/banners/toggle/${id}?isActive=${isActive}`)
}
