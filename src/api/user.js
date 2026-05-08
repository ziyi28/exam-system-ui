import request from '@/utils/request'

// 用户登录
export const login = (data) => request.post('/api/user/login', data)

// 检查管理员权限
export const checkAdmin = (userId) => request.get(`/api/user/check-admin/${userId}`)
