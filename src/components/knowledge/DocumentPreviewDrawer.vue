<template>
  <el-drawer
    :model-value="modelValue"
    :title="title"
    size="min(760px, 94vw)"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-loading="loading" class="document-preview">
      <template v-if="preview">
        <el-descriptions :column="2" border class="preview-summary">
          <el-descriptions-item label="文件名">{{ preview.fileName }}</el-descriptions-item>
          <el-descriptions-item label="分块总数">{{ preview.chunkCount }}</el-descriptions-item>
        </el-descriptions>

        <el-empty v-if="!preview.chunks.length" :image-size="84" description="当前页暂无可预览内容" />

        <div v-else class="preview-chunks">
          <article v-for="chunk in preview.chunks" :key="chunkKey(chunk)" class="preview-chunk">
            <div class="chunk-header">
              <strong>片段 {{ chunk.chunkIndex + 1 }}</strong>
              <div class="chunk-meta">
                <el-tag v-if="chunk.pageStart != null && chunk.pageStart > 0" size="small" type="info" effect="plain">
                  {{ pageText(chunk.pageStart, chunk.pageEnd) }}
                </el-tag>
                <el-tag v-if="chunk.sectionPath" size="small" type="info" effect="plain">
                  {{ chunk.sectionPath }}
                </el-tag>
              </div>
            </div>
            <div class="chunk-text">{{ chunk.text || '（空片段）' }}</div>
          </article>
        </div>

        <div v-if="preview.total > preview.pageSize" class="preview-pagination">
          <el-pagination
            :current-page="preview.page"
            :page-size="preview.pageSize"
            :total="preview.total"
            layout="total, prev, pager, next"
            @current-change="emit('page-change', $event)"
          />
        </div>
      </template>

      <el-empty v-else-if="!loading" :image-size="84" description="暂无预览数据" />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import type { KnowledgeDocumentPreview, KnowledgeDocumentPreviewChunk } from '@/types'

withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  loading?: boolean
  preview?: KnowledgeDocumentPreview | null
}>(), {
  title: '文档预览',
  loading: false,
  preview: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'page-change': [page: number]
}>()

function chunkKey(chunk: KnowledgeDocumentPreviewChunk) {
  return `${chunk.chunkId}-${chunk.chunkIndex}`
}

function pageText(start?: number, end?: number) {
  return end != null && start != null && end > start ? `第 ${start}-${end} 页` : `第 ${start} 页`
}
</script>

<style scoped>
.document-preview {
  min-height: 240px;
}

.preview-summary {
  margin-bottom: var(--space-4);
}

.preview-chunks {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.preview-chunk {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  background: var(--el-bg-color);
}

.chunk-header,
.chunk-meta {
  display: flex;
  align-items: center;
}

.chunk-header {
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.chunk-header strong {
  color: var(--gray-800);
  font-size: 13px;
}

.chunk-meta {
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chunk-text {
  color: var(--gray-700);
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.preview-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-4);
}

@media (max-width: 640px) {
  .chunk-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .chunk-meta {
    justify-content: flex-start;
  }
}
</style>
