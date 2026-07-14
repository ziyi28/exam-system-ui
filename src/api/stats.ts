import { get } from './request'
import type { Stats } from '@/types'

/** 统计 API（/api/stats） */

/** 系统概览统计（仅管理员/教师） */
export function getOverview() {
  return get<Stats>('/api/stats/overview')
}
