<template>
  <div>
    <AppPageHeader title="排行榜" description="看看大家在每张试卷上的表现，向优秀学习">
      <template #actions>
        <el-select v-model="paperId" placeholder="全部试卷" clearable style="width: 220px" @change="loadData">
          <el-option v-for="p in papers" :key="p.id" :label="p.name" :value="p.id!" />
        </el-select>
      </template>
    </AppPageHeader>

    <!-- 前三名 -->
    <el-row v-if="top3.length" :gutter="16" class="podium">
      <el-col v-for="(item, index) in top3" :key="item.id" :xs="24" :sm="8">
        <el-card shadow="never" class="podium-card" :class="`rank-${index + 1}`">
          <div class="medal" :class="`medal--${index + 1}`" :aria-label="`第 ${index + 1} 名`">
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                d="M6 4h20l-3 9.5a7 7 0 1 1-14 0z"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linejoin="round"
              />
              <circle cx="16" cy="17" r="5.4" stroke="currentColor" stroke-width="2" />
              <path d="M13 20.5 11.5 27l4.5-2.4L20.5 27 19 20.5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="podium-rank">第 {{ index + 1 }} 名</div>
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
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
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
.podium {
  margin-bottom: 16px;
}

.podium-card {
  text-align: center;
  padding: 8px 0;
  border: 1px solid var(--border-default);
  transition:
    transform var(--duration-base) var(--ease-out-expo),
    box-shadow var(--duration-base) var(--ease-out-expo);
}

.podium-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

/* 奖牌色与 Dashboard 一致 */
.rank-1 {
  border-top: 3px solid var(--medal-gold);
}

.rank-2 {
  border-top: 3px solid var(--medal-silver);
}

.rank-3 {
  border-top: 3px solid var(--medal-bronze);
}

.medal {
  width: 56px;
  height: 56px;
  margin: 0 auto;
  color: var(--text-muted);
}

.medal--1 {
  color: var(--medal-gold);
}

.medal--2 {
  color: var(--medal-silver);
}

.medal--3 {
  color: var(--medal-bronze);
}

.medal svg {
  width: 100%;
  height: 100%;
}

.podium-rank {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.podium-name {
  font-size: 14px;
  font-weight: 700;
  margin-top: 4px;
  color: var(--text-strong);
}

.podium-score {
  font-size: 24px;
  font-weight: 800;
  color: var(--brand-600);
  margin: 4px 0;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.podium-score .total {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
}

.podium-paper {
  color: var(--text-muted);
  font-size: 11px;
}
</style>
