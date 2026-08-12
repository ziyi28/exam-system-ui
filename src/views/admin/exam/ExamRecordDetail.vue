<template>
  <div v-loading="loading">
    <AppPageHeader title="考试记录详情" description="查看考生作答、切屏记录与 AI 批阅结果">
      <template #actions>
        <el-button v-if="record && record.status === '已完成'" type="primary" :loading="grading" @click="handleGrade">
          触发 AI 批阅
        </el-button>
        <el-button @click="router.back()">返回列表</el-button>
      </template>
    </AppPageHeader>

    <el-card shadow="never" class="detail-card exam-detail-card">
      <el-descriptions v-if="record" :column="4" border>
        <el-descriptions-item label="考生">{{ record.studentName }}</el-descriptions-item>
        <el-descriptions-item label="试卷" :span="2">{{ record.paper?.name ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="examStatusTag(record.status)" size="small">{{ record.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="得分">
          <b class="score">{{ record.score }}</b> / {{ record.paper?.totalScore ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="切屏次数">{{ record.windowSwitches ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ record.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ record.endTime ?? '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- AI 总评 -->
      <el-alert
        v-if="summary"
        type="success"
        :closable="false"
        style="margin-top: 12px"
      >
        <template #title><b>AI 总评</b></template>
        {{ summary }}
      </el-alert>
    </el-card>

    <!-- 逐题详情 -->
    <el-card v-for="(item, index) in answerItems" :key="item.record.id" shadow="never" class="detail-question-card">
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
          <div>学生答案：<el-text :type="item.record.isCorrect === 1 ? 'success' : 'danger'">{{ item.record.userAnswer || '（未作答）' }}</el-text></div>
        </template>
        <template #feedback>
          <el-alert
            v-if="item.record.aiCorrection"
            type="info"
            :closable="false"
            :title="`AI 点评：${item.record.aiCorrection}`"
          />
        </template>
      </QuestionReviewCard>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getExamRecordDetail } from '@/api/examRecord'
import { gradeExam } from '@/api/exam'
import QuestionReviewCard from '@/components/question/QuestionReviewCard.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import type { AnswerRecord, ExamRecord, Question } from '@/types'
import { examStatusTag } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const grading = ref(false)
const record = ref<ExamRecord | null>(null)

/** answers 字段已批阅后存 {"summary": "..."} JSON 或纯文本 */
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

/** 将答题记录与题目按 questionId 关联 */
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

function correctText(isCorrect?: number) {
  return { 0: '错误', 1: '正确', 2: '部分正确' }[isCorrect ?? -1] ?? '未批阅'
}

function correctTag(isCorrect?: number): 'success' | 'danger' | 'warning' | 'info' {
  return ({ 0: 'danger', 1: 'success', 2: 'warning' }[isCorrect ?? -1] ?? 'info') as never
}

async function loadData() {
  loading.value = true
  try {
    record.value = await getExamRecordDetail(Number(route.params.id))
  } finally {
    loading.value = false
  }
}

async function handleGrade() {
  grading.value = true
  try {
    await gradeExam(Number(route.params.id))
    ElMessage.success('AI 批阅完成')
    loadData()
  } finally {
    grading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.score {
  color: var(--danger);
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}

.exam-detail-card {
  margin-bottom: var(--space-5);
}

.detail-question-card {
  margin-bottom: var(--space-4);
}

@media (max-width: 768px) {
  .exam-detail-card {
    overflow-x: auto;
  }

  .exam-detail-card :deep(.el-descriptions__table) {
    min-width: 560px;
  }
}
</style>
