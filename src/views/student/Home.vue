<template>
  <div class="student-home">
    <section class="home-intro">
      <div>
        <span class="home-intro__eyebrow">今日学习</span>
        <h1>你好，{{ displayName }}。</h1>
        <p>从一场考试开始，持续追踪你的学习进度。</p>
      </div>
      <div class="home-intro__hint">
        <el-icon><Calendar /></el-icon>
        <span>合理安排学习与考试时间</span>
      </div>
    </section>

    <!-- 轮播图 -->
    <el-carousel v-if="banners.length" height="320px" class="banner-carousel" :interval="5000">
      <el-carousel-item v-for="banner in banners" :key="banner.id">
        <a v-if="banner.linkUrl" :href="banner.linkUrl" target="_blank" rel="noopener">
          <img :src="banner.imageUrl" :alt="banner.title" class="banner-img" />
        </a>
        <img v-else :src="banner.imageUrl" :alt="banner.title" class="banner-img" />
      </el-carousel-item>
    </el-carousel>

    <!-- 快捷入口 -->
    <section class="page-section quick-section">
      <div class="page-section__head">
        <div>
          <h2 class="page-section__title">快速开始</h2>
          <p class="section-desc">选择一项任务，继续你的学习节奏</p>
        </div>
      </div>
      <el-row :gutter="16" class="quick-row">
        <el-col v-for="entry in quickEntries" :key="entry.title" :xs="12" :sm="6">
          <el-card shadow="never" class="quick-card" @click="router.push(entry.path)">
            <div class="quick-icon" :class="`quick-icon--${entry.theme}`">
              <el-icon :size="24"><component :is="entry.icon" /></el-icon>
            </div>
            <div class="quick-content">
              <div class="quick-title">{{ entry.title }}</div>
              <div class="quick-desc">{{ entry.desc }}</div>
            </div>
            <el-icon class="quick-arrow"><ArrowRight /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <el-row :gutter="16" class="home-content-grid">
      <!-- 公告 -->
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="home-info-card">
          <template #header>
            <div class="card-header"><el-icon><Bell /></el-icon> 系统公告</div>
          </template>
          <el-empty v-if="!notices.length" description="暂无公告" :image-size="60" />
          <div v-for="notice in notices" :key="notice.id" class="notice-item" @click="activeNotice = notice">
            <el-tag v-if="notice.priority === 2" type="danger" size="small" effect="dark">紧急</el-tag>
            <el-tag v-else-if="notice.priority === 1" type="warning" size="small">重要</el-tag>
            <span class="notice-title ellipsis">{{ notice.title }}</span>
            <span class="notice-time">{{ (notice.createTime ?? '').slice(0, 10) }}</span>
          </div>
        </el-card>
      </el-col>

      <!-- 热门视频 -->
      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="home-info-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><VideoPlay /></el-icon> 热门课程</span>
              <el-button link type="primary" @click="router.push('/student/videos')">更多 →</el-button>
            </div>
          </template>
          <el-empty v-if="!videos.length" description="暂无视频" :image-size="60" />
          <el-row :gutter="12">
            <el-col v-for="video in videos" :key="video.id" :xs="12" :sm="8">
              <div class="video-card" @click="router.push(`/student/videos/${video.id}`)">
                <div class="video-cover">
                  <img v-if="video.coverUrl" :src="video.coverUrl" :alt="video.title" />
                  <div v-else class="cover-placeholder"><el-icon :size="28"><VideoCamera /></el-icon></div>
                </div>
                <div class="video-title ellipsis">{{ video.title }}</div>
                <div class="video-meta">{{ video.viewCount ?? 0 }} 次观看 · {{ video.likeCount ?? 0 }} 赞</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 公告详情对话框 -->
    <el-dialog :model-value="!!activeNotice" :title="activeNotice?.title" width="520px" @close="activeNotice = null">
      <div class="notice-content">{{ activeNotice?.content }}</div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getActiveBanners } from '@/api/banner'
import { getActiveNotices } from '@/api/notice'
import { getPopularVideos } from '@/api/video'
import { useUserStore } from '@/stores/user'
import type { Banner, Notice, Video } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const banners = ref<Banner[]>([])
const notices = ref<Notice[]>([])
const videos = ref<Video[]>([])
const activeNotice = ref<Notice | null>(null)
const displayName = computed(() => userStore.userInfo?.realName || userStore.userInfo?.username || '同学')

const quickEntries = computed(() => [
  { title: '在线考试', desc: '进入已发布的考试', path: '/student/exams', icon: 'EditPen', theme: 'brand' },
  { title: '我的成绩', desc: '查看考试记录与评语', path: '/student/records', icon: 'Medal', theme: 'success' },
  ...(userStore.role === 'STUDENT'
    ? [{ title: '学习资料库', desc: '阅读资料与课程内容', path: '/student/knowledge', icon: 'Collection', theme: 'brand' }]
    : []),
  { title: '排行榜', desc: '看看谁是学霸', path: '/student/ranking', icon: 'TrendCharts', theme: 'warning' },
  { title: '视频学习', desc: '在线课程随时学', path: '/student/videos', icon: 'VideoPlay', theme: 'danger' },
])

onMounted(async () => {
  // 三块内容互不阻塞
  getActiveBanners().then((data) => (banners.value = data)).catch(() => {})
  getActiveNotices().then((data) => (notices.value = data.slice(0, 6))).catch(() => {})
  getPopularVideos(6).then((data) => (videos.value = data)).catch(() => {})
})
</script>

<style scoped>
.student-home {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
  gap: 22px;
}

.banner-carousel {
  grid-column: 2;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--gray-200);
  box-shadow: none;
}

.banner-img {
  width: 100%;
  height: 320px;
  object-fit: cover;
}

.home-intro {
  grid-column: 1;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-5);
  min-height: 320px;
  margin-bottom: 0;
  padding: clamp(28px, 4vw, 44px);
  border: 1px solid #ccd7df;
  border-radius: var(--radius-xl);
  background: #e8eef2;
  box-shadow: none;
}

.home-intro__eyebrow {
  color: var(--brand-700);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.home-intro h1 {
  max-width: 520px;
  margin: 12px 0 10px;
  color: var(--gray-900);
  font-size: clamp(32px, 3.5vw, 44px);
  line-height: 1.12;
  letter-spacing: -0.05em;
}

.home-intro p,
.section-desc {
  margin: 0;
  color: var(--gray-600);
}

.home-intro__hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--gray-600);
  font-size: 13px;
  padding: 9px 13px;
  border-top: 1px solid #ccd7df;
  padding-left: 0;
  padding-right: 0;
}

.section-desc {
  margin-top: 4px;
  font-size: 13px;
}

.quick-section {
  grid-column: 1 / -1;
  margin-top: 10px;
}

.quick-row {
  margin-bottom: 0;
}

.quick-card {
  position: relative;
  cursor: pointer;
  border: 1px solid var(--gray-200);
  transition:
    transform var(--duration-base) var(--ease-out-expo),
    box-shadow var(--duration-base) var(--ease-out-expo);
}

.quick-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 112px;
  padding: 22px;
}

.quick-card:hover {
  border-color: var(--gray-300);
  background: var(--gray-50);
}

.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-content {
  min-width: 0;
  flex: 1;
}

.quick-icon--brand {
  background: var(--brand-bg);
  color: var(--brand-600);
}

.quick-icon--success {
  background: var(--success-bg);
  color: var(--success);
}

.quick-icon--warning {
  background: var(--warning-bg);
  color: var(--warning);
}

.quick-icon--danger {
  background: var(--danger-bg);
  color: var(--danger);
}

.quick-title {
  font-size: 16px;
  font-weight: 600;
}

.quick-desc {
  font-size: 12px;
  color: var(--gray-500);
  margin-top: 3px;
}

.quick-arrow {
  color: var(--gray-400);
  transition: transform var(--duration-fast) var(--ease-out-expo), color var(--duration-fast) var(--ease-out-expo);
}

.quick-card:hover .quick-arrow {
  color: var(--brand-600);
  transform: translateX(2px);
}

.home-content-grid {
  grid-column: 1 / -1;
  margin-top: var(--space-6);
}

.home-info-card {
  height: 100%;
  border: 1px solid var(--gray-200);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.notice-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px dashed var(--gray-100);
  cursor: pointer;
}

.notice-item:hover .notice-title {
  color: var(--brand-600);
}

.notice-title {
  flex: 1;
  transition: color var(--duration-fast) var(--ease-out-expo);
}

.notice-time {
  color: var(--gray-400);
  font-size: 12px;
}

.notice-content {
  white-space: pre-wrap;
  line-height: 1.8;
}

.video-card {
  cursor: pointer;
  margin-bottom: 16px;
}

.video-cover {
  height: 112px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--gray-100);
}

.video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-base) var(--ease-out-expo);
}

.video-card:hover .video-cover img {
  transform: scale(1.05);
}

.cover-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
}

.video-title {
  font-size: 14px;
  margin-top: 8px;
  font-weight: 600;
}

.video-meta {
  font-size: 12px;
  color: var(--gray-500);
  margin-top: 2px;
}

@media (max-width: 768px) {
  .student-home {
    display: flex;
    flex-direction: column;
  }

  .home-intro {
    align-items: flex-start;
    flex-direction: column;
    min-height: 290px;
    margin-bottom: 0;
    padding: 28px 24px;
  }

  .home-intro h1 {
    font-size: 36px;
  }

  .banner-carousel :deep(.el-carousel__container),
  .banner-img {
    height: 210px !important;
  }

  .quick-card :deep(.el-card__body) {
    min-height: 88px;
    padding: 16px;
  }

  .quick-icon {
    width: 42px;
    height: 42px;
  }

  .quick-desc,
  .quick-arrow {
    display: none;
  }
}
</style>
