<template>
  <div v-loading="loading">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div class="card-header">
          <span>试卷详情</span>
          <el-button @click="router.back()">返回</el-button>
        </div>
      </template>
      <el-descriptions v-if="paper" :column="4" border>
        <el-descriptions-item label="试卷名称" :span="2">{{ paper.name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="paperStatusTag(paper.status)" size="small">{{ paperStatusText(paper.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="考试时长">{{ paper.duration ?? '-' }} 分钟</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ paper.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="题目数量">{{ paper.questionCount }}</el-descriptions-item>
        <el-descriptions-item label="总分">{{ paper.totalScore }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card v-for="(q, index) in paper?.questions ?? []" :key="q.id" shadow="never" class="question-card">
      <div class="question-title">
        <span class="index">{{ index + 1 }}.</span>
        <el-tag :type="typeTag(q.type)" size="small">{{ typeText(q.type, q.multi) }}</el-tag>
        <el-tag type="info" size="small" effect="plain">{{ q.paperScore }} 分</el-tag>
        <span class="title-text">{{ q.title }}</span>
      </div>
      <div v-if="q.choices?.length" class="choices">
        <div v-for="(c, ci) in q.choices" :key="ci" class="choice" :class="{ correct: c.isCorrect }">
          {{ letter(ci) }}. {{ c.content }}
          <el-icon v-if="c.isCorrect" class="check-icon"><Check /></el-icon>
        </div>
      </div>
      <div class="answer-line">
        <el-text type="success">标准答案：{{ q.answer?.answer || '-' }}</el-text>
        <el-text v-if="q.answer?.keywords" type="info" style="margin-left: 16px">关键词：{{ q.answer.keywords }}</el-text>
      </div>
      <div v-if="q.analysis" class="analysis">解析：{{ q.analysis }}</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check } from '@element-plus/icons-vue'
import { getPaperDetail } from '@/api/paper'
import type { Paper } from '@/types'
import { typeText, typeTag, paperStatusText, paperStatusTag, letter } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const paper = ref<Paper | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    paper.value = await getPaperDetail(Number(route.params.id))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.index {
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
  font-weight: 600;
}

.check-icon {
  color: var(--success);
  vertical-align: -2px;
}

.answer-line {
  margin: 10px 0 0 24px;
}

.analysis {
  margin: 8px 0 0 24px;
  color: var(--gray-500);
  font-size: 13px;
}
</style>
