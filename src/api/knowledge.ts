import { get, post, del } from './request'
import type {
  KnowledgeBase,
  KnowledgeBaseCreateForm,
  KnowledgeDocument,
  RagAnswer,
  RagAnswerForm,
} from '@/types'

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

export function listKnowledgeDocuments(knowledgeBaseId: number) {
  return get<KnowledgeDocument[]>(`/api/ai/knowledge-bases/${knowledgeBaseId}/documents`)
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

export function retryKnowledgeDocument(id: number) {
  return post<KnowledgeDocument>(`/api/ai/documents/${id}/retry`)
}

export function deleteKnowledgeDocument(id: number) {
  return del(`/api/ai/documents/${id}`)
}

export function answerWithRag(data: RagAnswerForm) {
  return post<RagAnswer>('/api/ai/rag/answer', data)
}
