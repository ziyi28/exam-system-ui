<template>
  <div class="page-container">
    <div class="video-player-wrap glass-card" v-loading="loading">
      <div v-if="video" class="player-section">
        <video v-if="video.fileUrl" controls :src="video.fileUrl" class="video-player" @timeupdate="onTimeUpdate"></video>
        <div v-else class="no-video"><el-icon :size="64"><VideoPlay /></el-icon><p>视频加载中...</p></div>
      </div>
    </div>
    <div class="video-detail glass-card" v-if="video">
      <div class="detail-header">
        <h2>{{ video.title }}</h2>
        <div class="detail-actions">
          <el-button :type="video.isLiked ? 'primary' : 'default'" round @click="handleLike">
            <el-icon><Star /></el-icon> {{ video.isLiked ? '已点赞' : '点赞' }} ({{ video.likeCount || 0 }})
          </el-button>
        </div>
      </div>
      <div class="detail-meta">
        <span><el-icon><User /></el-icon> {{ video.uploaderName }}</span>
        <span><el-icon><View /></el-icon> {{ video.viewCount || 0 }} 次观看</span>
        <span><el-icon><Timer /></el-icon> {{ video.durationText }}</span>
      </div>
      <p class="detail-desc">{{ video.description || '暂无描述' }}</p>
      <div v-if="video.tags" class="detail-tags">
        <el-tag v-for="tag in video.tags.split(',')" :key="tag" size="small" type="info" style="margin-right:6px">{{ tag }}</el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { getVideoDetail, recordVideoView, toggleVideoLike } from '@/api/video'
import { ElMessage } from 'element-plus'
const route = useRoute(); const loading = ref(true); const video = ref(null); let viewDuration = 0
function onTimeUpdate(e) { viewDuration = Math.floor(e.target.currentTime) }
async function handleLike() { try { const res = await toggleVideoLike(video.value.id); video.value.isLiked = res.data.isLiked; video.value.likeCount += video.value.isLiked ? 1 : -1; ElMessage.success(res.data.message) } catch (e) {} }
onMounted(async () => { try { const res = await getVideoDetail(route.params.id); video.value = res.data } catch (e) {} loading.value = false })
onBeforeUnmount(() => { if (video.value && viewDuration > 5) recordVideoView(video.value.id, viewDuration).catch(() => {}) })
</script>

<style scoped>
.page-container{padding:4px;max-width:1000px;margin:0 auto}
.video-player-wrap{padding:0;overflow:hidden;margin-bottom:20px;aspect-ratio:16/9;background:#000;border-radius:var(--radius-lg)}
.video-player{width:100%;height:100%;object-fit:contain}
.no-video{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted)}
.video-detail{padding:28px}
.detail-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}.detail-header h2{font-size:1.3rem;flex:1;margin-right:16px}
.detail-meta{display:flex;gap:20px;color:var(--text-muted);font-size:.85rem;margin-bottom:16px}.detail-meta span{display:flex;align-items:center;gap:4px}
.detail-desc{color:var(--text-secondary);line-height:1.8;margin-bottom:16px}
.detail-tags{margin-top:12px}
</style>
