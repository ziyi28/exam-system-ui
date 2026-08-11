<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-header__title">热题看板</h2>
        <p class="page-header__desc">按题目详情被查看的次数排序，不足部分以最新创建题目补齐</p>
      </div>
      <div class="page-header__actions">
        <el-select v-model="displaySize" style="width: 110px" @change="loadData">
          <el-option v-for="n in sizeOptions" :key="n" :label="`显示 ${n} 条`" :value="n" />
        </el-select>
        <el-button :icon="Refresh" :loading="refreshing" @click="handleRefresh">刷新热度缓存</el-button>
      </div>
    </div>

    <el-card shadow="never" class="data-card hot-questions-card">
      <el-empty v-if="!loading && !questions.length" description="暂无热题数据" />
      <el-row v-loading="loading" :gutter="16">
        <el-col v-for="(q, index) in questions" :key="q.id" :xs="24" :sm="12" :md="8" class="hot-col">
          <div class="hot-card" @click="router.push('/admin/questions')">
            <div class="hot-rank" :class="rankClass(index)">{{ index + 1 }}</div>
            <div class="hot-body">
              <div class="hot-title ellipsis">{{ q.title }}</div>
              <div class="hot-meta">
                <el-tag :type="typeTag(q.type)" size="small">{{ typeText(q.type, q.multi) }}</el-tag>
                <el-tag :type="difficultyTag(q.difficulty)" size="small" effect="plain">{{ difficultyText(q.difficulty) }}</el-tag>
                <span class="hot-category">{{ categoryName(q.categoryId) }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getPopularQuestions, refreshPopularQuestions } from '@/api/question'
import { listCategories } from '@/api/category'
import type { Category, Question } from '@/types'
import { typeText, typeTag, difficultyText, difficultyTag } from '@/utils/format'

const router = useRouter()

const loading = ref(false)
const refreshing = ref(false)
const questions = ref<Question[]>([])
const categories = ref<Category[]>([])
const sizeOptions = [6, 10, 20, 50]
const displaySize = ref(10)

function categoryName(id?: number) {
  return categories.value.find((c) => c.id === id)?.name ?? '-'
}

function rankClass(index: number) {
  if (index === 0) return 'hot-rank--gold'
  if (index === 1) return 'hot-rank--silver'
  if (index === 2) return 'hot-rank--bronze'
  return ''
}

async function loadData() {
  loading.value = true
  try {
    questions.value = await getPopularQuestions(displaySize.value)
  } finally {
    loading.value = false
  }
}

async function handleRefresh() {
  await ElMessageBox.confirm('刷新后将清空当前的题目浏览热度统计，重新开始计数，确定继续吗？', '刷新热度缓存', { type: 'warning' })
  refreshing.value = true
  try {
    await refreshPopularQuestions()
    ElMessage.success('热度缓存已刷新')
    loadData()
  } finally {
    refreshing.value = false
  }
}

onMounted(async () => {
  categories.value = await listCategories()
  loadData()
})
</script>

<style scoped>
.hot-col {
  margin-bottom: 16px;
}

.hot-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px;
  border: 1px solid var(--gray-100);
  border-radius: var(--radius-lg);
  background: var(--surface-muted);
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
  height: 100%;
}

.hot-card:hover {
  border-color: var(--brand-100);
  box-shadow: var(--shadow-sm);
}

.hot-rank {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

.hot-rank--gold {
  background: var(--warning-bg);
  color: var(--warning);
}

.hot-rank--silver {
  background: var(--gray-100);
  color: var(--gray-600);
}

.hot-rank--bronze {
  background: var(--danger-bg);
  color: var(--danger);
}

.hot-body {
  flex: 1;
  min-width: 0;
}

.hot-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.hot-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hot-category {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
