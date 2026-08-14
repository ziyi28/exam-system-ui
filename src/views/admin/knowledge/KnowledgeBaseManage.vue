<template>
  <div>
    <AppPageHeader title="AI 知识库" description="上传可信资料并建立向量索引；教师可在入题前验证检索答案与引用依据">
      <template #actions>
        <el-button :icon="Refresh" :loading="knowledgeBaseLoading" @click="refreshAll">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建知识库</el-button>
      </template>
    </AppPageHeader>

    <el-row :gutter="16" class="knowledge-layout">
      <el-col :xs="24" :lg="7">
        <el-card v-loading="knowledgeBaseLoading" shadow="never" class="knowledge-base-card workspace-card">
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
                <div class="knowledge-base-tags">
                  <el-tag :type="item.published ? 'success' : 'info'" size="small" effect="plain">
                    {{ item.published ? '已发布' : '未发布' }}
                  </el-tag>
                  <el-tag :type="knowledgeBaseStatusTag(item.status)" size="small" effect="plain">
                    {{ knowledgeBaseStatusText(item.status) }}
                  </el-tag>
                </div>
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
          <el-card shadow="never" class="page-card workspace-card">
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
                  <el-button
                    :type="selectedKnowledgeBase.published ? 'warning' : 'success'"
                    plain
                    :loading="publicationUpdatingId === selectedKnowledgeBase.id"
                    @click="handlePublicationChange(selectedKnowledgeBase)"
                  >
                    {{ selectedKnowledgeBase.published ? '下架' : '发布' }}
                  </el-button>
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
              <el-table-column label="操作" width="240" fixed="right">
                <template #default="{ row }">
                  <el-button
                    v-if="isDocumentReady(row)"
                    link
                    type="primary"
                    @click="openDocumentPreview(row)"
                  >
                    预览
                  </el-button>
                  <el-button
                    v-if="isDocumentReady(row)"
                    link
                    type="warning"
                    :loading="retryingDocumentId === row.id"
                    @click="handleReindexDocument(row)"
                  >
                    重建索引
                  </el-button>
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

          <el-card shadow="never" class="rag-test-card workspace-card">
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

            <RagAnswerPanel :result="ragResult" empty-citation-text="本次回答未返回可核验引用" />
          </el-card>
        </template>

        <el-card v-else shadow="never" class="workspace-card">
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

    <DocumentPreviewDrawer
      v-model="previewVisible"
      :title="previewDocument ? `预览 · ${previewDocument.fileName}` : '文档预览'"
      :loading="previewLoading"
      :preview="documentPreview"
      @page-change="loadDocumentPreview"
    />
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
import DocumentPreviewDrawer from '@/components/knowledge/DocumentPreviewDrawer.vue'
import RagAnswerPanel from '@/components/knowledge/RagAnswerPanel.vue'
import {
  answerWithRag,
  createKnowledgeBase,
  deleteKnowledgeBase,
  deleteKnowledgeDocument,
  listKnowledgeBases,
  listKnowledgeDocuments,
  previewKnowledgeDocument,
  retryKnowledgeDocument,
  updateKnowledgeBasePublication,
  uploadKnowledgeDocument,
} from '@/api/knowledge'
import type {
  KnowledgeBase,
  KnowledgeDocument,
  KnowledgeDocumentPreview,
  RagAnswer,
} from '@/types'

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
const publicationUpdatingId = ref<number>()
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
  previewVisible.value = false
  stopDocumentPolling(true)
  loadDocuments().catch(() => {})
}

async function handlePublicationChange(item: KnowledgeBase) {
  const published = !item.published
  const action = published ? '发布' : '下架'
  await ElMessageBox.confirm(
    published
      ? `发布「${item.name}」后，学生可浏览其中已就绪的文档并基于资料提问。确定发布吗？`
      : `下架「${item.name}」后，学生将无法继续浏览或基于该知识库提问。确定下架吗？`,
    `${action}知识库`,
    { type: 'warning', confirmButtonText: action },
  )
  publicationUpdatingId.value = item.id
  try {
    const updated = await updateKnowledgeBasePublication(item.id, published)
    knowledgeBases.value = knowledgeBases.value.map((knowledgeBase) =>
      knowledgeBase.id === item.id
        ? { ...knowledgeBase, ...updated, published: updated?.published ?? published }
        : knowledgeBase,
    )
    ElMessage.success(`知识库已${action}`)
  } finally {
    publicationUpdatingId.value = undefined
  }
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
  const wasPublished = Boolean(selectedKnowledgeBase.value?.published)
  uploadingDocument.value = true
  uploadProgress.value = 0
  try {
    await uploadKnowledgeDocument(knowledgeBaseId, file, (percent) => {
      uploadProgress.value = percent
    })
    uploadDialogVisible.value = false
    await loadKnowledgeBaseData(knowledgeBaseId)
    const automaticallyUnpublished = wasPublished && !selectedKnowledgeBase.value?.published
    ElMessage.success(automaticallyUnpublished
      ? '文档已提交，知识库因内容变化自动下架；请在索引完成并预览后重新发布'
      : '文档上传成功，后台正在建立索引')
  } finally {
    uploadingDocument.value = false
  }
}

async function handleRetryDocument(document: KnowledgeDocument) {
  const knowledgeBaseId = selectedKnowledgeBaseId.value
  const wasPublished = Boolean(selectedKnowledgeBase.value?.published)
  retryingDocumentId.value = document.id
  try {
    await retryKnowledgeDocument(document.id)
    await loadKnowledgeBaseData(knowledgeBaseId)
    const automaticallyUnpublished = wasPublished && !selectedKnowledgeBase.value?.published
    ElMessage.success(automaticallyUnpublished
      ? '已重新提交索引，知识库因内容变化自动下架；请预览后重新发布'
      : '已重新提交索引任务')
  } finally {
    retryingDocumentId.value = undefined
  }
}

async function handleReindexDocument(document: KnowledgeDocument) {
  await ElMessageBox.confirm(
    `将按最新切分规则重建「${document.fileName}」的索引。知识库会自动下架，完成后请预览并重新发布。`,
    '重建索引',
    {
      type: 'warning',
      confirmButtonText: '开始重建',
      cancelButtonText: '取消',
    },
  )
  const knowledgeBaseId = selectedKnowledgeBaseId.value
  retryingDocumentId.value = document.id
  try {
    await retryKnowledgeDocument(document.id, true)
    await loadKnowledgeBaseData(knowledgeBaseId)
    ElMessage.success('索引重建已提交；完成后请预览并重新发布知识库')
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
  const knowledgeBaseId = selectedKnowledgeBaseId.value
  const wasPublished = Boolean(selectedKnowledgeBase.value?.published)
  deletingDocumentId.value = document.id
  try {
    await deleteKnowledgeDocument(document.id)
    if (previewDocument.value?.id === document.id) previewVisible.value = false
    await loadKnowledgeBaseData(knowledgeBaseId)
    const automaticallyUnpublished = wasPublished && !selectedKnowledgeBase.value?.published
    ElMessage.success(automaticallyUnpublished
      ? '文档已删除，知识库已自动下架；请确认剩余内容后重新发布'
      : '文档已删除')
  } finally {
    deletingDocumentId.value = undefined
  }
}

const previewVisible = ref(false)
const previewLoading = ref(false)
const previewDocument = ref<KnowledgeDocument | null>(null)
const documentPreview = ref<KnowledgeDocumentPreview | null>(null)
const PREVIEW_PAGE_SIZE = 20
let previewRequestSequence = 0

function openDocumentPreview(document: KnowledgeDocument) {
  previewDocument.value = document
  documentPreview.value = null
  previewVisible.value = true
  loadDocumentPreview(1).catch(() => {})
}

async function loadDocumentPreview(page: number) {
  const knowledgeBaseId = selectedKnowledgeBaseId.value
  const document = previewDocument.value
  if (!knowledgeBaseId || !document) return
  const requestSequence = ++previewRequestSequence
  previewLoading.value = true
  try {
    const preview = await previewKnowledgeDocument(knowledgeBaseId, document.id, page, PREVIEW_PAGE_SIZE)
    if (
      requestSequence === previewRequestSequence
      && selectedKnowledgeBaseId.value === knowledgeBaseId
      && previewDocument.value?.id === document.id
    ) {
      documentPreview.value = { ...preview, chunks: preview.chunks ?? [] }
    }
  } finally {
    if (requestSequence === previewRequestSequence) previewLoading.value = false
  }
}

const ragKnowledgeBaseIds = ref<number[]>([])
const ragQuestion = ref('')
const ragAsking = ref(false)
const ragResult = ref<RagAnswer | null>(null)

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
.knowledge-base-tags,
.knowledge-base-meta,
.rag-actions {
  display: flex;
  align-items: center;
}

.card-header,
.rag-actions {
  justify-content: space-between;
  gap: var(--space-3);
}

.card-actions,
.knowledge-base-title-row,
.knowledge-base-tags,
.knowledge-base-meta {
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
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 400;
}

.knowledge-base-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.knowledge-base-item {
  position: relative;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  background: var(--surface-2);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out-expo),
    background-color var(--duration-fast) var(--ease-out-expo);
}

.knowledge-base-item:hover {
  border-color: var(--border-strong);
  background: var(--surface-2);
}

.knowledge-base-item.selected {
  border-color: var(--brand-600);
  background: var(--brand-50);
}

.knowledge-base-item.selected::before {
  content: '';
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: -1px;
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--brand-600), var(--accent-violet));
}

.knowledge-base-item:focus-visible {
  outline: 2px solid var(--brand-600);
  outline-offset: 2px;
}

.knowledge-base-title-row {
  justify-content: space-between;
}

.knowledge-base-tags {
  flex-shrink: 0;
}

.knowledge-base-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-strong);
  font-weight: 600;
}

.knowledge-base-description {
  margin: 6px 0 8px;
  color: var(--text-muted);
  font-size: 13px;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.knowledge-base-meta {
  color: var(--text-muted);
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

.upload-icon {
  color: var(--text-muted);
}

.upload-progress-block {
  margin-top: var(--space-4);
}

.upload-progress-block p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .spin-icon {
    animation: none;
  }
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .card-actions {
    justify-content: flex-start;
  }

  .rag-actions {
    align-items: flex-end;
  }
}
</style>
