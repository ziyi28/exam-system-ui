<template>
  <div>
    <div class="page-title">
      <h2>在线考试</h2>
      <el-input v-model="keyword" placeholder="搜索试卷名称" clearable style="width: 240px" :prefix-icon="Search" @keyup.enter="loadData" @clear="loadData" />
    </div>

    <el-empty v-if="!loading && !papers.length" description="暂无可参加的考试" />

    <el-row v-loading="loading" :gutter="16">
      <el-col v-for="paper in papers" :key="paper.id" :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="exam-card">
          <div class="exam-head">
            <div class="exam-icon">
              <el-icon :size="22"><Notebook /></el-icon>
            </div>
            <div class="exam-name">{{ paper.name }}</div>
          </div>
          <p class="exam-desc">{{ paper.description || '暂无描述' }}</p>
          <div class="exam-meta">
            <span><el-icon><Document /></el-icon> {{ paper.questionCount ?? '-' }} 题</span>
            <span><el-icon><Medal /></el-icon> 总分 {{ paper.totalScore ?? '-' }}</span>
            <span><el-icon><Timer /></el-icon> {{ paper.duration ?? '-' }} 分钟</span>
          </div>
          <el-button type="primary" class="start-btn" :loading="startingId === paper.id" @click="handleStart(paper)">
            开始考试
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { listPapers } from '@/api/paper'
import { startExam } from '@/api/exam'
import type { Paper } from '@/types'

const router = useRouter()
const loading = ref(false)
const papers = ref<Paper[]>([])
const keyword = ref('')
const startingId = ref<number>()

async function loadData() {
  loading.value = true
  try {
    // 后端对学生强制只返回已发布试卷
    papers.value = await listPapers({ name: keyword.value || undefined, status: 'PUBLISHED' })
  } finally {
    loading.value = false
  }
}

async function handleStart(paper: Paper) {
  await ElMessageBox.confirm(
    `试卷「${paper.name}」共 ${paper.questionCount} 题，限时 ${paper.duration} 分钟。开始后计时不可暂停，切屏行为会被记录，确定开始吗？`,
    '开始考试',
    { type: 'warning', confirmButtonText: '开始考试', cancelButtonText: '再想想' },
  )
  startingId.value = paper.id
  try {
    const record = await startExam(paper.id!)
    router.push(`/student/exam/${record.id}`)
  } finally {
    startingId.value = undefined
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title h2 {
  margin: 0;
}

.exam-card {
  margin-bottom: 16px;
  transition:
    transform var(--duration-base) var(--ease-out-expo),
    box-shadow var(--duration-base) var(--ease-out-expo);
}

.exam-card:hover {
  transform: translateY(-2px);
}

.exam-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exam-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--brand-bg);
  color: var(--brand-600);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.exam-name {
  font-size: 16px;
  font-weight: 600;
  flex: 1;
}

.exam-desc {
  color: var(--gray-500);
  font-size: 13px;
  height: 38px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.exam-meta {
  display: flex;
  gap: 16px;
  color: var(--gray-600);
  font-size: 13px;
  margin-bottom: 12px;
}

.exam-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.start-btn {
  width: 100%;
}
</style>
