import { instance, post } from './request'
import type { AiGenerateForm, Question } from '@/types'

/** 题目批量操作 API（/api/questions/batch，仅管理员/教师） */

/** 下载 Excel 导入模板（文件流） */
export async function downloadTemplate() {
  const response = await instance.get('/api/questions/batch/template', { responseType: 'blob' })
  const blob = new Blob([response.data])
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '题目导入模板.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}

/** 上传 Excel 预览解析结果（不入库） */
export function previewExcel(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return post<Question[]>('/api/questions/batch/preview-excel', formData)
}

/** AI 智能生成题目（预览，不入库） */
export function aiGenerate(data: AiGenerateForm) {
  return post<Question[]>('/api/questions/batch/ai-generate', data)
}

/** 确认批量导入题目 */
export function importQuestions(questions: Question[]) {
  return post<{ successCount?: number; failCount?: number; total?: number }>(
    '/api/questions/batch/import-questions',
    questions,
  )
}
