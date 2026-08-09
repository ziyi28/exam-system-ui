import { get, post } from './request'
import type { MpPage, Video } from '@/types'

/** 用户端视频 API（/api/videos，登录即可） */

export function pageVideos(params: {
  page?: number
  size?: number
  categoryId?: number
  keyword?: string
}) {
  return get<MpPage<Video>>('/api/videos', params)
}

export function getVideoDetail(id: number) {
  return get<Video>(`/api/videos/${id}`)
}

export function getPopularVideos(limit = 6) {
  return get<Video[]>('/api/videos/popular', { limit })
}

export function getLatestVideos(limit = 6) {
  return get<Video[]>('/api/videos/latest', { limit })
}

/** 上报观看记录 */
export function recordView(videoId: number, viewDuration: number) {
  return post(`/api/videos/${videoId}/view?viewDuration=${viewDuration}`)
}

/** 切换点赞状态 */
export function toggleLike(videoId: number) {
  return post<{ isLiked: boolean; message: string }>(`/api/videos/${videoId}/like`)
}

/** 用户投稿视频（上传者信息取自登录态）；onProgress 上报“浏览器→服务器”的上传百分比 */
export function submitVideo(
  data: {
    title: string
    description?: string
    categoryId: number
    tags?: string
    duration: number
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
  formData.append('duration', String(data.duration))
  formData.append('videoFile', data.videoFile)
  if (data.coverFile) formData.append('coverFile', data.coverFile)
  // 大视频上传：关闭超时（覆盖全局 120s），并上报上传进度
  return post<{ success: boolean; message: string; videoId?: number }>('/api/videos/submit', formData, {
    timeout: 0,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  })
}
