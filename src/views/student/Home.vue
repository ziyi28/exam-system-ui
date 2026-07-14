<template>
  <div class="student-home">
    <!-- 轮播图 -->
    <el-carousel v-if="banners.length" height="300px" class="banner-carousel" :interval="5000">
      <el-carousel-item v-for="banner in banners" :key="banner.id">
        <a v-if="banner.linkUrl" :href="banner.linkUrl" target="_blank" rel="noopener">
          <img :src="banner.imageUrl" :alt="banner.title" class="banner-img" />
        </a>
        <img v-else :src="banner.imageUrl" :alt="banner.title" class="banner-img" />
      </el-carousel-item>
    </el-carousel>

    <!-- 快捷入口 -->
    <el-row :gutter="16" class="quick-row">
      <el-col v-for="entry in quickEntries" :key="entry.title" :xs="12" :sm="6">
        <el-card shadow="hover" class="quick-card" @click="router.push(entry.path)">
          <div class="quick-icon" :class="`quick-icon--${entry.theme}`">
            <el-icon :size="24"><component :is="entry.icon" /></el-icon>
          </div>
          <div class="quick-title">{{ entry.title }}</div>
          <div class="quick-desc">{{ entry.desc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 公告 -->
      <el-col :xs="24" :md="10">
        <el-card shadow="never">
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
        <el-card shadow="never">
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
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getActiveBanners } from '@/api/banner'
import { getActiveNotices } from '@/api/notice'
import { getPopularVideos } from '@/api/video'
import type { Banner, Notice, Video } from '@/types'

const router = useRouter()
const banners = ref<Banner[]>([])
const notices = ref<Notice[]>([])
const videos = ref<Video[]>([])
const activeNotice = ref<Notice | null>(null)

const quickEntries = [
  { title: '在线考试', desc: '进入已发布的考试', path: '/student/exams', icon: 'EditPen', theme: 'brand' },
  { title: '我的成绩', desc: '查看考试记录与评语', path: '/student/records', icon: 'Medal', theme: 'success' },
  { title: '排行榜', desc: '看看谁是学霸', path: '/student/ranking', icon: 'TrendCharts', theme: 'warning' },
  { title: '视频学习', desc: '在线课程随时学', path: '/student/videos', icon: 'VideoPlay', theme: 'danger' },
]

onMounted(async () => {
  // 三块内容互不阻塞
  getActiveBanners().then((data) => (banners.value = data)).catch(() => {})
  getActiveNotices().then((data) => (notices.value = data.slice(0, 6))).catch(() => {})
  getPopularVideos(6).then((data) => (videos.value = data)).catch(() => {})
})
</script>

<style scoped>
.banner-carousel {
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

.banner-img {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.quick-row {
  margin-bottom: 16px;
}

.quick-card {
  text-align: center;
  cursor: pointer;
  transition:
    transform var(--duration-base) var(--ease-out-expo),
    box-shadow var(--duration-base) var(--ease-out-expo);
}

.quick-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.quick-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
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
  margin-top: 10px;
}

.quick-desc {
  font-size: 12px;
  color: var(--gray-500);
  margin-top: 4px;
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
  padding: 10px 0;
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
  margin-bottom: 12px;
}

.video-cover {
  height: 100px;
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
  margin-top: 6px;
}

.video-meta {
  font-size: 12px;
  color: var(--gray-500);
  margin-top: 2px;
}
</style>
