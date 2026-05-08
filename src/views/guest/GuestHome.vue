<template>
  <div class="guest-home">
    <!-- 轮播图 -->
    <el-carousel v-if="banners.length > 0" height="300px" class="banner-carousel glass-card">
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

    <!-- 欢迎横幅 (如果没有轮播图则显示原本的横幅) -->
    <div v-else class="welcome-banner glass-card">
      <div class="banner-content">
        <h1 class="gradient-text">欢迎使用智能考试系统</h1>
        <p>在线考试、视频学习、智能评测，助力高效学习与成长</p>
        <el-button type="primary" size="large" @click="$router.push('/guest/papers')">
          <el-icon><EditPen /></el-icon> 开始考试
        </el-button>
      </div>
    </div>

    <div class="home-grid">
      <!-- 左侧：公告 + 热门试卷 -->
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

        <!-- 热门试卷 -->
        <div class="section-card glass-card">
          <div class="section-header">
            <h3><el-icon><Notebook /></el-icon> 热门试卷</h3>
          </div>
          <div class="paper-grid">
            <div v-if="papers.length === 0" class="empty-state">
              <el-icon :size="32"><Document /></el-icon>
              <span>暂无试卷</span>
            </div>
            <div v-for="p in papers" :key="p.id" class="paper-card" @click="$router.push(`/exam/${p.id}`)">
              <div class="paper-icon" :style="{ background: paperGradient(p.id) }">
                <el-icon :size="22"><Notebook /></el-icon>
              </div>
              <div class="paper-info">
                <h4>{{ p.name }}</h4>
                <div class="paper-meta">
                  <span v-if="p.totalScore"><el-icon><Medal /></el-icon> {{ p.totalScore }}分</span>
                  <span v-if="p.duration"><el-icon><Timer /></el-icon> {{ p.duration }}分钟</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：快捷入口 -->
      <div class="home-right">
        <div class="section-card glass-card">
          <div class="section-header">
            <h3><el-icon><Operation /></el-icon> 快捷入口</h3>
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
import { getActiveNotices } from '@/api/notice'
import { listPapers } from '@/api/paper'
import { getActiveBanners } from '@/api/banner'

const notices = ref([])
const papers = ref([])
const banners = ref([])

const quickActions = [
  { label: '考试中心', icon: 'EditPen', route: '/guest/papers', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  { label: '视频学习', icon: 'VideoPlay', route: '/guest/videos', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
  { label: '排行榜', icon: 'Trophy', route: '/guest/ranking', gradient: 'linear-gradient(135deg, #10b981, #34d399)' }
]

const gradients = [
  'linear-gradient(135deg, #6366f1, #818cf8)',
  'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  'linear-gradient(135deg, #3b82f6, #60a5fa)',
  'linear-gradient(135deg, #10b981, #34d399)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #ef4444, #f87171)'
]
function paperGradient(id) { return gradients[id % gradients.length] }

function noticeTagType(type) {
  return { SYSTEM: 'danger', FEATURE: 'success', NOTICE: 'warning' }[type] || 'info'
}
function noticeTypeLabel(type) {
  return { SYSTEM: '系统', FEATURE: '新功能', NOTICE: '通知' }[type] || '公告'
}

onMounted(async () => {
  try {
    const resBanner = await getActiveBanners()
    banners.value = resBanner.data || []
  } catch (e) { /* ignore */ }

  try {
    const res = await getActiveNotices()
    notices.value = res.data || []
  } catch (e) { /* ignore */ }

  try {
    const res2 = await listPapers({ status: 'PUBLISHED' })
    papers.value = (res2.data?.records || res2.data || []).slice(0, 6)
  } catch (e) { /* ignore */ }
})
</script>

<style scoped>
.guest-home { padding: 4px; }

.welcome-banner {
  padding: 48px 40px;
  margin-bottom: 24px;
  text-align: center;
  background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08));
}
.banner-content h1 { font-size: 1.8rem; margin-bottom: 12px; }
.banner-content p {
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 24px;
}

.home-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

.section-card { padding: 24px; margin-bottom: 20px; }
.section-header { margin-bottom: 16px; }
.section-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* 公告 */
.notice-list { display: flex; flex-direction: column; gap: 10px; }
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

/* 热门试卷 */
.paper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.paper-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}
.paper-card:hover {
  transform: translateY(-3px);
  background: var(--bg-hover);
  box-shadow: var(--shadow-md);
}
.paper-icon {
  width: 44px; height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.paper-info { flex: 1; min-width: 0; }
.paper-info h4 {
  font-size: 0.9rem;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.paper-meta {
  display: flex;
  gap: 12px;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.paper-meta span { display: flex; align-items: center; gap: 3px; }

/* 快捷入口 */
.quick-actions { display: flex; flex-direction: column; gap: 12px; }
.action-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
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
  flex-shrink: 0;
}
.action-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

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
