<template>
  <div>
    <AppPageHeader title="题库管理" description="维护题目、题型与难度，支持批量导入与 AI 出题">
      <template #actions>
        <el-button :icon="MagicStick" @click="router.push('/admin/questions/import')">批量导入 / AI出题</el-button>
        <el-button type="primary" :icon="Plus" @click="openDialog()">新增题目</el-button>
      </template>
    </AppPageHeader>

    <el-card shadow="never" class="data-card">
      <!-- 筛选区 -->
      <div class="filter-bar" aria-label="筛选条件">
        <el-select v-model="query.categoryId" placeholder="全部分类" clearable style="width: 150px">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id!" />
        </el-select>
        <el-select v-model="query.type" placeholder="全部题型" clearable style="width: 130px">
          <el-option label="选择题" value="CHOICE" />
          <el-option label="判断题" value="JUDGE" />
          <el-option label="简答题" value="TEXT" />
        </el-select>
        <el-select v-model="query.difficulty" placeholder="全部难度" clearable style="width: 130px">
          <el-option label="简单" value="EASY" />
          <el-option label="中等" value="MEDIUM" />
          <el-option label="困难" value="HARD" />
        </el-select>
        <el-input v-model="query.keyword" placeholder="题目关键词" clearable style="width: 200px" @keyup.enter="handleSearch" />
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="records" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="题目" min-width="280" show-overflow-tooltip />
        <el-table-column label="题型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" size="small">{{ typeText(row.type, row.multi) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="难度" width="90">
          <template #default="{ row }">
            <el-tag :type="difficultyTag(row.difficulty)" size="small" effect="plain">{{ difficultyText(row.difficulty) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120">
          <template #default="{ row }">{{ categoryName(row.categoryId) }}</template>
        </el-table-column>
        <el-table-column prop="score" label="默认分值" width="90" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row.id)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @change="loadData"
        />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑题目' : '新增题目'" width="min(720px, calc(100vw - 48px))" destroy-on-close top="5vh">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="题目" prop="title">
          <el-input v-model="form.title" type="textarea" :rows="2" placeholder="请输入题目内容" />
        </el-form-item>
        <el-form-item label="题型" prop="type">
          <el-radio-group v-model="form.type" :disabled="!!form.id" @change="handleTypeChange">
            <el-radio-button value="CHOICE">选择题</el-radio-button>
            <el-radio-button value="JUDGE">判断题</el-radio-button>
            <el-radio-button value="TEXT">简答题</el-radio-button>
          </el-radio-group>
          <el-checkbox v-if="form.type === 'CHOICE'" v-model="form.multi" style="margin-left: 16px">多选题</el-checkbox>
        </el-form-item>

        <!-- 选择题选项 -->
        <template v-if="form.type === 'CHOICE'">
          <el-form-item v-for="(choice, index) in form.choices" :key="index" :label="`选项${letter(index)}`">
            <div class="choice-row">
              <el-input v-model="choice.content" placeholder="选项内容" />
              <el-checkbox v-model="choice.isCorrect" @change="handleCorrectChange(index)">正确答案</el-checkbox>
              <el-button link type="danger" :disabled="form.choices.length <= 2" @click="form.choices.splice(index, 1)">
                删除
              </el-button>
            </div>
          </el-form-item>
          <el-form-item>
            <el-button :disabled="form.choices.length >= 8" :icon="Plus" @click="form.choices.push({ content: '', isCorrect: false, sort: form.choices.length })">
              添加选项
            </el-button>
          </el-form-item>
        </template>

        <!-- 判断题答案 -->
        <el-form-item v-if="form.type === 'JUDGE'" label="答案">
          <el-radio-group v-model="form.judgeAnswer">
            <el-radio value="正确">正确</el-radio>
            <el-radio value="错误">错误</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 简答题答案 -->
        <template v-if="form.type === 'TEXT'">
          <el-form-item label="参考答案">
            <el-input v-model="form.textAnswer" type="textarea" :rows="3" placeholder="简答题参考答案（用于 AI 评分）" />
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="form.keywords" placeholder="评分关键词，逗号分隔，如：封装,继承,多态" />
          </el-form-item>
        </template>

        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 200px">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id!" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度" prop="difficulty">
          <el-radio-group v-model="form.difficulty">
            <el-radio-button value="EASY">简单</el-radio-button>
            <el-radio-button value="MEDIUM">中等</el-radio-button>
            <el-radio-button value="HARD">困难</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="默认分值">
          <el-input-number v-model="form.score" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="解析">
          <el-input v-model="form.analysis" type="textarea" :rows="2" placeholder="题目解析（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus, MagicStick } from '@element-plus/icons-vue'
import { pageQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion } from '@/api/question'
import { listCategories } from '@/api/category'
import type { Category, Question, QuestionChoice } from '@/types'
import { typeText, typeTag, difficultyText, difficultyTag, letter } from '@/utils/format'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'

const router = useRouter()

// ---- 列表 ----
const loading = ref(false)
const records = ref<Question[]>([])
const total = ref(0)
const categories = ref<Category[]>([])
const query = reactive({
  page: 1,
  size: 10,
  categoryId: undefined as number | undefined,
  type: undefined as string | undefined,
  difficulty: undefined as string | undefined,
  keyword: '',
})

async function loadData() {
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
  loadData()
}

function handleReset() {
  query.categoryId = undefined
  query.type = undefined
  query.difficulty = undefined
  query.keyword = ''
  handleSearch()
}

function categoryName(id?: number) {
  return categories.value.find((c) => c.id === id)?.name ?? '-'
}

async function handleDelete(row: Question) {
  await ElMessageBox.confirm(`确定删除题目「${row.title.slice(0, 20)}...」吗？`, '删除确认', { type: 'warning' })
  await deleteQuestion(row.id!)
  ElMessage.success('删除成功')
  loadData()
}

// ---- 编辑对话框 ----
interface QuestionForm {
  id?: number
  title: string
  type: 'CHOICE' | 'JUDGE' | 'TEXT'
  multi: boolean
  categoryId?: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  score: number
  analysis: string
  choices: QuestionChoice[]
  judgeAnswer: string
  textAnswer: string
  keywords: string
  answerId?: number
}

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const defaultForm = (): QuestionForm => ({
  title: '',
  type: 'CHOICE',
  multi: false,
  categoryId: undefined,
  difficulty: 'MEDIUM',
  score: 5,
  analysis: '',
  choices: [
    { content: '', isCorrect: false, sort: 0 },
    { content: '', isCorrect: false, sort: 1 },
    { content: '', isCorrect: false, sort: 2 },
    { content: '', isCorrect: false, sort: 3 },
  ],
  judgeAnswer: '正确',
  textAnswer: '',
  keywords: '',
})

const form = reactive<QuestionForm>(defaultForm())

const rules: FormRules = {
  title: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
  type: [{ required: true, message: '请选择题型', trigger: 'change' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
}

function handleTypeChange() {
  // 切换题型时重置答案相关字段
  form.choices = defaultForm().choices
  form.judgeAnswer = '正确'
  form.textAnswer = ''
  form.keywords = ''
}

/** 单选题只允许一个正确答案 */
function handleCorrectChange(index: number) {
  if (!form.multi && form.choices[index].isCorrect) {
    form.choices.forEach((c, i) => {
      if (i !== index) c.isCorrect = false
    })
  }
}

async function openDialog(id?: number) {
  Object.assign(form, defaultForm(), { id: undefined, answerId: undefined })
  if (id != null) {
    const q = await getQuestion(id)
    form.id = q.id
    form.title = q.title
    form.type = q.type
    form.multi = !!q.multi
    form.categoryId = q.categoryId
    form.difficulty = q.difficulty
    form.score = q.score ?? 5
    form.analysis = q.analysis ?? ''
    form.answerId = q.answer?.id
    if (q.type === 'CHOICE') {
      form.choices = (q.choices ?? []).map((c, i) => ({ content: c.content, isCorrect: !!c.isCorrect, sort: i }))
    } else if (q.type === 'JUDGE') {
      form.judgeAnswer = q.answer?.answer ?? '正确'
    } else {
      form.textAnswer = q.answer?.answer ?? ''
      form.keywords = q.answer?.keywords ?? ''
    }
  }
  dialogVisible.value = true
}

function buildPayload(): Question {
  const payload: Question = {
    id: form.id,
    title: form.title,
    type: form.type,
    multi: form.type === 'CHOICE' ? form.multi : false,
    categoryId: form.categoryId,
    difficulty: form.difficulty,
    score: form.score,
    analysis: form.analysis,
    // 选择题的标准答案由后端根据 isCorrect 选项自动生成
    answer: { id: form.answerId, answer: '', keywords: '' },
  }
  if (form.type === 'CHOICE') {
    payload.choices = form.choices.map((c, i) => ({ content: c.content, isCorrect: c.isCorrect, sort: i }))
  } else if (form.type === 'JUDGE') {
    payload.answer = { id: form.answerId, answer: form.judgeAnswer, keywords: '' }
  } else {
    payload.answer = { id: form.answerId, answer: form.textAnswer, keywords: form.keywords }
  }
  return payload
}

function validateAnswer(): string | null {
  if (form.type === 'CHOICE') {
    if (form.choices.some((c) => !c.content.trim())) return '选项内容不能为空'
    const correctCount = form.choices.filter((c) => c.isCorrect).length
    if (correctCount === 0) return '请勾选正确答案'
    if (!form.multi && correctCount > 1) return '单选题只能有一个正确答案'
    if (form.multi && correctCount < 2) return '多选题至少需要两个正确答案'
  }
  if (form.type === 'TEXT' && !form.textAnswer.trim()) return '请填写简答题参考答案'
  return null
}

async function handleSave() {
  await formRef.value?.validate()
  const error = validateAnswer()
  if (error) {
    ElMessage.warning(error)
    return
  }
  saving.value = true
  try {
    const payload = buildPayload()
    if (form.id) {
      await updateQuestion(form.id, payload)
      ElMessage.success('题目更新成功')
    } else {
      await createQuestion(payload)
      ElMessage.success('题目创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  categories.value = await listCategories()
  loadData()
})
</script>

<style scoped>
.choice-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.choice-row .el-input {
  flex: 1;
}
</style>
