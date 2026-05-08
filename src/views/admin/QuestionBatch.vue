<template>
  <div class="page-container">
    <div class="batch-tabs glass-card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- Excel 导入 -->
        <el-tab-pane label="Excel 导入" name="excel">
          <div class="tab-content">
            <div class="upload-section">
              <el-button type="primary" @click="handleDownloadTemplate" :loading="downloading">
                <el-icon><Download /></el-icon> 下载导入模板
              </el-button>
              <el-upload
                action="#" :auto-upload="false" :on-change="handleExcelFile" accept=".xls,.xlsx"
                :show-file-list="false" style="display:inline-block; margin-left: 12px;">
                <el-button><el-icon><Upload /></el-icon> 选择Excel文件</el-button>
              </el-upload>
              <el-button v-if="selectedFile" type="success" @click="handlePreviewExcel" :loading="previewing" style="margin-left:12px">
                <el-icon><View /></el-icon> 预览数据
              </el-button>
            </div>
            <div v-if="selectedFile" class="file-info">
              <el-tag type="info">{{ selectedFile.name }}</el-tag>
            </div>
          </div>
        </el-tab-pane>

        <!-- AI 生成 -->
        <el-tab-pane label="AI 智能生成" name="ai">
          <div class="tab-content">
            <el-form :model="aiForm" label-width="100px" class="ai-form">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="生成主题" required>
                    <el-input v-model="aiForm.topic" placeholder="如：Java面向对象编程" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="数量">
                    <el-input-number v-model="aiForm.count" :min="1" :max="20" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="难度">
                    <el-select v-model="aiForm.difficulty" clearable>
                      <el-option label="简单" value="EASY" />
                      <el-option label="中等" value="MEDIUM" />
                      <el-option label="困难" value="HARD" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="题型">
                    <el-input v-model="aiForm.types" placeholder="CHOICE,JUDGE,TEXT" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="额外要求">
                    <el-input v-model="aiForm.requirements" placeholder="如：重点考察实际应用" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item>
                <el-button type="primary" @click="handleAiGenerate" :loading="aiGenerating">
                  <el-icon><MagicStick /></el-icon> AI 生成题目
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 预览数据表格 -->
    <div v-if="previewData.length > 0" class="preview-section glass-card">
      <div class="preview-header">
        <h3><el-icon><Document /></el-icon> 预览数据 ({{ previewData.length }} 道题)</h3>
        <el-button type="primary" @click="handleBatchImport" :loading="importing">
          <el-icon><Check /></el-icon> 确认导入
        </el-button>
      </div>
      <el-table :data="previewData" stripe max-height="500">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="title" label="题目标题" min-width="300" show-overflow-tooltip />
        <el-table-column prop="type" label="题型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="80" align="center" />
        <el-table-column prop="answer" label="答案" width="120" show-overflow-tooltip />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { downloadTemplate, previewExcel, aiGenerateQuestions, importQuestions } from '@/api/question'
import { ElMessage } from 'element-plus'

const activeTab = ref('excel')
const selectedFile = ref(null)
const downloading = ref(false)
const previewing = ref(false)
const aiGenerating = ref(false)
const importing = ref(false)
const previewData = ref([])

const aiForm = reactive({
  topic: '', count: 5, types: 'CHOICE,JUDGE,TEXT', difficulty: 'MEDIUM', requirements: ''
})

async function handleDownloadTemplate() {
  downloading.value = true
  try {
    const res = await downloadTemplate()
    const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'question_import_template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (e) { /* ignore */ }
  downloading.value = false
}

function handleExcelFile(file) {
  selectedFile.value = file.raw
  previewData.value = []
}

async function handlePreviewExcel() {
  if (!selectedFile.value) return
  previewing.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    const res = await previewExcel(formData)
    previewData.value = res.data || []
    ElMessage.success(`解析成功，共 ${previewData.value.length} 道题`)
  } catch (e) { /* ignore */ }
  previewing.value = false
}

async function handleAiGenerate() {
  if (!aiForm.topic) return ElMessage.warning('请输入生成主题')
  aiGenerating.value = true
  try {
    const res = await aiGenerateQuestions(aiForm)
    previewData.value = res.data || []
    ElMessage.success(`AI 生成成功，共 ${previewData.value.length} 道题`)
  } catch (e) { /* ignore */ }
  aiGenerating.value = false
}

async function handleBatchImport() {
  if (previewData.value.length === 0) return
  importing.value = true
  try {
    const res = await importQuestions(previewData.value)
    ElMessage.success(res.data || '导入成功')
    previewData.value = []
  } catch (e) { /* ignore */ }
  importing.value = false
}
</script>

<style scoped>
.page-container { padding: 4px; }
.batch-tabs { padding: 0; overflow: hidden; }
.tab-content { padding: 20px; }
.upload-section { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.file-info { margin-top: 12px; }
.ai-form { max-width: 900px; }

.preview-section {
  padding: 20px;
  margin-top: 20px;
}
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.preview-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}
</style>
