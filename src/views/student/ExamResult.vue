<template>
  <div v-loading="loading" class="exam-result">
    <template v-if="record">
      <!-- 成绩概览 -->
      <el-card shadow="never" class="result-card">
        <div class="result-head">
          <div class="score-circle" :class="{ pass: isPass }">
            <div class="score-num">{{ record.score }}</div>
            <div class="score-total">/ {{ record.paper?.totalScore ?? '-' }} 分</div>
          </div>
          <div class="result-info">
            <span class="result-kicker">考试结果</span>
            <h2>{{ record.paper?.name ?? '考试结果' }}</h2>
            <div class="meta-line">
              <el-tag :type="examStatusTag(record.status)" size="small">{{ record.status }}</el-tag>
              <span>考生：{{ record.studentName }}</span>
              <span>用时：{{ usedTime }}</span>
              <span v-if="record.windowSwitches">切屏：{{ record.windowSwitches }} 次</span>
            </div>
            <div class="stat-line">
              <span class="stat correct">答对 {{ stats.correct }}</span>
              <span class="stat partial">部分正确 {{ stats.partial }}</span>
              <span class="stat wrong">答错 {{ stats.wrong }}</span>
            </div>
          </div>
          <div class="actions">
            <el-button @click="router.push('/student/records')">我的成绩</el-button>
            <el-button type="primary" @click="router.push('/student/exams')">再考一场</el-button>
          </div>
        </div>

        <!-- AI 总评 -->
        <el-alert v-if="record.status === '进行中'" type="warning" :closable="false" show-icon title="考试仍在进行中" style="margin-top: 16px" />
        <el-alert v-else-if="record.status === '已完成'" type="info" :closable="false" show-icon style="margin-top: 16px">
          <template #title>试卷已提交，系统正在批阅，页面会自动刷新，无需手动操作…</template>
        </el-alert>
        <div v-else-if="summary" class="ai-summary">
          <div class="summary-title">综合评语</div>
          <p>{{ summary }}</p>
        </div>
      </el-card>

      <!-- 逐题解析 -->
      <h3 v-if="answerItems.length" class="section-title">答题详情</h3>
      <el-card v-for="(item, index) in answerItems" :key="item.record.id" shadow="never" class="question-card">
        <QuestionReviewCard
          :index="index"
          :question="item.question"
          :title-fallback="`题目#${item.record.questionId}`"
          :score-text="`${item.record.score ?? 0} 分`"
        >
          <template #status>
            <el-tag :type="correctTag(item.record.isCorrect)" size="small" effect="dark">
              {{ correctText(item.record.isCorrect) }}
            </el-tag>
          </template>
          <template #answer>
            <span>我的答案：<el-text :type="item.record.isCorrect === 1 ? 'success' : 'danger'">{{ item.record.userAnswer || '（未作答）' }}</el-text></span>
          </template>
          <template #feedback>
            <el-alert v-if="item.record.aiCorrection" type="info" :closable="false" :title="`点评：${item.record.aiCorrection}`" />
          </template>
        </QuestionReviewCard>
      </el-card>
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
  return `${minutes} 分钟`
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

// ---- 批阅中自动轮询：交卷后 AI 批阅是异步的，"已完成"状态需要轮询直到变成"已批阅" ----
let pollTimer: number | undefined

function schedulePoll() {
  if (pollTimer != null) return
  pollTimer = window.setTimeout(async () => {
    pollTimer = undefined
    try {
      record.value = await getExamDetail(Number(route.params.recordId))
    } catch {
      // 轮询失败静默重试，不打断页面展示
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
.result-card {
  margin-bottom: 28px;
  overflow: hidden;
  border: 1px solid var(--border-default);
  background: var(--surface-1);
  box-shadow: none;
}

.result-card :deep(.el-card__body) {
  padding: 28px;
}

.result-head {
  display: flex;
  align-items: center;
  gap: 28px;
}

.score-circle {
  width: 126px;
  height: 110px;
  border: 1px solid var(--border-default);
  border-left: 4px solid var(--danger);
  border-radius: var(--radius-md);
  background: var(--danger-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.score-circle.pass {
  border-color: var(--border-default);
  border-left-color: var(--success);
  background: var(--success-bg);
}

.score-num {
  font-size: 34px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: var(--text-strong);
}

.score-total {
  font-size: 13px;
  color: var(--text-muted);
}

.result-info {
  flex: 1;
}

.result-info h2 {
  margin: 5px 0 12px;
  font-size: 23px;
  color: var(--text-strong);
}

.result-kicker {
  color: var(--brand-600);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.meta-line {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 10px;
}

.stat-line {
  display: flex;
  gap: 12px;
}

.stat {
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
}

.stat.correct {
  background: var(--success-bg);
  color: var(--success);
}

.stat.partial {
  background: var(--warning-bg);
  color: var(--warning);
}

.stat.wrong {
  background: var(--danger-bg);
  color: var(--danger);
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.ai-summary {
  margin-top: 16px;
  background: var(--brand-50);
  border-left: 3px solid var(--brand-600);
  border-radius: var(--radius-md);
  padding: 16px 20px;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--brand-700);
  margin-bottom: 8px;
}

.ai-summary p {
  margin: 0;
  line-height: 1.8;
  color: var(--text-secondary);
}

.section-title {
  margin: 0 0 12px;
}

.question-card {
  margin-bottom: 16px;
}

.question-card :deep(.el-card__body) {
  padding: 22px 24px;
}

@media (max-width: 768px) {
  .result-card :deep(.el-card__body) {
    padding: 22px 18px;
  }

  .result-head {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .meta-line,
  .stat-line,
  .actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .meta-line {
    gap: 8px 12px;
  }

  .question-card :deep(.el-card__body) {
    padding: 18px;
  }
}
</style>
