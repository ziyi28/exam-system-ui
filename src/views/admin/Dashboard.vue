<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="16">
      <el-col v-for="card in statCards" :key="card.label" :xs="12" :sm="8" :md="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" :style="{ background: card.color + '1a', color: card.color }">
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
        <el-card shadow="never">
          <template #header>系统资源概览</template>
          <div ref="barChartRef" class="chart" />
        </el-card>
      </el-col>
      <!-- 成绩排行 -->
      <el-col :xs="24" :md="10">
        <el-card shadow="never">
          <template #header>成绩排行 TOP10</template>
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
import type { ExamRanking, Stats } from '@/types'

const stats = ref<Stats | null>(null)
const ranking = ref<ExamRanking[]>([])
const barChartRef = ref<HTMLDivElement>()
let barChart: echarts.ECharts | null = null

const statCards = computed(() => [
  { label: '题目总数', value: stats.value?.questionCount ?? '-', icon: 'Document', color: '#409eff' },
  { label: '试卷总数', value: stats.value?.paperCount ?? '-', icon: 'Notebook', color: '#67c23a' },
  { label: '分类总数', value: stats.value?.categoryCount ?? '-', icon: 'FolderOpened', color: '#e6a23c' },
  { label: '用户总数', value: stats.value?.userCount ?? '-', icon: 'User', color: '#f56c6c' },
  { label: '考试场次', value: stats.value?.examCount ?? '-', icon: 'List', color: '#909399' },
  { label: '今日考试', value: stats.value?.todayExamCount ?? '-', icon: 'Calendar', color: '#6e40c9' },
])

function renderBarChart() {
  if (!barChartRef.value || !stats.value) return
  barChart = echarts.init(barChartRef.value)
  const s = stats.value
  barChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['题目', '试卷', '分类', '用户', '考试场次', '今日考试'],
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        type: 'bar',
        barWidth: 36,
        itemStyle: { borderRadius: [6, 6, 0, 0] },
        data: [
          { value: s.questionCount, itemStyle: { color: '#409eff' } },
          { value: s.paperCount, itemStyle: { color: '#67c23a' } },
          { value: s.categoryCount, itemStyle: { color: '#e6a23c' } },
          { value: s.userCount, itemStyle: { color: '#f56c6c' } },
          { value: s.examCount, itemStyle: { color: '#909399' } },
          { value: s.todayExamCount, itemStyle: { color: '#6e40c9' } },
        ],
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
  gap: 12px;
  padding: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.chart-row {
  margin-top: 16px;
}

.chart {
  height: 320px;
}

.rank-num {
  color: #909399;
  padding-left: 8px;
}
</style>
