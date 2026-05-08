<template>
  <div class="exam-page" @visibilitychange="onVisibilityChange">
    <!-- 顶栏 -->
    <header class="exam-header glass-card">
      <div class="header-left">
        <h2>{{ paper?.name || '在线考试' }}</h2>
      </div>
      <div class="header-center">
        <div class="timer" :class="{ warning: remainingTime < 300 }">
          <el-icon><Timer /></el-icon>
          <span>{{ formatTime(remainingTime) }}</span>
        </div>
      </div>
      <div class="header-right">
        <span class="student-name">考生：{{ studentName }}</span>
        <el-button type="primary" @click="handleSubmit" :loading="submittingExam">提交试卷</el-button>
      </div>
    </header>

    <div class="exam-body" v-loading="loadingExam">
      <!-- 题目区域 -->
      <div class="question-area">
        <div v-if="currentQuestion" class="question-card glass-card">
          <div class="question-header">
            <span class="q-number">第 {{ currentIndex + 1 }} 题</span>
            <el-tag :type="typeTag(currentQuestion.type)" size="small">{{ typeLabel(currentQuestion.type) }}</el-tag>
            <el-tag size="small">{{ currentQuestion.paperScore || currentQuestion.score }} 分</el-tag>
          </div>
          <div class="question-title">{{ currentQuestion.title }}</div>

          <!-- 选择题 -->
          <div v-if="currentQuestion.type === 'CHOICE'" class="choices-area">
            <div v-for="(choice, idx) in currentQuestion.choices" :key="idx"
              class="choice-item" :class="{ selected: isChoiceSelected(choice) }"
              @click="toggleChoice(choice)">
              <span class="choice-label">{{ String.fromCharCode(65 + idx) }}</span>
              <span class="choice-text">{{ choice.content }}</span>
            </div>
          </div>

          <!-- 判断题 -->
          <div v-if="currentQuestion.type === 'JUDGE'" class="judge-area">
            <div class="choice-item" :class="{ selected: answers[currentQuestion.id] === '正确' }" @click="answers[currentQuestion.id] = '正确'">
              <el-icon><CircleCheckFilled /></el-icon> 正确
            </div>
            <div class="choice-item" :class="{ selected: answers[currentQuestion.id] === '错误' }" @click="answers[currentQuestion.id] = '错误'">
              <el-icon><CircleCloseFilled /></el-icon> 错误
            </div>
          </div>

          <!-- 简答题 -->
          <div v-if="currentQuestion.type === 'TEXT'" class="text-area">
            <el-input v-model="answers[currentQuestion.id]" type="textarea" :rows="6" placeholder="请输入您的答案..." />
          </div>

          <!-- 上下题导航 -->
          <div class="question-nav">
            <el-button :disabled="currentIndex === 0" @click="currentIndex--"><el-icon><ArrowLeft /></el-icon> 上一题</el-button>
            <el-button :disabled="currentIndex === questions.length - 1" @click="currentIndex++">下一题 <el-icon><ArrowRight /></el-icon></el-button>
          </div>
        </div>
      </div>

      <!-- 答题卡 -->
      <div class="answer-sheet glass-card">
        <h3>答题卡</h3>
        <div class="sheet-grid">
          <div v-for="(q, idx) in questions" :key="q.id"
            class="sheet-item" :class="{ answered: !!answers[q.id], current: idx === currentIndex }"
            @click="currentIndex = idx">
            {{ idx + 1 }}
          </div>
        </div>
        <div class="sheet-legend">
          <span><i class="dot answered"></i> 已答</span>
          <span><i class="dot unanswered"></i> 未答</span>
          <span><i class="dot current"></i> 当前</span>
        </div>
        <div class="sheet-stats">
          已答 {{ answeredCount }} / {{ questions.length }} 题
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { startExam, submitAnswers } from '@/api/exam'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const paperId = route.params.paperId
const studentName = route.query.name || '匿名'

const loadingExam = ref(true)
const submittingExam = ref(false)
const paper = ref(null)
const questions = ref([])
const currentIndex = ref(0)
const answers = reactive({})
const examRecordId = ref(null)
const remainingTime = ref(7200) // 默认120分钟
let timer = null
let windowSwitches = 0

const currentQuestion = computed(() => questions.value[currentIndex.value])
const answeredCount = computed(() => Object.keys(answers).filter(k => !!answers[k]).length)

const typeLabel = (t) => ({ CHOICE: '选择题', JUDGE: '判断题', TEXT: '简答题' }[t] || t)
const typeTag = (t) => ({ CHOICE: 'primary', JUDGE: 'warning', TEXT: 'success' }[t] || 'info')

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function isChoiceSelected(choice) {
  const ans = answers[currentQuestion.value.id]
  if (currentQuestion.value.multi) {
    return (ans || '').split(',').includes(String(choice.id))
  }
  return ans === String(choice.id)
}

function toggleChoice(choice) {
  const qId = currentQuestion.value.id
  if (currentQuestion.value.multi) {
    const selected = (answers[qId] || '').split(',').filter(Boolean)
    const idx = selected.indexOf(String(choice.id))
    if (idx >= 0) selected.splice(idx, 1)
    else selected.push(String(choice.id))
    answers[qId] = selected.join(',')
  } else {
    answers[qId] = String(choice.id)
  }
}

function onVisibilityChange() {
  if (document.hidden) {
    windowSwitches++
    if (windowSwitches >= 3) {
      ElMessage.warning('频繁切换窗口，系统已记录！')
    }
  }
}

async function handleSubmit() {
  await ElMessageBox.confirm('确定提交试卷吗？提交后将无法修改。', '确认提交', { type: 'warning' })
  submittingExam.value = true
  try {
    const answerList = questions.value.map(q => ({
      questionId: q.id,
      userAnswer: answers[q.id] || ''
    }))
    await submitAnswers(examRecordId.value, answerList)
    ElMessage.success('提交成功！')
    clearInterval(timer)
    router.push(`/exam-result/${examRecordId.value}`)
  } catch (e) {
    ElMessage.error('提交失败，请重试')
  }
  submittingExam.value = false
}

onMounted(async () => {
  try {
    const res = await startExam({ paperId: Number(paperId), studentName })
    examRecordId.value = res.data?.id
    paper.value = res.data?.paper
    questions.value = res.data?.paper?.questions || []
    remainingTime.value = (paper.value?.duration || 120) * 60

    timer = setInterval(() => {
      remainingTime.value--
      if (remainingTime.value <= 0) {
        clearInterval(timer)
        handleSubmit()
      }
    }, 1000)
  } catch (e) {
    ElMessage.error('考试初始化失败')
  }
  loadingExam.value = false

  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<style scoped>
.exam-page {
  min-height: 100vh;
  background: var(--bg-deep);
  padding: 16px;
}

.exam-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  margin-bottom: 20px;
}
.header-left h2 { font-size: 1.1rem; }
.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--primary-light);
}
.timer.warning { color: var(--danger); animation: pulse-glow 1s infinite; }
.student-name { color: var(--text-secondary); margin-right: 12px; font-size: 0.9rem; }

.exam-body { display: flex; gap: 20px; }
.question-area { flex: 1; }
.question-card { padding: 32px; }
.question-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.q-number {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--primary-light);
}
.question-title {
  font-size: 1.05rem;
  line-height: 1.8;
  margin-bottom: 24px;
  color: var(--text-primary);
}

/* 选择题/判断题选项 */
.choices-area, .judge-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}
.choice-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: var(--bg-elevated);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.choice-item:hover { border-color: var(--border-hover); }
.choice-item.selected {
  border-color: var(--primary);
  background: rgba(99, 102, 241, 0.1);
}
.choice-label {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.choice-item.selected .choice-label {
  background: var(--primary);
  color: #fff;
}

.text-area { margin-bottom: 24px; }

.question-nav {
  display: flex;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

/* 答题卡 */
.answer-sheet {
  width: 240px;
  padding: 20px;
  position: sticky;
  top: 100px;
  height: fit-content;
}
.answer-sheet h3 { margin-bottom: 16px; font-size: 0.95rem; }
.sheet-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 16px;
}
.sheet-item {
  width: 36px; height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--text-muted);
}
.sheet-item:hover { background: var(--bg-hover); }
.sheet-item.answered { background: var(--primary); color: #fff; }
.sheet-item.current { outline: 2px solid var(--accent); outline-offset: 2px; }

.sheet-legend {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}
.sheet-legend span { display: flex; align-items: center; gap: 4px; }
.dot {
  display: inline-block;
  width: 10px; height: 10px;
  border-radius: 50%;
}
.dot.answered { background: var(--primary); }
.dot.unanswered { background: var(--bg-elevated); }
.dot.current { background: var(--bg-elevated); outline: 2px solid var(--accent); }

.sheet-stats {
  font-size: 0.82rem;
  color: var(--text-secondary);
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}
</style>
