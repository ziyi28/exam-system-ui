export type ModelProviderType = 'OPENAI_COMPATIBLE' | 'MINERU'

export type ModelCapability =
  | 'QUESTION_GENERATION'
  | 'SUBJECTIVE_GRADING'
  | 'EXAM_SUMMARY'
  | 'RAG_CHAT'
  | 'RAG_EMBEDDING'
  | 'DOCUMENT_PARSING'

export type ModelConfigState = 'ACTIVE' | 'DRAFT' | 'RETIRED'

export type ModelConfigTestStatus = 'NOT_TESTED' | 'PASSED' | 'FAILED'

export interface ModelProvider {
  id: string
  name: string
  provider_type: ModelProviderType
  base_url: string
  enabled: boolean
  api_key_configured: boolean
  created_by?: string
  updated_by?: string
  created_at?: string
  updated_at?: string
}

export interface ModelProviderCreateRequest {
  name: string
  provider_type: ModelProviderType
  base_url: string
  api_key: string
}

export interface ModelProviderUpdateRequest {
  name: string
  provider_type: ModelProviderType
  base_url: string
  api_key?: string
}

export interface ModelCapabilityConfig {
  id: string
  capability: ModelCapability
  provider_id: string
  provider_name?: string
  provider_type?: ModelProviderType
  model_name: string
  state: ModelConfigState
  test_status: ModelConfigTestStatus
  test_error_message?: string
  temperature?: number
  max_tokens?: number
  timeout_seconds?: number
  collection_name?: string
  index_version?: string
  embedding_dimension?: number
  tested_at?: string
  observed_embedding_dimension?: number
  created_by?: string
  created_at?: string
  activated_at?: string
}

export interface ModelCapabilityDraftRequest {
  provider_id: string
  model_name: string
  temperature?: number
  max_tokens?: number
  timeout_seconds?: number
  collection_name?: string
  index_version?: string
  embedding_dimension?: number
}

export interface ModelCapabilityGroup {
  capability: ModelCapability
  active_config?: ModelCapabilityConfig
  draft_config?: ModelCapabilityConfig
  history: ModelCapabilityConfig[]
}

export interface ModelConfigAudit {
  id: string
  actor: string
  action: string
  target_type: string
  target_id: string
  changed_fields: string[]
  created_at: string
}

export interface AiEmbeddingReindexRun {
  id: number
  targetConfigId: string
  targetIndexVersion: string
  status: 'RUNNING' | 'READY_TO_ACTIVATE' | 'SWITCHING' | 'COMPLETED' | 'FAILED' | 'ABORTED'
  totalCount: number
  readyCount: number
  failedCount: number
  errorMessage?: string
  createdBy: number
  createTime: string
  updateTime: string
}

export interface AiEmbeddingReindexItem {
  id: number
  runId: number
  documentId: number
  contentHash: string
  pythonJobId?: string
  status: string
  chunkCount: number
  errorMessage?: string
  createTime: string
  updateTime: string
}
