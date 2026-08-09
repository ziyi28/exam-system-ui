import { get, post, del } from './request'
import type { MpPage, Video } from '@/types'

/** 管理端视频 API（/api/admin/videos，仅管理员/教师） */

export function pageVideosForAdmin(params: {
  page?: number
  size?: number
  status?: number
  uploaderType?: number
  keyword?: string
}) {
  return get<MpPage<Video>>('/api/admin/videos', params)
}

/** 管理员上传视频（直接发布）；onProgress 上报“浏览器→服务器”的上传百分比 */
export function uploadVideo(
  data: {
    title: string
    description?: string
    categoryId: number
    tags?: string
    uploaderName: string
    duration?: number
    videoFile: File
    coverFile?: File
  },
  onProgress?: (percent: number) => void,
) {
  const formData = new FormData()
  formData.append('title', data.title)
  if (data.description) formData.append('description', data.description)
  formData.append('categoryId', String(data.categoryId))
  if (data.tags) formData.append('tags', data.tags)
  formData.append('uploaderName', data.uploaderName)
  if (data.duration != null) formData.append('duration', String(data.duration))
  formData.append('videoFile', data.videoFile)
  if (data.coverFile) formData.append('coverFile', data.coverFile)
  // 大视频上传：关闭超时（覆盖全局 120s），并上报上传进度
  return post('/api/admin/videos/upload', formData, {
    timeout: 0,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  })
}

/** 审核视频：status 1-通过 2-拒绝，拒绝时需填 reason */
export function auditVideo(videoId: number, status: 1 | 2, reason?: string) {
  const params = new URLSearchParams({ status: String(status) })
  if (reason) params.set('reason', reason)
  return post(`/api/admin/videos/${videoId}/audit?${params.toString()}`)
}

export function offlineVideo(videoId: number) {
  return post(`/api/admin/videos/${videoId}/offline`)
}

export function deleteVideo(videoId: number) {
  return del(`/api/admin/videos/${videoId}`)
}

/** 视频统计（仪表盘用） */
export function getVideoStatistics() {
  return get<Record<string, number>>('/api/admin/videos/statistics')
}
