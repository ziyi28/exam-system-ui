import request from '@/utils/request'

// 获取系统统计数据
export const getSystemStats = () => request.get('/api/stats/overview')

// 测试数据库连接
export const testDatabase = () => request.get('/api/stats/test')
