<template>
  <div class="knowledge-library">
    <AppPageHeader title="学习资料库" description="阅读教师发布的课程资料，并通过带引用的 AI 回答巩固知识">
      <template #actions>
        <el-button v-if="!accessForbidden" :icon="Refresh" :loading="knowledgeBaseLoading" @click="loadKnowledgeBases">刷新</el-button>
      </template>
    </AppPageHeader>

    <el-result
      v-if="accessForbidden"
      icon="warning"
      title="考试进行中，学习资料库暂不可用"
      :sub-title="forbiddenMessage"
    >
      <template #extra>
        <el-button @click="router.push('/student/home')">返回首页</el-button>
        <el-button type="primary" @click="router.push('/student/records')">查看我的考试</el-button>
      </template>
    </el-result>

    <el-result v-else-if="loadError" icon="error" title="资料库加载失败" :sub-title="loadError">
      <template #extra>
        <el-button type="primary" @click="loadKnowledgeBases">重新加载</el-button>
      </template>
    </el-result>

    <template v-else>
      <el-row :gutter="16" class="library-layout">
        <el-col :xs="24" :lg="7">
          <el-card v-loading="knowledgeBaseLoading" shadow="never" class="knowledge-base-card">
            <template #header>已发布知识库（{{ knowledgeBases.length }}）</template>

            <el-empty
              v-if="!knowledgeBases.length && !knowledgeBaseLoading"
              :image-size="90"
              description="教师暂未发布学习资料"
            />

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
                <div class="knowledge-base-title">
                  <span>{{ item.name }}</span>
                  <el-tag size="small" type="success" effect="plain">已发布</el-tag>
                </div>
                <p>{{ item.description || '暂无描述' }}</p>
                <div class="knowledge-base-meta">
                  <span><el-icon><Files /></el-icon>{{ item.documentCount ?? 0 }} 份资料</span>
                  <span v-if="item.publishedAt">发布于 {{ formatDate(item.publishedAt) }}</span>
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
                    <span>{{ selectedKnowledgeBase.name }} · 学习文档</span>
                    <small>点击预览可按分块阅读已建立索引的正文</small>
                  </div>
                </div>
              </template>

              <el-table
                v-loading="documentLoading"
                :data="documents"
                row-key="id"
                stripe
                empty-text="该知识库暂无可阅读文档"
              >
                <el-table-column prop="fileName" label="文件名" min-width="240" show-overflow-tooltip />
                <el-table-column label="大小" width="100">
                  <template #default="{ row }">{{ formatFileSize(row.sizeBytes) }}</template>
                </el-table-column>
                <el-table-column prop="chunkCount" label="片段数" width="90">
                  <template #default="{ row }">{{ row.chunkCount ?? '-' }}</template>
                </el-table-column>
                <el-table-column label="更新时间" width="170">
                  <template #default="{ row }">{{ formatDateTime(row.updatedAt || row.createdAt) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="90" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" :icon="View" @click="openDocumentPreview(row)">预览</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>

            <el-card shadow="never" class="question-card">
              <template #header>
                <div class="card-title-copy">
                  <span>向资料库提问</span>
                  <small>回答只用于辅助学习，请结合下方引用原文核验</small>
                </div>
              </template>

              <el-form label-position="top" class="question-form">
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
                <el-form-item label="问题" required>
                  <el-input
                    v-model="question"
                    type="textarea"
                    :rows="4"
                    maxlength="2000"
                    show-word-limit
                    placeholder="例如：请根据课程资料解释这个概念，并指出原文依据"
                    @keydown.ctrl.enter.prevent="handleAsk"
                  />
                </el-form-item>
                <div class="question-actions">
                  <el-text type="info" size="small">快捷键：Ctrl + Enter</el-text>
                  <el-button type="primary" :icon="Search" :loading="asking" @click="handleAsk">
                    {{ asking ? '正在查找资料…' : '基于资料回答' }}
                  </el-button>
                </div>
              </el-form>

              <RagAnswerPanel :result="ragResult" empty-citation-text="未找到可核验引用，请调整问题或检索范围" />
            </el-card>
          </template>

          <el-card v-else shadow="never">
            <el-empty description="请选择一个知识库开始学习" />
          </el-card>
        </el-col>
      </el-row>
    </template>

    <DocumentPreviewDrawer
      v-model="previewVisible"
      :title="previewDocument ? `阅读 · ${previewDocument.fileName}` : '文档预览'"
      :loading="previewLoading"
      :preview="documentPreview"
      @page-change="loadDocumentPreview"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Files, Refresh, Search, View } from '@element-plus/icons-vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import DocumentPreviewDrawer from '@/components/knowledge/DocumentPreviewDrawer.vue'
import RagAnswerPanel from '@/components/knowledge/RagAnswerPanel.vue'
import {
  answerWithStudentRag,
  listStudentKnowledgeBases,
  listStudentKnowledgeDocuments,
  previewStudentKnowledgeDocument,
} from '@/api/knowledge'
import { getApiErrorMessage, getApiErrorStatus } from '@/api/request'
import type {
  KnowledgeDocument,
  KnowledgeDocumentPreview,
  RagAnswer,
  StudentKnowledgeBase,
} from '@/types'

const router = useRouter()
const knowledgeBaseLoading = ref(false)
const documentLoading = ref(false)
const knowledgeBases = ref<StudentKnowledgeBase[]>([])
const documents = ref<KnowledgeDocument[]>([])
const selectedKnowledgeBaseId = ref<number>()
const selectedKnowledgeBase = computed(() =>
  knowledgeBases.value.find((item) => item.id === selectedKnowledgeBaseId.value),
)
const accessForbidden = ref(false)
const forbiddenMessage = ref('考试结束并交卷后即可继续使用学习资料库。')
const loadError = ref('')

function handleAccessError(error: unknown) {
  if (getApiErrorStatus(error) !== 403) return false
  accessForbidden.value = true
  forbiddenMessage.value = getApiErrorMessage(error, '考试进行中，暂不能访问学习资料库。')
  knowledgeBases.value = []
  documents.value = []
  selectedKnowledgeBaseId.value = undefined
  previewVisible.value = false
  return true
}

async function loadKnowledgeBases() {
  knowledgeBaseLoading.value = true
  accessForbidden.value = false
  loadError.value = ''
  try {
    const data = await listStudentKnowledgeBases()
    knowledgeBases.value = data ?? []
    const existingIds = new Set(knowledgeBases.value.map((item) => item.id))
    const nextId = selectedKnowledgeBaseId.value != null && existingIds.has(selectedKnowledgeBaseId.value)
      ? selectedKnowledgeBaseId.value
      : knowledgeBases.value[0]?.id
    selectedKnowledgeBaseId.value = nextId
    ragKnowledgeBaseIds.value = ragKnowledgeBaseIds.value.filter((id) => existingIds.has(id))
    if (!ragKnowledgeBaseIds.value.length && nextId != null) ragKnowledgeBaseIds.value = [nextId]
  } catch (error) {
    if (!handleAccessError(error)) loadError.value = getApiErrorMessage(error, '无法加载学习资料库')
    return
  } finally {
    knowledgeBaseLoading.value = false
  }
  await loadDocuments()
}

function selectKnowledgeBase(item: StudentKnowledgeBase) {
  if (selectedKnowledgeBaseId.value === item.id) return
  selectedKnowledgeBaseId.value = item.id
  documents.value = []
  previewVisible.value = false
  loadDocuments().catch(() => {})
}

async function loadDocuments() {
  const knowledgeBaseId = selectedKnowledgeBaseId.value
  if (!knowledgeBaseId) {
    documents.value = []
    return
  }
  documentLoading.value = true
  try {
    const data = await listStudentKnowledgeDocuments(knowledgeBaseId)
    if (selectedKnowledgeBaseId.value === knowledgeBaseId) documents.value = data ?? []
  } catch (error) {
    if (!handleAccessError(error)) {
      documents.value = []
      ElMessage.error(getApiErrorMessage(error, '学习文档加载失败'))
    }
  } finally {
    documentLoading.value = false
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
    const preview = await previewStudentKnowledgeDocument(knowledgeBaseId, document.id, page, PREVIEW_PAGE_SIZE)
    if (
      requestSequence === previewRequestSequence
      && selectedKnowledgeBaseId.value === knowledgeBaseId
      && previewDocument.value?.id === document.id
    ) {
      documentPreview.value = { ...preview, chunks: preview.chunks ?? [] }
    }
  } catch (error) {
    if (requestSequence !== previewRequestSequence) return
    if (handleAccessError(error)) {
      previewVisible.value = false
    } else {
      ElMessage.error(getApiErrorMessage(error, '文档预览加载失败'))
    }
  } finally {
    if (requestSequence === previewRequestSequence) previewLoading.value = false
  }
}

const ragKnowledgeBaseIds = ref<number[]>([])
const question = ref('')
const asking = ref(false)
const ragResult = ref<RagAnswer | null>(null)

async function handleAsk() {
  const normalizedQuestion = question.value.trim()
  if (!ragKnowledgeBaseIds.value.length) {
    ElMessage.warning('请至少选择一个知识库')
    return
  }
  if (!normalizedQuestion) {
    ElMessage.warning('请输入问题')
    return
  }
  asking.value = true
  ragResult.value = null
  try {
    const result = await answerWithStudentRag({
      knowledgeBaseIds: [...ragKnowledgeBaseIds.value],
      question: normalizedQuestion,
    })
    ragResult.value = { ...result, citations: result.citations ?? [] }
  } catch (error) {
    if (!handleAccessError(error)) ElMessage.error(getApiErrorMessage(error, '资料问答失败，请稍后重试'))
  } finally {
    asking.value = false
  }
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

function formatDate(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 10) : '-'
}

onMounted(() => {
  loadKnowledgeBases().catch(() => {})
})
</script>

<style scoped>
.library-layout {
  align-items: flex-start;
}

.knowledge-base-card,
.question-card {
  margin-bottom: var(--space-4);
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
  padding: var(--space-3);
  background: var(--surface-2);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out-expo),
    background-color var(--duration-fast) var(--ease-out-expo);
}

.knowledge-base-item:hover {
  border-color: var(--border-strong);
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

.knowledge-base-title,
.knowledge-base-meta,
.card-header,
.question-actions {
  display: flex;
  align-items: center;
}

.knowledge-base-title,
.card-header,
.question-actions {
  justify-content: space-between;
  gap: var(--space-3);
}

.knowledge-base-title span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-strong);
  font-weight: 600;
}

.knowledge-base-item p {
  margin: 6px 0 8px;
  color: var(--text-muted);
  font-size: 13px;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.knowledge-base-meta {
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: 11px;
  flex-wrap: wrap;
}

.knowledge-base-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.card-title-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-title-copy small {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 400;
}

.question-form {
  max-width: 860px;
}

.question-actions {
  align-items: flex-end;
  margin-top: calc(0px - var(--space-3));
}

</style>
