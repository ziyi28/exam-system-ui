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

    <!-- 统计卡片 -->
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
      <!-- 资源统计柱状图 -->
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
            <el-table-column type="index" label="名次" width="60">
              <template #default="{ $index }">
                <el-tag v-if="$index < 3" :type="['danger', 'warning', 'success'][$index] as any" size="small" effect="dark" round>
                  {{ $index + 1 }}
                </el-tag>
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { getOverview } from '@/api/stats'
import { getRanking } from '@/api/examRecord'
import { chartColors } from '@/utils/chartTheme'
import type { ExamRanking, Stats } from '@/types'

const stats = ref<Stats | null>(null)
const ranking = ref<ExamRanking[]>([])
const barChartRef = ref<HTMLDivElement>()
let barChart: echarts.ECharts | null = null

const statCards = computed(() => [
  { label: '题目总数', value: stats.value?.questionCount ?? '-', icon: 'Document', theme: 'brand' },
  { label: '试卷总数', value: stats.value?.paperCount ?? '-', icon: 'Notebook', theme: 'success' },
  { label: '分类总数', value: stats.value?.categoryCount ?? '-', icon: 'FolderOpened', theme: 'warning' },
  { label: '用户总数', value: stats.value?.userCount ?? '-', icon: 'User', theme: 'danger' },
  { label: '考试场次', value: stats.value?.examCount ?? '-', icon: 'List', theme: 'info' },
  { label: '今日考试', value: stats.value?.todayExamCount ?? '-', icon: 'Calendar', theme: 'brand-dark' },
])

function renderBarChart() {
  if (!barChartRef.value || !stats.value) return
  barChart = echarts.init(barChartRef.value)
  const s = stats.value
  // 同一度量的柱状图用单色（多色是分类色误用），色值经 chartTheme 读取 tokens
  const c = chartColors()
  barChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['题目', '试卷', '分类', '用户', '考试场次', '今日考试'],
      axisLabel: { color: c.axisLabel },
      axisLine: { lineStyle: { color: c.axisLine } },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: c.axisLabel },
      splitLine: { lineStyle: { color: c.splitLine } },
    },
    series: [
      {
        type: 'bar',
        barWidth: 36,
        itemStyle: { borderRadius: [6, 6, 0, 0], color: c.primary },
        emphasis: { itemStyle: { color: c.primaryDark } },
        data: [s.questionCount, s.paperCount, s.categoryCount, s.userCount, s.examCount, s.todayExamCount],
      },
    ],
  })
}

function handleResize() {
  barChart?.resize()
}

onMounted(async () => {
  const [overview, rankingList] = await Promise.all([getOverview(), getRanking({ limit: 10 })])
  stats.value = overview
  ranking.value = rankingList
  renderBarChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
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
  border: 1px solid var(--gray-200);
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
  background: var(--brand-bg);
  color: var(--brand-600);
}

.stat-icon--success {
  background: var(--success-bg);
  color: var(--success);
}

.stat-icon--warning {
  background: var(--warning-bg);
  color: var(--warning);
}

.stat-icon--danger {
  background: var(--danger-bg);
  color: var(--danger);
}

.stat-icon--info {
  background: var(--gray-100);
  color: var(--gray-500);
}

.stat-icon--brand-dark {
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
  color: var(--gray-500);
}

.chart-row {
  margin-top: var(--space-5);
}

.chart {
  height: 340px;
}

.rank-num {
  color: var(--gray-500);
  padding-left: 8px;
}

.dashboard-header__date {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--gray-500);
  font-size: 13px;
  padding: 8px 12px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.dashboard-panel {
  height: 100%;
  border: 1px solid var(--gray-200);
  box-shadow: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.panel-title {
  color: var(--gray-900);
  font-size: 16px;
  font-weight: 700;
}

.panel-desc {
  margin-top: 3px;
  color: var(--gray-500);
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
