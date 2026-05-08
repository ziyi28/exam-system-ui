import request from '@/utils/request'

// 管理端获取视频列表
export const getVideosForAdmin = (params) => request.get('/api/admin/videos', { params })

// 管理员上传视频
export const uploadVideoByAdmin = (formData) => request.post('/api/admin/videos/upload', formData)

// 审核视频
export const auditVideo = (videoId, status, reason) => request.post(`/api/admin/videos/${videoId}/audit`, null, { params: { status, reason } })

// 下架视频
export const offlineVideo = (videoId) => request.post(`/api/admin/videos/${videoId}/offline`)

// 删除视频
export const deleteVideo = (videoId) => request.delete(`/api/admin/videos/${videoId}`)

// 获取视频统计
export const getVideoStatistics = () => request.get('/api/admin/videos/statistics')

// 获取视频详细统计
export const getVideoDetailStats = (videoId, days = 30) => request.get(`/api/admin/videos/${videoId}/stats`, { params: { days } })
