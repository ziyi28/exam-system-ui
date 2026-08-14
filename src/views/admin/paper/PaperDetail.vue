<template>
  <div v-loading="loading">
    <AppPageHeader title="试卷详情" description="查看试卷配置、题目结构与标准答案">
      <template #actions>
        <el-button @click="router.back()">返回列表</el-button>
      </template>
    </AppPageHeader>

    <el-card shadow="never" class="detail-card paper-detail-card">
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

    <el-card v-for="(q, index) in paper?.questions ?? []" :key="q.id" shadow="never" class="detail-question-card">
      <QuestionReviewCard :index="index" :question="q" :score-text="`${q.paperScore} 分`" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPaperDetail } from '@/api/paper'
import QuestionReviewCard from '@/components/question/QuestionReviewCard.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import type { Paper } from '@/types'
import { paperStatusText, paperStatusTag } from '@/utils/format'

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
.paper-detail-card {
  margin-bottom: var(--space-5);
}

.detail-question-card {
  margin-bottom: var(--space-4);
}

@media (max-width: 768px) {
  .paper-detail-card :deep(.el-descriptions__table) {
    min-width: 560px;
  }

  .paper-detail-card {
    overflow-x: auto;
  }
}
</style>
