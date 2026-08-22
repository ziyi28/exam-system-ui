import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  activateCapabilityConfig,
  disableModelProvider,
  saveCapabilityDraft,
  testCapabilityConfig,
} from './admin-model-config'
import { post } from './request'

vi.mock('./request', () => ({
  del: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

describe('统一模型配置管理 API 契约', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('禁用供应商时暴露并调用 Java 的 disable 接口', () => {
    disableModelProvider('provider-1')

    expect(post).toHaveBeenCalledWith('/api/admin/model-config/providers/provider-1/disable')
  })

  it('保存能力草稿时使用 POST /drafts', () => {
    const draft = { provider_id: 'provider-1', model_name: 'gpt-4o', max_tokens: 1024 }

    saveCapabilityDraft('RAG_CHAT', draft)

    expect(post).toHaveBeenCalledWith('/api/admin/model-config/capabilities/RAG_CHAT/drafts', draft)
  })

  it('探活配置时使用 capability-configs 路径', () => {
    testCapabilityConfig('config-1')

    expect(post).toHaveBeenCalledWith('/api/admin/model-config/capability-configs/config-1/test')
  })

  it('激活配置时使用 capability-configs 路径', () => {
    activateCapabilityConfig('config-1')

    expect(post).toHaveBeenCalledWith('/api/admin/model-config/capability-configs/config-1/activate')
  })
})
