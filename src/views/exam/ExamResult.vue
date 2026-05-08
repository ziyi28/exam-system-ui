<template>
  <div class="result-page">
    <div class="result-container" v-loading="loading">
      <!-- 成绩概览 -->
      <div class="score-card glass-card" v-if="record">
        <div class="score-circle" :class="scoreLevel">
          <span class="score-value">{{ record.score || 0 }}</span>
          <span class="score-label">得分</span>
        </div>
        <div class="score-info">
          <h2>{{ record.paper?.name || '考试' }}</h2>
          <div class="score-meta">
            <span>考生：{{ record.studentName }}</span>
            <span>状态：<el-tag :type="record.status === '已批阅' ? 'success' : 'warning'" size="small">{{ record.status }}</el-tag></span>
          </div>
          <div class="score-actions">
            <el-button type="primary" @click="handleGrade" :loading="grading" v-if="record.status !== '已批阅'">
              <el-icon><MagicStick /></el-icon> AI 批阅
            </el-button>
            <el-button @click="goHome"><el-icon><HomeFilled /></el-icon> 返回首页</el-button>
          </div>
        </div>
      </div>

      <!-- 答题详情 -->
      <div class="answers-section glass-card" v-if="record?.answerRecords?.length">
        <h3>答题详情</h3>
        <div v-for="(ar, idx) in record.answerRecords" :key="ar.id" class="answer-item">
          <div class="answer-header">
            <span class="q-num">第 {{ idx + 1 }} 题</span>
            <el-tag :type="correctTag(ar.isCorrect)" size="small">
              {{ ar.isCorrect === 1 ? '正确' : ar.isCorrect === 2 ? '部分正确' : '错误' }}
            </el-tag>
            <span class="q-score">{{ ar.score || 0 }} 分</span>
          </div>
          <div class="answer-body">
            <p><strong>你的答案：</strong>{{ ar.userAnswer || '未作答' }}</p>
            <p v-if="ar.aiCorrection" class="ai-feedback">
              <el-icon><MagicStick /></el-icon> <strong>AI 评价：</strong>{{ ar.aiCorrection }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getExamRecordById, gradeExam } from '@/api/exam'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const loading = ref(true)
const grading = ref(false)
const record = ref(null)

const userInfo = localStorage.getItem('userInfo')
function goHome() { router.push(userInfo ? '/home' : '/guest') }

const scoreLevel = computed(() => {
  const s = record.value?.score || 0
  if (s >= 80) return 'excellent'
  if (s >= 60) return 'good'
  return 'failed'
})

const correctTag = (v) => ({ 1: 'success', 2: 'warning' }[v] || 'danger')

async function loadRecord() {
  loading.value = true
  try {
    const res = await getExamRecordById(id)
    record.value = res.data
  } catch (e) { /* ignore */ }
  loading.value = false
}

async function handleGrade() {
  grading.value = true
  try {
    const res = await gradeExam(id)
    record.value = res.data
    ElMessage.success('AI 批阅完成')
  } catch (e) { /* ignore */ }
  grading.value = false
}

onMounted(() => loadRecord())
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  background: var(--bg-deep);
  padding: 32px;
}
.result-container { max-width: 900px; margin: 0 auto; }

.score-card {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 40px;
  margin-bottom: 24px;
}
.score-circle {
  width: 120px; height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.score-circle.excellent { background: linear-gradient(135deg, #10b981, #34d399); }
.score-circle.good { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.score-circle.failed { background: linear-gradient(135deg, #ef4444, #f87171); }
.score-value {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}
.score-label { color: rgba(255,255,255,0.8); font-size: 0.8rem; }
.score-info { flex: 1; }
.score-info h2 { margin-bottom: 8px; }
.score-meta {
  display: flex;
  gap: 20px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 16px;
}
.score-actions { display: flex; gap: 10px; }

.answers-section {
  padding: 28px;
}
.answers-section h3 { margin-bottom: 16px; }
.answer-item {
  padding: 16px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
}
.answer-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.q-num { font-weight: 600; color: var(--primary-light); }
.q-score { margin-left: auto; color: var(--text-muted); font-size: 0.85rem; }
.answer-body p { color: var(--text-secondary); margin-bottom: 4px; font-size: 0.9rem; }
.ai-feedback {
  background: rgba(99, 102, 241, 0.08);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  margin-top: 8px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
</style>
