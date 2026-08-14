<template>
  <div class="dashboard">
    <div class="page-header dashboard-header">
      <div>
        <h1 class="page-header__title">运营概览</h1>
        <p class="page-header__desc">快速了解题库、考试和学习数据的当前状态。</p>
      </div>
      <div class="dashboard-header__date">
        <el-icon><Calendar /></el-icon>
        <span>数据实时更新</span>
      </div>
    </div>

    <!-- 统计卡片：类别色表达资源类型，不借用成功/危险语义色 -->
    <el-row :gutter="16" class="stats-grid">
      <el-col v-for="card in statCards" :key="card.label" :xs="12" :sm="8" :md="8" :lg="4">
        <el-card shadow="never" class="stat-card">
          <div class="stat-icon" :class="`stat-icon--${card.theme}`">
            <el-icon :size="24"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <!-- 资源统计条形图 -->
      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="dashboard-panel">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-title">系统资源概览</div>
                <div class="panel-desc">题库与考试资源分布</div>
              </div>
              <el-icon class="panel-icon"><DataAnalysis /></el-icon>
            </div>
          </template>
          <div ref="barChartRef" class="chart" />
        </el-card>
      </el-col>
      <!-- 成绩排行 -->
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="dashboard-panel">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-title">成绩排行</div>
                <div class="panel-desc">当前表现最佳的 10 位考生</div>
              </div>
              <el-tag type="primary" effect="plain">前 10 名</el-tag>
            </div>
          </template>
          <el-table :data="ranking" size="small" :show-header="true" height="320">
            <el-table-column label="名次" width="64">
              <template #default="{ $index }">
                <span v-if="$index < 3" class="rank-medal" :class="`rank-medal--${$index + 1}`" :aria-label="`第 ${$index + 1} 名`">
                  {{ $index + 1 }}
                </span>
                <span v-else class="rank-num">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="studentName" label="考生" min-width="80" show-overflow-tooltip />
            <el-table-column prop="paperName" label="试卷" min-width="120" show-overflow-tooltip />
            <el-table-column label="得分" width="90">
              <template #default="{ row }">
                <b>{{ row.score }}</b> / {{ row.paperTotalScore ?? '-' }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
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

// 类别色：品牌蓝 / 青 / 紫 / 靛 / 中性，不把普通资源映射为成功/危险状态色
const statCards = computed(() => [
  { label: '题目总数', value: stats.value?.questionCount ?? '-', icon: 'Document', theme: 'brand' },
  { label: '试卷总数', value: stats.value?.paperCount ?? '-', icon: 'Notebook', theme: 'cyan' },
  { label: '分类总数', value: stats.value?.categoryCount ?? '-', icon: 'FolderOpened', theme: 'violet' },
  { label: '用户总数', value: stats.value?.userCount ?? '-', icon: 'User', theme: 'indigo' },
  { label: '考试场次', value: stats.value?.examCount ?? '-', icon: 'List', theme: 'neutral' },
  { label: '今日考试', value: stats.value?.todayExamCount ?? '-', icon: 'Calendar', theme: 'brand-soft' },
])

function buildBarOption() {
  const s = stats.value
  if (!s) return null
  // 单系列水平条形图：类别在 Y 轴，数值在 X 轴，低对比网格，无冗余 legend
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
      textStyle: { color: c.text },
    },
    grid: { left: 8, right: 28, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: c.axisLabel },
      splitLine: { lineStyle: { color: c.splitLine } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: ['题目', '试卷', '分类', '用户', '考试场次', '今日考试'],
      axisLabel: { color: c.axisLabel },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        barWidth: 18,
        itemStyle: { borderRadius: [0, 9, 9, 0], color: c.primary },
        emphasis: { itemStyle: { color: c.primaryDark } },
        label: { show: true, position: 'right', color: c.text, fontWeight: 600 },
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

// 主题切换只重绘图表，不重新请求数据
watch(theme, () => {
  const option = buildBarOption()
  if (barChart && option) barChart.setOption(option)
})

// 侧栏折叠/展开有 250ms width 过渡，期间 ResizeObserver 每帧触发 resize，
// 用 rAF 合并到同一帧只执行一次，避免 ECharts 全量重布局风暴
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
.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
}

.dashboard-header {
  margin-bottom: var(--space-5);
}

.stats-grid {
  margin-bottom: 0;
}

.stat-card {
  border: 1px solid var(--border-default);
  box-shadow: none;
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon--brand {
  background: var(--brand-50);
  color: var(--brand-600);
}

.stat-icon--cyan {
  background: var(--accent-cyan-soft);
  color: var(--accent-cyan);
}

.stat-icon--violet {
  background: var(--accent-violet-soft);
  color: var(--accent-violet);
}

.stat-icon--indigo {
  background: var(--accent-indigo-soft);
  color: var(--accent-indigo);
}

.stat-icon--neutral {
  background: var(--surface-2);
  color: var(--text-secondary);
}

.stat-icon--brand-soft {
  background: var(--brand-100);
  color: var(--brand-700);
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 13px;
  color: var(--text-muted);
}

.chart-row {
  margin-top: var(--space-5);
}

.chart {
  height: 340px;
}

/* 前三名使用奖牌色，其余中性排名数字 */
.rank-medal {
  width: 26px;
  height: 26px;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* 浅色下奖牌原色数字在 16% tint 圆底上仅约 2:1，改中性圆底 + 加深数字达标；
   深色下保留 16% tint + 原色（6.7–10.9:1 已达标） */
:root:not([data-theme='dark']) .rank-medal--1 {
  background: var(--surface-2);
  color: color-mix(in srgb, var(--medal-gold) 55%, black);
}

:root:not([data-theme='dark']) .rank-medal--2 {
  background: var(--surface-2);
  color: color-mix(in srgb, var(--medal-silver) 55%, black);
}

:root:not([data-theme='dark']) .rank-medal--3 {
  background: var(--surface-2);
  color: color-mix(in srgb, var(--medal-bronze) 55%, black);
}

/* 深色：维持奖牌色 tint 圆底 + 原色 */
:root[data-theme='dark'] .rank-medal--1 {
  background: color-mix(in srgb, var(--medal-gold) 16%, transparent);
  color: var(--medal-gold);
}

:root[data-theme='dark'] .rank-medal--2 {
  background: color-mix(in srgb, var(--medal-silver) 16%, transparent);
  color: var(--medal-silver);
}

:root[data-theme='dark'] .rank-medal--3 {
  background: color-mix(in srgb, var(--medal-bronze) 16%, transparent);
  color: var(--medal-bronze);
}

.rank-num {
  color: var(--text-muted);
  padding-left: 8px;
}

.dashboard-header__date {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 8px 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--surface-1);
}

.dashboard-panel {
  height: 100%;
  border: 1px solid var(--border-default);
  box-shadow: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.panel-title {
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 700;
}

.panel-desc {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 400;
}

.panel-icon {
  color: var(--brand-600);
  font-size: 20px;
}

@media (max-width: 768px) {
  .stat-card :deep(.el-card__body) {
    padding: 16px;
  }

  .stat-icon {
    width: 42px;
    height: 42px;
  }

  .stat-value {
    font-size: 22px;
  }

  .chart {
    height: 280px;
  }
}
</style>
