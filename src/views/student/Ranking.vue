<template>
  <div>
    <div class="page-title">
      <h2>排行榜</h2>
      <div class="filters">
        <el-select v-model="paperId" placeholder="全部试卷" clearable style="width: 220px" @change="loadData">
          <el-option v-for="p in papers" :key="p.id" :label="p.name" :value="p.id!" />
        </el-select>
      </div>
    </div>

    <!-- 前三名 -->
    <el-row v-if="top3.length" :gutter="16" class="podium">
      <el-col v-for="(item, index) in top3" :key="item.id" :xs="24" :sm="8">
        <el-card shadow="hover" class="podium-card" :class="`rank-${index + 1}`">
          <div class="medal">{{ ['🥇', '🥈', '🥉'][index] }}</div>
          <div class="podium-name">{{ item.studentName }}</div>
          <div class="podium-score">{{ item.score }} <span class="total">/ {{ item.paperTotalScore ?? '-' }}</span></div>
          <div class="podium-paper ellipsis">{{ item.paperName }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="rest" stripe>
        <el-table-column label="名次" width="80">
          <template #default="{ $index }">{{ $index + 4 }}</template>
        </el-table-column>
        <el-table-column prop="studentName" label="考生" width="130" />
        <el-table-column prop="paperName" label="试卷" min-width="200" show-overflow-tooltip />
        <el-table-column label="得分" width="120">
          <template #default="{ row }"><b>{{ row.score }}</b> / {{ row.paperTotalScore ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="用时" width="110">
          <template #default="{ row }">{{ row.duration != null ? row.duration + ' 分钟' : '-' }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !ranking.length" description="暂无排行数据" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getRanking } from '@/api/examRecord'
import { listPapers } from '@/api/paper'
import type { ExamRanking, Paper } from '@/types'

const loading = ref(false)
const ranking = ref<ExamRanking[]>([])
const papers = ref<Paper[]>([])
const paperId = ref<number>()

const top3 = computed(() => ranking.value.slice(0, 3))
const rest = computed(() => ranking.value.slice(3))

async function loadData() {
  loading.value = true
  try {
    ranking.value = await getRanking({ paperId: paperId.value, limit: 50 })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  loadData()
  papers.value = await listPapers().catch(() => [])
})
</script>

<style scoped>
.page-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title h2 {
  margin: 0;
}

.podium {
  margin-bottom: 16px;
}

.podium-card {
  text-align: center;
  padding: 8px 0;
}

.rank-1 {
  border-top: 4px solid #f7ba2a;
}

.rank-2 {
  border-top: 4px solid #c0c4cc;
}

.rank-3 {
  border-top: 4px solid #e6a23c;
}

.medal {
  font-size: 36px;
}

.podium-name {
  font-size: 17px;
  font-weight: 700;
  margin-top: 6px;
}

.podium-score {
  font-size: 26px;
  font-weight: 800;
  color: #409eff;
  margin: 4px 0;
}

.podium-score .total {
  font-size: 14px;
  color: #909399;
  font-weight: 400;
}

.podium-paper {
  color: #909399;
  font-size: 13px;
}
</style>
