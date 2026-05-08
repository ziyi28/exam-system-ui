<template>
  <div class="home-page">
    <!-- 轮播图 -->
    <el-carousel v-if="banners.length > 0" height="300px" class="banner-carousel glass-card" style="margin-bottom: 24px;">
      <el-carousel-item v-for="banner in banners" :key="banner.id">
        <a :href="banner.linkUrl || 'javascript:void(0)'" :target="banner.linkUrl ? '_blank' : '_self'" class="banner-link">
          <div class="banner-bg" :style="{ backgroundImage: 'url(' + banner.imageUrl + ')', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center' }">
            <div class="banner-overlay" style="height: 100%; display: flex; flex-direction: column; justify-content: flex-end; padding: 24px; background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%); color: white;">
              <h2 style="margin: 0 0 8px 0;">{{ banner.title }}</h2>
              <p v-if="banner.description" style="margin: 0; opacity: 0.8;">{{ banner.description }}</p>
            </div>
          </div>
        </a>
      </el-carousel-item>
    </el-carousel>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div v-for="(stat, i) in statsCards" :key="i" class="stat-card glass-card" :style="{ '--accent': stat.color }">
        <div class="stat-icon-wrap" :style="{ background: stat.gradient }">
          <el-icon :size="24"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <div class="home-grid">
      <!-- 左侧：公告 + 热门题目 -->
      <div class="home-left">
        <!-- 系统公告 -->
        <div class="section-card glass-card">
          <div class="section-header">
            <h3><el-icon><Bell /></el-icon> 系统公告</h3>
          </div>
          <div class="notice-list">
            <div v-if="notices.length === 0" class="empty-state">
              <el-icon :size="32"><InfoFilled /></el-icon>
              <span>暂无公告</span>
            </div>
            <div v-for="notice in notices" :key="notice.id" class="notice-item">
              <el-tag :type="noticeTagType(notice.type)" size="small">{{ noticeTypeLabel(notice.type) }}</el-tag>
              <span class="notice-title">{{ notice.title }}</span>
            </div>
          </div>
        </div>

        <!-- 热门题目 -->
        <div class="section-card glass-card">
          <div class="section-header">
            <h3><el-icon><TrendCharts /></el-icon> 热门题目</h3>
          </div>
          <div class="popular-questions">
            <div v-if="popularQuestions.length === 0" class="empty-state">
              <el-icon :size="32"><Document /></el-icon>
              <span>暂无热门题目</span>
            </div>
            <div v-for="(q, idx) in popularQuestions" :key="q.id" class="question-item">
              <span class="q-rank" :class="{ top3: idx < 3 }">{{ idx + 1 }}</span>
              <span class="q-title">{{ q.title }}</span>
              <el-tag size="small" :type="difficultyType(q.difficulty)">{{ q.difficulty }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：快捷操作 -->
      <div class="home-right">
        <div class="section-card glass-card">
          <div class="section-header">
            <h3><el-icon><Operation /></el-icon> 快捷操作</h3>
          </div>
          <div class="quick-actions">
            <div class="action-card" v-for="action in quickActions" :key="action.route" @click="$router.push(action.route)">
              <div class="action-icon" :style="{ background: action.gradient }">
                <el-icon :size="22"><component :is="action.icon" /></el-icon>
              </div>
              <span class="action-label">{{ action.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSystemStats } from '@/api/stats'
import { getActiveNotices } from '@/api/notice'
import { getPopularQuestions } from '@/api/question'
import { getActiveBanners } from '@/api/banner'

const stats = ref({})
const notices = ref([])
const popularQuestions = ref([])
const banners = ref([])

const statsCards = ref([
  { label: '题目总数', value: 0, icon: 'Document', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  { label: '试卷总数', value: 0, icon: 'Notebook', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
  { label: '考试次数', value: 0, icon: 'DataLine', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
  { label: '用户总数', value: 0, icon: 'User', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  { label: '今日考试', value: 0, icon: 'Calendar', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  { label: '分类数量', value: 0, icon: 'FolderOpened', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' }
])

const quickActions = [
  { label: '题目管理', icon: 'List', route: '/admin/questions', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  { label: '批量导入', icon: 'Upload', route: '/admin/questions/batch', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
  { label: '试卷管理', icon: 'Tickets', route: '/admin/papers', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
  { label: '参加考试', icon: 'EditPen', route: '/papers', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  { label: '考试记录', icon: 'DataLine', route: '/admin/exam-records', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  { label: '排行榜', icon: 'Trophy', route: '/ranking', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' }
]

function noticeTagType(type) {
  return { SYSTEM: 'danger', FEATURE: 'success', NOTICE: 'warning' }[type] || 'info'
}
function noticeTypeLabel(type) {
  return { SYSTEM: '系统', FEATURE: '新功能', NOTICE: '通知' }[type] || '公告'
}
function difficultyType(d) {
  return { EASY: 'success', MEDIUM: 'warning', HARD: 'danger' }[d] || 'info'
}

onMounted(async () => {
  try {
    const resBanner = await getActiveBanners()
    banners.value = resBanner.data || []
  } catch (e) { /* ignore */ }

  try {
    const res = await getSystemStats()
    stats.value = res.data || {}
    statsCards.value[0].value = stats.value.questionCount || 0
    statsCards.value[1].value = stats.value.paperCount || 0
    statsCards.value[2].value = stats.value.examCount || 0
    statsCards.value[3].value = stats.value.userCount || 0
    statsCards.value[4].value = stats.value.todayExamCount || 0
    statsCards.value[5].value = stats.value.categoryCount || 0
  } catch (e) { /* ignore */ }

  try {
    const res2 = await getActiveNotices()
    notices.value = res2.data || []
  } catch (e) { /* ignore */ }

  try {
    const res3 = await getPopularQuestions(6)
    popularQuestions.value = res3.data || []
  } catch (e) { /* ignore */ }
})
</script>

<style scoped>
.home-page { padding: 4px; }

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 24px rgba(99, 102, 241, 0.15);
}
.stat-icon-wrap {
  width: 48px; height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.stat-info {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}
.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* 主网格 */
.home-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
}
.section-card {
  padding: 24px;
  margin-bottom: 20px;
}
.section-header {
  margin-bottom: 16px;
}
.section-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* 公告 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.notice-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}
.notice-item:hover { background: var(--bg-hover); }
.notice-title {
  flex: 1;
  font-size: 0.9rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 热门题目 */
.popular-questions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.question-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}
.question-item:hover { background: var(--bg-hover); }
.q-rank {
  width: 24px; height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 50%;
  background: var(--bg-hover);
  color: var(--text-muted);
  flex-shrink: 0;
}
.q-rank.top3 {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: #fff;
}
.q-title {
  flex: 1;
  font-size: 0.85rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 快捷操作 */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}
.action-card:hover {
  transform: translateY(-3px);
  background: var(--bg-hover);
  box-shadow: var(--shadow-md);
}
.action-icon {
  width: 44px; height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.action-label {
  font-size: 0.82rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: var(--text-muted);
  font-size: 0.85rem;
}
</style>
