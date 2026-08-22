import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ModelConfigView from './ModelConfigView.vue'
import type { ModelCapability, ModelCapabilityGroup } from '@/types/admin-model-config'
import {
  listCapabilityConfigs,
  listModelConfigAudits,
  listModelProviders,
  testCapabilityConfig,
  updateModelProvider,
  updateModelProviderApiKey,
} from '@/api/admin-model-config'

vi.mock('@/api/admin-model-config', () => ({
  abortReindexRun: vi.fn(),
  activateCapabilityConfig: vi.fn(),
  activateReindexRun: vi.fn(),
  createModelProvider: vi.fn(),
  disableModelProvider: vi.fn(),
  enableModelProvider: vi.fn(),
  listCapabilityConfigs: vi.fn(),
  listModelConfigAudits: vi.fn(),
  listModelProviders: vi.fn(),
  listReindexRunItems: vi.fn(),
  listReindexRuns: vi.fn(),
  retryReindexRun: vi.fn(),
  saveCapabilityDraft: vi.fn(),
  startEmbeddingReindex: vi.fn(),
  testCapabilityConfig: vi.fn(),
  updateModelProvider: vi.fn(),
  updateModelProviderApiKey: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
  ElMessageBox: { confirm: vi.fn() },
}))

const capabilities: ModelCapability[] = [
  'QUESTION_GENERATION',
  'SUBJECTIVE_GRADING',
  'EXAM_SUMMARY',
  'RAG_CHAT',
  'RAG_EMBEDDING',
  'DOCUMENT_PARSING',
]

function groups(testStatus: 'NOT_TESTED' | 'PASSED' = 'NOT_TESTED'): ModelCapabilityGroup[] {
  return capabilities.map((capability) => ({
    capability,
    draft_config: {
      id: `${capability}-draft`,
      capability,
      provider_id: 'provider-1',
      model_name: 'model-1',
      state: 'DRAFT',
      test_status: testStatus,
      max_tokens: 1024,
    },
    history: [],
  }))
}

const stubs = {
  ElAlert: { props: ['title'], template: '<div>{{ title }}</div>' },
  ElBadge: { template: '<div><slot /></div>' },
  ElButton: { emits: ['click'], template: '<button @click="$emit(\'click\')"><slot /></button>' },
  ElCard: { template: '<section class="capability-card"><slot name="header" /><slot /></section>' },
  ElCollapse: { template: '<div><slot /></div>' },
  ElCollapseItem: { template: '<div><slot /></div>' },
  ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
  ElDrawer: { template: '<div><slot /></div>' },
  ElEmpty: { template: '<div />' },
  ElForm: { template: '<form><slot /></form>' },
  ElFormItem: { props: ['label'], template: '<div>{{ label }}<slot /></div>' },
  ElIcon: { template: '<i><slot /></i>' },
  ElInput: {
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: '<input :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  ElInputNumber: { props: ['min', 'max'], template: '<input :min="min" :max="max" />' },
  ElOption: { template: '<option />' },
  ElProgress: { template: '<div />' },
  ElSelect: { template: '<select><slot /></select>' },
  ElSwitch: { template: '<input type="checkbox" />' },
  ElTabPane: { template: '<div><slot /></div>' },
  ElTabs: { template: '<div><slot /></div>' },
  ElTable: { template: '<div><slot /></div>' },
  ElTableColumn: {
    props: ['prop'],
    data: () => ({
      row: {
        id: 'provider-1',
        name: 'Provider One',
        provider_type: 'OPENAI_COMPATIBLE',
        base_url: 'https://example.com',
        enabled: true,
      },
    }),
    template: '<span><span class="table-column-prop">{{ prop }}</span><slot :row="row" /></span>',
  },
  ElTag: { template: '<span><slot /></span>' },
  ElTimeline: { template: '<div><slot /></div>' },
  ElTimelineItem: { template: '<div><slot /></div>' },
}

function mountView() {
  return mount(ModelConfigView, { global: { directives: { loading: {} }, stubs } })
}

describe('ModelConfigView', () => {
  beforeEach(() => {
    vi.mocked(listModelProviders).mockResolvedValue([
      { id: 'provider-1', name: 'Provider One', provider_type: 'OPENAI_COMPATIBLE', base_url: 'https://example.com', enabled: true, api_key_configured: true },
    ])
    vi.mocked(listCapabilityConfigs).mockResolvedValue(groups())
    vi.mocked(listModelConfigAudits).mockResolvedValue([])
    vi.mocked(testCapabilityConfig).mockResolvedValue({
      id: 'RAG_CHAT-draft',
      capability: 'RAG_CHAT',
      provider_id: 'provider-1',
      model_name: 'model-1',
      state: 'DRAFT',
      test_status: 'PASSED',
    })
  })

  it.each(capabilities)('从已解包响应为 %s 创建草稿表单', async (capability) => {
    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.findAll('.capability-card')).toHaveLength(6)
    expect(wrapper.text()).toContain(capability)
  })

  it('页面说明与六个业务场景保持一致', async () => {
    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain('六大业务场景')
    expect(wrapper.text()).not.toContain('四大业务场景')
  })

  it('只在 Embedding 场景收集 Milvus collection 名称', async () => {
    const wrapper = mountView()

    await flushPromises()

    const cards = wrapper.findAll('.capability-card')
    const ragChat = cards.find((card) => card.text().includes('RAG_CHAT'))
    const embedding = cards.find((card) => card.text().includes('RAG_EMBEDDING'))
    expect(ragChat?.text()).not.toContain('Milvus Collection')
    expect(embedding?.text()).toContain('Milvus Collection')
  })

  it('从已解包的探活响应刷新并显示通过状态', async () => {
    vi.mocked(listCapabilityConfigs).mockResolvedValueOnce(groups()).mockResolvedValueOnce(groups('PASSED'))
    const wrapper = mountView()

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text().includes('测试连通性'))!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('探活测试通过')
  })

  it('按审计接口的 wire 字段渲染审计表格', async () => {
    const wrapper = mountView()

    await flushPromises()

    const props = wrapper.findAll('.table-column-prop').map((column) => column.text())
    expect(props).toEqual(expect.arrayContaining([
      'created_at',
      'actor',
      'action',
      'target_type',
      'target_id',
      'changed_fields',
    ]))
  })

  it('最大输出 Token 输入范围与 Java 校验一致', async () => {
    const wrapper = mountView()

    await flushPromises()

    const inputs = wrapper.findAll('.max-tokens-input')
    expect(inputs).toHaveLength(5)
    for (const input of inputs) {
      expect(input.attributes('min')).toBe('64')
      expect(input.attributes('max')).toBe('8192')
    }
  })

  it('编辑供应商含新密钥时只发起一次原子更新请求', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '编辑')!.trigger('click')
    const apiKeyInput = wrapper.find('input[placeholder="留空表示保持原有密钥不变"]')
    await apiKeyInput.setValue('sk-new-provider-secret')
    await wrapper.findAll('button').find((button) => button.text() === '保存')!.trigger('click')
    await flushPromises()

    expect(updateModelProvider).toHaveBeenCalledTimes(1)
    expect(updateModelProvider).toHaveBeenCalledWith('provider-1', {
      name: 'Provider One',
      provider_type: 'OPENAI_COMPATIBLE',
      base_url: 'https://example.com',
      api_key: 'sk-new-provider-secret',
    })
    expect(updateModelProviderApiKey).not.toHaveBeenCalled()
  })
})
