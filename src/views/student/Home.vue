<template>
  <div class="student-home">
    <!-- 全宽 Hero -->
    <section class="home-hero">
      <div class="home-hero__copy">
        <span class="home-hero__eyebrow">今日学习</span>
        <h1>你好，{{ displayName }}。</h1>
        <p>从一场考试开始，持续追踪你的学习进度。</p>
        <div class="home-hero__hint">
          <el-icon><Calendar /></el-icon>
          <span>合理安排学习与考试时间</span>
        </div>
      </div>
      <BrandScene variant="home" class="home-hero__scene" />
    </section>

    <!-- 快速入口 -->
    <section class="page-section quick-section" aria-label="快速开始">
      <div class="page-section__head">
        <div>
          <h2 class="page-section__title">快速开始</h2>
          <p class="section-desc">选择一项任务，继续你的学习节奏</p>
        </div>
      </div>
      <div class="quick-grid" :class="{ 'quick-grid--four': quickEntries.length === 4 }">
        <router-link v-for="entry in quickEntries" :key="entry.title" :to="entry.path" class="quick-card">
          <span class="quick-icon" :class="`quick-icon--${entry.theme}`">
            <el-icon :size="24"><component :is="entry.icon" /></el-icon>
          </span>
          <span class="quick-content">
            <span class="quick-title">{{ entry.title }}</span>
            <span class="quick-desc">{{ entry.desc }}</span>
          </span>
          <el-icon class="quick-arrow"><ArrowRight /></el-icon>
        </router-link>
      </div>
    </section>

    <!-- 轮播图：有数据时全宽展示 -->
    <el-carousel v-if="banners.length" height="280px" class="banner-carousel" :interval="5000" arrow="hover">
      <el-carousel-item v-for="banner in banners" :key="banner.id">
        <a v-if="banner.linkUrl" :href="banner.linkUrl" target="_blank" rel="noopener">
          <img :src="banner.imageUrl" :alt="banner.title" class="banner-img" />
        </a>
        <img v-else :src="banner.imageUrl" :alt="banner.title" class="banner-img" />
      </el-carousel-item>
    </el-carousel>

    <!-- 公告 + 热门课程：无轮播时公告自动占满，不留空洞 -->
    <el-row :gutter="16" class="home-content-grid">
      <el-col :xs="24" :md="banners.length ? 8 : 10">
        <el-card shadow="never" class="home-info-card">
          <template #header>
            <div class="card-header"><el-icon><Bell /></el-icon> 系统公告</div>
          </template>
          <el-empty v-if="!notices.length" description="暂无公告" :image-size="60" />
          <button
            v-for="notice in notices"
            :key="notice.id"
            type="button"
            class="notice-item"
            @click="activeNotice = notice"
          >
            <el-tag v-if="notice.priority === 2" type="danger" size="small" effect="dark">紧急</el-tag>
            <el-tag v-else-if="notice.priority === 1" type="warning" size="small">重要</el-tag>
            <span class="notice-title ellipsis">{{ notice.title }}</span>
            <span class="notice-time">{{ (notice.createTime ?? '').slice(0, 10) }}</span>
          </button>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="banners.length ? 16 : 14">
        <el-card shadow="never" class="home-info-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><VideoPlay /></el-icon> 热门课程</span>
              <router-link to="/student/videos" class="more-link">更多 →</router-link>
            </div>
          </template>
          <el-empty v-if="!videos.length" description="暂无视频" :image-size="60" />
          <el-row :gutter="12">
            <el-col v-for="video in videos" :key="video.id" :xs="12" :sm="8">
              <router-link :to="`/student/videos/${video.id}`" class="video-card">
                <span class="video-cover">
                  <img v-if="video.coverUrl" :src="video.coverUrl" :alt="video.title" />
                  <span v-else class="cover-placeholder"><el-icon :size="28"><VideoCamera /></el-icon></span>
                </span>
                <span class="video-title ellipsis">{{ video.title }}</span>
                <span class="video-meta">{{ video.viewCount ?? 0 }} 次观看 · {{ video.likeCount ?? 0 }} 赞</span>
              </router-link>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 公告详情对话框 -->
    <el-dialog :model-value="!!activeNotice" :title="activeNotice?.title" width="min(520px, calc(100vw - 48px))" @close="activeNotice = null">
      <div class="notice-content">{{ activeNotice?.content }}</div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

// 类别色使用品牌蓝 / 青 / 紫 / 靛 / 中性，不用成功/危险色伪装内容分类
const quickEntries = computed(() => [
  { title: '在线考试', desc: '进入已发布的考试', path: '/student/exams', icon: 'EditPen', theme: 'brand' },
  { title: '我的成绩', desc: '查看考试记录与评语', path: '/student/records', icon: 'Medal', theme: 'cyan' },
  ...(userStore.role === 'STUDENT'
    ? [{ title: '学习资料库', desc: '阅读资料与课程内容', path: '/student/knowledge', icon: 'Collection', theme: 'violet' }]
    : []),
  { title: '排行榜', desc: '看看谁是学霸', path: '/student/ranking', icon: 'TrendCharts', theme: 'indigo' },
  { title: '视频学习', desc: '在线课程随时学', path: '/student/videos', icon: 'VideoPlay', theme: 'neutral' },
])

onMounted(async () => {
  // 三块内容互不阻塞，失败静默
  getActiveBanners().then((data) => (banners.value = data)).catch(() => {})
  getActiveNotices().then((data) => (notices.value = data.slice(0, 6))).catch(() => {})
  getPopularVideos(6).then((data) => (videos.value = data)).catch(() => {})
})
</script>

<style scoped>
.student-home {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* ============ 全宽 Hero ============ */
.home-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 300px;
  padding: clamp(28px, 4vw, 48px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  overflow: hidden;
  background:
    radial-gradient(560px 320px at 92% -10%, color-mix(in srgb, var(--accent-violet) 11%, transparent), transparent 62%),
    radial-gradient(480px 300px at 6% 110%, color-mix(in srgb, var(--accent-cyan) 9%, transparent), transparent 60%),
    var(--surface-1);
}

.home-hero__copy {
  position: relative;
  z-index: 1;
  max-width: 560px;
}

.home-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  color: var(--brand-600);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: var(--brand-50);
}

.home-hero h1 {
  max-width: 520px;
  margin: 16px 0 10px;
  color: var(--text-strong);
  font-size: clamp(32px, 3.4vw, 44px);
  line-height: 1.12;
  letter-spacing: -0.05em;
}

.home-hero p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 15px;
}

.home-hero__hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 13px;
}

.home-hero__scene {
  width: clamp(300px, 40vw, 460px);
  flex: none;
}

.section-desc {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

/* ============ 快速入口 ============ */
.quick-section {
  margin: 0;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-4);
}

.quick-grid--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.quick-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  min-height: 112px;
  padding: 22px;
  color: inherit;
  text-decoration: none;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--surface-1);
  transition:
    transform var(--duration-base) var(--ease-out-expo),
    box-shadow var(--duration-base) var(--ease-out-expo),
    border-color var(--duration-base) var(--ease-out-expo);
}

.quick-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}

.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.quick-content {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.quick-icon--brand {
  background: var(--brand-50);
  color: var(--brand-600);
}

.quick-icon--cyan {
  background: var(--accent-cyan-soft);
  color: var(--accent-cyan);
}

.quick-icon--violet {
  background: var(--accent-violet-soft);
  color: var(--accent-violet);
}

.quick-icon--indigo {
  background: var(--accent-indigo-soft);
  color: var(--accent-indigo);
}

.quick-icon--neutral {
  background: var(--surface-2);
  color: var(--text-secondary);
}

.quick-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-strong);
}

.quick-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 3px;
}

.quick-arrow {
  color: var(--text-muted);
  flex: none;
  transition: transform var(--duration-fast) var(--ease-out-expo), color var(--duration-fast) var(--ease-out-expo);
}

.quick-card:hover .quick-arrow {
  color: var(--brand-600);
  transform: translateX(2px);
}

/* ============ 轮播图 ============ */
.banner-carousel {
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--border-default);
  box-shadow: none;
}

.banner-img {
  width: 100%;
  height: 280px;
  object-fit: cover;
}

/* ============ 公告 + 热门课程 ============ */
.home-content-grid {
  margin-top: 0;
}

.home-info-card {
  height: 100%;
  border: 1px solid var(--border-default);
  box-shadow: none;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  color: var(--text-strong);
  font-weight: 600;
}

.notice-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 0;
  font: inherit;
  text-align: left;
  color: inherit;
  background: transparent;
  border: 0;
  border-bottom: 1px dashed var(--border-subtle);
  cursor: pointer;
}

.notice-item:hover .notice-title {
  color: var(--brand-600);
}

.notice-title {
  flex: 1;
  color: var(--text-primary);
  transition: color var(--duration-fast) var(--ease-out-expo);
}

.notice-time {
  color: var(--text-muted);
  font-size: 12px;
}

.notice-content {
  white-space: pre-wrap;
  line-height: 1.8;
}

.more-link {
  color: var(--brand-600);
  font-size: 13px;
  font-weight: 500;
}

.more-link:hover {
  color: var(--brand-700);
}

.video-card {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  color: inherit;
  text-decoration: none;
}

.video-cover {
  height: 112px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--surface-2);
  display: block;
}

.video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
  color: var(--text-muted);
}

.video-title {
  font-size: 14px;
  margin-top: 8px;
  font-weight: 600;
  color: var(--text-strong);
}

.video-meta {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

@media (max-width: 1024px) {
  /* 平板：六列网格，前三项各占两列、后两项各占三列 */
  .quick-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .quick-grid .quick-card:nth-child(-n + 3) {
    grid-column: span 2;
  }

  .quick-grid .quick-card:nth-child(n + 4) {
    grid-column: span 3;
  }

  /* 仅四项（管理员/教师预览）在平板下 2×2 */
  .quick-grid--four .quick-card {
    grid-column: span 3;
  }

  .home-hero__scene {
    width: 300px;
  }
}

@media (max-width: 768px) {
  .home-hero {
    align-items: flex-start;
    flex-direction: column;
    min-height: 0;
    padding: 28px 24px;
  }

  .home-hero__scene {
    display: none;
  }

  .home-hero h1 {
    font-size: 36px;
  }

  .banner-carousel :deep(.el-carousel__container),
  .banner-img {
    height: 210px !important;
  }

  .quick-grid,
  .quick-grid--four {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quick-grid .quick-card,
  .quick-grid--four .quick-card {
    grid-column: auto;
  }

  .quick-card {
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
