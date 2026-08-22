<template>
  <div class="dashboard-terminal">
    <!-- 顶部终端标题栏 -->
    <div class="page-header dashboard-header">
      <div>
        <h1 class="page-header__title">
          <span class="mono-badge">OPERATIONS_CENTER</span>
          数智考务运营大盘
        </h1>
        <p class="page-header__desc">全域试题库、考试排程、考务数据与学情排行榜的实时分析中控台。</p>
      </div>
      <div class="header-status-box">
        <span class="pulse-indicator"></span>
        <span class="mono-text">DATA_PIPELINE: LIVE_SYNC</span>
      </div>
    </div>

    <!-- 6大核心指标矩阵 -->
    <el-row :gutter="12" class="stats-grid">
      <el-col v-for="card in statCards" :key="card.label" :xs="12" :sm="8" :md="8" :lg="4">
        <div class="terminal-stat-card">
          <div class="stat-card-top">
            <span class="stat-mono-code">{{ card.code }}</span>
            <div class="stat-icon-wrapper" :class="`icon-theme--${card.theme}`">
              <el-icon :size="16"><component :is="card.icon" /></el-icon>
            </div>
          </div>
          <div class="stat-value mono-num">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表与排行榜双栏 -->
    <el-row :gutter="16" class="chart-row">
      <!-- 资源分布条形图 -->
      <el-col :xs="24" :md="14">
        <div class="terminal-panel-card">
          <div class="panel-header">
            <div class="panel-title-group">
              <div class="panel-title">系统核心资源分布</div>
              <div class="panel-subtitle mono-text">RESOURCE_VECTOR_DISTRIBUTION</div>
            </div>
            <el-icon class="panel-icon"><DataAnalysis /></el-icon>
          </div>
          <div class="panel-body">
            <div ref="barChartRef" class="chart-container" />
          </div>
        </div>
      </el-col>

      <!-- 成绩榜 TOP 10 -->
      <el-col :xs="24" :md="10">
        <div class="terminal-panel-card">
          <div class="panel-header">
            <div class="panel-title-group">
              <div class="panel-title">全站学情表现榜</div>
              <div class="panel-subtitle mono-text">TOP_10_ACADEMIC_PERFORMANCE</div>
            </div>
            <span class="rank-tag mono-num">[TOP_10]</span>
          </div>
          <div class="panel-body table-body">
            <el-table :data="ranking" size="small" :show-header="true" height="340" class="terminal-ranking-table">
              <el-table-column label="RANK" width="68">
                <template #default="{ $index }">
                  <span v-if="$index === 0" class="rank-pill gold mono-num">01</span>
                  <span v-else-if="$index === 1" class="rank-pill silver mono-num">02</span>
                  <span v-else-if="$index === 2" class="rank-pill bronze mono-num">03</span>
                  <span v-else class="rank-num mono-num">{{ String($index + 1).padStart(2, '0') }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="studentName" label="学员 / 账号" min-width="90" show-overflow-tooltip />
              <el-table-column prop="paperName" label="考核试卷" min-width="120" show-overflow-tooltip />
              <el-table-column label="得分" width="90" align="right">
                <template #default="{ row }">
                  <span class="score-strong mono-num">{{ row.score }}</span>
                  <span class="score-total mono-num">/{{ row.paperTotalScore ?? '-' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { getOverview } from '@/api/stats'
import { getRanking } from '@/api/examRecord'
import { chartColors } from '@/utils/chartTheme'
import { useTheme } from '@/composables/useTheme'
import type { ExamRanking, Stats } from '@/types'

const stats = ref<Stats | null>(null)
const ranking = ref<ExamRanking[]>([])
const barChartRef = ref<HTMLDivElement>()
let barChart: echarts.ECharts | null = null
let chartObserver: ResizeObserver | null = null

const { theme } = useTheme()

const statCards = computed(() => [
  { label: '题目总数', code: 'QUESTIONS', value: stats.value?.questionCount ?? '-', icon: 'Document', theme: 'brand' },
  { label: '试卷总数', code: 'PAPERS', value: stats.value?.paperCount ?? '-', icon: 'Notebook', theme: 'cyan' },
  { label: '分类总数', code: 'CATEGORIES', value: stats.value?.categoryCount ?? '-', icon: 'FolderOpened', theme: 'violet' },
  { label: '用户总数', code: 'USERS', value: stats.value?.userCount ?? '-', icon: 'User', theme: 'indigo' },
  { label: '考试场次', code: 'EXAMS', value: stats.value?.examCount ?? '-', icon: 'List', theme: 'neutral' },
  { label: '今日考试', code: 'TODAY_ACTIVE', value: stats.value?.todayExamCount ?? '-', icon: 'Calendar', theme: 'brand-soft' },
])

function buildBarOption() {
  const s = stats.value
  if (!s) return null
  const c = chartColors()
  return {
    aria: {
      enabled: true,
      description: '系统资源统计条形图，展示题目、试卷、分类、用户、考试场次与今日考试的数量',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: c.surface,
      borderColor: c.splitLine,
      textStyle: { color: c.text, fontFamily: 'JetBrains Mono, Fira Code, SF Mono, Consolas, monospace', fontSize: 12 },
    },
    grid: { left: 8, right: 36, top: 12, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: c.axisLabel, fontFamily: 'JetBrains Mono, Fira Code, SF Mono, Consolas, monospace', fontSize: 11 },
      splitLine: { lineStyle: { color: c.splitLine, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: ['题目 (QST)', '试卷 (PPR)', '分类 (CAT)', '用户 (USR)', '考试 (EXM)', '今日 (TOD)'],
      axisLabel: { color: c.axisLabel, fontFamily: 'JetBrains Mono, Fira Code, SF Mono, Consolas, monospace', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        barWidth: 16,
        itemStyle: { borderRadius: [0, 2, 2, 0], color: c.primary },
        emphasis: { itemStyle: { color: c.primaryDark } },
        label: {
          show: true,
          position: 'right',
          color: c.text,
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, Fira Code, SF Mono, Consolas, monospace',
          fontSize: 11,
        },
        data: [s.questionCount, s.paperCount, s.categoryCount, s.userCount, s.examCount, s.todayExamCount],
      },
    ],
  }
}

function renderBarChart() {
  if (!barChartRef.value || !stats.value) return
  barChart = echarts.init(barChartRef.value)
  barChart.setOption(buildBarOption()!)
}

watch(theme, () => {
  const option = buildBarOption()
  if (barChart && option) barChart.setOption(option)
})

let resizeFrame = 0
function handleChartResize() {
  cancelAnimationFrame(resizeFrame)
  resizeFrame = requestAnimationFrame(() => barChart?.resize())
}

onMounted(async () => {
  const [overview, rankingList] = await Promise.all([getOverview(), getRanking({ limit: 10 })])
  stats.value = overview
  ranking.value = rankingList
  renderBarChart()
  chartObserver = new ResizeObserver(handleChartResize)
  if (barChartRef.value) chartObserver.observe(barChartRef.value)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(resizeFrame)
  chartObserver?.disconnect()
  barChart?.dispose()
})
</script>

<style scoped>
.dashboard-terminal {
  min-height: 100%;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.mono-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--brand-600);
  background: color-mix(in srgb, var(--brand-600) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--brand-600) 25%, transparent);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  margin-right: 8px;
}

.header-status-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--surface-1);
}

.pulse-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-600);
  box-shadow: 0 0 6px var(--brand-600);
}

.mono-text {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-secondary);
}

/* ============ 指标数据网格 ============ */
.stats-grid {
  margin-bottom: var(--space-4);
}

.terminal-stat-card {
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: border-color var(--duration-fast) var(--ease-out-expo);
}

.terminal-stat-card:hover {
  border-color: var(--border-strong);
}

.stat-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.stat-mono-code {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.stat-icon-wrapper {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  display: grid;
  place-items: center;
  border: 1px solid var(--border-subtle);
}

.icon-theme--brand {
  background: color-mix(in srgb, var(--brand-600) 12%, transparent);
  color: var(--brand-600);
}

.icon-theme--cyan {
  background: color-mix(in srgb, var(--accent-cyan) 12%, transparent);
  color: var(--accent-cyan);
}

.icon-theme--violet {
  background: color-mix(in srgb, var(--accent-violet) 12%, transparent);
  color: var(--accent-violet);
}

.icon-theme--indigo {
  background: color-mix(in srgb, var(--accent-indigo) 12%, transparent);
  color: var(--accent-indigo);
}

.icon-theme--neutral {
  background: var(--surface-2);
  color: var(--text-secondary);
}

.icon-theme--brand-soft {
  background: color-mix(in srgb, var(--brand-600) 18%, transparent);
  color: var(--brand-600);
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-strong);
  line-height: 1.2;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-secondary);
}

/* ============ 图表与列表容器 ============ */
.chart-row {
  margin-top: 0;
}

.terminal-panel-card {
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-subtle);
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: -0.01em;
}

.panel-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 1px;
}

.panel-icon {
  color: var(--brand-600);
  font-size: 18px;
}

.rank-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--brand-600);
}

.panel-body {
  padding: 14px 18px;
  flex: 1;
}

.table-body {
  padding: 0;
}

.chart-container {
  height: 340px;
  width: 100%;
}

.terminal-ranking-table {
  border: 0 !important;
}

.rank-pill {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 800;
  font-family: var(--font-mono);
}

.rank-pill.gold {
  background: color-mix(in srgb, var(--medal-gold) 15%, transparent);
  color: var(--medal-gold);
  border: 1px solid color-mix(in srgb, var(--medal-gold) 35%, transparent);
}

.rank-pill.silver {
  background: color-mix(in srgb, var(--medal-silver) 15%, transparent);
  color: var(--medal-silver);
  border: 1px solid color-mix(in srgb, var(--medal-silver) 35%, transparent);
}

.rank-pill.bronze {
  background: color-mix(in srgb, var(--medal-bronze) 15%, transparent);
  color: var(--medal-bronze);
  border: 1px solid color-mix(in srgb, var(--medal-bronze) 35%, transparent);
}

.rank-num {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  padding-left: 4px;
}

.score-strong {
  font-weight: 700;
  color: var(--brand-600);
  font-size: 13px;
}

.score-total {
  color: var(--text-muted);
  font-size: 11px;
}
</style>
