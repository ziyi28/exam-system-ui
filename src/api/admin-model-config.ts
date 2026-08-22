import { get, post, put, del } from './request'
import type {
  ModelProvider,
  ModelProviderCreateRequest,
  ModelProviderUpdateRequest,
  ModelCapabilityGroup,
  ModelCapabilityDraftRequest,
  ModelCapabilityConfig,
  ModelConfigTestResponse,
  ModelConfigAudit,
  AiEmbeddingReindexRun,
  AiEmbeddingReindexItem,
} from '@/types/admin-model-config'

export function listModelProviders() {
  return get<ModelProvider[]>('/api/admin/model-config/providers')
}

export function createModelProvider(data: ModelProviderCreateRequest) {
  return post<ModelProvider>('/api/admin/model-config/providers', data)
}

export function updateModelProvider(id: string, data: ModelProviderUpdateRequest) {
  return put<ModelProvider>(`/api/admin/model-config/providers/${id}`, data)
}

export function deleteModelProvider(id: string) {
  return del<void>(`/api/admin/model-config/providers/${id}`)
}

export function listCapabilityConfigs() {
  return get<ModelCapabilityGroup[]>('/api/admin/model-config/capabilities')
}

export function saveCapabilityDraft(capability: string, data: ModelCapabilityDraftRequest) {
  return put<ModelCapabilityConfig>(`/api/admin/model-config/capabilities/${capability}/draft`, data)
}

export function testCapabilityConfig(configId: string) {
  return post<ModelConfigTestResponse>(`/api/admin/model-config/configs/${configId}/test`)
}

export function activateCapabilityConfig(configId: string) {
  return post<ModelCapabilityConfig>(`/api/admin/model-config/configs/${configId}/activate`)
}

export function listModelConfigAudits(params?: { limit?: number; offset?: number }) {
  return get<ModelConfigAudit[]>('/api/admin/model-config/audit', params)
}

// ==================== Embedding 重建管理 ====================

export function startEmbeddingReindex(targetConfigId: string) {
  return post<AiEmbeddingReindexRun>('/api/admin/model-config/reindex/start', { targetConfigId })
}

export function listReindexRuns() {
  return get<AiEmbeddingReindexRun[]>('/api/admin/model-config/reindex/runs')
}

export function getReindexRun(runId: number) {
  return get<AiEmbeddingReindexRun>(`/api/admin/model-config/reindex/runs/${runId}`)
}

export function listReindexRunItems(runId: number) {
  return get<AiEmbeddingReindexItem[]>(`/api/admin/model-config/reindex/runs/${runId}/items`)
}

export function activateReindexRun(runId: number) {
  return post<void>(`/api/admin/model-config/reindex/runs/${runId}/activate`)
}

export function abortReindexRun(runId: number) {
  return post<void>(`/api/admin/model-config/reindex/runs/${runId}/abort`)
}

export function retryReindexRun(runId: number) {
  return post<void>(`/api/admin/model-config/reindex/runs/${runId}/retry`)
}
