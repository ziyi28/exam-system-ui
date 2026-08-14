<template>
  <AppPageHeader title="考试记录" description="查看考试记录与 AI 批阅详情，可删除异常记录" />

  <el-card shadow="never" class="data-card">
    <el-tabs v-model="activeTab">
      <!-- 考试记录 -->
      <el-tab-pane label="考试记录" name="records">
        <div class="filter-bar" aria-label="筛选条件">
          <el-input v-model="query.studentName" placeholder="考生姓名" clearable style="width: 160px" @keyup.enter="handleSearch" />
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 130px">
            <el-option label="进行中" :value="0" />
            <el-option label="已完成" :value="1" />
            <el-option label="已批阅" :value="2" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </div>

        <el-table v-loading="loading" :data="records" stripe>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="studentName" label="考生" width="110" show-overflow-tooltip />
          <el-table-column label="试卷" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.paper?.name ?? `试卷#${row.examId}` }}</template>
          </el-table-column>
          <el-table-column label="得分" width="100">
            <template #default="{ row }">
              <b>{{ row.score }}</b><span v-if="row.paper?.totalScore"> / {{ row.paper.totalScore }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="examStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="windowSwitches" label="切屏次数" width="90" />
          <el-table-column prop="startTime" label="开始时间" width="160" />
          <el-table-column prop="endTime" label="结束时间" width="160" />
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="router.push(`/admin/exam-records/${row.id}`)">详情</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-bar">
          <el-pagination
            v-model:current-page="query.page"
            v-model:page-size="query.size"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @change="loadData"
          />
        </div>
      </el-tab-pane>

      <!-- 排行榜 -->
      <el-tab-pane label="成绩排行榜" name="ranking">
        <div class="filter-bar" aria-label="排行筛选">
          <el-select v-model="rankingPaperId" placeholder="全部试卷" clearable style="width: 220px" @change="loadRanking">
            <el-option v-for="p in papers" :key="p.id" :label="p.name" :value="p.id!" />
          </el-select>
          <el-input-number v-model="rankingLimit" :min="5" :max="100" :step="5" @change="loadRanking" />
          <el-text type="info" size="small">显示条数</el-text>
        </div>
        <el-table v-loading="rankingLoading" :data="ranking" stripe>
          <el-table-column label="名次" width="70">
            <template #default="{ $index }">
              <span v-if="$index < 3" class="rank-medal" :class="`rank-medal--${$index + 1}`" :aria-label="`第 ${$index + 1} 名`">
                {{ $index + 1 }}
              </span>
              <span v-else class="rank-num">{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="studentName" label="考生" width="120" />
          <el-table-column prop="paperName" label="试卷" min-width="180" show-overflow-tooltip />
          <el-table-column label="得分" width="110">
            <template #default="{ row }"><b>{{ row.score }}</b> / {{ row.paperTotalScore ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="用时" width="100">
            <template #default="{ row }">{{ row.duration != null ? row.duration + ' 分钟' : '-' }}</template>
          </el-table-column>
          <el-table-column prop="startTime" label="考试时间" width="170">
            <template #default="{ row }">{{ (row.startTime ?? '').toString().replace('T', ' ') }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { pageExamRecords, deleteExamRecord, getRanking } from '@/api/examRecord'
import { listPapers } from '@/api/paper'
import type { ExamRanking, ExamRecord, Paper } from '@/types'
import { examStatusTag } from '@/utils/format'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'

const router = useRouter()
const activeTab = ref('records')

// ---- 记录列表 ----
const loading = ref(false)
const records = ref<ExamRecord[]>([])
const total = ref(0)
const dateRange = ref<[string, string] | null>(null)
const query = reactive({
  page: 1,
  size: 10,
  studentName: '',
  status: undefined as number | undefined,
})

async function loadData() {
  loading.value = true
  try {
    const data = await pageExamRecords({
      ...query,
      studentName: query.studentName || undefined,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
    })
    records.value = data.records
    total.value = Number(data.total)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.studentName = ''
  query.status = undefined
  dateRange.value = null
  handleSearch()
}

async function handleDelete(row: ExamRecord) {
  await ElMessageBox.confirm(`确定删除「${row.studentName}」的这条考试记录吗？`, '删除确认', { type: 'warning' })
  await deleteExamRecord(row.id)
  ElMessage.success('删除成功')
  loadData()
}

// ---- 排行榜 ----
const rankingLoading = ref(false)
const ranking = ref<ExamRanking[]>([])
const papers = ref<Paper[]>([])
const rankingPaperId = ref<number | undefined>()
const rankingLimit = ref(20)

async function loadRanking() {
  rankingLoading.value = true
  try {
    ranking.value = await getRanking({ paperId: rankingPaperId.value, limit: rankingLimit.value })
  } finally {
    rankingLoading.value = false
  }
}

onMounted(async () => {
  loadData()
  loadRanking()
  papers.value = await listPapers()
})
</script>

<style scoped>
/* 前三名奖牌色，与 Dashboard 一致 */
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

.rank-medal--1 {
  background: color-mix(in srgb, var(--medal-gold) 16%, transparent);
  color: var(--medal-gold);
}

.rank-medal--2 {
  background: color-mix(in srgb, var(--medal-silver) 16%, transparent);
  color: var(--medal-silver);
}

.rank-medal--3 {
  background: color-mix(in srgb, var(--medal-bronze) 16%, transparent);
  color: var(--medal-bronze);
}

.rank-num {
  color: var(--text-muted);
  padding-left: 6px;
}
</style>
