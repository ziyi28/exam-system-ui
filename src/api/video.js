import request from '@/utils/request'

// 获取视频列表
export const getVideos = (params) => request.get('/api/videos', { params })

// 获取视频详情
export const getVideoDetail = (id) => request.get(`/api/videos/${id}`)

// 获取热门视频
export const getPopularVideos = (limit = 10) => request.get('/api/videos/popular', { params: { limit } })

// 获取最新视频
export const getLatestVideos = (limit = 10) => request.get('/api/videos/latest', { params: { limit } })

// 记录观看
export const recordVideoView = (videoId, viewDuration) => request.post(`/api/videos/${videoId}/view`, null, { params: { viewDuration } })

// 切换点赞
export const toggleVideoLike = (videoId) => request.post(`/api/videos/${videoId}/like`)

// 用户投稿
export const submitVideo = (formData) => request.post('/api/videos/submit', formData)
