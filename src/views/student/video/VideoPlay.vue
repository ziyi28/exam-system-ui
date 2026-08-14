<template>
  <div v-loading="loading" class="video-play">
    <template v-if="video">
      <el-row :gutter="16">
        <el-col :xs="24" :md="17">
          <el-card shadow="never" body-style="padding: 0">
            <video
              ref="playerRef"
              :src="video.fileUrl"
              :poster="video.coverUrl"
              controls
              class="player"
              @play="startTiming"
              @pause="stopTiming"
              @ended="stopTiming"
            />
            <div class="video-info">
              <h2>{{ video.title }}</h2>
              <div class="meta-line">
                <span>{{ video.categoryName ?? '未分类' }}</span>
                <span>{{ video.viewCount ?? 0 }} 次观看</span>
                <span>上传者：{{ video.uploaderName ?? '-' }}</span>
                <div style="flex: 1" />
                <el-button :type="video.isLiked ? 'primary' : 'default'" round :icon="video.isLiked ? StarFilled : Star" @click="handleLike">
                  {{ video.isLiked ? '已点赞' : '点赞' }} {{ video.likeCount ?? 0 }}
                </el-button>
              </div>
              <el-divider style="margin: 12px 0" />
              <p class="description">{{ video.description || '暂无简介' }}</p>
              <div v-if="video.tags" class="tags">
                <el-tag v-for="tag in video.tags.split(',')" :key="tag" size="small" effect="plain" style="margin-right: 6px">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 推荐视频 -->
        <el-col :xs="24" :md="7">
          <el-card shadow="never">
            <template #header>热门推荐</template>
            <router-link v-for="item in recommended" :key="item.id" :to="`/student/videos/${item.id}`" class="rec-item" @click="reportWatch">
              <div class="rec-cover">
                <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" />
                <div v-else class="cover-placeholder"><el-icon><VideoCamera /></el-icon></div>
              </div>
              <div class="rec-info">
                <div class="rec-title">{{ item.title }}</div>
                <div class="rec-meta">{{ item.viewCount ?? 0 }} 观看</div>
              </div>
            </router-link>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Star, StarFilled, VideoCamera } from '@element-plus/icons-vue'
import { getVideoDetail, getPopularVideos, recordView, toggleLike } from '@/api/video'
import type { Video } from '@/types'

const route = useRoute()
const loading = ref(false)
const video = ref<Video | null>(null)
const recommended = ref<Video[]>([])
const playerRef = ref<HTMLVideoElement>()

// ---- 观看时长统计：暂停/离开时上报 ----
let watchSeconds = 0
let timingTimer: number | undefined
let reported = false

function startTiming() {
  if (timingTimer) return
  timingTimer = window.setInterval(() => {
    watchSeconds++
  }, 1000)
}

function stopTiming() {
  window.clearInterval(timingTimer)
  timingTimer = undefined
}

function reportWatch() {
  if (reported || watchSeconds < 3 || !video.value?.id) return
  reported = true
  recordView(video.value.id, watchSeconds).catch(() => {})
}

async function handleLike() {
  if (!video.value?.id) return
  const result = await toggleLike(video.value.id)
  video.value.isLiked = result.isLiked
  video.value.likeCount = (video.value.likeCount ?? 0) + (result.isLiked ? 1 : -1)
}

async function loadData() {
  loading.value = true
  watchSeconds = 0
  reported = false
  try {
    video.value = await getVideoDetail(Number(route.params.id))
    recommended.value = (await getPopularVideos(6)).filter((v) => v.id !== video.value?.id).slice(0, 5)
  } finally {
    loading.value = false
  }
}

// 站内跳转到另一个视频时重新加载
watch(() => route.params.id, () => {
  if (route.name === 'VideoPlay') {
    stopTiming()
    loadData()
  }
})

onMounted(loadData)

onBeforeUnmount(() => {
  stopTiming()
  reportWatch()
})
</script>

<style scoped>
.player {
  width: 100%;
  max-height: 480px;
  background: var(--media-surface);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  display: block;
}

.video-info {
  padding: 16px 20px 20px;
}

.video-info h2 {
  margin: 0 0 10px;
}

.meta-line {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--text-muted);
  font-size: 13px;
}

.description {
  color: var(--text-secondary);
  line-height: 1.7;
  white-space: pre-wrap;
  margin: 0 0 10px;
}

.rec-item {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  text-decoration: none;
  color: inherit;
}

.rec-item:focus-visible {
  outline: 2px solid var(--brand-600);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.rec-cover {
  width: 110px;
  height: 64px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--border-subtle);
  flex-shrink: 0;
}

.rec-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.rec-title {
  font-size: 13px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color var(--duration-fast) var(--ease-out-expo);
}

.rec-item:hover .rec-title {
  color: var(--brand-600);
}

.rec-meta {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}
</style>
