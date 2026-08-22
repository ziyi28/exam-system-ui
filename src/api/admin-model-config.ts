import { get, post, put } from './request'
import type {
  ModelProvider,
  ModelProviderCreateRequest,
  ModelProviderUpdateRequest,
  ModelCapabilityGroup,
  ModelCapabilityDraftRequest,
  ModelCapabilityConfig,
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

export function updateModelProviderApiKey(id: string, apiKey: string) {
  return put<void>(`/api/admin/model-config/providers/${id}/api-key`, { api_key: apiKey })
}

export function disableModelProvider(id: string) {
  return post<void>(`/api/admin/model-config/providers/${id}/disable`)
}

export function enableModelProvider(id: string) {
  return post<void>(`/api/admin/model-config/providers/${id}/enable`)
}

export function listCapabilityConfigs() {
  return get<ModelCapabilityGroup[]>('/api/admin/model-config/capabilities')
}

export function saveCapabilityDraft(capability: string, data: ModelCapabilityDraftRequest) {
  return post<ModelCapabilityConfig>(`/api/admin/model-config/capabilities/${capability}/drafts`, data)
}

export function testCapabilityConfig(configId: string) {
  return post<ModelCapabilityConfig>(`/api/admin/model-config/capability-configs/${configId}/test`)
}

export function activateCapabilityConfig(configId: string) {
  return post<ModelCapabilityConfig>(`/api/admin/model-config/capability-configs/${configId}/activate`)
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
