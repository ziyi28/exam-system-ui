<template>
  <div v-if="result" class="rag-answer-panel">
    <div class="rag-answer-panel__header">
      <h3>回答</h3>
      <el-tag :type="evidenceStatusTag(result.evidenceStatus)" effect="plain">
        {{ evidenceStatusText(result.evidenceStatus) }}
      </el-tag>
    </div>
    <div class="rag-answer-panel__text">{{ result.answer || '未生成回答' }}</div>
    <div v-if="result.model || result.latencyMs != null" class="rag-answer-panel__meta">
      <span v-if="result.model">模型：{{ result.model }}</span>
      <span v-if="result.latencyMs != null">耗时：{{ formatLatency(result.latencyMs) }}</span>
    </div>

    <el-divider content-position="left">引用依据（{{ result.citations.length }}）</el-divider>
    <el-empty
      v-if="!result.citations.length"
      :image-size="72"
      :description="emptyCitationText"
    />
    <div v-else class="rag-answer-panel__citations">
      <article
        v-for="(citation, index) in result.citations"
        :key="citationKey(citation, index)"
        class="citation-card"
      >
        <div class="citation-card__header">
          <strong>{{ index + 1 }}. {{ citation.documentName || `文档 #${citation.documentId}` }}</strong>
          <div class="citation-card__tags">
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
        <p class="citation-card__quote">{{ citation.quote || '（无可展示片段）' }}</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RagAnswer, RagCitation } from '@/types'

withDefaults(defineProps<{
  result: RagAnswer | null
  emptyCitationText: string
}>(), {
  result: null,
})

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

function normalizeStatus(status?: string) {
  return (status || '').trim().toUpperCase()
}

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
</script>

<style scoped>
.rag-answer-panel {
  margin-top: var(--space-5);
  border-top: 1px solid var(--border-subtle);
  padding-top: var(--space-5);
}

.rag-answer-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.rag-answer-panel__header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.rag-answer-panel__text,
.citation-card__quote {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.rag-answer-panel__text {
  margin-top: var(--space-3);
  padding: var(--space-4);
  border: 1px solid color-mix(in srgb, var(--brand-600) 25%, transparent);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--brand-600) 6%, var(--surface-1));
  color: var(--text-primary);
  line-height: 1.7;
  font-size: 13px;
}

.rag-answer-panel__meta {
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: 11px;
  font-family: var(--font-mono);
  flex-wrap: wrap;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.rag-answer-panel__citations {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.citation-card {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  background: var(--surface-1);
}

.citation-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.citation-card__header strong {
  color: var(--text-primary);
  font-size: 13px;
}

.citation-card__tags {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--space-2);
  flex-shrink: 0;
}

.citation-card__quote {
  margin: var(--space-2) 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 768px) {
  .citation-card__header {
    flex-direction: column;
  }

  .citation-card__tags {
    justify-content: flex-start;
  }
}
</style>
