<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-header__title">试卷管理</h2>
        <p class="page-header__desc">组卷、发布与停用，支持 AI 按规则智能组卷</p>
      </div>
      <div class="page-header__actions">
        <el-button :icon="MagicStick" @click="aiDialogVisible = true">AI 智能组卷</el-button>
        <el-button type="primary" :icon="Plus" @click="router.push('/admin/papers/edit')">手动组卷</el-button>
      </div>
    </div>

    <el-card shadow="never">
      <div class="filter-bar">
        <el-input v-model="query.name" placeholder="试卷名称" clearable style="width: 200px" @keyup.enter="loadData" />
        <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px">
          <el-option label="草稿" value="DRAFT" />
          <el-option label="已发布" value="PUBLISHED" />
          <el-option label="已停用" value="STOPPED" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
      </div>

      <el-table v-loading="loading" :data="papers" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="试卷名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="paperStatusTag(row.status)" size="small">{{ paperStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="questionCount" label="题目数" width="80" />
        <el-table-column prop="totalScore" label="总分" width="80" />
        <el-table-column label="时长" width="90">
          <template #default="{ row }">{{ row.duration ? row.duration + ' 分钟' : '-' }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push(`/admin/papers/${row.id}`)">详情</el-button>
            <el-button link type="primary" @click="router.push({ path: '/admin/papers/edit', query: { id: row.id } })">编辑</el-button>
            <el-button v-if="row.status !== 'PUBLISHED'" link type="success" @click="handleStatus(row, 'PUBLISHED')">发布</el-button>
            <el-button v-else link type="warning" @click="handleStatus(row, 'STOPPED')">停用</el-button>
            <el-button link type="danger" :disabled="row.status === 'PUBLISHED'" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- AI 组卷对话框 -->
    <el-dialog v-model="aiDialogVisible" title="AI 智能组卷" width="680px" destroy-on-close>
      <el-form :model="aiForm" label-width="90px">
        <el-form-item label="试卷名称" required>
          <el-input v-model="aiForm.name" placeholder="请输入试卷名称" />
        </el-form-item>
        <el-form-item label="试卷描述">
          <el-input v-model="aiForm.description" type="textarea" :rows="2" placeholder="试卷描述（可选）" />
        </el-form-item>
        <el-form-item label="考试时长">
          <el-input-number v-model="aiForm.duration" :min="10" :max="600" :step="10" /> <span style="margin-left: 8px">分钟</span>
        </el-form-item>
        <el-divider>组卷规则</el-divider>
        <div v-for="(rule, index) in aiForm.rules" :key="index" class="rule-row">
          <el-select v-model="rule.type" style="width: 110px">
            <el-option label="选择题" value="CHOICE" />
            <el-option label="判断题" value="JUDGE" />
            <el-option label="简答题" value="TEXT" />
          </el-select>
          <el-select v-model="rule.categoryIds" multiple collapse-tags placeholder="不限分类" clearable style="flex: 1">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id!" />
          </el-select>
          <el-input-number v-model="rule.count" :min="1" :max="50" controls-position="right" style="width: 110px" />
          <span class="rule-label">道 ×</span>
          <el-input-number v-model="rule.score" :min="1" :max="50" controls-position="right" style="width: 110px" />
          <span class="rule-label">分</span>
          <el-button link type="danger" :disabled="aiForm.rules.length <= 1" @click="aiForm.rules.splice(index, 1)">删除</el-button>
        </div>
        <el-button :icon="Plus" style="margin-top: 8px" @click="aiForm.rules.push({ type: 'CHOICE', count: 5, score: 5, categoryIds: [] })">
          添加规则
        </el-button>
        <el-alert style="margin-top: 12px" type="info" :closable="false" show-icon :title="`预计总分：${aiTotalScore} 分，共 ${aiTotalCount} 道题`" />
      </el-form>
      <template #footer>
        <el-button @click="aiDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiCreating" @click="handleAiCreate">生成试卷</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, MagicStick } from '@element-plus/icons-vue'
import { listPapers, updatePaperStatus, deletePaper, createPaperWithAI } from '@/api/paper'
import { listCategories } from '@/api/category'
import type { AiPaperForm, Category, Paper } from '@/types'
import { paperStatusText, paperStatusTag } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const papers = ref<Paper[]>([])
const categories = ref<Category[]>([])
const query = reactive({ name: '', status: undefined as string | undefined })

async function loadData() {
  loading.value = true
  try {
    papers.value = await listPapers({ name: query.name || undefined, status: query.status })
  } finally {
    loading.value = false
  }
}

async function handleStatus(row: Paper, status: 'PUBLISHED' | 'STOPPED') {
  const action = status === 'PUBLISHED' ? '发布' : '停用'
  await ElMessageBox.confirm(`确定${action}试卷「${row.name}」吗？`, `${action}确认`, { type: 'warning' })
  await updatePaperStatus(row.id!, status)
  ElMessage.success(`${action}成功`)
  loadData()
}

async function handleDelete(row: Paper) {
  await ElMessageBox.confirm(`确定删除试卷「${row.name}」吗？`, '删除确认', { type: 'warning' })
  await deletePaper(row.id!)
  ElMessage.success('删除成功')
  loadData()
}

// ---- AI 组卷 ----
const aiDialogVisible = ref(false)
const aiCreating = ref(false)
const aiForm = reactive<AiPaperForm>({
  name: '',
  description: '',
  duration: 60,
  rules: [
    { type: 'CHOICE', count: 5, score: 5, categoryIds: [] },
    { type: 'JUDGE', count: 3, score: 5, categoryIds: [] },
  ],
})

const aiTotalScore = computed(() => aiForm.rules.reduce((sum, r) => sum + (r.count || 0) * (r.score || 0), 0))
const aiTotalCount = computed(() => aiForm.rules.reduce((sum, r) => sum + (r.count || 0), 0))

async function handleAiCreate() {
  if (!aiForm.name.trim()) {
    ElMessage.warning('请输入试卷名称')
    return
  }
  aiCreating.value = true
  try {
    const paper = await createPaperWithAI(aiForm)
    ElMessage.success(`组卷成功：${paper.name}`)
    aiDialogVisible.value = false
    loadData()
  } finally {
    aiCreating.value = false
  }
}

onMounted(async () => {
  loadData()
  categories.value = await listCategories()
})
</script>

<style scoped>
.rule-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.rule-label {
  color: var(--gray-500);
  white-space: nowrap;
}
</style>
