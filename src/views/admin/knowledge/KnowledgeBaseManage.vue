<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-header__title">AI 知识库</h2>
        <p class="page-header__desc">上传可信资料并建立向量索引；教师可在入题前验证检索答案与引用依据</p>
      </div>
      <div class="page-header__actions">
        <el-button :icon="Refresh" :loading="knowledgeBaseLoading" @click="refreshAll">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建知识库</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="knowledge-layout">
      <el-col :xs="24" :lg="7">
        <el-card v-loading="knowledgeBaseLoading" shadow="never" class="knowledge-base-card">
          <template #header>
            <div class="card-header">
              <span>知识库（{{ knowledgeBases.length }}）</span>
            </div>
          </template>

          <el-empty v-if="!knowledgeBases.length && !knowledgeBaseLoading" description="暂无知识库">
            <el-button type="primary" plain :icon="Plus" @click="openCreateDialog">创建第一个知识库</el-button>
          </el-empty>

          <div v-else class="knowledge-base-list">
            <div
              v-for="item in knowledgeBases"
              :key="item.id"
              class="knowledge-base-item"
              :class="{ selected: item.id === selectedKnowledgeBaseId }"
              role="button"
              tabindex="0"
              @click="selectKnowledgeBase(item)"
              @keydown.enter.self="selectKnowledgeBase(item)"
              @keydown.space.prevent.self="selectKnowledgeBase(item)"
            >
              <div class="knowledge-base-title-row">
                <span class="knowledge-base-name">{{ item.name }}</span>
                <el-tag :type="knowledgeBaseStatusTag(item.status)" size="small" effect="plain">
                  {{ knowledgeBaseStatusText(item.status) }}
                </el-tag>
              </div>
              <p class="knowledge-base-description">{{ item.description || '暂无描述' }}</p>
              <div class="knowledge-base-meta">
                <span><el-icon><Files /></el-icon>{{ item.documentCount ?? 0 }} 个文档</span>
                <span v-if="item.ownerName">创建人：{{ item.ownerName }}</span>
                <el-button link type="danger" size="small" @click.stop="handleDeleteKnowledgeBase(item)">删除</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="17">
        <template v-if="selectedKnowledgeBase">
          <el-card shadow="never" class="page-card">
            <template #header>
              <div class="card-header">
                <div class="card-title-copy">
                  <span>{{ selectedKnowledgeBase.name }} · 文档</span>
                  <small>上传后由后台异步解析、切分并建立向量索引</small>
                </div>
                <div class="card-actions">
                  <el-tag v-if="hasActiveDocuments" type="warning" size="small" effect="plain">
                    <el-icon class="spin-icon"><Loading /></el-icon>
                    索引处理中
                  </el-tag>
                  <el-button :icon="Refresh" :loading="documentLoading" @click="loadDocuments()">刷新状态</el-button>
                  <el-button type="primary" :icon="Upload" @click="openUploadDialog">上传文档</el-button>
                </div>
              </div>
            </template>

            <el-alert
              v-if="pollingExhausted"
              type="warning"
              :closable="false"
              show-icon
              title="自动刷新已暂停，请手动刷新查看最新索引状态"
              style="margin-bottom: 12px"
            />

            <el-table
              v-loading="documentLoading"
              :data="documents"
              row-key="id"
              stripe
              empty-text="暂无文档，请先上传资料"
            >
              <el-table-column prop="fileName" label="文件名" min-width="210" show-overflow-tooltip />
              <el-table-column label="大小" width="100">
                <template #default="{ row }">{{ formatFileSize(row.sizeBytes) }}</template>
              </el-table-column>
              <el-table-column label="索引状态" min-width="180">
                <template #default="{ row }">
                  <div class="document-status-cell">
                    <el-tag :type="documentStatusTag(row.status)" size="small">
                      {{ documentStatusText(row.status) }}
                    </el-tag>
                    <el-progress
                      v-if="isDocumentActive(row)"
                      class="document-progress"
                      :percentage="normalizeProgress(row.progress)"
                      :show-text="false"
                      :stroke-width="5"
                    />
                    <span v-if="isDocumentFailed(row) && row.errorMessage" class="document-error" :title="row.errorMessage">
                      {{ row.errorMessage }}
                    </span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="chunkCount" label="片段数" width="90">
                <template #default="{ row }">{{ row.chunkCount ?? '-' }}</template>
              </el-table-column>
              <el-table-column label="更新时间" width="170">
                <template #default="{ row }">{{ formatDateTime(row.updatedAt || row.createdAt) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="130" fixed="right">
                <template #default="{ row }">
                  <el-button
                    v-if="isDocumentFailed(row)"
                    link
                    type="primary"
                    :loading="retryingDocumentId === row.id"
                    @click="handleRetryDocument(row)"
                  >
                    重试
                  </el-button>
                  <el-button
                    link
                    type="danger"
                    :loading="deletingDocumentId === row.id"
                    @click="handleDeleteDocument(row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-card shadow="never" class="rag-test-card">
            <template #header>
              <div class="card-title-copy">
                <span>RAG 检索测试</span>
                <small>仅用于教师验证知识召回质量，不会出现在学生考试页面</small>
              </div>
            </template>

            <el-form label-position="top" class="rag-form">
              <el-form-item label="检索范围" required>
                <el-select
                  v-model="ragKnowledgeBaseIds"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  placeholder="请选择至少一个知识库"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in knowledgeBases"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="测试问题" required>
                <el-input
                  v-model="ragQuestion"
                  type="textarea"
                  :rows="4"
                  maxlength="2000"
                  show-word-limit
                  placeholder="请输入一个能从已上传资料中找到依据的问题"
                  @keydown.ctrl.enter.prevent="handleAskRag"
                />
              </el-form-item>
              <div class="rag-actions">
                <el-text type="info" size="small">快捷键：Ctrl + Enter</el-text>
                <el-button type="primary" :icon="Search" :loading="ragAsking" @click="handleAskRag">
                  {{ ragAsking ? '检索并生成中…' : '检索测试' }}
                </el-button>
              </div>
            </el-form>

            <div v-if="ragResult" class="rag-result">
              <div class="rag-answer-header">
                <h3>回答</h3>
                <el-tag :type="evidenceStatusTag(ragResult.evidenceStatus)" effect="plain">
                  {{ evidenceStatusText(ragResult.evidenceStatus) }}
                </el-tag>
              </div>
              <div class="rag-answer-text">{{ ragResult.answer || '未生成回答' }}</div>
              <div v-if="ragResult.model || ragResult.latencyMs != null" class="rag-result-meta">
                <span v-if="ragResult.model">模型：{{ ragResult.model }}</span>
                <span v-if="ragResult.latencyMs != null">耗时：{{ formatLatency(ragResult.latencyMs) }}</span>
              </div>

              <el-divider content-position="left">引用依据（{{ ragResult.citations.length }}）</el-divider>
              <el-empty v-if="!ragResult.citations.length" :image-size="72" description="本次回答未返回可核验引用" />
              <div v-else class="citation-list">
                <article v-for="(citation, index) in ragResult.citations" :key="citationKey(citation, index)" class="citation-card">
                  <div class="citation-header">
                    <strong>{{ index + 1 }}. {{ citation.documentName || `文档 #${citation.documentId}` }}</strong>
                    <div class="citation-tags">
                      <el-tag v-if="citation.pageStart != null && citation.pageStart > 0" size="small" type="info" effect="plain">
                        {{ citationPageText(citation) }}
                      </el-tag>
                      <el-tag v-if="citation.sectionPath" size="small" type="info" effect="plain">
                        {{ citation.sectionPath }}
                      </el-tag>
                      <el-tag v-if="citation.chunkId != null" size="small" type="info" effect="plain">
                        片段 {{ citation.chunkId }}
                      </el-tag>
                      <el-tag v-if="citation.score != null" size="small" type="success" effect="plain">
                        相关度 {{ formatScore(citation.score) }}
                      </el-tag>
                    </div>
                  </div>
                  <p class="citation-content">{{ citation.quote || '（无可展示片段）' }}</p>
                </article>
              </div>
            </div>
          </el-card>
        </template>

        <el-card v-else shadow="never">
          <el-empty description="请先创建或选择一个知识库" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="createDialogVisible" title="新建知识库" width="500px" destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="createForm.name" maxlength="100" show-word-limit placeholder="如：Java 课程资料" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="说明知识范围与适用场景（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creatingKnowledgeBase" @click="handleCreateKnowledgeBase">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="uploadDialogVisible"
      title="上传知识文档"
      width="560px"
      :close-on-click-modal="!uploadingDocument"
      :close-on-press-escape="!uploadingDocument"
      :show-close="!uploadingDocument"
    >
      <el-alert
        v-if="selectedKnowledgeBase"
        type="info"
        :closable="false"
        :title="`将上传到「${selectedKnowledgeBase.name}」；文件接收后会在后台异步建立索引`"
        style="margin-bottom: 16px"
      />
      <el-upload
        ref="uploadRef"
        drag
        :auto-upload="false"
        :limit="1"
        :disabled="uploadingDocument"
        accept=".pdf,.docx,.txt,.md"
        :on-change="handleUploadFileChange"
        :on-remove="handleUploadFileRemove"
      >
        <el-icon :size="44" class="upload-icon"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处，或 <em>点击选择文件</em></div>
        <template #tip>
          <div class="el-upload__tip">支持格式和大小以后端配置为准；一次上传一个文件</div>
        </template>
      </el-upload>
      <div v-if="uploadingDocument" class="upload-progress-block">
        <el-progress :percentage="uploadProgress" :stroke-width="14" text-inside />
        <p>{{ uploadProgress >= 100 ? '文件已发送，正在等待服务器确认…' : '正在上传文档…' }}</p>
      </div>
      <template #footer>
        <el-button :disabled="uploadingDocument" @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploadingDocument" :disabled="!uploadFile" @click="handleUploadDocument">
          上传并索引
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
  type UploadFile,
  type UploadInstance,
} from 'element-plus'
import { Files, Loading, Plus, Refresh, Search, Upload, UploadFilled } from '@element-plus/icons-vue'
import {
  answerWithRag,
  createKnowledgeBase,
  deleteKnowledgeBase,
  deleteKnowledgeDocument,
  listKnowledgeBases,
  listKnowledgeDocuments,
  retryKnowledgeDocument,
  uploadKnowledgeDocument,
} from '@/api/knowledge'
import type { KnowledgeBase, KnowledgeDocument, RagAnswer, RagCitation } from '@/types'

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

const SUCCESS_DOCUMENT_STATUSES = new Set(['READY', 'COMPLETED', 'INDEXED', 'SUCCESS', 'SUCCEEDED'])
const FAILED_DOCUMENT_STATUSES = new Set(['FAILED', 'ERROR'])
const DOCUMENT_POLL_INTERVAL = 3000
const DOCUMENT_POLL_LIMIT = 600

const knowledgeBaseLoading = ref(false)
const knowledgeBases = ref<KnowledgeBase[]>([])
const selectedKnowledgeBaseId = ref<number>()
const selectedKnowledgeBase = computed(() =>
  knowledgeBases.value.find((item) => item.id === selectedKnowledgeBaseId.value),
)

const documentLoading = ref(false)
const documents = ref<KnowledgeDocument[]>([])
const retryingDocumentId = ref<number>()
const deletingDocumentId = ref<number>()
const hasActiveDocuments = computed(() => documents.value.some(isDocumentActive))
const pollingExhausted = ref(false)
let documentPollTimer: number | undefined
let documentPollCount = 0

function normalizeStatus(status?: string) {
  return (status || '').trim().toUpperCase()
}

function isDocumentFailed(document: KnowledgeDocument) {
  return FAILED_DOCUMENT_STATUSES.has(normalizeStatus(document.status))
}

function isDocumentReady(document: KnowledgeDocument) {
  return SUCCESS_DOCUMENT_STATUSES.has(normalizeStatus(document.status))
}

function isDocumentActive(document: KnowledgeDocument) {
  const status = normalizeStatus(document.status)
  return !!status && !isDocumentReady(document) && !isDocumentFailed(document)
}

function documentStatusText(status?: string) {
  const text: Record<string, string> = {
    PENDING: '待处理',
    QUEUED: '排队中',
    UPLOADING: '上传中',
    UPLOADED: '等待索引',
    PARSING: '解析中',
    CHUNKING: '切分中',
    EMBEDDING: '向量化中',
    PROCESSING: '处理中',
    INDEXING: '建索引中',
    RETRYING: '重试中',
    READY: '可检索',
    COMPLETED: '已完成',
    INDEXED: '已索引',
    SUCCESS: '已完成',
    SUCCEEDED: '已完成',
    FAILED: '失败',
    ERROR: '失败',
  }
  const normalized = normalizeStatus(status)
  return text[normalized] || status || '未知'
}

function documentStatusTag(status?: string): TagType {
  const normalized = normalizeStatus(status)
  if (SUCCESS_DOCUMENT_STATUSES.has(normalized)) return 'success'
  if (FAILED_DOCUMENT_STATUSES.has(normalized)) return 'danger'
  if (normalized === 'PENDING' || normalized === 'QUEUED' || normalized === 'UPLOADED') return 'info'
  return 'warning'
}

function knowledgeBaseStatusText(status?: string) {
  const normalized = normalizeStatus(status)
  return ({ ACTIVE: '可用', READY: '可用', DISABLED: '已停用', FAILED: '异常' } as Record<string, string>)[normalized]
    || status
    || '可用'
}

function knowledgeBaseStatusTag(status?: string): TagType {
  const normalized = normalizeStatus(status)
  if (!normalized || normalized === 'ACTIVE' || normalized === 'READY') return 'success'
  if (normalized === 'FAILED') return 'danger'
  return 'info'
}

function normalizeProgress(progress?: number) {
  const value = Number(progress ?? 0)
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

function formatFileSize(bytes?: number) {
  const value = Number(bytes ?? 0)
  if (!Number.isFinite(value) || value <= 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`
}

function formatDateTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-'
}

function stopDocumentPolling(resetCount = false) {
  if (documentPollTimer != null) {
    window.clearTimeout(documentPollTimer)
    documentPollTimer = undefined
  }
  if (resetCount) {
    documentPollCount = 0
    pollingExhausted.value = false
  }
}

function scheduleDocumentPolling() {
  if (documentPollTimer != null || !hasActiveDocuments.value || !selectedKnowledgeBaseId.value) return
  if (documentPollCount >= DOCUMENT_POLL_LIMIT) {
    pollingExhausted.value = true
    return
  }
  documentPollTimer = window.setTimeout(() => {
    documentPollTimer = undefined
    documentPollCount++
    loadDocuments(true).catch(() => {
      scheduleDocumentPolling()
    })
  }, DOCUMENT_POLL_INTERVAL)
}

async function loadDocuments(background = false) {
  const knowledgeBaseId = selectedKnowledgeBaseId.value
  if (!knowledgeBaseId) {
    documents.value = []
    stopDocumentPolling(true)
    return
  }
  if (!background) {
    documentLoading.value = true
    stopDocumentPolling(true)
  }
  try {
    const data = await listKnowledgeDocuments(knowledgeBaseId)
    if (selectedKnowledgeBaseId.value === knowledgeBaseId) {
      documents.value = data ?? []
    }
  } finally {
    if (!background) documentLoading.value = false
    if (selectedKnowledgeBaseId.value === knowledgeBaseId) scheduleDocumentPolling()
  }
}

async function loadKnowledgeBaseData(preferredId?: number) {
  knowledgeBaseLoading.value = true
  try {
    const data = await listKnowledgeBases()
    knowledgeBases.value = data ?? []
    const existingIds = new Set(knowledgeBases.value.map((item) => item.id))
    const nextId = (preferredId != null && existingIds.has(preferredId) ? preferredId : undefined)
      ?? (selectedKnowledgeBaseId.value != null && existingIds.has(selectedKnowledgeBaseId.value)
        ? selectedKnowledgeBaseId.value
        : knowledgeBases.value[0]?.id)
    selectedKnowledgeBaseId.value = nextId
    ragKnowledgeBaseIds.value = ragKnowledgeBaseIds.value.filter((id) => existingIds.has(id))
    if (!ragKnowledgeBaseIds.value.length && nextId != null) ragKnowledgeBaseIds.value = [nextId]
  } finally {
    knowledgeBaseLoading.value = false
  }
  await loadDocuments()
}

function refreshAll() {
  loadKnowledgeBaseData(selectedKnowledgeBaseId.value).catch(() => {})
}

function selectKnowledgeBase(item: KnowledgeBase) {
  if (selectedKnowledgeBaseId.value === item.id) return
  selectedKnowledgeBaseId.value = item.id
  documents.value = []
  stopDocumentPolling(true)
  loadDocuments().catch(() => {})
}

const createDialogVisible = ref(false)
const creatingKnowledgeBase = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({ name: '', description: '' })
const createRules: FormRules = {
  name: [
    { required: true, message: '请输入知识库名称', trigger: 'blur' },
    { min: 2, max: 100, message: '名称长度为 2-100 个字符', trigger: 'blur' },
  ],
}

function openCreateDialog() {
  createForm.name = ''
  createForm.description = ''
  createDialogVisible.value = true
  nextTick(() => createFormRef.value?.clearValidate())
}

async function handleCreateKnowledgeBase() {
  await createFormRef.value?.validate()
  creatingKnowledgeBase.value = true
  try {
    const created = await createKnowledgeBase({
      name: createForm.name.trim(),
      description: createForm.description.trim() || undefined,
    })
    ElMessage.success('知识库创建成功')
    createDialogVisible.value = false
    await loadKnowledgeBaseData(created?.id)
  } finally {
    creatingKnowledgeBase.value = false
  }
}

async function handleDeleteKnowledgeBase(item: KnowledgeBase) {
  await ElMessageBox.confirm(
    `确定删除知识库「${item.name}」吗？其中的文档和向量索引也会被删除，此操作不可撤销。`,
    '删除知识库',
    { type: 'warning', confirmButtonText: '删除', confirmButtonClass: 'el-button--danger' },
  )
  await deleteKnowledgeBase(item.id)
  ElMessage.success('知识库已删除')
  ragKnowledgeBaseIds.value = ragKnowledgeBaseIds.value.filter((id) => id !== item.id)
  ragResult.value = null
  if (selectedKnowledgeBaseId.value === item.id) {
    selectedKnowledgeBaseId.value = undefined
    documents.value = []
  }
  await loadKnowledgeBaseData()
}

const uploadDialogVisible = ref(false)
const uploadRef = ref<UploadInstance>()
const uploadFile = ref<File | null>(null)
const uploadingDocument = ref(false)
const uploadProgress = ref(0)

function openUploadDialog() {
  uploadFile.value = null
  uploadProgress.value = 0
  uploadDialogVisible.value = true
  nextTick(() => uploadRef.value?.clearFiles())
}

function handleUploadFileChange(file: UploadFile) {
  uploadFile.value = file.raw ?? null
}

function handleUploadFileRemove() {
  uploadFile.value = null
}

async function handleUploadDocument() {
  const knowledgeBaseId = selectedKnowledgeBaseId.value
  const file = uploadFile.value
  if (!knowledgeBaseId || !file) {
    ElMessage.warning('请选择要上传的文档')
    return
  }
  uploadingDocument.value = true
  uploadProgress.value = 0
  try {
    await uploadKnowledgeDocument(knowledgeBaseId, file, (percent) => {
      uploadProgress.value = percent
    })
    ElMessage.success('文档上传成功，后台正在建立索引')
    uploadDialogVisible.value = false
    await loadKnowledgeBaseData(knowledgeBaseId)
  } finally {
    uploadingDocument.value = false
  }
}

async function handleRetryDocument(document: KnowledgeDocument) {
  retryingDocumentId.value = document.id
  try {
    await retryKnowledgeDocument(document.id)
    ElMessage.success('已重新提交索引任务')
    await loadDocuments()
  } finally {
    retryingDocumentId.value = undefined
  }
}

async function handleDeleteDocument(document: KnowledgeDocument) {
  await ElMessageBox.confirm(`确定删除文档「${document.fileName}」及其向量索引吗？`, '删除文档', {
    type: 'warning',
    confirmButtonText: '删除',
    confirmButtonClass: 'el-button--danger',
  })
  deletingDocumentId.value = document.id
  try {
    await deleteKnowledgeDocument(document.id)
    ElMessage.success('文档已删除')
    await loadKnowledgeBaseData(selectedKnowledgeBaseId.value)
  } finally {
    deletingDocumentId.value = undefined
  }
}

const ragKnowledgeBaseIds = ref<number[]>([])
const ragQuestion = ref('')
const ragAsking = ref(false)
const ragResult = ref<RagAnswer | null>(null)

function evidenceStatusText(status?: string) {
  const normalized = normalizeStatus(status)
  const text: Record<string, string> = {
    SUPPORTED: '证据充分',
    GROUNDED: '证据充分',
    SUFFICIENT: '证据充分',
    PARTIAL: '部分有依据',
    INSUFFICIENT: '证据不足',
    NO_EVIDENCE: '未检索到依据',
    UNSUPPORTED: '缺少依据',
  }
  return text[normalized] || status || '证据状态未知'
}

function evidenceStatusTag(status?: string): TagType {
  const normalized = normalizeStatus(status)
  if (['SUPPORTED', 'GROUNDED', 'SUFFICIENT'].includes(normalized)) return 'success'
  if (['INSUFFICIENT', 'NO_EVIDENCE', 'UNSUPPORTED'].includes(normalized)) return 'danger'
  return 'warning'
}

function formatLatency(latencyMs: number) {
  const value = Number(latencyMs)
  if (!Number.isFinite(value)) return '-'
  return value >= 1000 ? `${(value / 1000).toFixed(2)} 秒` : `${Math.round(value)} ms`
}

function formatScore(score: number) {
  const value = Number(score)
  if (!Number.isFinite(value)) return '-'
  if (value >= 0 && value <= 1) return `${(value * 100).toFixed(1)}%`
  return value.toFixed(3)
}

function citationKey(citation: RagCitation, index: number) {
  return `${citation.documentId}-${citation.chunkId ?? index}-${index}`
}

function citationPageText(citation: RagCitation) {
  const start = citation.pageStart
  const end = citation.pageEnd
  return end != null && start != null && end > start ? `第 ${start}-${end} 页` : `第 ${start} 页`
}

async function handleAskRag() {
  const question = ragQuestion.value.trim()
  if (!ragKnowledgeBaseIds.value.length) {
    ElMessage.warning('请至少选择一个知识库')
    return
  }
  if (!question) {
    ElMessage.warning('请输入测试问题')
    return
  }
  ragAsking.value = true
  ragResult.value = null
  try {
    const result = await answerWithRag({
      knowledgeBaseIds: [...ragKnowledgeBaseIds.value],
      question,
    })
    ragResult.value = { ...result, citations: result.citations ?? [] }
  } finally {
    ragAsking.value = false
  }
}

onMounted(() => {
  loadKnowledgeBaseData().catch(() => {})
})

onBeforeUnmount(() => {
  stopDocumentPolling()
})
</script>

<style scoped>
.knowledge-layout {
  align-items: flex-start;
}

.knowledge-base-card {
  margin-bottom: var(--space-4);
}

.card-header,
.card-actions,
.knowledge-base-title-row,
.knowledge-base-meta,
.rag-actions,
.rag-answer-header,
.citation-header,
.citation-tags,
.rag-result-meta {
  display: flex;
  align-items: center;
}

.card-header,
.rag-actions,
.rag-answer-header,
.citation-header {
  justify-content: space-between;
  gap: var(--space-3);
}

.card-actions,
.knowledge-base-title-row,
.knowledge-base-meta,
.citation-tags,
.rag-result-meta {
  gap: var(--space-2);
}

.card-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.card-title-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-title-copy small {
  color: var(--gray-500);
  font-size: 12px;
  font-weight: 400;
}

.knowledge-base-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.knowledge-base-item {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out-expo),
    background-color var(--duration-fast) var(--ease-out-expo);
}

.knowledge-base-item:hover,
.knowledge-base-item.selected {
  border-color: var(--brand-500);
  background: var(--brand-50);
}

.knowledge-base-item:focus-visible {
  outline: 2px solid var(--brand-600);
  outline-offset: 2px;
}

.knowledge-base-title-row {
  justify-content: space-between;
}

.knowledge-base-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--gray-900);
  font-weight: 600;
}

.knowledge-base-description {
  margin: 6px 0 8px;
  color: var(--gray-500);
  font-size: 13px;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.knowledge-base-meta {
  color: var(--gray-500);
  font-size: 12px;
  flex-wrap: wrap;
}

.knowledge-base-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.knowledge-base-meta .el-button {
  margin-left: auto;
}

.document-status-cell {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.document-progress {
  width: 120px;
}

.document-error {
  max-width: 200px;
  color: var(--danger);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spin-icon {
  margin-right: 3px;
  animation: spin 1.2s var(--ease-out-expo) infinite;
  vertical-align: -2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.rag-test-card {
  margin-bottom: var(--space-4);
}

.rag-form {
  max-width: 860px;
}

.rag-actions {
  margin-top: calc(0px - var(--space-3));
}

.rag-result {
  margin-top: var(--space-5);
  border-top: 1px solid var(--gray-100);
  padding-top: var(--space-5);
}

.rag-answer-header h3 {
  margin: 0;
  font-size: 16px;
}

.rag-answer-text,
.citation-content {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.rag-answer-text {
  margin-top: var(--space-3);
  padding: var(--space-4);
  border-left: 3px solid var(--brand-600);
  border-radius: var(--radius-md);
  background: var(--brand-50);
  color: var(--gray-800);
  line-height: 1.8;
}

.rag-result-meta {
  margin-top: var(--space-2);
  color: var(--gray-500);
  font-size: 12px;
  flex-wrap: wrap;
}

.citation-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.citation-card {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  background: var(--el-bg-color);
}

.citation-header {
  align-items: flex-start;
}

.citation-header strong {
  color: var(--gray-800);
  font-size: 13px;
}

.citation-tags {
  justify-content: flex-end;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.citation-content {
  margin: var(--space-2) 0 0;
  color: var(--gray-600);
  font-size: 13px;
  line-height: 1.7;
}

.upload-icon {
  color: var(--gray-400);
}

.upload-progress-block {
  margin-top: var(--space-4);
}

.upload-progress-block p {
  margin: 6px 0 0;
  color: var(--gray-500);
  font-size: 12px;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .spin-icon {
    animation: none;
  }
}

@media (max-width: 768px) {
  .page-header,
  .card-header,
  .citation-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header__actions,
  .card-actions {
    justify-content: flex-start;
  }

  .rag-actions {
    align-items: flex-end;
  }

  .citation-tags {
    justify-content: flex-start;
  }
}
</style>
