<template>
  <div class="student-home-terminal">
    <!-- 全宽终端 Hero -->
    <section class="home-hero-terminal">
      <div class="hero-content">
        <div class="hero-kicker-row">
          <span class="mono-badge">ACADEMIC_PORTAL // V1.0</span>
          <span class="hero-time-tag mono-num">{{ todayDateText }}</span>
        </div>
        <h1 class="hero-title">
          你好，<span class="highlight-name">{{ displayName }}</span>。
        </h1>
        <p class="hero-subtitle">
          以严肃考评检验真实掌握，以 AI 深度解析驱动知识进阶。
        </p>
        <div class="hero-meta-row">
          <div class="meta-item">
            <span class="meta-dot"></span>
            <span>考场模式就绪</span>
          </div>
          <div class="meta-item">
            <span class="meta-dot cyan"></span>
            <span>RAG 知识库已联机</span>
          </div>
        </div>
      </div>
      <BrandScene variant="home" class="hero-scene" />
    </section>

    <!-- 5大快捷业务入口 -->
    <section class="quick-section" aria-label="快捷考学通道">
      <div class="section-head">
        <div class="section-title-group">
          <h2 class="section-title">核心考学通道</h2>
          <span class="section-code mono-text">KEY_WORKSPACES</span>
        </div>
      </div>
      <div class="quick-grid" :class="{ 'quick-grid--four': quickEntries.length === 4 }">
        <router-link v-for="entry in quickEntries" :key="entry.title" :to="entry.path" class="quick-terminal-card">
          <div class="quick-card-head">
            <span class="quick-code mono-num">{{ entry.code }}</span>
            <div class="quick-icon" :class="`icon-theme--${entry.theme}`">
              <el-icon :size="16"><component :is="entry.icon" /></el-icon>
            </div>
          </div>
          <div class="quick-content">
            <span class="quick-title">{{ entry.title }}</span>
            <span class="quick-desc">{{ entry.desc }}</span>
          </div>
          <div class="quick-bottom-bar">
            <span class="enter-text">ENTER_SPACE</span>
            <el-icon class="quick-arrow"><ArrowRight /></el-icon>
          </div>
        </router-link>
      </div>
    </section>

    <!-- 轮播图 -->
    <el-carousel v-if="banners.length" height="240px" class="banner-carousel" :interval="5000" arrow="hover">
      <el-carousel-item v-for="banner in banners" :key="banner.id">
        <a v-if="banner.linkUrl" :href="banner.linkUrl" target="_blank" rel="noopener">
          <img :src="banner.imageUrl" :alt="banner.title" class="banner-img" />
        </a>
        <img v-else :src="banner.imageUrl" :alt="banner.title" class="banner-img" />
      </el-carousel-item>
    </el-carousel>

    <!-- 公告与热门课程 -->
    <el-row :gutter="16" class="home-content-grid">
      <!-- 系统公告 -->
      <el-col :xs="24" :md="banners.length ? 9 : 10">
        <div class="terminal-panel-card">
          <div class="panel-header">
            <div class="panel-title-group">
              <div class="panel-title">
                <el-icon class="panel-header-icon"><Bell /></el-icon>
                系统公告与通知
              </div>
              <div class="panel-subtitle mono-text">NOTICE_BULLETIN</div>
            </div>
          </div>
          <div class="panel-body list-body">
            <el-empty v-if="!notices.length" description="暂无通知公告" :image-size="60" />
            <button
              v-for="notice in notices"
              :key="notice.id"
              type="button"
              class="terminal-notice-item"
              @click="activeNotice = notice"
            >
              <div class="notice-meta-line">
                <el-tag v-if="notice.priority === 2" type="danger" size="small" effect="plain">紧急</el-tag>
                <el-tag v-else-if="notice.priority === 1" type="warning" size="small" effect="plain">重要</el-tag>
                <span class="notice-date mono-num">{{ (notice.createTime ?? '').slice(0, 10) }}</span>
              </div>
              <span class="notice-title-text ellipsis">{{ notice.title }}</span>
            </button>
          </div>
        </div>
      </el-col>

      <!-- 热门课程 / 视频 -->
      <el-col :xs="24" :md="banners.length ? 15 : 14">
        <div class="terminal-panel-card">
          <div class="panel-header">
            <div class="panel-title-group">
              <div class="panel-title">
                <el-icon class="panel-header-icon"><VideoPlay /></el-icon>
                推荐视频课程
              </div>
              <div class="panel-subtitle mono-text">RECOMMENDED_VIDEOS</div>
            </div>
            <router-link to="/student/videos" class="more-link mono-num">VIEW_ALL →</router-link>
          </div>
          <div class="panel-body">
            <el-empty v-if="!videos.length" description="暂无视频课程" :image-size="60" />
            <el-row :gutter="10">
              <el-col v-for="video in videos" :key="video.id" :xs="12" :sm="8">
                <router-link :to="`/student/videos/${video.id}`" class="terminal-video-card">
                  <div class="video-cover-wrap">
                    <img v-if="video.coverUrl" :src="video.coverUrl" :alt="video.title" class="video-img" />
                    <div v-else class="video-placeholder">
                      <el-icon :size="24"><VideoCamera /></el-icon>
                    </div>
                  </div>
                  <div class="video-info">
                    <span class="video-title ellipsis">{{ video.title }}</span>
                    <div class="video-meta mono-num">
                      <span>{{ video.viewCount ?? 0 }} VIEWS</span>
                      <span>{{ video.likeCount ?? 0 }} LIKES</span>
                    </div>
                  </div>
                </router-link>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 公告详情对话框 -->
    <el-dialog
      :model-value="!!activeNotice"
      :title="activeNotice?.title"
      width="min(520px, calc(100vw - 48px))"
      @close="activeNotice = null"
    >
      <div class="notice-dialog-content">{{ activeNotice?.content }}</div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Bell, VideoPlay, VideoCamera, ArrowRight } from '@element-plus/icons-vue'
import { getActiveBanners } from '@/api/banner'
import { getActiveNotices } from '@/api/notice'
import { getPopularVideos } from '@/api/video'
import { useUserStore } from '@/stores/user'
import BrandScene from '@/components/brand/BrandScene.vue'
import type { Banner, Notice, Video } from '@/types'

const userStore = useUserStore()
const banners = ref<Banner[]>([])
const notices = ref<Notice[]>([])
const videos = ref<Video[]>([])
const activeNotice = ref<Notice | null>(null)
const displayName = computed(() => userStore.userInfo?.realName || userStore.userInfo?.username || '同学')

const todayDateText = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${date}`
})

const quickEntries = computed(() => [
  { title: '在线考试', code: '01_EXAMS', desc: '进入发布考场与即时作答', path: '/student/exams', icon: 'EditPen', theme: 'brand' },
  { title: '成绩档案', code: '02_RECORDS', desc: '查看得分复盘与 AI 解析', path: '/student/records', icon: 'Medal', theme: 'cyan' },
  ...(userStore.role === 'STUDENT'
    ? [{ title: '知识资料库', code: '03_RAG_LIB', desc: '检索资料与溯源查阅', path: '/student/knowledge', icon: 'Collection', theme: 'violet' }]
    : []),
  { title: '全站排行', code: '04_RANKING', desc: '全校/班级学情积分榜', path: '/student/ranking', icon: 'TrendCharts', theme: 'indigo' },
  { title: '视频自学', code: '05_VIDEOS', desc: '点播核心难点精讲视频', path: '/student/videos', icon: 'VideoPlay', theme: 'neutral' },
])

onMounted(async () => {
  getActiveBanners().then((data) => (banners.value = data)).catch(() => {})
  getActiveNotices().then((data) => (notices.value = data.slice(0, 6))).catch(() => {})
  getPopularVideos(6).then((data) => (videos.value = data)).catch(() => {})
})
</script>

<style scoped>
.student-home-terminal {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* ============ 顶部 Hero 终端 ============ */
.home-hero-terminal {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 32px 36px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(480px 260px at 95% 0%, color-mix(in srgb, var(--accent-cyan) 8%, transparent), transparent 60%),
    var(--surface-1);
  overflow: hidden;
}

.hero-content {
  max-width: 540px;
  z-index: 1;
}

.hero-kicker-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
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
}

.hero-time-tag {
  font-size: 11px;
  color: var(--text-muted);
}

.hero-title {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.03em;
  color: var(--text-strong);
  margin: 0 0 10px;
}

.highlight-name {
  color: var(--brand-600);
}

.hero-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 18px;
}

.hero-meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-secondary);
}

.meta-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-600);
  box-shadow: 0 0 6px var(--brand-600);
}

.meta-dot.cyan {
  background: var(--accent-cyan);
  box-shadow: 0 0 6px var(--accent-cyan);
}

.hero-scene {
  width: clamp(240px, 32vw, 360px);
  flex: none;
}

/* ============ 快捷通道网格 ============ */
.quick-section {
  margin: 0;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.section-title-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: -0.01em;
}

.section-code {
  font-size: 11px;
  color: var(--text-muted);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-3);
}

.quick-grid--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.quick-terminal-card {
  display: flex;
  flex-direction: column;
  padding: 14px;
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: inherit;
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.quick-terminal-card:hover {
  border-color: var(--brand-600);
  background: var(--surface-2);
  box-shadow: var(--glow-brand);
}

.quick-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.quick-code {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
}

.quick-icon {
  width: 26px;
  height: 26px;
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

.quick-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.quick-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 2px;
}

.quick-desc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
}

.quick-bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.quick-terminal-card:hover .quick-bottom-bar {
  color: var(--brand-600);
}

/* ============ 轮播图 ============ */
.banner-carousel {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-default);
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ============ 下方两栏容器 ============ */
.terminal-panel-card {
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.panel-title-group {
  display: flex;
  flex-direction: column;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.panel-header-icon {
  color: var(--brand-600);
}

.panel-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 1px;
}

.more-link {
  font-size: 11px;
  font-weight: 700;
  color: var(--brand-600);
  text-decoration: none;
}

.panel-body {
  padding: 14px 16px;
  flex: 1;
}

.list-body {
  padding: 8px 12px;
}

.terminal-notice-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  text-align: left;
  border-radius: var(--radius-xs);
  transition: background var(--duration-fast) var(--ease-out-expo);
}

.terminal-notice-item:last-child {
  border-bottom: 0;
}

.terminal-notice-item:hover {
  background: var(--surface-2);
}

.notice-meta-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notice-date {
  font-size: 11px;
  color: var(--text-muted);
}

.notice-title-text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
}

.terminal-notice-item:hover .notice-title-text {
  color: var(--brand-600);
}

/* 视频卡片 */
.terminal-video-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  margin-bottom: 10px;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.terminal-video-card:hover {
  border-color: var(--brand-600);
}

.video-cover-wrap {
  aspect-ratio: 16 / 9;
  background: var(--bg-canvas);
  overflow: hidden;
}

.video-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--text-muted);
}

.video-info {
  padding: 8px 10px;
}

.video-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-strong);
  display: block;
}

.video-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-muted);
}

.notice-dialog-content {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
}

.mono-num,
.mono-text {
  font-family: var(--font-mono);
}
</style>
