import { get, post, put, del } from './request'
import type {
  KnowledgeBase,
  KnowledgeBaseCreateForm,
  KnowledgeDocument,
  KnowledgeDocumentPreview,
  RagAnswer,
  RagAnswerForm,
  StudentKnowledgeBase,
} from '@/types'

const STUDENT_API_CONFIG = { suppressGlobalError: true }

/** AI 知识库与 RAG API（仅管理员/教师） */

export function listKnowledgeBases() {
  return get<KnowledgeBase[]>('/api/ai/knowledge-bases')
}

export function createKnowledgeBase(data: KnowledgeBaseCreateForm) {
  return post<KnowledgeBase>('/api/ai/knowledge-bases', data)
}

export function deleteKnowledgeBase(id: number) {
  return del(`/api/ai/knowledge-bases/${id}`)
}

export function updateKnowledgeBasePublication(id: number, published: boolean) {
  return put<KnowledgeBase>(`/api/ai/knowledge-bases/${id}/publication`, { published })
}

export function listKnowledgeDocuments(knowledgeBaseId: number) {
  return get<KnowledgeDocument[]>(`/api/ai/knowledge-bases/${knowledgeBaseId}/documents`)
}

export function previewKnowledgeDocument(knowledgeBaseId: number, documentId: number, page = 1, pageSize = 20) {
  return get<KnowledgeDocumentPreview>(
    `/api/ai/knowledge-bases/${knowledgeBaseId}/documents/${documentId}/preview`,
    { page, pageSize },
  )
}

export function uploadKnowledgeDocument(
  knowledgeBaseId: number,
  file: File,
  onProgress?: (percent: number) => void,
) {
  const formData = new FormData()
  formData.append('file', file)
  return post<KnowledgeDocument>(`/api/ai/knowledge-bases/${knowledgeBaseId}/documents`, formData, {
    timeout: 0,
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total))
      }
    },
  })
}

export function retryKnowledgeDocument(id: number, force = false) {
  const suffix = force ? '?force=true' : ''
  return post<KnowledgeDocument>(`/api/ai/documents/${id}/retry${suffix}`)
}

export function deleteKnowledgeDocument(id: number) {
  return del(`/api/ai/documents/${id}`)
}

export function answerWithRag(data: RagAnswerForm) {
  return post<RagAnswer>('/api/ai/rag/answer', data)
}

/** 学生端仅能访问已发布的知识库，考试进行中由后端返回 403。 */

export function listStudentKnowledgeBases() {
  return get<StudentKnowledgeBase[]>('/api/ai/student/knowledge-bases', undefined, STUDENT_API_CONFIG)
}

export function listStudentKnowledgeDocuments(knowledgeBaseId: number) {
  return get<KnowledgeDocument[]>(
    `/api/ai/student/knowledge-bases/${knowledgeBaseId}/documents`,
    undefined,
    STUDENT_API_CONFIG,
  )
}

export function previewStudentKnowledgeDocument(knowledgeBaseId: number, documentId: number, page = 1, pageSize = 20) {
  return get<KnowledgeDocumentPreview>(
    `/api/ai/student/knowledge-bases/${knowledgeBaseId}/documents/${documentId}/preview`,
    { page, pageSize },
    STUDENT_API_CONFIG,
  )
}

export function answerWithStudentRag(data: RagAnswerForm) {
  return post<RagAnswer>('/api/ai/student/rag/answer', data, STUDENT_API_CONFIG)
}
