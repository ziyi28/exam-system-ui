<template>
  <div class="model-config-container">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">
          <el-icon class="title-icon"><Cpu /></el-icon>
          统一 AI 模型配置中心
        </h2>
        <p class="page-subtitle">
          集中管理大模型供应商连接、四大业务场景模型绑定、运行时动态探活测试与安全无感 Embedding 向量重建迁移
        </p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="refreshAll" :loading="loading">刷新状态</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="config-tabs" type="border-card">
      <!-- Tab 1: 场景能力配置 -->
      <el-tab-pane label="场景能力配置" name="capabilities">
        <div class="capability-grid">
          <el-card
            v-for="group in capabilityGroups"
            :key="group.capability"
            class="capability-card"
            shadow="hover"
          >
            <template #header>
              <div class="card-header">
                <div class="capability-title">
                  <el-tag :type="getCapabilityTagType(group.capability)" effect="dark" size="small">
                    {{ getCapabilityName(group.capability) }}
                  </el-tag>
                  <span class="capability-code">{{ group.capability }}</span>
                </div>
                <div class="active-status">
                  <el-badge
                    :is-dot="true"
                    :type="group.activeConfig ? 'success' : 'danger'"
                    class="status-badge"
                  >
                    <span class="status-text">
                      {{ group.activeConfig ? '运行中' : '未配置 (走环境变量回退)' }}
                    </span>
                  </el-badge>
                </div>
              </div>
            </template>

            <!-- 生效中配置展示 -->
            <div class="active-config-section">
              <div class="section-label">当前生效配置：</div>
              <div v-if="group.activeConfig" class="active-config-box">
                <div class="config-row">
                  <span class="label">供应商：</span>
                  <span class="value highlight">{{ group.activeConfig.providerName || group.activeConfig.providerId }}</span>
                </div>
                <div class="config-row">
                  <span class="label">模型名：</span>
                  <span class="value font-mono">{{ group.activeConfig.modelName }}</span>
                </div>
                <div class="config-row" v-if="group.capability !== 'RAG_EMBEDDING'">
                  <span class="label">温度/超时：</span>
                  <span class="value">{{ group.activeConfig.temperature ?? '默认' }} / {{ group.activeConfig.timeoutSeconds ?? '默认' }}s</span>
                </div>
                <div class="config-row" v-else>
                  <span class="label">索引版本/维度：</span>
                  <span class="value">{{ group.activeConfig.indexVersion }} / {{ group.activeConfig.embeddingDimension }}维</span>
                </div>
              </div>
              <div v-else class="empty-active-box">
                <el-empty description="当前暂未绑定生效配置" :image-size="40" />
              </div>
            </div>

            <!-- 草稿编辑区 -->
            <div class="draft-config-section">
              <div class="section-label">草稿/待生效配置：</div>
              <el-form :model="draftForms[group.capability]" label-position="top" size="small">
                <el-form-item label="选择供应商" required>
                  <el-select
                    v-model="draftForms[group.capability].providerId"
                    placeholder="请选择供应商"
                    class="w-full"
                  >
                    <el-option
                      v-for="p in providers"
                      :key="p.id"
                      :label="p.name + ' (' + p.providerType + ')'"
                      :value="p.id"
                      :disabled="!p.isActive"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="模型名称" required>
                  <el-input
                    v-model="draftForms[group.capability].modelName"
                    placeholder="例如: gpt-4o, deepseek-chat, text-embedding-3-small"
                  />
                </el-form-item>

                <!-- 非 Embedding 参数 -->
                <template v-if="group.capability !== 'RAG_EMBEDDING'">
                  <div class="grid-2">
                    <el-form-item label="采样温度 (0.0 ~ 2.0)">
                      <el-input-number
                        v-model="draftForms[group.capability].temperature"
                        :min="0"
                        :max="2"
                        :step="0.1"
                        class="w-full"
                      />
                    </el-form-item>
                    <el-form-item label="超时时间 (秒)">
                      <el-input-number
                        v-model="draftForms[group.capability].timeoutSeconds"
                        :min="5"
                        :max="600"
                        :step="5"
                        class="w-full"
                      />
                    </el-form-item>
                  </div>
                </template>

                <!-- Embedding 参数 -->
                <template v-else>
                  <div class="grid-2">
                    <el-form-item label="索引版本 (如 v2, bge-v1)" required>
                      <el-input
                        v-model="draftForms[group.capability].indexVersion"
                        placeholder="新索引版本号"
                      />
                    </el-form-item>
                    <el-form-item label="向量维度 (如 1536, 1024)" required>
                      <el-input-number
                        v-model="draftForms[group.capability].embeddingDimension"
                        :min="1"
                        :max="8192"
                        class="w-full"
                      />
                    </el-form-item>
                  </div>
                </template>

                <!-- 探活测试与激活操作 -->
                <div class="card-actions">
                  <el-button
                    type="primary"
                    plain
                    size="small"
                    @click="saveDraft(group.capability)"
                    :loading="savingCapability === group.capability"
                  >
                    保存草稿
                  </el-button>

                  <el-button
                    type="warning"
                    size="small"
                    @click="testConfig(group.draftConfig?.id)"
                    :disabled="!group.draftConfig"
                    :loading="testingConfigId === group.draftConfig?.id"
                  >
                    测试连通性
                  </el-button>

                  <el-button
                    v-if="group.capability !== 'RAG_EMBEDDING'"
                    type="success"
                    size="small"
                    @click="activateConfig(group.draftConfig?.id)"
                    :disabled="!group.draftConfig || group.draftConfig.testStatus !== 'PASSED'"
                  >
                    激活上线
                  </el-button>
                  <el-button
                    v-else
                    type="danger"
                    size="small"
                    @click="goToReindex(group.draftConfig?.id)"
                    :disabled="!group.draftConfig || group.draftConfig.testStatus !== 'PASSED'"
                  >
                    前往数据重建
                  </el-button>
                </div>

                <!-- 测试结果提示 -->
                <div v-if="group.draftConfig?.testStatus" class="test-result-box">
                  <el-alert
                    v-if="group.draftConfig.testStatus === 'PASSED'"
                    type="success"
                    show-icon
                    :closable="false"
                    title="探活测试通过，可安全上线生效"
                  />
                  <el-alert
                    v-else-if="group.draftConfig.testStatus === 'FAILED'"
                    type="error"
                    show-icon
                    :closable="false"
                    :title="'测试失败: ' + (group.draftConfig.testErrorMessage || '连接超时或鉴权失败')"
                  />
                  <el-alert
                    v-else-if="group.draftConfig.testStatus === 'UNTESTED'"
                    type="info"
                    show-icon
                    :closable="false"
                    title="草稿已修改，请先点击测试连通性"
                  />
                </div>
              </el-form>
            </div>

            <!-- 历史版本折叠面板 -->
            <el-collapse class="history-collapse">
              <el-collapse-item title="查看配置历史记录">
                <el-timeline v-if="group.history && group.history.length > 0">
                  <el-timeline-item
                    v-for="item in group.history"
                    :key="item.id"
                    :timestamp="item.createdAt"
                    :type="item.state === 'ACTIVE' ? 'success' : 'info'"
                  >
                    <div class="history-item">
                      <span class="history-model">{{ item.modelName }}</span>
                      <el-tag size="small" :type="item.state === 'ACTIVE' ? 'success' : 'info'">
                        {{ item.state }}
                      </el-tag>
                    </div>
                  </el-timeline-item>
                </el-timeline>
                <div v-else class="text-gray text-xs">暂无历史配置</div>
              </el-collapse-item>
            </el-collapse>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 供应商管理 -->
      <el-tab-pane label="供应商连接管理" name="providers">
        <div class="pane-action-bar">
          <el-button type="primary" :icon="Plus" @click="openCreateProviderDialog">
            新增供应商
          </el-button>
        </div>

        <el-table :data="providers" stripe v-loading="loading" class="provider-table">
          <el-table-column prop="name" label="供应商名称" min-width="150" />
          <el-table-column prop="providerType" label="类型" width="160">
            <template #default="{ row }">
              <el-tag effect="plain">{{ row.providerType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="baseUrl" label="API Base URL" min-width="260" show-overflow-tooltip />
          <el-table-column prop="associatedConfigCount" label="关联配置数" width="110" align="center" />
          <el-table-column prop="isActive" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
                {{ row.isActive ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openEditProviderDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDeleteProvider(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab 3: Embedding 重建管理 -->
      <el-tab-pane label="知识库向量重建" name="reindex">
        <div class="reindex-dashboard">
          <el-alert
            type="warning"
            show-icon
            :closable="false"
            title="安全并行重建机制"
            description="修改知识库 Embedding 模型时，系统会在后台使用目标模型为所有现有文档创建新索引。重建期间知识库继续使用旧索引正常问答；全部文档构建完毕后方可一键原子切换，保障业务零中断。"
            class="mb-4"
          />

          <div class="reindex-actions mb-4">
            <el-button type="primary" :icon="VideoPlay" @click="handleStartReindex">
              发起新重建任务
            </el-button>
            <el-button :icon="Refresh" @click="loadReindexRuns">刷新进度</el-button>
          </div>

          <!-- 重建批次列表 -->
          <el-table :data="reindexRuns" stripe v-loading="loadingReindex" class="reindex-table">
            <el-table-column prop="id" label="批次 ID" width="90" align="center" />
            <el-table-column prop="targetIndexVersion" label="目标索引版本" width="140" />
            <el-table-column label="进度与完成度" min-width="220">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.totalCount > 0 ? Math.round((row.readyCount / row.totalCount) * 100) : 100"
                  :status="getReindexProgressStatus(row.status)"
                />
                <div class="progress-subtext">
                  成功 {{ row.readyCount }} / 失败 {{ row.failedCount }} / 总计 {{ row.totalCount }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="160" align="center">
              <template #default="{ row }">
                <el-tag :type="getReindexStatusTagType(row.status)">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="170" />
            <el-table-column label="操作" width="260" fixed="right" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="viewRunItems(row.id)">明细</el-button>
                <el-button
                  v-if="row.status === 'READY_TO_ACTIVATE'"
                  link
                  type="success"
                  size="small"
                  @click="handleActivateRun(row.id)"
                >
                  切换上线
                </el-button>
                <el-button
                  v-if="row.status === 'FAILED'"
                  link
                  type="warning"
                  size="small"
                  @click="handleRetryRun(row.id)"
                >
                  重试失败项
                </el-button>
                <el-button
                  v-if="row.status === 'RUNNING' || row.status === 'FAILED'"
                  link
                  type="danger"
                  size="small"
                  @click="handleAbortRun(row.id)"
                >
                  中止
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Tab 4: 配置审计日志 -->
      <el-tab-pane label="配置审计日志" name="audit">
        <div class="audit-dashboard">
          <div class="mb-3 flex justify-between">
            <span class="text-sm text-gray-500">记录所有模型供应商与场景配置变更、探活测试及切换审计</span>
            <el-button :icon="Refresh" size="small" @click="loadAudits">刷新</el-button>
          </div>
          <el-table :data="auditLogs" stripe v-loading="loadingAudit" class="audit-table">
            <el-table-column prop="createdAt" label="操作时间" width="170" />
            <el-table-column prop="operatorId" label="操作人ID" width="100" align="center" />
            <el-table-column prop="action" label="操作类型" width="180" />
            <el-table-column prop="targetType" label="目标类型" width="140" />
            <el-table-column prop="targetId" label="目标 ID" width="160" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'danger'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="errorMessage" label="备注/错误" min-width="200" show-overflow-tooltip />
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 供应商编辑/新建弹窗 -->
    <el-dialog
      v-model="providerDialogVisible"
      :title="editingProviderId ? '编辑供应商' : '新增供应商'"
      width="560px"
    >
      <el-form :model="providerForm" label-width="110px">
        <el-form-item label="供应商名称" required>
          <el-input v-model="providerForm.name" placeholder="例如: 阿里云百炼 / OpenAI 官方" />
        </el-form-item>

        <el-form-item label="供应商类型" required v-if="!editingProviderId">
          <el-select v-model="providerForm.providerType" class="w-full">
            <el-option label="OpenAI Compatible" value="OPENAI_COMPATIBLE" />
            <el-option label="Azure OpenAI" value="AZURE_OPENAI" />
            <el-option label="Ollama 本地" value="OLLAMA" />
            <el-option label="DeepSeek" value="DEEPSEEK" />
          </el-select>
        </el-form-item>

        <el-form-item label="Base URL" required>
          <el-input
            v-model="providerForm.baseUrl"
            placeholder="例如: https://dashscope.aliyuncs.com/compatible-mode/v1"
          />
          <span class="form-tip">服务端已开启 SSRF 防护，仅允许标准公网域名与白名单主机</span>
        </el-form-item>

        <el-form-item label="API Key" :required="!editingProviderId">
          <el-input
            v-model="providerForm.apiKey"
            type="password"
            show-password
            :placeholder="editingProviderId ? '留空表示保持原有密钥不变' : '输入供应商 API Key (AES-GCM 加密存储)'"
          />
        </el-form-item>

        <el-form-item label="是否启用">
          <el-switch v-model="providerForm.isActive" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="providerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProviderForm" :loading="submittingProvider">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 重建文档明细抽屉 -->
    <el-drawer v-model="itemsDrawerVisible" title="重建文档明细" size="50%">
      <el-table :data="reindexItems" stripe>
        <el-table-column prop="documentId" label="文档 ID" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'READY' ? 'success' : row.status === 'FAILED' ? 'danger' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="chunkCount" label="分块数" width="90" align="center" />
        <el-table-column prop="errorMessage" label="错误信息" min-width="180" show-overflow-tooltip />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Cpu, Refresh, Plus, VideoPlay } from '@element-plus/icons-vue'
import type {
  ModelProvider,
  ModelCapabilityGroup,
  ModelCapabilityDraftRequest,
  ModelConfigAudit,
  AiEmbeddingReindexRun,
  AiEmbeddingReindexItem,
} from '@/types/admin-model-config'
import {
  listModelProviders,
  createModelProvider,
  updateModelProvider,
  deleteModelProvider,
  listCapabilityConfigs,
  saveCapabilityDraft,
  testCapabilityConfig,
  activateCapabilityConfig,
  listModelConfigAudits,
  startEmbeddingReindex,
  listReindexRuns,
  listReindexRunItems,
  activateReindexRun,
  abortReindexRun,
  retryReindexRun,
} from '@/api/admin-model-config'

const activeTab = ref('capabilities')
const loading = ref(false)
const loadingReindex = ref(false)
const loadingAudit = ref(false)

const providers = ref<ModelProvider[]>([])
const capabilityGroups = ref<ModelCapabilityGroup[]>([])
const reindexRuns = ref<AiEmbeddingReindexRun[]>([])
const reindexItems = ref<AiEmbeddingReindexItem[]>([])
const auditLogs = ref<ModelConfigAudit[]>([])

const savingCapability = ref<string | null>(null)
const testingConfigId = ref<string | null>(null)

// 草稿表单映射
const draftForms = reactive<Record<string, ModelCapabilityDraftRequest>>({
  QUESTION_GENERATION: { providerId: '', modelName: '', temperature: 0.7, timeoutSeconds: 60 },
  SUBJECTIVE_GRADING: { providerId: '', modelName: '', temperature: 0.1, timeoutSeconds: 30 },
  EXAM_SUMMARY: { providerId: '', modelName: '', temperature: 0.7, timeoutSeconds: 30 },
  RAG_EMBEDDING: { providerId: '', modelName: '', indexVersion: 'v1', embeddingDimension: 1536 },
})

// 供应商弹窗表单
const providerDialogVisible = ref(false)
const editingProviderId = ref<string | null>(null)
const submittingProvider = ref(false)
const providerForm = reactive({
  name: '',
  providerType: 'OPENAI_COMPATIBLE' as any,
  baseUrl: '',
  apiKey: '',
  isActive: true,
})

const itemsDrawerVisible = ref(false)

function getCapabilityName(cap: string) {
  const map: Record<string, string> = {
    QUESTION_GENERATION: 'AI 题目智能生成',
    SUBJECTIVE_GRADING: '简答题智能批阅',
    EXAM_SUMMARY: '考试智能综合评语',
    RAG_EMBEDDING: '知识库向量检索 (Embedding)',
  }
  return map[cap] || cap
}

function getCapabilityTagType(cap: string) {
  const map: Record<string, any> = {
    QUESTION_GENERATION: 'primary',
    SUBJECTIVE_GRADING: 'warning',
    EXAM_SUMMARY: 'success',
    RAG_EMBEDDING: 'danger',
  }
  return map[cap] || 'info'
}

function getReindexStatusTagType(status: string) {
  const map: Record<string, any> = {
    RUNNING: 'primary',
    READY_TO_ACTIVATE: 'warning',
    SWITCHING: 'warning',
    COMPLETED: 'success',
    FAILED: 'danger',
    ABORTED: 'info',
  }
  return map[status] || 'info'
}

function getReindexProgressStatus(status: string) {
  if (status === 'COMPLETED') return 'success'
  if (status === 'FAILED') return 'exception'
  if (status === 'READY_TO_ACTIVATE') return 'warning'
  return ''
}

async function loadProviders() {
  try {
    const res = await listModelProviders()
    providers.value = res.data || []
  } catch (error: any) {
    ElMessage.error(error.message || '加载供应商列表失败')
  }
}

async function loadCapabilities() {
  try {
    const res = await listCapabilityConfigs()
    capabilityGroups.value = res.data || []
    for (const group of capabilityGroups.value) {
      const target = group.draftConfig || group.activeConfig
      if (target) {
        draftForms[group.capability] = {
          providerId: target.providerId,
          modelName: target.modelName,
          temperature: target.temperature,
          timeoutSeconds: target.timeoutSeconds,
          indexVersion: target.indexVersion,
          embeddingDimension: target.embeddingDimension,
        }
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载场景能力配置失败')
  }
}

async function loadReindexRuns() {
  loadingReindex.value = true
  try {
    const res = await listReindexRuns()
    reindexRuns.value = res.data || []
  } catch (error: any) {
    ElMessage.error(error.message || '加载重建任务失败')
  } finally {
    loadingReindex.value = false
  }
}

async function loadAudits() {
  loadingAudit.value = true
  try {
    const res = await listModelConfigAudits({ limit: 50 })
    auditLogs.value = res.data || []
  } catch (error: any) {
    ElMessage.error(error.message || '加载审计日志失败')
  } finally {
    loadingAudit.value = false
  }
}

async function refreshAll() {
  loading.value = true
  await Promise.all([loadProviders(), loadCapabilities(), loadReindexRuns(), loadAudits()])
  loading.value = false
}

async function saveDraft(capability: string) {
  const form = draftForms[capability]
  if (!form.providerId || !form.modelName) {
    ElMessage.warning('请选择供应商并填写模型名称')
    return
  }
  savingCapability.value = capability
  try {
    await saveCapabilityDraft(capability, form)
    ElMessage.success('草稿保存成功')
    await loadCapabilities()
  } catch (error: any) {
    ElMessage.error(error.message || '保存草稿失败')
  } finally {
    savingCapability.value = null
  }
}

async function testConfig(configId?: string) {
  if (!configId) {
    ElMessage.warning('未找到待测试的草稿配置')
    return
  }
  testingConfigId.value = configId
  try {
    const res = await testCapabilityConfig(configId)
    if (res.data?.testStatus === 'PASSED') {
      ElMessage.success(`探活测试成功，耗时 ${res.data.latencyMs ?? 0}ms`)
    } else {
      ElMessage.error(res.data?.errorMessage || '探活测试未通过')
    }
    await loadCapabilities()
  } catch (error: any) {
    ElMessage.error(error.message || '探活测试执行失败')
  } finally {
    testingConfigId.value = null
  }
}

async function activateConfig(configId?: string) {
  if (!configId) return
  try {
    await ElMessageBox.confirm('确定要将该配置上线为当前运行配置吗？变更将立即在所有新请求中生效。', '确认上线', {
      confirmButtonText: '确定上线',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await activateCapabilityConfig(configId)
    ElMessage.success('模型配置已成功激活上线')
    await loadCapabilities()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '激活配置失败')
    }
  }
}

function goToReindex(_configId?: string) {
  activeTab.value = 'reindex'
}

function openCreateProviderDialog() {
  editingProviderId.value = null
  providerForm.name = ''
  providerForm.providerType = 'OPENAI_COMPATIBLE'
  providerForm.baseUrl = ''
  providerForm.apiKey = ''
  providerForm.isActive = true
  providerDialogVisible.value = true
}

function openEditProviderDialog(row: ModelProvider) {
  editingProviderId.value = row.id
  providerForm.name = row.name
  providerForm.providerType = row.providerType
  providerForm.baseUrl = row.baseUrl
  providerForm.apiKey = ''
  providerForm.isActive = row.isActive
  providerDialogVisible.value = true
}

async function submitProviderForm() {
  if (!providerForm.name || !providerForm.baseUrl) {
    ElMessage.warning('请填写供应商名称和 Base URL')
    return
  }
  submittingProvider.value = true
  try {
    if (editingProviderId.value) {
      await updateModelProvider(editingProviderId.value, {
        name: providerForm.name,
        baseUrl: providerForm.baseUrl,
        apiKey: providerForm.apiKey || undefined,
        isActive: providerForm.isActive,
      })
      ElMessage.success('供应商更新成功')
    } else {
      if (!providerForm.apiKey) {
        ElMessage.warning('新建供应商必须提供 API Key')
        submittingProvider.value = false
        return
      }
      await createModelProvider({
        name: providerForm.name,
        providerType: providerForm.providerType,
        baseUrl: providerForm.baseUrl,
        apiKey: providerForm.apiKey,
        isActive: providerForm.isActive,
      })
      ElMessage.success('供应商创建成功')
    }
    providerDialogVisible.value = false
    await loadProviders()
  } catch (error: any) {
    ElMessage.error(error.message || '保存供应商失败')
  } finally {
    submittingProvider.value = false
  }
}

async function handleDeleteProvider(row: ModelProvider) {
  if (row.associatedConfigCount && row.associatedConfigCount > 0) {
    ElMessage.warning(`该供应商仍被 ${row.associatedConfigCount} 个场景配置引用，无法直接删除`)
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除供应商【${row.name}】吗？`, '删除确认', {
      type: 'warning',
    })
    await deleteModelProvider(row.id)
    ElMessage.success('供应商已删除')
    await loadProviders()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除供应商失败')
    }
  }
}

async function handleStartReindex() {
  const embGroup = capabilityGroups.value.find((g) => g.capability === 'RAG_EMBEDDING')
  if (!embGroup?.draftConfig || embGroup.draftConfig.testStatus !== 'PASSED') {
    ElMessage.warning('知识库 Embedding 草稿配置不存在或尚未通过探活测试')
    return
  }
  try {
    await ElMessageBox.confirm(
      `即将使用目标配置【${embGroup.draftConfig.modelName}】(索引版本 ${embGroup.draftConfig.indexVersion}) 发起全量知识库向量重建，是否继续？`,
      '发起重建确认',
      { type: 'warning' },
    )
    await startEmbeddingReindex(embGroup.draftConfig.id)
    ElMessage.success('已启动后台并行向量重建')
    await loadReindexRuns()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '启动重建任务失败')
    }
  }
}

async function viewRunItems(runId: number) {
  try {
    const res = await listReindexRunItems(runId)
    reindexItems.value = res.data || []
    itemsDrawerVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '获取明细失败')
  }
}

async function handleActivateRun(runId: number) {
  try {
    await ElMessageBox.confirm('所有文档新索引已构建就绪，确定原子切换为当前生效版本吗？', '确认切换上线', {
      type: 'warning',
    })
    await activateReindexRun(runId)
    ElMessage.success('索引版本与模型配置已成功切换上线！')
    await refreshAll()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '切换上线失败')
    }
  }
}

async function handleAbortRun(runId: number) {
  try {
    await ElMessageBox.confirm('确定中止该重建任务吗？中止后解除文档写入锁定，旧索引继续有效。', '中止确认', {
      type: 'warning',
    })
    await abortReindexRun(runId)
    ElMessage.success('重建任务已中止')
    await loadReindexRuns()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '中止失败')
    }
  }
}

async function handleRetryRun(runId: number) {
  try {
    await retryReindexRun(runId)
    ElMessage.success('已重新提交失败文档')
    await loadReindexRuns()
  } catch (error: any) {
    ElMessage.error(error.message || '重试失败')
  }
}

onMounted(() => {
  refreshAll()
})
</script>

<style scoped>
.model-config-container {
  padding: 16px 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.config-tabs {
  margin-top: 12px;
}

.capability-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 16px;
  padding: 8px 0;
}

.capability-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.capability-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.capability-code {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-family: monospace;
}

.active-status .status-text {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.section-label {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.active-config-box {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  margin-bottom: 14px;
}

.config-row {
  display: flex;
  margin-bottom: 4px;
}

.config-row:last-child {
  margin-bottom: 0;
}

.config-row .label {
  color: var(--el-text-color-secondary);
  width: 90px;
}

.config-row .value {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.draft-config-section {
  border-top: 1px dashed var(--el-border-color);
  padding-top: 12px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.test-result-box {
  margin-top: 10px;
}

.history-collapse {
  margin-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pane-action-bar {
  margin-bottom: 14px;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
  display: block;
}

.progress-subtext {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.mb-4 {
  margin-bottom: 16px;
}

.w-full {
  width: 100%;
}

.font-mono {
  font-family: monospace;
}
</style>
