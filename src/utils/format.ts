/**
 * 展示格式化工具 - 题型/难度/状态的文案与标签色，多个页面共用
 */

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

export function typeText(type?: string, multi?: boolean): string {
  if (type === 'CHOICE') return multi ? '多选题' : '单选题'
  if (type === 'JUDGE') return '判断题'
  if (type === 'TEXT') return '简答题'
  return type ?? '-'
}

export function typeTag(type?: string): TagType {
  if (type === 'CHOICE') return 'primary'
  if (type === 'JUDGE') return 'success'
  if (type === 'TEXT') return 'warning'
  return 'info'
}

export function difficultyText(difficulty?: string): string {
  return { EASY: '简单', MEDIUM: '中等', HARD: '困难' }[difficulty ?? ''] ?? difficulty ?? '-'
}

export function difficultyTag(difficulty?: string): TagType {
  return ({ EASY: 'success', MEDIUM: 'warning', HARD: 'danger' }[difficulty ?? ''] ?? 'info') as TagType
}

export function paperStatusText(status?: string): string {
  return { DRAFT: '草稿', PUBLISHED: '已发布', STOPPED: '已停用' }[status ?? ''] ?? status ?? '-'
}

export function paperStatusTag(status?: string): TagType {
  return ({ DRAFT: 'info', PUBLISHED: 'success', STOPPED: 'danger' }[status ?? ''] ?? 'info') as TagType
}

export function examStatusTag(status?: string): TagType {
  return ({ 进行中: 'warning', 已完成: 'primary', 已批阅: 'success' }[status ?? ''] ?? 'info') as TagType
}

/** 选项序号转字母：0 -> A */
export function letter(index: number): string {
  return String.fromCharCode(65 + index)
}

/** 秒数转 mm:ss / hh:mm:ss */
export function formatDuration(seconds?: number): string {
  if (seconds == null) return '-'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** 视频状态：与后端 Video 常量对应 */
export function videoStatusText(status?: number): string {
  return { 0: '待审核', 1: '已发布', 2: '已拒绝', 3: '已下架' }[status ?? -1] ?? '-'
}

export function videoStatusTag(status?: number): TagType {
  return ({ 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }[status ?? -1] ?? 'info') as TagType
}
