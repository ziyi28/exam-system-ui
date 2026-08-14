<template>
  <div>
    <AppPageHeader :title="paperId ? '编辑试卷' : '手动组卷'" description="设置试卷基础信息，从题库选择题目并配置对应分值">
      <template #actions>
        <el-button @click="router.back()">返回</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存试卷</el-button>
      </template>
    </AppPageHeader>

    <el-card shadow="never" class="detail-card paper-base-card">
      <el-form :model="form" label-width="90px" inline>
        <el-form-item label="试卷名称" required>
          <el-input v-model="form.name" placeholder="请输入试卷名称" style="width: 260px" />
        </el-form-item>
        <el-form-item label="考试时长">
          <el-input-number v-model="form.duration" :min="10" :max="600" :step="10" /> <span style="margin-left: 6px">分钟</span>
        </el-form-item>
        <el-form-item label="试卷描述">
          <el-input v-model="form.description" placeholder="试卷描述（可选）" style="width: 300px" />
        </el-form-item>
      </el-form>
      <el-alert :closable="false" type="info" show-icon :title="`已选 ${selected.length} 道题，总分 ${totalScore} 分`" />
    </el-card>

    <el-row :gutter="16" align="top">
      <!-- 题库选题 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="workspace-card">
          <template #header>题库选题</template>
          <div class="filter-bar" aria-label="筛选条件">
            <el-select v-model="query.categoryId" placeholder="全部分类" clearable style="width: 140px">
              <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id!" />
            </el-select>
            <el-select v-model="query.type" placeholder="全部题型" clearable style="width: 120px">
              <el-option label="选择题" value="CHOICE" />
              <el-option label="判断题" value="JUDGE" />
              <el-option label="简答题" value="TEXT" />
            </el-select>
            <el-input v-model="query.keyword" placeholder="关键词" clearable style="width: 160px" @keyup.enter="handleSearch" />
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          </div>
          <el-table v-loading="loading" :data="records" size="small" max-height="480">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="title" label="题目" min-width="220" show-overflow-tooltip />
            <el-table-column label="题型" width="90">
              <template #default="{ row }">
                <el-tag :type="typeTag(row.type)" size="small">{{ typeText(row.type, row.multi) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90">
              <template #default="{ row }">
                <el-button v-if="!selectedIds.has(row.id)" link type="primary" @click="addQuestion(row)">添加</el-button>
                <el-text v-else size="small" type="success">已添加</el-text>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-bar">
            <el-pagination
              v-model:current-page="query.page"
              v-model:page-size="query.size"
              :total="total"
              layout="total, prev, pager, next"
              @change="loadQuestions"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 已选题目 -->
      <el-col :xs="24" :lg="10" class="selected-col">
        <el-card shadow="never" class="workspace-card selected-questions-card">
          <template #header>已选题目（可设置分值）</template>
          <el-empty v-if="!selected.length" description="从左侧题库添加题目" />
          <el-table v-else :data="selected" size="small" max-height="540">
            <el-table-column type="index" label="#" width="45" />
            <el-table-column prop="title" label="题目" min-width="160" show-overflow-tooltip />
            <el-table-column label="分值" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.paperScore" :min="1" :max="100" size="small" controls-position="right" style="width: 100px" />
              </template>
            </el-table-column>
            <el-table-column label="" width="60">
              <template #default="{ $index }">
                <el-button link type="danger" size="small" @click="selected.splice($index, 1)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { pageQuestions } from '@/api/question'
import { listCategories } from '@/api/category'
import { createPaper, updatePaper, getPaperDetail } from '@/api/paper'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import type { Category, Question } from '@/types'
import { typeText, typeTag } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const paperId = computed(() => (route.query.id ? Number(route.query.id) : undefined))

// ---- 试卷基础信息 ----
const form = reactive({ name: '', description: '', duration: 60 })
const saving = ref(false)

// ---- 题库分页 ----
const loading = ref(false)
const records = ref<Question[]>([])
const total = ref(0)
const categories = ref<Category[]>([])
const query = reactive({
  page: 1,
  size: 10,
  categoryId: undefined as number | undefined,
  type: undefined as string | undefined,
  keyword: '',
})

async function loadQuestions() {
  loading.value = true
  try {
    const data = await pageQuestions({ ...query, keyword: query.keyword || undefined })
    records.value = data.records
    total.value = Number(data.total)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadQuestions()
}

// ---- 已选题目 ----
interface SelectedQuestion extends Question {
  paperScore: number
}

const selected = ref<SelectedQuestion[]>([])
const selectedIds = computed(() => new Set(selected.value.map((q) => q.id)))
const totalScore = computed(() => selected.value.reduce((sum, q) => sum + (q.paperScore || 0), 0))

function addQuestion(row: Question) {
  selected.value.push({ ...row, paperScore: row.score ?? 5 })
}

async function handleSave() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入试卷名称')
    return
  }
  if (!selected.value.length) {
    ElMessage.warning('请至少选择一道题目')
    return
  }
  saving.value = true
  try {
    const questions: Record<number, number> = {}
    for (const q of selected.value) {
      questions[q.id!] = q.paperScore
    }
    const payload = { name: form.name, description: form.description, duration: form.duration, questions }
    if (paperId.value) {
      await updatePaper(paperId.value, payload)
      ElMessage.success('试卷更新成功')
    } else {
      await createPaper(payload)
      ElMessage.success('试卷创建成功')
    }
    router.push('/admin/papers')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  categories.value = await listCategories()
  loadQuestions()
  // 编辑模式：回填试卷信息与已选题目
  if (paperId.value) {
    const paper = await getPaperDetail(paperId.value)
    form.name = paper.name
    form.description = paper.description ?? ''
    form.duration = paper.duration ?? 60
    selected.value = (paper.questions ?? []).map((q) => ({ ...q, paperScore: Number(q.paperScore ?? q.score ?? 5) }))
  }
})
</script>

<style scoped>
.paper-base-card {
  margin-bottom: var(--space-4);
}

/* 已选列：桌面双栏下局部吸顶，窄屏恢复普通文档流 */
@media (min-width: 1200px) {
  .selected-col {
    position: sticky;
    top: var(--space-4);
    align-self: flex-start;
  }
}

@media (max-width: 1199px) {
  .selected-col {
    height: auto;
  }
}

@media (max-width: 768px) {
  .paper-base-card :deep(.el-form--inline .el-form-item) {
    display: flex;
    margin-right: 0;
  }
}
</style>
