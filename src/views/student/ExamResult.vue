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
          <template #title>试卷已提交，AI 批阅中，稍后刷新查看成绩与评语</template>
        </el-alert>
        <div v-else-if="summary" class="ai-summary">
          <div class="summary-title"><el-icon><MagicStick /></el-icon> AI 智能总评</div>
          <p>{{ summary }}</p>
        </div>
      </el-card>

      <!-- 逐题解析 -->
      <h3 v-if="answerItems.length" class="section-title">答题详情</h3>
      <el-card v-for="(item, index) in answerItems" :key="item.record.id" shadow="never" class="question-card">
        <div class="question-title">
          <span class="q-index">{{ index + 1 }}.</span>
          <el-tag v-if="item.question" :type="typeTag(item.question.type)" size="small">
            {{ typeText(item.question.type, item.question.multi) }}
          </el-tag>
          <el-tag :type="correctTag(item.record.isCorrect)" size="small" effect="dark">
            {{ correctText(item.record.isCorrect) }} · {{ item.record.score ?? 0 }} 分
          </el-tag>
          <span class="title-text">{{ item.question?.title ?? `题目#${item.record.questionId}` }}</span>
        </div>
        <div v-if="item.question?.choices?.length" class="choices">
          <div v-for="(c, ci) in item.question.choices" :key="ci" class="choice" :class="{ correct: c.isCorrect }">
            {{ letter(ci) }}. {{ c.content }}
            <el-icon v-if="c.isCorrect" class="check-icon"><Check /></el-icon>
          </div>
        </div>
        <div class="answer-compare">
          <span>我的答案：<el-text :type="item.record.isCorrect === 1 ? 'success' : 'danger'">{{ item.record.userAnswer || '（未作答）' }}</el-text></span>
          <span>标准答案：<el-text type="success">{{ item.question?.answer?.answer ?? '-' }}</el-text></span>
        </div>
        <el-alert v-if="item.record.aiCorrection" type="info" :closable="false" style="margin-top: 8px">
          <template #title>AI 点评：{{ item.record.aiCorrection }}</template>
        </el-alert>
        <div v-if="item.question?.analysis" class="analysis">解析:{{ item.question.analysis }}</div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check, MagicStick } from '@element-plus/icons-vue'
import { getExamDetail } from '@/api/exam'
import type { AnswerRecord, ExamRecord, Question } from '@/types'
import { typeText, typeTag, examStatusTag, letter } from '@/utils/format'

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

onMounted(async () => {
  loading.value = true
  try {
    record.value = await getExamDetail(Number(route.params.recordId))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.result-card {
  margin-bottom: 20px;
}

.result-head {
  display: flex;
  align-items: center;
  gap: 28px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 6px solid var(--danger);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.score-circle.pass {
  border-color: var(--success);
}

.score-num {
  font-size: 34px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.score-total {
  font-size: 13px;
  color: var(--gray-500);
}

.result-info {
  flex: 1;
}

.result-info h2 {
  margin: 0 0 10px;
}

.meta-line {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--gray-600);
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
  color: var(--gray-800);
}

.section-title {
  margin: 0 0 12px;
}

.question-card {
  margin-bottom: 12px;
}

.question-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.q-index {
  color: var(--gray-500);
}

.title-text {
  flex: 1;
}

.choices {
  margin: 10px 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--gray-600);
}

.choice.correct {
  color: var(--success);
}

.check-icon {
  color: var(--success);
  vertical-align: -2px;
}

.answer-compare {
  margin: 10px 0 0 24px;
  display: flex;
  gap: 32px;
  font-size: 13px;
}

.analysis {
  margin: 8px 0 0 24px;
  color: var(--gray-500);
  font-size: 13px;
}

@media (max-width: 768px) {
  .result-head {
    flex-direction: column;
    text-align: center;
  }
}
</style>
