<template>
  <div v-loading="loading" class="exam-taking">
    <template v-if="record && paper">
      <!-- 顶部信息栏 -->
      <el-card shadow="never" class="exam-header">
        <div class="header-inner">
          <div>
            <div class="paper-name">{{ paper.name }}</div>
            <div class="paper-meta">共 {{ questions.length }} 题 · 总分 {{ paper.totalScore }} 分</div>
          </div>
          <div class="header-right">
            <el-tag v-if="windowSwitches > 0" type="danger" effect="plain" size="small">
              切屏 {{ windowSwitches }} 次
            </el-tag>
            <div class="countdown" :class="{ warning: remainSeconds <= 300 }">
              <el-icon><Timer /></el-icon>
              {{ countdownText }}
            </div>
            <el-button type="primary" :loading="submitting" @click="handleSubmit(false)">交卷</el-button>
          </div>
        </div>
      </el-card>

      <div class="exam-body">
        <!-- 题目区 -->
        <div class="questions">
          <el-card v-for="(q, index) in questions" :id="`question-${q.id}`" :key="q.id" shadow="never" class="question-card">
            <div class="question-title">
              <span class="q-index">{{ index + 1 }}.</span>
              <el-tag :type="typeTag(q.type)" size="small">{{ typeText(q.type, q.multi) }}</el-tag>
              <el-tag type="info" size="small" effect="plain">{{ q.paperScore }} 分</el-tag>
            </div>
            <div class="q-text">{{ q.title }}</div>

            <!-- 单选 -->
            <el-radio-group
              v-if="q.type === 'CHOICE' && !q.multi"
              :model-value="answers[q.id!]"
              class="choice-group"
              @update:model-value="(v: string | number | boolean | undefined) => (answers[q.id!] = String(v ?? ''))"
            >
              <el-radio v-for="(c, ci) in q.choices" :key="ci" :value="letter(ci)" class="choice-item" border>
                {{ letter(ci) }}. {{ c.content }}
              </el-radio>
            </el-radio-group>

            <!-- 多选 -->
            <el-checkbox-group
              v-else-if="q.type === 'CHOICE' && q.multi"
              :model-value="multiAnswers[q.id!] ?? []"
              class="choice-group"
              @update:model-value="(v: unknown[]) => setMultiAnswer(q.id!, v as string[])"
            >
              <el-checkbox v-for="(c, ci) in q.choices" :key="ci" :value="letter(ci)" class="choice-item" border>
                {{ letter(ci) }}. {{ c.content }}
              </el-checkbox>
            </el-checkbox-group>

            <!-- 判断 -->
            <el-radio-group
              v-else-if="q.type === 'JUDGE'"
              :model-value="answers[q.id!]"
              class="choice-group"
              @update:model-value="(v: string | number | boolean | undefined) => (answers[q.id!] = String(v ?? ''))"
            >
              <el-radio value="正确" class="choice-item" border>正确</el-radio>
              <el-radio value="错误" class="choice-item" border>错误</el-radio>
            </el-radio-group>

            <!-- 简答 -->
            <el-input
              v-else
              :model-value="answers[q.id!]"
              type="textarea"
              :rows="5"
              placeholder="请输入你的答案，AI 将根据语义进行评分…"
              @update:model-value="(v: string) => (answers[q.id!] = v)"
            />
          </el-card>
        </div>

        <!-- 答题卡 -->
        <div class="answer-sheet">
          <el-card shadow="never">
            <template #header>答题卡（{{ answeredCount }} / {{ questions.length }}）</template>
            <div class="sheet-grid">
              <div
                v-for="(q, index) in questions"
                :key="q.id"
                class="sheet-item"
                :class="{ answered: isAnswered(q.id!) }"
                @click="scrollToQuestion(q.id!)"
              >
                {{ index + 1 }}
              </div>
            </div>
            <div class="sheet-legend">
              <span><i class="dot answered" /> 已答</span>
              <span><i class="dot" /> 未答</span>
            </div>
            <el-alert type="warning" :closable="false" show-icon title="切换窗口/标签页将被记录" style="margin-top: 12px" />
          </el-card>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExamDetail, submitAnswers, reportWindowSwitch } from '@/api/exam'
import type { ExamRecord, Paper, Question } from '@/types'
import { typeText, typeTag, letter } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const recordId = Number(route.params.recordId)

const loading = ref(false)
const submitting = ref(false)
const record = ref<ExamRecord | null>(null)
const paper = ref<Paper | null>(null)
const questions = computed<Question[]>(() => paper.value?.questions ?? [])

/** 单选/判断/简答答案：questionId -> string */
const answers = reactive<Record<number, string>>({})
/** 多选答案单独存数组，提交时 join(',') */
const multiAnswers = reactive<Record<number, string[]>>({})

function setMultiAnswer(questionId: number, values: string[]) {
  // 保持字母顺序，与后端标准答案格式（A,C）一致
  multiAnswers[questionId] = [...values].sort()
  answers[questionId] = multiAnswers[questionId].join(',')
}

function isAnswered(questionId: number) {
  return !!answers[questionId]?.trim()
}

const answeredCount = computed(() => questions.value.filter((q) => isAnswered(q.id!)).length)

function scrollToQuestion(questionId: number) {
  document.getElementById(`question-${questionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// ---- 倒计时 ----
const remainSeconds = ref(0)
let countdownTimer: number | undefined

const countdownText = computed(() => {
  const s = Math.max(0, remainSeconds.value)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
})

function startCountdown() {
  const durationMinutes = paper.value?.duration ?? 60
  const startTime = record.value?.startTime ? new Date(record.value.startTime.replace(' ', 'T')).getTime() : Date.now()
  const deadline = startTime + durationMinutes * 60 * 1000

  const tick = () => {
    remainSeconds.value = Math.floor((deadline - Date.now()) / 1000)
    if (remainSeconds.value <= 0) {
      window.clearInterval(countdownTimer)
      ElMessage.warning('考试时间已到，系统自动交卷')
      handleSubmit(true)
    }
  }
  tick()
  countdownTimer = window.setInterval(tick, 1000)
}

// ---- 切屏监控 ----
const windowSwitches = ref(0)

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden' && record.value?.status === '进行中' && !submitting.value) {
    windowSwitches.value++
    reportWindowSwitch(recordId).catch(() => {})
  }
}

// ---- 提交 ----
async function handleSubmit(auto: boolean) {
  if (submitting.value) return
  if (!auto) {
    const unanswered = questions.value.length - answeredCount.value
    await ElMessageBox.confirm(
      unanswered > 0 ? `还有 ${unanswered} 道题未作答，确定交卷吗？` : '确认交卷吗？交卷后将由 AI 自动批阅。',
      '交卷确认',
      { type: 'warning', confirmButtonText: '交卷', cancelButtonText: '继续答题' },
    )
  }
  submitting.value = true
  // 交卷后 AI 批阅改为后台异步执行，这里只需等待保存答案，结果页会自动轮询批阅进度
  const loadingMsg = ElMessage({ message: '正在提交答案…', type: 'info', duration: 0 })
  try {
    const answerList = questions.value.map((q) => ({ questionId: q.id!, userAnswer: answers[q.id!] ?? '' }))
    await submitAnswers(recordId, answerList)
    ElMessage.success('交卷成功，AI 正在批阅中')
    router.replace(`/student/result/${recordId}`)
  } finally {
    loadingMsg.close()
    submitting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const data = await getExamDetail(recordId)
    // 非进行中的记录直接跳转结果页
    if (data.status !== '进行中') {
      router.replace(`/student/result/${recordId}`)
      return
    }
    record.value = data
    paper.value = data.paper ?? null
    windowSwitches.value = data.windowSwitches ?? 0
    startCountdown()
    document.addEventListener('visibilitychange', handleVisibilityChange)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  window.clearInterval(countdownTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.exam-header {
  position: sticky;
  top: 68px;
  z-index: 10;
  margin-bottom: 16px;
  /* 沉浸式毛玻璃：sticky 元素上使用 backdrop-filter 安全 */
  --el-card-bg-color: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: var(--shadow-sm);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.paper-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.paper-meta {
  font-size: 13px;
  color: var(--gray-500);
  margin-top: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.countdown {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 22px;
  font-weight: 700;
  color: var(--brand-600);
  font-variant-numeric: tabular-nums;
}

.countdown.warning {
  color: var(--danger);
  animation: countdown-pulse 1.2s var(--ease-out-expo) infinite;
}

@keyframes countdown-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .countdown.warning {
    animation: none;
  }
}

.exam-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.questions {
  flex: 1;
  min-width: 0;
}

.question-card {
  margin-bottom: 12px;
}

.question-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.q-index {
  font-weight: 700;
  color: var(--brand-600);
}

.q-text {
  margin: 10px 0 14px;
  font-size: 15px;
  line-height: 1.7;
}

.choice-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.choice-item {
  width: 100%;
  margin-right: 0 !important;
  height: auto;
  padding: 10px 14px;
  white-space: normal;
  border-radius: var(--radius-md);
  transition:
    border-color var(--duration-fast) var(--ease-out-expo),
    background-color var(--duration-fast) var(--ease-out-expo);
}

.choice-item:hover {
  background: var(--gray-50);
}

.answer-sheet {
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: 150px;
}

.sheet-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.sheet-item {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  transition:
    border-color var(--duration-fast) var(--ease-out-expo),
    background-color var(--duration-fast) var(--ease-out-expo),
    color var(--duration-fast) var(--ease-out-expo);
}

.sheet-item:hover {
  border-color: var(--brand-600);
  color: var(--brand-600);
}

.sheet-item.answered {
  background: var(--brand-600);
  border-color: var(--brand-600);
  color: #fff;
}

.sheet-legend {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--gray-500);
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--gray-200);
  margin-right: 4px;
}

.dot.answered {
  background: var(--brand-600);
}

@media (max-width: 768px) {
  .answer-sheet {
    display: none;
  }
}
</style>
