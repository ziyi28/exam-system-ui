<template>
  <div class="page-container">
    <!-- 搜索 -->
    <div class="search-bar glass-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="试卷名称">
          <el-input v-model="searchForm.name" placeholder="搜索试卷" clearable prefix-icon="Search" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="已停止" value="STOPPED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData"><el-icon><Search /></el-icon> 搜索</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="openCreateDialog"><el-icon><Plus /></el-icon> 手动创建</el-button>
      <el-button type="success" @click="aiDialogVisible = true"><el-icon><MagicStick /></el-icon> AI 智能组卷</el-button>
    </div>

    <!-- 表格 -->
    <div class="table-card glass-card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="试卷名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="questionCount" label="题目数" width="80" align="center" />
        <el-table-column prop="totalScore" label="总分" width="80" align="center" />
        <el-table-column prop="duration" label="时长(分)" width="90" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)"><el-icon><View /></el-icon> 详情</el-button>
            <el-button v-if="row.status === 'DRAFT'" type="success" link size="small" @click="handleStatusChange(row, 'PUBLISHED')">发布</el-button>
            <el-button v-if="row.status === 'PUBLISHED'" type="warning" link size="small" @click="handleStatusChange(row, 'STOPPED')">停止</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)"><el-icon><Delete /></el-icon> 删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 手动创建对话框 -->
    <el-dialog v-model="createDialogVisible" title="创建试卷" width="650px" destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="试卷名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入试卷名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="时长(分)" prop="duration">
          <el-input-number v-model="createForm.duration" :min="1" :max="600" />
        </el-form-item>
        <el-form-item label="选择题目">
          <div class="question-selector">
            <el-button type="primary" size="small" @click="loadQuestions">加载题目列表</el-button>
            <div v-if="questionPool.length > 0" class="question-pool">
              <div v-for="q in questionPool" :key="q.id" class="question-pool-item">
                <el-checkbox v-model="q._selected" @change="toggleQuestion(q)">
                  <span>{{ q.title }}</span>
                </el-checkbox>
                <el-input-number v-if="q._selected" v-model="q._score" :min="1" :max="100" size="small" style="width:100px;margin-left:8px" />
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="submitting">创建</el-button>
      </template>
    </el-dialog>

    <!-- AI 组卷对话框 -->
    <el-dialog v-model="aiDialogVisible" title="AI 智能组卷" width="600px">
      <el-form :model="aiForm" label-width="80px">
        <el-form-item label="试卷名称" required>
          <el-input v-model="aiForm.name" placeholder="请输入试卷名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="aiForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="时长(分)">
          <el-input-number v-model="aiForm.duration" :min="1" :max="600" />
        </el-form-item>
        <div class="section-title">组卷规则</div>
        <div v-for="(rule, idx) in aiForm.rules" :key="idx" class="rule-row">
          <el-select v-model="rule.type" placeholder="题型" style="width:120px">
            <el-option label="选择题" value="CHOICE" />
            <el-option label="判断题" value="JUDGE" />
            <el-option label="简答题" value="TEXT" />
          </el-select>
          <el-input-number v-model="rule.count" :min="1" placeholder="数量" style="width:100px" />
          <el-input-number v-model="rule.score" :min="1" placeholder="分值" style="width:100px" />
          <el-select v-model="rule.difficulty" placeholder="难度" clearable style="width:100px">
            <el-option label="简单" value="EASY" />
            <el-option label="中等" value="MEDIUM" />
            <el-option label="困难" value="HARD" />
          </el-select>
          <el-button type="danger" link @click="aiForm.rules.splice(idx, 1)"><el-icon><Delete /></el-icon></el-button>
        </div>
        <el-button text type="primary" @click="aiForm.rules.push({ type: 'CHOICE', count: 5, score: 2, difficulty: '' })">
          <el-icon><Plus /></el-icon> 添加规则
        </el-button>
      </el-form>
      <template #footer>
        <el-button @click="aiDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAiCreate" :loading="aiCreating">AI 组卷</el-button>
      </template>
    </el-dialog>

    <!-- 试卷详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="试卷详情" width="700px">
      <div v-if="detailData">
        <p><strong>名称：</strong>{{ detailData.name }}</p>
        <p><strong>描述：</strong>{{ detailData.description || '无' }}</p>
        <p><strong>总分：</strong>{{ detailData.totalScore }}  |  <strong>题目数：</strong>{{ detailData.questionCount }}  |  <strong>时长：</strong>{{ detailData.duration }} 分钟</p>
        <el-divider />
        <el-table :data="detailData.questions || []" stripe max-height="400">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="title" label="题目" min-width="300" show-overflow-tooltip />
          <el-table-column prop="type" label="题型" width="80" />
          <el-table-column prop="paperScore" label="分值" width="70" align="center" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { listPapers, createPaper, createPaperWithAI, updatePaperStatus, deletePaper, getPaperById } from '@/api/paper'
import { getQuestionList } from '@/api/question'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const submitting = ref(false)
const aiCreating = ref(false)
const tableData = ref([])
const searchForm = reactive({ name: '', status: '' })
const createDialogVisible = ref(false)
const aiDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const detailData = ref(null)
const createFormRef = ref()
const questionPool = ref([])

const createForm = reactive({ name: '', description: '', duration: 120 })
const createRules = { name: [{ required: true, message: '请输入试卷名称', trigger: 'blur' }] }

const aiForm = reactive({
  name: '', description: '', duration: 90,
  rules: [{ type: 'CHOICE', count: 10, score: 3, difficulty: '' }, { type: 'JUDGE', count: 5, score: 2, difficulty: '' }]
})

const statusLabel = (s) => ({ DRAFT: '草稿', PUBLISHED: '已发布', STOPPED: '已停止' }[s] || s)
const statusTag = (s) => ({ DRAFT: 'info', PUBLISHED: 'success', STOPPED: 'danger' }[s] || 'info')

async function loadData() {
  loading.value = true
  try {
    const res = await listPapers(searchForm)
    tableData.value = res.data || []
  } catch (e) { /* ignore */ }
  loading.value = false
}

function openCreateDialog() {
  Object.assign(createForm, { name: '', description: '', duration: 120 })
  questionPool.value = []
  createDialogVisible.value = true
}

async function loadQuestions() {
  try {
    const res = await getQuestionList({ page: 1, size: 200 })
    questionPool.value = (res.data?.records || []).map(q => ({ ...q, _selected: false, _score: 5 }))
  } catch (e) { /* ignore */ }
}

function toggleQuestion(q) { /* just checkbox toggle */ }

async function handleCreate() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  const selectedQuestions = questionPool.value.filter(q => q._selected)
  const questions = {}
  selectedQuestions.forEach(q => { questions[q.id] = q._score })
  submitting.value = true
  try {
    await createPaper({ ...createForm, questions })
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    loadData()
  } catch (e) { /* ignore */ }
  submitting.value = false
}

async function handleAiCreate() {
  if (!aiForm.name) return ElMessage.warning('请输入试卷名称')
  aiCreating.value = true
  try {
    await createPaperWithAI(aiForm)
    ElMessage.success('AI 组卷成功')
    aiDialogVisible.value = false
    loadData()
  } catch (e) { /* ignore */ }
  aiCreating.value = false
}

async function handleStatusChange(row, status) {
  try {
    await updatePaperStatus(row.id, status)
    ElMessage.success('状态更新成功')
    loadData()
  } catch (e) { /* ignore */ }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除试卷 "${row.name}" 吗？`, '确认删除', { type: 'warning' })
  try {
    await deletePaper(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) { /* ignore */ }
}

async function handleViewDetail(row) {
  try {
    const res = await getPaperById(row.id)
    detailData.value = res.data
    detailDialogVisible.value = true
  } catch (e) { /* ignore */ }
}

onMounted(() => loadData())
</script>

<style scoped>
.page-container { padding: 4px; }
.search-bar { padding: 20px 20px 4px; margin-bottom: 16px; }
.toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
.table-card { padding: 0; overflow: hidden; }
.section-title { font-weight: 600; color: var(--text-secondary); font-size: 0.85rem; margin: 12px 0 8px; }
.rule-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
.question-selector { width: 100%; }
.question-pool { max-height: 300px; overflow-y: auto; margin-top: 8px; }
.question-pool-item { padding: 6px 0; display: flex; align-items: center; }
</style>
