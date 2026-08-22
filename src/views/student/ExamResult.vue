<template>
  <div v-loading="loading" class="exam-result-terminal">
    <template v-if="record">
      <!-- 成绩与总评大卡片 -->
      <div class="result-summary-card">
        <div class="summary-top-row">
          <!-- 得分精密表盘 -->
          <div class="score-display-box" :class="{ 'is-pass': isPass }">
            <div class="score-digit mono-num">{{ record.score }}</div>
            <div class="score-total-denom mono-num">/ {{ record.paper?.totalScore ?? '-' }} PTS</div>
            <div class="pass-verdict-badge mono-num">
              {{ isPass ? '[PASSED // 及格]' : '[FAILED // 未及格]' }}
            </div>
          </div>

          <!-- 考试基本信息与三态统计 -->
          <div class="summary-info-col">
            <div class="result-badge-row">
              <span class="mono-badge">EXAM_ASSESSMENT_REPORT</span>
              <el-tag :type="examStatusTag(record.status)" size="small" class="mono-num">
                {{ record.status }}
              </el-tag>
            </div>
            <h1 class="paper-name-title">{{ record.paper?.name ?? '考试成绩报告' }}</h1>

            <div class="meta-data-line mono-num">
              <span>CANDIDATE: {{ record.studentName }}</span>
              <span class="divider">/</span>
              <span>DURATION: {{ usedTime }}</span>
              <span v-if="record.windowSwitches" class="divider">/</span>
              <span v-if="record.windowSwitches" class="danger-text">SWITCH_COUNT: {{ record.windowSwitches }}</span>
            </div>

            <div class="stat-pills-row">
              <span class="stat-pill correct mono-num">
                <span class="pill-dot correct-dot"></span>
                CORRECT: {{ stats.correct }}
              </span>
              <span class="stat-pill partial mono-num">
                <span class="pill-dot partial-dot"></span>
                PARTIAL: {{ stats.partial }}
              </span>
              <span class="stat-pill wrong mono-num">
                <span class="pill-dot wrong-dot"></span>
                WRONG: {{ stats.wrong }}
              </span>
            </div>
          </div>

          <!-- 操作按钮组 -->
          <div class="summary-actions-col">
            <el-button class="action-btn mono-num" @click="router.push('/student/records')">
              MY_RECORDS // 我的成绩
            </el-button>
            <el-button type="primary" class="action-btn mono-num" @click="router.push('/student/exams')">
              ANOTHER_EXAM // 再考一场
            </el-button>
          </div>
        </div>

        <!-- 批阅状态提示 / AI 综合评语 -->
        <el-alert
          v-if="record.status === '进行中'"
          type="warning"
          :closable="false"
          show-icon
          title="考试仍在进行中"
          class="alert-block"
        />
        <el-alert
          v-else-if="record.status === '已完成'"
          type="info"
          :closable="false"
          show-icon
          title="试卷已安全提交，系统正在执行 AI 智能批阅与切片分析，页面将自动轮询刷新…"
          class="alert-block"
        />
        <div v-else-if="summary" class="ai-diagnostic-panel">
          <div class="diagnostic-head">
            <span class="diagnostic-dot"></span>
            <span class="diagnostic-title">AI_DIAGNOSTIC_ANALYSIS // 智能学情综合评语</span>
          </div>
          <p class="diagnostic-body">{{ summary }}</p>
        </div>
      </div>

      <!-- 逐题复盘详情 -->
      <div v-if="answerItems.length" class="review-section">
        <div class="section-header-row">
          <div class="section-title-group">
            <h2 class="section-title">逐题答卷与解析复盘</h2>
            <span class="mono-text">QUESTION_BY_QUESTION_BREAKDOWN</span>
          </div>
          <span class="mono-badge">TOTAL: {{ answerItems.length }} ITEMS</span>
        </div>

        <div class="question-cards-list">
          <div v-for="(item, index) in answerItems" :key="item.record.id" class="review-question-card">
            <QuestionReviewCard
              :index="index"
              :question="item.question"
              :title-fallback="`题目#${item.record.questionId}`"
              :score-text="`${item.record.score ?? 0} 分`"
            >
              <template #status>
                <el-tag :type="correctTag(item.record.isCorrect)" size="small" class="mono-num">
                  {{ correctText(item.record.isCorrect) }}
                </el-tag>
              </template>
              <template #answer>
                <span class="user-answer-line">
                  考生作答：<el-text :type="item.record.isCorrect === 1 ? 'success' : 'danger'" class="mono-num">{{ item.record.userAnswer || '（未作答）' }}</el-text>
                </span>
              </template>
              <template #feedback>
                <div v-if="item.record.aiCorrection" class="ai-item-feedback">
                  <span class="feedback-label">AI_FEEDBACK:</span>
                  <span class="feedback-text">{{ item.record.aiCorrection }}</span>
                </div>
              </template>
            </QuestionReviewCard>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getExamDetail } from '@/api/exam'
import QuestionReviewCard from '@/components/question/QuestionReviewCard.vue'
import type { AnswerRecord, ExamRecord, Question } from '@/types'
import { examStatusTag } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const record = ref<ExamRecord | null>(null)

const isPass = computed(() => {
  const total = Number(record.value?.paper?.totalScore ?? 0)
  return total > 0 && (record.value?.score ?? 0) >= total * 0.6
})

const usedTime = computed(() => {
  const start = record.value?.startTime
  const end = record.value?.endTime
  if (!start || !end) return '-'
  const ms = new Date(end.replace(' ', 'T')).getTime() - new Date(start.replace(' ', 'T')).getTime()
  const minutes = Math.max(0, Math.round(ms / 60000))
  return `${minutes} MIN`
})

const summary = computed(() => {
  const raw = record.value?.answers
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw)
    return parsed.summary ?? raw
  } catch {
    return raw
  }
})

const answerItems = computed(() => {
  const questions = new Map<number, Question>()
  for (const q of record.value?.paper?.questions ?? []) {
    if (q.id != null) questions.set(q.id, q)
  }
  return (record.value?.answerRecords ?? []).map((r: AnswerRecord) => ({
    record: r,
    question: questions.get(r.questionId),
  }))
})

const stats = computed(() => {
  const items = record.value?.answerRecords ?? []
  return {
    correct: items.filter((r) => r.isCorrect === 1).length,
    partial: items.filter((r) => r.isCorrect === 2).length,
    wrong: items.filter((r) => r.isCorrect === 0).length,
  }
})

function correctText(isCorrect?: number) {
  return { 0: '错误', 1: '正确', 2: '部分正确' }[isCorrect ?? -1] ?? '未批阅'
}

function correctTag(isCorrect?: number): 'success' | 'danger' | 'warning' | 'info' {
  return ({ 0: 'danger', 1: 'success', 2: 'warning' }[isCorrect ?? -1] ?? 'info') as never
}

let pollTimer: number | undefined

function schedulePoll() {
  if (pollTimer != null) return
  pollTimer = window.setTimeout(async () => {
    pollTimer = undefined
    try {
      record.value = await getExamDetail(Number(route.params.recordId))
    } catch {
      // 静默重试
    }
    if (record.value?.status === '已完成') {
      schedulePoll()
    }
  }, 3000)
}

onMounted(async () => {
  loading.value = true
  try {
    record.value = await getExamDetail(Number(route.params.recordId))
  } finally {
    loading.value = false
  }
  if (record.value?.status === '已完成') {
    schedulePoll()
  }
})

onBeforeUnmount(() => {
  if (pollTimer != null) {
    window.clearTimeout(pollTimer)
  }
})
</script>

<style scoped>
.exam-result-terminal {
  min-height: 100%;
}

/* ============ 成绩总评大卡片 ============ */
.result-summary-card {
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: var(--space-5);
}

.summary-top-row {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* 得分精密表盘：全周发丝边框，无单侧粗条 */
.score-display-box {
  width: 140px;
  height: 120px;
  background: var(--surface-2);
  border: 1px solid var(--danger);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 8px;
}

.score-display-box.is-pass {
  border-color: var(--brand-600);
  background: color-mix(in srgb, var(--brand-600) 8%, var(--surface-2));
}

.score-digit {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-strong);
  letter-spacing: -0.03em;
}

.score-total-denom {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.pass-verdict-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--danger);
  margin-top: 4px;
}

.score-display-box.is-pass .pass-verdict-badge {
  color: var(--brand-600);
}

.summary-info-col {
  flex: 1;
  min-width: 0;
}

.result-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.mono-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--brand-600);
  background: color-mix(in srgb, var(--brand-600) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--brand-600) 25%, transparent);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}

.paper-name-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-strong);
}

.meta-data-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.divider {
  color: var(--border-strong);
}

.danger-text {
  color: var(--danger);
  font-weight: 700;
}

.stat-pills-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
  background: var(--surface-2);
}

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.pill-dot.correct-dot {
  background: var(--brand-600);
}

.pill-dot.partial-dot {
  background: var(--warning);
}

.pill-dot.wrong-dot {
  background: var(--danger);
}

.stat-pill.correct {
  color: var(--brand-600);
  border-color: color-mix(in srgb, var(--brand-600) 30%, transparent);
}

.stat-pill.partial {
  color: var(--warning);
  border-color: color-mix(in srgb, var(--warning) 30%, transparent);
}

.stat-pill.wrong {
  color: var(--danger);
  border-color: color-mix(in srgb, var(--danger) 30%, transparent);
}

.summary-actions-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  font-size: 11px;
  font-weight: 700;
  height: 34px;
}

.alert-block {
  margin-top: 16px;
}

/* AI 诊断分析：发丝全边框 + 微发光 */
.ai-diagnostic-panel {
  margin-top: 16px;
  background: color-mix(in srgb, var(--brand-600) 6%, var(--surface-2));
  border: 1px solid color-mix(in srgb, var(--brand-600) 25%, transparent);
  border-radius: var(--radius-md);
  padding: 14px 18px;
}

.diagnostic-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.diagnostic-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-600);
}

.diagnostic-title {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--brand-600);
}

.diagnostic-body {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-primary);
}

/* ============ 逐题复盘列表 ============ */
.review-section {
  margin-top: var(--space-4);
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.section-title-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.review-question-card {
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  margin-bottom: 12px;
}

.user-answer-line {
  font-size: 13px;
}

.ai-item-feedback {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.feedback-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--brand-600);
  margin-right: 6px;
}

.mono-num,
.mono-text {
  font-family: var(--font-mono);
}
</style>
