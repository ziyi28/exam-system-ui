<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="gradient-text"><el-icon><Trophy /></el-icon> 考试排行榜</h2>
      <el-select v-model="paperId" placeholder="全部试卷" clearable @change="loadRanking" style="width:200px">
        <el-option v-for="p in papers" :key="p.id" :label="p.name" :value="p.id" />
      </el-select>
    </div>
    <div class="ranking-list glass-card" v-loading="loading">
      <div v-for="(item, idx) in rankingData" :key="item.id" class="ranking-item" :class="{ 'top-1': idx === 0, 'top-2': idx === 1, 'top-3': idx === 2 }">
        <div class="rank-pos">
          <span v-if="idx < 3" class="medal">{{ ['🥇', '🥈', '🥉'][idx] }}</span>
          <span v-else class="rank-num">{{ idx + 1 }}</span>
        </div>
        <div class="rank-info">
          <span class="rank-name">{{ item.studentName }}</span>
          <span class="rank-paper">{{ item.paper?.name || '-' }}</span>
        </div>
        <div class="rank-score">
          <span class="score-num">{{ item.score }}</span>
          <span class="score-total">/ {{ item.paper?.totalScore || 100 }}</span>
        </div>
      </div>
      <div v-if="!loading && rankingData.length === 0" class="empty-state"><el-icon :size="48"><Trophy /></el-icon><p>暂无排行数据</p></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getExamRanking } from '@/api/examRecord'
import { listPapers } from '@/api/paper'
const loading = ref(false); const rankingData = ref([]); const papers = ref([]); const paperId = ref(null)
async function loadRanking() { loading.value = true; try { const res = await getExamRanking({ paperId: paperId.value, limit: 50 }); rankingData.value = res.data || [] } catch (e) {} loading.value = false }
async function loadPapers() { try { const res = await listPapers({}); papers.value = res.data || [] } catch (e) {} }
onMounted(() => { loadRanking(); loadPapers() })
</script>

<style scoped>
.page-container { padding: 4px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-header h2 { display: flex; align-items: center; gap: 8px; font-size: 1.4rem; }
.ranking-list { padding: 8px 20px; }
.ranking-item { display: flex; align-items: center; gap: 16px; padding: 16px; border-bottom: 1px solid var(--border); transition: background var(--transition-fast); }
.ranking-item:hover { background: var(--bg-hover); }
.ranking-item:last-child { border-bottom: none; }
.ranking-item.top-1 { background: rgba(245, 158, 11, 0.06); }
.ranking-item.top-2 { background: rgba(148, 163, 184, 0.06); }
.ranking-item.top-3 { background: rgba(217, 119, 6, 0.04); }
.rank-pos { width: 48px; text-align: center; flex-shrink: 0; }
.medal { font-size: 1.5rem; }
.rank-num { font-family: var(--font-display); font-weight: 700; color: var(--text-muted); }
.rank-info { flex: 1; display: flex; flex-direction: column; }
.rank-name { font-weight: 600; color: var(--text-primary); }
.rank-paper { font-size: 0.8rem; color: var(--text-muted); }
.rank-score { text-align: right; }
.score-num { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; color: var(--primary-light); }
.score-total { font-size: 0.8rem; color: var(--text-muted); }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: var(--text-muted); }
</style>
