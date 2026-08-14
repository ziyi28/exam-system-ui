<template>
  <div class="records-page">
    <AppPageHeader title="我的成绩" description="查看已完成考试的成绩与批阅结果" />

    <el-card shadow="never" class="data-card records-card">
      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column type="index" label="#" width="60" />
        <el-table-column label="试卷" min-width="200">
          <template #default="{ row }">{{ paperNames.get(row.examId) ?? `试卷 #${row.examId}` }}</template>
        </el-table-column>
        <el-table-column label="得分" width="110">
          <template #default="{ row }">
            <b :class="{ 'score-good': row.score > 0 }">{{ row.score }}</b>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="examStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="170">
          <template #default="{ row }">{{ (row.startTime ?? '').toString().replace('T', ' ').slice(0, 19) }}</template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="170">
          <template #default="{ row }">{{ (row.endTime ?? '-').toString().replace('T', ' ').slice(0, 19) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === '进行中'" link type="warning" @click="router.push(`/student/exam/${row.id}`)">
              继续考试
            </el-button>
            <el-button v-else link type="primary" @click="router.push(`/student/result/${row.id}`)">查看成绩</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !records.length" description="还没有考试记录，去参加一场考试吧" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listMyRecords } from '@/api/exam'
import { listPapers } from '@/api/paper'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import type { ExamRecord } from '@/types'
import { examStatusTag } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const records = ref<ExamRecord[]>([])
const paperNames = ref(new Map<number, string>())

onMounted(async () => {
  loading.value = true
  try {
    records.value = await listMyRecords()
    // 关联试卷名（学生只能拿到已发布试卷，已停用的显示编号兜底）
    const papers = await listPapers().catch(() => [])
    paperNames.value = new Map(papers.map((p) => [p.id!, p.name]))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.records-card :deep(.el-card__body) {
  padding: 8px 24px 24px;
}

.score-good {
  color: var(--success);
}

@media (max-width: 768px) {
  .records-card :deep(.el-card__body) {
    padding: 6px 14px 18px;
  }
}
</style>
