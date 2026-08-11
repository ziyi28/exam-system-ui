<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-header__title">批量导入 / AI 出题</h2>
        <p class="page-header__desc">通过 Excel 导入或 AI 生成题目，确认预览后再写入题库。</p>
      </div>
    </div>
    <el-row :gutter="16">
      <!-- Excel 导入 -->
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="workspace-card">
          <template #header>
            <div class="card-header">
              <span>Excel 批量导入</span>
              <el-button link type="primary" :icon="Download" @click="downloadTemplate">下载模板</el-button>
            </div>
          </template>
          <el-upload
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept=".xls,.xlsx"
            :on-change="handleFileChange"
          >
            <el-icon :size="48" class="upload-icon"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽 Excel 文件到此处，或 <em>点击选择文件</em></div>
            <template #tip>
              <div class="el-upload__tip">支持 .xls / .xlsx，上传后先预览再确认导入</div>
            </template>
          </el-upload>
          <el-alert v-if="excelFileName" :title="`已解析文件：${excelFileName}`" type="success" :closable="false" show-icon style="margin-top: 12px" />
        </el-card>

        <!-- AI 生成 -->
        <el-card shadow="never" class="workspace-card ai-generator-card">
          <template #header>AI 智能出题</template>
          <el-form :model="aiForm" label-width="90px">
            <el-form-item label="主题" required>
              <el-input v-model="aiForm.topic" placeholder="如：Java 面向对象编程" />
            </el-form-item>
            <el-form-item label="数量">
              <el-input-number v-model="aiForm.count" :min="1" :max="20" />
            </el-form-item>
            <el-form-item label="题型">
              <el-checkbox-group v-model="aiTypes">
                <el-checkbox value="CHOICE">选择题</el-checkbox>
                <el-checkbox value="JUDGE">判断题</el-checkbox>
                <el-checkbox value="TEXT">简答题</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="难度">
              <el-radio-group v-model="aiForm.difficulty">
                <el-radio-button value="EASY">简单</el-radio-button>
                <el-radio-button value="MEDIUM">中等</el-radio-button>
                <el-radio-button value="HARD">困难</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="aiForm.categoryId" placeholder="生成题目所属分类" clearable style="width: 100%">
                <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id!" />
              </el-select>
            </el-form-item>
            <el-form-item label="包含多选">
              <el-switch v-model="aiForm.includeMultiple" :disabled="!aiTypes.includes('CHOICE')" />
            </el-form-item>
            <el-form-item label="额外要求">
              <el-input v-model="aiForm.requirements" type="textarea" :rows="2" placeholder="如：重点考察实际应用，包含代码示例（可选）" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="MagicStick" :loading="generating" @click="handleGenerate">
                {{ generating ? 'AI 生成中，请稍候…' : '开始生成' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 预览与导入 -->
      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="workspace-card preview-card">
          <template #header>
            <div class="card-header">
              <span>待导入题目预览（{{ previewList.length }} 道）</span>
              <div>
                <el-button :disabled="!previewList.length" @click="previewList = []">清空</el-button>
                <el-button type="primary" :disabled="!previewList.length" :loading="importing" @click="handleImport">
                  确认导入
                </el-button>
              </div>
            </div>
          </template>

          <el-empty v-if="!previewList.length" description="通过左侧 Excel 上传或 AI 生成题目后在此预览" />

          <div v-else class="preview-list">
            <div v-for="(q, index) in previewList" :key="index" class="preview-item">
              <div class="preview-title">
                <el-tag :type="typeTag(q.type)" size="small">{{ typeText(q.type, q.multi) }}</el-tag>
                <el-tag :type="difficultyTag(q.difficulty)" size="small" effect="plain">{{ difficultyText(q.difficulty) }}</el-tag>
                <span class="title-text">{{ index + 1 }}. {{ q.title }}</span>
                <el-button link type="danger" size="small" @click="previewList.splice(index, 1)">移除</el-button>
              </div>
              <div v-if="q.choices?.length" class="preview-choices">
                <div v-for="(c, ci) in q.choices" :key="ci" :class="{ correct: c.isCorrect }">
                  {{ letter(ci) }}. {{ c.content }}
                  <el-icon v-if="c.isCorrect" class="check-icon"><Check /></el-icon>
                </div>
              </div>
              <div v-if="q.answer?.answer" class="preview-answer">答案：{{ q.answer.answer }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type UploadFile } from 'element-plus'
import { Download, UploadFilled, MagicStick, Check } from '@element-plus/icons-vue'
import { downloadTemplate, previewExcel, aiGenerate, importQuestions } from '@/api/questionBatch'
import { listCategories } from '@/api/category'
import type { AiGenerateForm, Category, Question } from '@/types'
import { typeText, typeTag, difficultyText, difficultyTag, letter } from '@/utils/format'

const categories = ref<Category[]>([])
const previewList = ref<Question[]>([])
const excelFileName = ref('')
const generating = ref(false)
const importing = ref(false)

// ---- Excel ----
async function handleFileChange(file: UploadFile) {
  if (!file.raw) return
  try {
    const questions = await previewExcel(file.raw)
    previewList.value = [...previewList.value, ...questions]
    excelFileName.value = file.name
    ElMessage.success(`解析成功，共 ${questions.length} 道题目`)
  } catch {
    // 错误提示已由拦截器处理
  }
}

// ---- AI 生成 ----
const aiTypes = ref<string[]>(['CHOICE', 'JUDGE'])
const aiForm = reactive<AiGenerateForm>({
  topic: '',
  count: 5,
  difficulty: 'MEDIUM',
  categoryId: undefined,
  includeMultiple: false,
  requirements: '',
})

async function handleGenerate() {
  if (!aiForm.topic.trim()) {
    ElMessage.warning('请输入生成主题')
    return
  }
  if (!aiTypes.value.length) {
    ElMessage.warning('请至少选择一种题型')
    return
  }
  generating.value = true
  try {
    const questions = await aiGenerate({ ...aiForm, types: aiTypes.value.join(',') })
    previewList.value = [...previewList.value, ...questions]
    ElMessage.success(`AI 生成成功，共 ${questions.length} 道题目`)
  } finally {
    generating.value = false
  }
}

// ---- 导入 ----
async function handleImport() {
  importing.value = true
  try {
    const result = await importQuestions(previewList.value)
    const success = result?.successCount ?? previewList.value.length
    ElMessage.success(`导入完成，成功 ${success} 道`)
    previewList.value = []
    excelFileName.value = ''
  } finally {
    importing.value = false
  }
}

onMounted(async () => {
  categories.value = await listCategories()
})
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-generator-card {
  margin-top: 16px;
}

.preview-list {
  max-height: 70vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-item {
  border: 1px solid var(--gray-100);
  border-radius: var(--radius-lg);
  padding: 16px;
  background: var(--surface-muted);
}

.upload-icon {
  color: var(--gray-400);
}

.check-icon {
  color: var(--success);
  vertical-align: -2px;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  flex: 1;
  font-weight: 500;
}

.preview-choices {
  margin-top: 8px;
  padding-left: 8px;
  color: var(--gray-600);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-choices .correct {
  color: var(--success);
  font-weight: 600;
}

.preview-answer {
  margin-top: 8px;
  font-size: 13px;
  color: var(--warning);
}

@media (max-width: 768px) {
  .card-header,
  .preview-title {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .preview-list {
    max-height: none;
  }
}
</style>
