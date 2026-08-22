<template>
  <div v-loading="loading" class="exam-taking-terminal">
    <template v-if="record && paper">
      <!-- 顶部固定考务 HUD 仪表栏 -->
      <div class="exam-hud-bar">
        <div class="hud-inner">
          <div class="hud-left">
            <div class="hud-paper-name">
              <span class="hud-badge">EXAM_SESSION</span>
              <span class="paper-title">{{ paper.name }}</span>
            </div>
            <div class="hud-progress-wrap">
              <span class="mono-progress-text">
                PROGRESS: {{ String(answeredCount).padStart(2, '0') }}/{{ String(questions.length).padStart(2, '0') }}
                ({{ progressPercentage }}%)
              </span>
              <el-progress
                :percentage="progressPercentage"
                :show-text="false"
                :stroke-width="4"
                class="hud-progress-bar"
              />
            </div>
          </div>

          <div class="hud-right">
            <!-- 切屏预警雷达 -->
            <div v-if="windowSwitches > 0" class="switch-radar-badge">
              <span class="radar-dot"></span>
              <span>SWITCH_LOG: {{ windowSwitches }}</span>
            </div>

            <!-- 倒计时 HUD -->
            <div class="countdown-hud" :class="{ 'is-urgent': remainSeconds <= 300 }">
              <el-icon :size="16"><Timer /></el-icon>
              <span class="countdown-digits">{{ countdownText }}</span>
            </div>

            <!-- 快捷键指南提示 -->
            <el-popover placement="bottom" :width="300" trigger="hover">
              <template #reference>
                <button type="button" class="hud-icon-btn" aria-label="键盘快捷键指南">
                  <span class="kbd-icon">⌨</span>
                </button>
              </template>
              <div class="shortcuts-guide">
                <div class="guide-title">TERMINAL_SHORTCUTS // 快捷键</div>
                <ul class="guide-list">
                  <li><kbd>J</kbd> / <kbd>↓</kbd> <span>下一题</span></li>
                  <li><kbd>K</kbd> / <kbd>↑</kbd> <span>上一题</span></li>
                  <li><kbd>A</kbd> - <kbd>D</kbd> 或 <kbd>1</kbd> - <kbd>4</kbd> <span>快速选选项</span></li>
                  <li><kbd>M</kbd> <span>标记 / 取消疑难</span></li>
                  <li><kbd>Alt + S</kbd> <span>快速交卷 (回车确认)</span></li>
                </ul>
              </div>
            </el-popover>

            <!-- 交卷主按钮 -->
            <el-button
              type="primary"
              class="submit-exam-btn"
              :loading="submitting"
              @click="handleSubmit(false)"
            >
              SUBMIT // 交卷
            </el-button>
          </div>
        </div>
      </div>

      <!-- 核心考场答题区 -->
      <div class="exam-terminal-body">
        <!-- 题目流列表 -->
        <div class="questions-stream">
          <div
            v-for="(q, index) in questions"
            :id="`question-${q.id}`"
            :key="q.id"
            class="terminal-question-card"
            :class="{ 'is-marked': flaggedQuestions.has(q.id!), 'is-active': activeQuestionIndex === index }"
            @click="activeQuestionIndex = index"
          >
            <!-- 题目头部元数据 -->
            <div class="q-card-head">
              <div class="q-head-left">
                <span class="q-index-mono">#{{ String(index + 1).padStart(2, '0') }}</span>
                <el-tag :type="typeTag(q.type)" size="small" class="q-type-tag">
                  {{ typeText(q.type, q.multi) }}
                </el-tag>
                <span class="q-score-badge">{{ q.paperScore }} PTS</span>
              </div>
              <div class="q-head-right">
                <!-- 疑难标记按钮 -->
                <button
                  type="button"
                  class="flag-btn"
                  :class="{ 'is-flagged': flaggedQuestions.has(q.id!) }"
                  :aria-label="flaggedQuestions.has(q.id!) ? '取消疑难标记' : '标记为疑难题目'"
                  @click.stop="toggleFlag(q.id!)"
                >
                  <span class="flag-star">★</span>
                  <span>{{ flaggedQuestions.has(q.id!) ? 'FLAGGED' : 'FLAG' }}</span>
                </button>
              </div>
            </div>

            <!-- 题干文本 -->
            <div class="q-body-title">{{ q.title }}</div>

            <!-- 单选题选项 -->
            <div v-if="q.type === 'CHOICE' && !q.multi" class="options-container">
              <div
                v-for="(c, ci) in q.choices"
                :key="ci"
                class="terminal-option-row"
                :class="{ 'is-selected': answers[q.id!] === letter(ci) }"
                @click="selectSingleChoice(q.id!, letter(ci))"
              >
                <span class="option-key">{{ letter(ci) }}</span>
                <span class="option-content">{{ c.content }}</span>
              </div>
            </div>

            <!-- 多选题选项 -->
            <div v-else-if="q.type === 'CHOICE' && q.multi" class="options-container">
              <div
                v-for="(c, ci) in q.choices"
                :key="ci"
                class="terminal-option-row"
                :class="{ 'is-selected': (multiAnswers[q.id!] ?? []).includes(letter(ci)) }"
                @click="toggleMultiChoice(q.id!, letter(ci))"
              >
                <span class="option-key checkbox-key">{{ letter(ci) }}</span>
                <span class="option-content">{{ c.content }}</span>
              </div>
            </div>

            <!-- 判断题 -->
            <div v-else-if="q.type === 'JUDGE'" class="options-container judge-container">
              <div
                class="terminal-option-row judge-option"
                :class="{ 'is-selected': answers[q.id!] === '正确' }"
                @click="selectSingleChoice(q.id!, '正确')"
              >
                <span class="option-key">T</span>
                <span class="option-content">正确 // TRUE</span>
              </div>
              <div
                class="terminal-option-row judge-option"
                :class="{ 'is-selected': answers[q.id!] === '错误' }"
                @click="selectSingleChoice(q.id!, '错误')"
              >
                <span class="option-key">F</span>
                <span class="option-content">错误 // FALSE</span>
              </div>
            </div>

            <!-- 简答题 -->
            <div v-else class="essay-container">
              <div class="essay-toolbar">
                <button
                  type="button"
                  class="mono-mode-toggle"
                  :class="{ 'is-active': monoModeMap[q.id!] }"
                  @click="monoModeMap[q.id!] = !monoModeMap[q.id!]"
                >
                  <span class="toggle-icon">⌨</span>
                  <span>{{ monoModeMap[q.id!] ? 'MONO_CODE // 等宽模式开启' : 'PLAIN_TEXT // 标准文本' }}</span>
                </button>
              </div>
              <el-input
                :model-value="answers[q.id!]"
                type="textarea"
                :rows="6"
                placeholder="请输入你的作答内容（系统支持离线暂存防丢，交卷后将启动 AI 智能判题流水线）…"
                class="terminal-essay-input"
                :class="{ 'is-mono-editor': monoModeMap[q.id!] }"
                @update:model-value="(v: string) => updateAnswer(q.id!, v)"
              />
              <div class="essay-meta-footer">
                <div class="essay-char-count mono-num">
                  LEN: {{ (answers[q.id!] || '').length }} CHARS
                </div>
                <div v-if="(answers[q.id!] || '').length >= 10" class="essay-status-pill">
                  [DRAFT_RECORDED]
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧悬浮等宽矩阵答题卡 -->
        <aside class="terminal-sheet-sidebar">
          <div class="sheet-panel">
            <div class="sheet-header">
              <div class="sheet-title">
                <span class="sheet-dot"></span>
                ANSWER_MATRIX
              </div>
              <span class="sheet-counter mono-num">{{ answeredCount }}/{{ questions.length }}</span>
            </div>

            <!-- 题型分类锚点过滤器 -->
            <div class="matrix-type-anchors">
              <button
                type="button"
                class="anchor-pill"
                :class="{ 'is-active': activeTypeFilter === 'ALL' }"
                @click="activeTypeFilter = 'ALL'"
              >
                ALL
              </button>
              <button
                v-for="qt in availableQuestionTypes"
                :key="qt.type"
                type="button"
                class="anchor-pill"
                :class="{ 'is-active': activeTypeFilter === qt.type }"
                @click="jumpToFirstOfType(qt.type)"
              >
                {{ qt.label }}
              </button>
            </div>

            <!-- 答题卡网格 -->
            <div class="matrix-grid">
              <button
                v-for="(q, index) in questions"
                :key="q.id"
                type="button"
                class="matrix-cell"
                :class="{
                  'is-answered': isAnswered(q.id!),
                  'is-flagged': flaggedQuestions.has(q.id!),
                  'is-active': activeQuestionIndex === index,
                  'is-dimmed': activeTypeFilter !== 'ALL' && q.type !== activeTypeFilter,
                }"
                :aria-label="`跳转到第 ${index + 1} 题`"
                @click="jumpToQuestion(index, q.id!)"
              >
                <span class="cell-num">{{ index + 1 }}</span>
                <span v-if="isAnswered(q.id!)" class="answered-dot" aria-hidden="true"></span>
                <span v-if="flaggedQuestions.has(q.id!)" class="flag-corner">★</span>
              </button>
            </div>

            <!-- 图例说明 -->
            <div class="sheet-legend">
              <div class="legend-item"><span class="legend-box is-answered"><span class="dot-indicator"></span></span> 已作答</div>
              <div class="legend-item"><span class="legend-box is-unanswered"></span> 未作答</div>
              <div class="legend-item"><span class="legend-box is-flagged-box">★</span> 疑难标记</div>
            </div>

            <!-- 本地缓存与防作弊守护 -->
            <div class="sheet-guard-card">
              <div class="guard-row">
                <span class="guard-label">AUTO_DRAFT_CACHE</span>
                <span class="guard-status">ACTIVE</span>
              </div>
              <div class="guard-tip">答案每实时变更均自动暂存至本地，断网或误刷新无缝恢复。</div>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Timer } from '@element-plus/icons-vue'
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

/** 当前聚焦题目的索引 */
const activeQuestionIndex = ref(0)

/** 单选/判断/简答答案映射：questionId -> string */
const answers = reactive<Record<number, string>>({})
/** 多选答案数组映射 */
const multiAnswers = reactive<Record<number, string[]>>({})
/** 简答题等宽代码模式映射 */
const monoModeMap = reactive<Record<number, boolean>>({})
/** 标记为疑难的题目 Set */
const flaggedQuestions = ref<Set<number>>(new Set())

/** 题型锚点过滤器 */
const activeTypeFilter = ref<string>('ALL')

const availableQuestionTypes = computed(() => {
  const types = new Set<string>()
  for (const q of questions.value) {
    if (q.type) types.add(q.type)
  }
  const labelMap: Record<string, string> = {
    CHOICE: '选择',
    JUDGE: '判断',
    TEXT: '简答',
  }
  return Array.from(types).map((t) => ({ type: t, label: labelMap[t] || t }))
})

function jumpToFirstOfType(type: string) {
  activeTypeFilter.value = type
  const targetIndex = questions.value.findIndex((q) => q.type === type)
  if (targetIndex >= 0) {
    jumpToQuestion(targetIndex, questions.value[targetIndex].id!)
  }
}

const DRAFT_STORAGE_KEY = `EXAM_TERMINAL_DRAFT_${recordId}`

/** 保存答案至 LocalStorage 草稿 */
function persistDraft() {
  try {
    const payload = {
      answers: { ...answers },
      multiAnswers: { ...multiAnswers },
      flagged: Array.from(flaggedQuestions.value),
      timestamp: Date.now(),
    }
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 忽略存储空间满等异常
  }
}

/** 恢复本地草稿 */
function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data.answers && typeof data.answers === 'object') {
      Object.assign(answers, data.answers)
    }
    if (data.multiAnswers && typeof data.multiAnswers === 'object') {
      Object.assign(multiAnswers, data.multiAnswers)
    }
    if (Array.isArray(data.flagged)) {
      flaggedQuestions.value = new Set(data.flagged)
    }
    ElMessage.info('已为您自动恢复本地暂存的作答草稿')
  } catch {
    // 忽略解析错误
  }
}

function updateAnswer(questionId: number, val: string) {
  answers[questionId] = val
  persistDraft()
}

function selectSingleChoice(questionId: number, choiceLetter: string) {
  answers[questionId] = choiceLetter
  persistDraft()
}

function toggleMultiChoice(questionId: number, choiceLetter: string) {
  const current = multiAnswers[questionId] ? [...multiAnswers[questionId]] : []
  const idx = current.indexOf(choiceLetter)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(choiceLetter)
  }
  current.sort()
  multiAnswers[questionId] = current
  answers[questionId] = current.join(',')
  persistDraft()
}

function toggleFlag(questionId: number) {
  if (flaggedQuestions.value.has(questionId)) {
    flaggedQuestions.value.delete(questionId)
  } else {
    flaggedQuestions.value.add(questionId)
  }
  // 触发响应式更新
  flaggedQuestions.value = new Set(flaggedQuestions.value)
  persistDraft()
}

function isAnswered(questionId: number) {
  return !!answers[questionId]?.trim()
}

const answeredCount = computed(() => questions.value.filter((q) => isAnswered(q.id!)).length)
const progressPercentage = computed(() =>
  questions.value.length ? Math.round((answeredCount.value / questions.value.length) * 100) : 0
)

function jumpToQuestion(index: number, questionId: number) {
  activeQuestionIndex.value = index
  const el = document.getElementById(`question-${questionId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// ---- 全键盘快捷操作支持 ----
function handleGlobalKeydown(e: KeyboardEvent) {
  // 全局交卷热键：Alt + S 或 Ctrl + Enter
  if ((e.altKey && (e.key === 's' || e.key === 'S')) || (e.ctrlKey && e.key === 'Enter')) {
    e.preventDefault()
    handleSubmit(false)
    return
  }

  // 如果当前在 textarea 输入，不拦截题目选项切换按键
  const target = e.target as HTMLElement
  if (target && target.tagName.toLowerCase() === 'textarea') {
    return
  }

  const currentQ = questions.value[activeQuestionIndex.value]
  if (!currentQ) return

  const key = e.key.toUpperCase()

  // J / ArrowDown：下一题
  if (e.key === 'j' || e.key === 'ArrowDown') {
    if (activeQuestionIndex.value < questions.value.length - 1) {
      jumpToQuestion(activeQuestionIndex.value + 1, questions.value[activeQuestionIndex.value + 1].id!)
    }
    e.preventDefault()
    return
  }

  // K / ArrowUp：上一题
  if (e.key === 'k' || e.key === 'ArrowUp') {
    if (activeQuestionIndex.value > 0) {
      jumpToQuestion(activeQuestionIndex.value - 1, questions.value[activeQuestionIndex.value - 1].id!)
    }
    e.preventDefault()
    return
  }

  // M：标记疑难
  if (e.key === 'm' || e.key === 'M') {
    toggleFlag(currentQ.id!)
    e.preventDefault()
    return
  }

  // 单选 / 多选快捷键（A-D 或 1-4）
  let targetLetter = ''
  if (['A', 'B', 'C', 'D', 'E', 'F'].includes(key)) {
    targetLetter = key
  } else if (['1', '2', '3', '4', '5', '6'].includes(key)) {
    targetLetter = letter(Number(key) - 1)
  }

  if (targetLetter) {
    if (currentQ.type === 'CHOICE' && !currentQ.multi) {
      selectSingleChoice(currentQ.id!, targetLetter)
      e.preventDefault()
    } else if (currentQ.type === 'CHOICE' && currentQ.multi) {
      toggleMultiChoice(currentQ.id!, targetLetter)
      e.preventDefault()
    } else if (currentQ.type === 'JUDGE') {
      if (key === '1' || key === 'T') selectSingleChoice(currentQ.id!, '正确')
      if (key === '2' || key === 'F') selectSingleChoice(currentQ.id!, '错误')
      e.preventDefault()
    }
  }
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
      ElMessage.warning('考试时间截止，系统正自动交卷')
      handleSubmit(true)
    }
  }
  tick()
  countdownTimer = window.setInterval(tick, 1000)
}

// ---- 切屏防作弊监控 ----
const windowSwitches = ref(0)

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden' && record.value?.status === '进行中' && !submitting.value) {
    windowSwitches.value++
    reportWindowSwitch(recordId).catch(() => {})
  }
}

// ---- 提交试卷 ----
async function handleSubmit(auto: boolean) {
  if (submitting.value) return
  if (!auto) {
    const unanswered = questions.value.length - answeredCount.value
    await ElMessageBox.confirm(
      unanswered > 0
        ? `当前仍有 ${unanswered} 道题未作答，确定现在交卷吗？`
        : '确认提交整套试卷吗？交卷后将启动 AI 自动化批阅分析。',
      'TERMINAL_SUBMIT // 交卷确认',
      { type: 'warning', confirmButtonText: '确认交卷', cancelButtonText: '继续作答' }
    )
  }
  submitting.value = true
  const loadingMsg = ElMessage({ message: '正在同步提交答案数据包…', type: 'info', duration: 0 })
  try {
    const answerList = questions.value.map((q) => ({ questionId: q.id!, userAnswer: answers[q.id!] ?? '' }))
    await submitAnswers(recordId, answerList)
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    ElMessage.success('试卷提交成功，正在跳转学情评估报告')
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
    if (data.status !== '进行中') {
      router.replace(`/student/result/${recordId}`)
      return
    }
    record.value = data
    paper.value = data.paper ?? null
    windowSwitches.value = data.windowSwitches ?? 0
    restoreDraft()
    startCountdown()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('keydown', handleGlobalKeydown)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  window.clearInterval(countdownTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
.exam-taking-terminal {
  min-height: 100%;
}

/* ============ 顶部 HUD 考务栏 ============ */
.exam-hud-bar {
  position: sticky;
  top: calc(var(--student-topbar-height) + 8px);
  z-index: var(--z-sticky);
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.hud-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  gap: 16px;
}

.hud-left {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
  flex: 1;
}

.hud-paper-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.hud-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--brand-600);
  background: color-mix(in srgb, var(--brand-600) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--brand-600) 25%, transparent);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  flex-shrink: 0;
}

.paper-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hud-progress-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}

.mono-progress-text {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.hud-progress-bar {
  flex: 1;
}

.hud-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.switch-radar-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--danger);
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--danger) 25%, transparent);
  padding: 3px 8px;
  border-radius: var(--radius-xs);
}

.radar-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--danger);
}

.countdown-hud {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 800;
  color: var(--brand-600);
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  padding: 4px 10px;
  border-radius: var(--radius-md);
  letter-spacing: 0.05em;
}

.countdown-hud.is-urgent {
  color: var(--danger);
  border-color: var(--danger);
  animation: urgent-glow 1.2s var(--ease-out-expo) infinite;
}

@keyframes urgent-glow {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--danger) 40%, transparent); }
  50% { box-shadow: 0 0 10px color-mix(in srgb, var(--danger) 40%, transparent); }
}

.hud-icon-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  cursor: pointer;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 13px;
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.hud-icon-btn:hover {
  border-color: var(--brand-600);
  color: var(--brand-600);
}

.submit-exam-btn {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  height: 34px;
}

/* ============ 核心双栏布局 ============ */
.exam-terminal-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.questions-stream {
  flex: 1;
  min-width: 0;
}

/* 题目卡片 */
.terminal-question-card {
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  margin-bottom: 16px;
  transition: border-color var(--duration-fast) var(--ease-out-expo);
}

.terminal-question-card:hover {
  border-color: var(--border-strong);
}

.terminal-question-card.is-active {
  border-color: var(--brand-600);
  box-shadow: 0 0 0 1px var(--brand-600) inset;
}

.terminal-question-card.is-marked {
  border-color: var(--warning);
  background: color-mix(in srgb, var(--warning) 4%, var(--surface-1));
}

.q-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 14px;
}

.q-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.q-index-mono {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 800;
  color: var(--brand-600);
}

.q-type-tag {
  font-family: var(--font-mono);
  font-size: 11px;
}

.q-score-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--surface-2);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}

.flag-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.flag-btn:hover {
  border-color: var(--warning);
  color: var(--warning);
}

.flag-btn.is-flagged {
  background: color-mix(in srgb, var(--warning) 12%, transparent);
  border-color: var(--warning);
  color: var(--warning);
}

.q-body-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.65;
  color: var(--text-strong);
  margin-bottom: 16px;
}

/* 选项列表 */
.options-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.terminal-option-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.terminal-option-row:hover {
  border-color: var(--border-strong);
  background: color-mix(in srgb, var(--brand-600) 4%, var(--surface-2));
}

.terminal-option-row.is-selected {
  background: color-mix(in srgb, var(--brand-600) 10%, var(--surface-1));
  border-color: var(--brand-600);
}

.option-key {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-xs);
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.terminal-option-row.is-selected .option-key {
  background: var(--brand-600);
  border-color: var(--brand-600);
  color: var(--text-on-brand);
}

.option-content {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.5;
}

.judge-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.essay-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.essay-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.mono-mode-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.mono-mode-toggle.is-active {
  background: color-mix(in srgb, var(--brand-600) 12%, transparent);
  border-color: var(--brand-600);
  color: var(--brand-600);
}

.terminal-essay-input.is-mono-editor :deep(textarea) {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
  letter-spacing: 0.02em;
}

.essay-meta-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.essay-char-count {
  font-size: 11px;
  color: var(--text-muted);
}

.essay-status-pill {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--brand-600);
  font-weight: 700;
}

/* ============ 右侧悬浮答题卡 ============ */
.terminal-sheet-sidebar {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: calc(var(--student-topbar-height) + 80px);
}

.sheet-panel {
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 16px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 12px;
}

.sheet-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--text-strong);
}

.sheet-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-600);
}

.sheet-counter {
  font-size: 11px;
  color: var(--text-muted);
}

.matrix-type-anchors {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.anchor-pill {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.anchor-pill:hover,
.anchor-pill.is-active {
  color: var(--brand-600);
  border-color: var(--brand-600);
  background: color-mix(in srgb, var(--brand-600) 10%, transparent);
}

.matrix-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 14px;
}

.matrix-cell {
  position: relative;
  height: 34px;
  display: grid;
  place-items: center;
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.matrix-cell:hover {
  border-color: var(--brand-600);
  color: var(--brand-600);
}

.matrix-cell.is-active {
  box-shadow: 0 0 0 1px var(--brand-600) inset;
}

.matrix-cell.is-answered {
  background: var(--brand-600);
  border-color: var(--brand-600);
  color: var(--text-on-brand);
}

.matrix-cell.is-dimmed {
  opacity: 0.35;
}

.answered-dot {
  position: absolute;
  bottom: 2px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-on-brand);
}

.matrix-cell.is-flagged {
  border-color: var(--warning);
}

.flag-corner {
  position: absolute;
  top: 1px;
  right: 2px;
  font-size: 11px;
  color: var(--warning);
}

.matrix-cell.is-answered .flag-corner {
  color: var(--text-on-brand);
}

.sheet-legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-top: 1px solid var(--border-subtle);
  font-size: 11px;
  color: var(--text-muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-box {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-default);
  display: grid;
  place-items: center;
  font-size: 11px;
}

.dot-indicator {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--text-on-brand);
}

.legend-box.is-answered {
  background: var(--brand-600);
  border-color: var(--brand-600);
}

.legend-box.is-unanswered {
  background: var(--surface-2);
}

.legend-box.is-flagged-box {
  color: var(--warning);
  border-color: var(--warning);
}

.sheet-guard-card {
  margin-top: 10px;
  padding: 10px;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.guard-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.guard-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
}

.guard-status {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--brand-600);
}

.guard-tip {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
}

/* 快捷键弹出框 */
.shortcuts-guide {
  padding: 4px;
}

.guide-title {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 800;
  color: var(--text-strong);
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 4px;
}

.guide-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.guide-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
}

.guide-list kbd {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  padding: 1px 5px;
  border-radius: var(--radius-xs);
  color: var(--text-strong);
}
</style>
