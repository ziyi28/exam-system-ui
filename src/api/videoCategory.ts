import { get, post, put, del } from './request'
import type { VideoCategory } from '@/types'

/** 视频分类 API（/api/video-categories，查询登录即可，增删改仅管理员/教师） */

export function listVideoCategories() {
  return get<VideoCategory[]>('/api/video-categories')
}

export function getVideoCategoryTree() {
  return get<VideoCategory[]>('/api/video-categories/tree')
}

export function getTopVideoCategories() {
  return get<VideoCategory[]>('/api/video-categories/top')
}

export function addVideoCategory(data: VideoCategory) {
  return post('/api/video-categories', data)
}

export function updateVideoCategory(data: VideoCategory) {
  return put('/api/video-categories', data)
}

export function deleteVideoCategory(id: number) {
  return del(`/api/video-categories/${id}`)
}
