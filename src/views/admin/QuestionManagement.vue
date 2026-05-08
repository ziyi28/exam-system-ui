<template>
  <div class="page-container">
    <!-- 搜索区 -->
    <div class="search-bar glass-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索题目标题" clearable prefix-icon="Search" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="全部分类" clearable>
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="searchForm.difficulty" placeholder="全部难度" clearable>
            <el-option label="简单" value="EASY" />
            <el-option label="中等" value="MEDIUM" />
            <el-option label="困难" value="HARD" />
          </el-select>
        </el-form-item>
        <el-form-item label="题型">
          <el-select v-model="searchForm.type" placeholder="全部题型" clearable>
            <el-option label="选择题" value="CHOICE" />
            <el-option label="判断题" value="JUDGE" />
            <el-option label="简答题" value="TEXT" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData"><el-icon><Search /></el-icon> 搜索</el-button>
          <el-button @click="resetSearch"><el-icon><RefreshRight /></el-icon> 重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="openCreateDialog"><el-icon><Plus /></el-icon> 新增题目</el-button>
      <el-button @click="$router.push('/admin/questions/batch')"><el-icon><Upload /></el-icon> 批量操作</el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-card glass-card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="题目标题" min-width="260" show-overflow-tooltip />
        <el-table-column prop="type" label="题型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" size="small">{{ typeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="difficultyTag(row.difficulty)" size="small">{{ difficultyLabel(row.difficulty) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="分值" width="70" align="center" />
        <el-table-column prop="category" label="分类" width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.category?.name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑题目' : '新增题目'" width="700px" destroy-on-close>
      <el-form ref="dialogFormRef" :model="dialogForm" :rules="dialogRules" label-width="80px">
        <el-form-item label="题目标题" prop="title">
          <el-input v-model="dialogForm.title" type="textarea" :rows="3" placeholder="请输入题目内容" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="题型" prop="type">
              <el-select v-model="dialogForm.type" @change="onTypeChange">
                <el-option label="选择题" value="CHOICE" />
                <el-option label="判断题" value="JUDGE" />
                <el-option label="简答题" value="TEXT" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度" prop="difficulty">
              <el-select v-model="dialogForm.difficulty">
                <el-option label="简单" value="EASY" />
                <el-option label="中等" value="MEDIUM" />
                <el-option label="困难" value="HARD" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分值" prop="score">
              <el-input-number v-model="dialogForm.score" :min="1" :max="100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId">
              <el-select v-model="dialogForm.categoryId" placeholder="选择分类" clearable>
                <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="dialogForm.type === 'CHOICE'">
            <el-form-item label="多选">
              <el-switch v-model="dialogForm.multi" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 选择题选项 -->
        <div v-if="dialogForm.type === 'CHOICE'" class="choices-section">
          <div class="section-title">选项列表</div>
          <div v-for="(choice, idx) in dialogForm.choices" :key="idx" class="choice-row">
            <el-checkbox v-model="choice.isCorrect" :label="'正确'" />
            <el-input v-model="choice.content" :placeholder="`选项 ${String.fromCharCode(65 + idx)}`" style="flex:1" />
            <el-button type="danger" link @click="dialogForm.choices.splice(idx, 1)" :disabled="dialogForm.choices.length <= 2">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <el-button text type="primary" @click="dialogForm.choices.push({ content: '', isCorrect: false, sort: dialogForm.choices.length })">
            <el-icon><Plus /></el-icon> 添加选项
          </el-button>
        </div>

        <!-- 判断题/简答题答案 -->
        <div v-if="dialogForm.type === 'JUDGE' || dialogForm.type === 'TEXT'" class="answer-section">
          <el-form-item label="答案" prop="answerContent">
            <el-input v-if="dialogForm.type === 'TEXT'" v-model="dialogForm.answerContent" type="textarea" :rows="3" placeholder="请输入标准答案" />
            <el-radio-group v-else v-model="dialogForm.answerContent">
              <el-radio label="正确">正确</el-radio>
              <el-radio label="错误">错误</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="关键词" v-if="dialogForm.type === 'TEXT'">
            <el-input v-model="dialogForm.answerKeywords" placeholder="评分关键词，逗号分隔" />
          </el-form-item>
        </div>

        <el-form-item label="解析">
          <el-input v-model="dialogForm.analysis" type="textarea" :rows="2" placeholder="题目解析（可选）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getQuestionList, createQuestion, updateQuestion, deleteQuestion } from '@/api/question'
import { getCategories } from '@/api/category'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const categories = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const dialogFormRef = ref()

const searchForm = reactive({ keyword: '', categoryId: '', difficulty: '', type: '' })
const pagination = reactive({ page: 1, size: 10, total: 0 })

const dialogForm = reactive({
  id: null, title: '', type: 'CHOICE', difficulty: 'MEDIUM', score: 5,
  categoryId: null, multi: false, analysis: '',
  choices: [
    { content: '', isCorrect: true, sort: 0 },
    { content: '', isCorrect: false, sort: 1 },
    { content: '', isCorrect: false, sort: 2 },
    { content: '', isCorrect: false, sort: 3 }
  ],
  answerContent: '', answerKeywords: ''
})

const dialogRules = {
  title: [{ required: true, message: '请输入题目标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择题型', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
  score: [{ required: true, message: '请输入分值', trigger: 'blur' }]
}

const typeLabel = (t) => ({ CHOICE: '选择题', JUDGE: '判断题', TEXT: '简答题' }[t] || t)
const typeTag = (t) => ({ CHOICE: 'primary', JUDGE: 'warning', TEXT: 'success' }[t] || 'info')
const difficultyLabel = (d) => ({ EASY: '简单', MEDIUM: '中等', HARD: '困难' }[d] || d)
const difficultyTag = (d) => ({ EASY: 'success', MEDIUM: 'warning', HARD: 'danger' }[d] || 'info')

async function loadData() {
  loading.value = true
  try {
    const res = await getQuestionList({
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    })
    tableData.value = res.data?.records || []
    pagination.total = Number(res.data?.total || 0)
  } catch (e) { /* ignore */ }
  loading.value = false
}

async function loadCategories() {
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } catch (e) { /* ignore */ }
}

function resetSearch() {
  Object.assign(searchForm, { keyword: '', categoryId: '', difficulty: '', type: '' })
  pagination.page = 1
  loadData()
}

function openCreateDialog() {
  isEdit.value = false
  Object.assign(dialogForm, {
    id: null, title: '', type: 'CHOICE', difficulty: 'MEDIUM', score: 5,
    categoryId: null, multi: false, analysis: '',
    choices: [
      { content: '', isCorrect: true, sort: 0 },
      { content: '', isCorrect: false, sort: 1 },
      { content: '', isCorrect: false, sort: 2 },
      { content: '', isCorrect: false, sort: 3 }
    ],
    answerContent: '', answerKeywords: ''
  })
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  Object.assign(dialogForm, {
    id: row.id, title: row.title, type: row.type, difficulty: row.difficulty,
    score: row.score, categoryId: row.categoryId, multi: row.multi || false,
    analysis: row.analysis || '',
    choices: row.choices?.length ? row.choices.map(c => ({ ...c })) : [
      { content: '', isCorrect: true, sort: 0 }, { content: '', isCorrect: false, sort: 1 }
    ],
    answerContent: row.answer?.answer || '',
    answerKeywords: row.answer?.keywords || ''
  })
  dialogVisible.value = true
}

function onTypeChange() {
  if (dialogForm.type === 'JUDGE') {
    dialogForm.answerContent = '正确'
  }
}

async function handleSubmit() {
  const valid = await dialogFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const payload = {
      title: dialogForm.title,
      type: dialogForm.type,
      difficulty: dialogForm.difficulty,
      score: dialogForm.score,
      categoryId: dialogForm.categoryId,
      multi: dialogForm.multi,
      analysis: dialogForm.analysis,
      choices: dialogForm.type === 'CHOICE' ? dialogForm.choices : [],
      answer: dialogForm.type !== 'CHOICE' ? {
        answer: dialogForm.answerContent,
        keywords: dialogForm.answerKeywords
      } : null
    }

    if (isEdit.value) {
      await updateQuestion(dialogForm.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createQuestion(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) { /* error handled by interceptor */ }
  submitting.value = false
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除题目 "${row.title}" 吗？`, '确认删除', { type: 'warning' })
  try {
    await deleteQuestion(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) { /* ignore */ }
}

onMounted(() => {
  loadData()
  loadCategories()
})
</script>

<style scoped>
.page-container { padding: 4px; }
.search-bar { padding: 20px 20px 4px; margin-bottom: 16px; }
.search-form { display: flex; flex-wrap: wrap; gap: 0; }
.toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
.table-card { padding: 0; overflow: hidden; }
.pagination-wrap { padding: 16px 20px; display: flex; justify-content: flex-end; }

.choices-section, .answer-section {
  margin: 12px 0;
  padding: 16px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
}
.section-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}
.choice-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
</style>
