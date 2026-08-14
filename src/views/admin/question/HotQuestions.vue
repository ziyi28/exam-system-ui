<template>
  <div>
    <AppPageHeader title="热题看板" description="按题目详情被查看的次数排序，不足部分以最新创建题目补齐">
      <template #actions>
        <el-select v-model="displaySize" style="width: 110px" @change="loadData">
          <el-option v-for="n in sizeOptions" :key="n" :label="`显示 ${n} 条`" :value="n" />
        </el-select>
        <el-button :icon="Refresh" :loading="refreshing" @click="handleRefresh">刷新热度缓存</el-button>
      </template>
    </AppPageHeader>

    <el-card shadow="never" class="data-card hot-questions-card">
      <el-empty v-if="!loading && !questions.length" description="暂无热题数据" />
      <el-row v-loading="loading" :gutter="16">
        <el-col v-for="(q, index) in questions" :key="q.id" :xs="24" :sm="12" :md="8" class="hot-col">
          <router-link to="/admin/questions" class="hot-card">
            <div class="hot-rank" :class="rankClass(index)" :aria-label="`第 ${index + 1} 名`">{{ index + 1 }}</div>
            <div class="hot-body">
              <div class="hot-title ellipsis">{{ q.title }}</div>
              <div class="hot-meta">
                <el-tag :type="typeTag(q.type)" size="small">{{ typeText(q.type, q.multi) }}</el-tag>
                <el-tag :type="difficultyTag(q.difficulty)" size="small" effect="plain">{{ difficultyText(q.difficulty) }}</el-tag>
                <span class="hot-category">{{ categoryName(q.categoryId) }}</span>
              </div>
            </div>
          </router-link>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getPopularQuestions, refreshPopularQuestions } from '@/api/question'
import { listCategories } from '@/api/category'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import type { Category, Question } from '@/types'
import { typeText, typeTag, difficultyText, difficultyTag } from '@/utils/format'

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
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-2);
  text-decoration: none;
  color: inherit;
  transition:
    border-color var(--duration-base) var(--ease-out-expo),
    box-shadow var(--duration-base) var(--ease-out-expo);
  height: 100%;
}

.hot-card:hover {
  border-color: var(--brand-500);
  box-shadow: var(--shadow-sm);
}

.hot-card:focus-visible {
  outline: 2px solid var(--brand-600);
  outline-offset: 2px;
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
  background: var(--surface-1);
  color: var(--text-muted);
}

/* 浅色下奖牌原色数字在 16% tint 圆底上仅约 2:1，改中性圆底 + 加深数字达标；
   深色下保留 16% tint + 原色（6.7–10.9:1 已达标） */
:root:not([data-theme='dark']) .hot-rank--gold {
  background: var(--surface-2);
  color: color-mix(in srgb, var(--medal-gold) 55%, black);
}

:root:not([data-theme='dark']) .hot-rank--silver {
  background: var(--surface-2);
  color: color-mix(in srgb, var(--medal-silver) 55%, black);
}

:root:not([data-theme='dark']) .hot-rank--bronze {
  background: var(--surface-2);
  color: color-mix(in srgb, var(--medal-bronze) 55%, black);
}

:root[data-theme='dark'] .hot-rank--gold {
  background: color-mix(in srgb, var(--medal-gold) 16%, transparent);
  color: var(--medal-gold);
}

:root[data-theme='dark'] .hot-rank--silver {
  background: color-mix(in srgb, var(--medal-silver) 16%, transparent);
  color: var(--medal-silver);
}

:root[data-theme='dark'] .hot-rank--bronze {
  background: color-mix(in srgb, var(--medal-bronze) 16%, transparent);
  color: var(--medal-bronze);
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
  color: var(--text-muted);
}
</style>
