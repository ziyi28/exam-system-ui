export type ModelProviderType = 'OPENAI_COMPATIBLE' | 'AZURE_OPENAI' | 'OLLAMA' | 'DEEPSEEK'

export type ModelCapability =
  | 'QUESTION_GENERATION'
  | 'SUBJECTIVE_GRADING'
  | 'EXAM_SUMMARY'
  | 'RAG_EMBEDDING'

export type ModelConfigState = 'ACTIVE' | 'DRAFT' | 'INACTIVE' | 'REPLACED'

export type ModelConfigTestStatus = 'UNTESTED' | 'TESTING' | 'PASSED' | 'FAILED'

export interface ModelProvider {
  id: string
  name: string
  providerType: ModelProviderType
  baseUrl: string
  isDefault: boolean
  isActive: boolean
  associatedConfigCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface ModelProviderCreateRequest {
  name: string
  providerType: ModelProviderType
  baseUrl: string
  apiKey: string
  isDefault?: boolean
  isActive?: boolean
}

export interface ModelProviderUpdateRequest {
  name?: string
  baseUrl?: string
  apiKey?: string
  isDefault?: boolean
  isActive?: boolean
}

export interface ModelCapabilityConfig {
  id: string
  capability: ModelCapability
  providerId: string
  providerName?: string
  modelName: string
  state: ModelConfigState
  testStatus: ModelConfigTestStatus
  testErrorMessage?: string
  temperature?: number
  maxTokens?: number
  timeoutSeconds?: number
  indexVersion?: string
  embeddingDimension?: number
  createdAt?: string
  updatedAt?: string
  activatedAt?: string
}

export interface ModelCapabilityDraftRequest {
  providerId: string
  modelName: string
  temperature?: number
  maxTokens?: number
  timeoutSeconds?: number
  indexVersion?: string
  embeddingDimension?: number
}

export interface ModelCapabilityGroup {
  capability: ModelCapability
  activeConfig?: ModelCapabilityConfig
  draftConfig?: ModelCapabilityConfig
  history: ModelCapabilityConfig[]
}

export interface ModelConfigTestResponse {
  configId: string
  testStatus: ModelConfigTestStatus
  latencyMs?: number
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  outputSnippet?: string
  errorMessage?: string
}

export interface ModelConfigAudit {
  id: number
  operatorId: number
  action: string
  targetType: string
  targetId: string
  diffJson?: string
  status: string
  errorMessage?: string
  createdAt?: string
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
