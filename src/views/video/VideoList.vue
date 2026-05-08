<template>
  <div class="page-container">
    <div class="page-header"><h2 class="gradient-text">视频学习</h2></div>
    <div class="search-bar glass-card">
      <el-input v-model="keyword" placeholder="搜索视频" prefix-icon="Search" clearable style="width:300px" @keyup.enter="loadData" />
      <el-select v-model="categoryId" placeholder="全部分类" clearable @change="loadData" style="width:160px;margin-left:12px">
        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
    </div>
    <div class="video-grid" v-loading="loading">
      <div v-for="v in videos" :key="v.id" class="video-card glass-card" @click="$router.push($route.path.startsWith('/guest') ? `/guest/video/${v.id}` : `/video/${v.id}`)">
        <div class="video-cover"><img :src="v.coverUrl || 'https://via.placeholder.com/320x180?text=Video'" :alt="v.title" /><span class="duration-badge">{{ v.durationText || formatDuration(v.duration) }}</span></div>
        <div class="video-info"><h4>{{ v.title }}</h4><div class="video-meta"><span><el-icon><View /></el-icon> {{ v.viewCount || 0 }}</span><span><el-icon><Star /></el-icon> {{ v.likeCount || 0 }}</span></div></div>
      </div>
      <div v-if="!loading && videos.length === 0" class="empty-state glass-card"><el-icon :size="48"><VideoPlay /></el-icon><p>暂无视频</p></div>
    </div>
    <div class="pagination-wrap" v-if="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="size" :total="total" layout="prev, pager, next" @current-change="loadData" /></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getVideos } from '@/api/video'
import { getVideoCategories } from '@/api/videoCategory'
const loading = ref(false); const videos = ref([]); const categories = ref([])
const keyword = ref(''); const categoryId = ref(null); const page = ref(1); const size = ref(12); const total = ref(0)
function formatDuration(s) { if (!s) return ''; const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${String(sec).padStart(2, '0')}` }
async function loadData() { loading.value = true; try { const res = await getVideos({ page: page.value, size: size.value, categoryId: categoryId.value, keyword: keyword.value }); videos.value = res.data?.records || []; total.value = Number(res.data?.total || 0) } catch (e) {} loading.value = false }
async function loadCategories() { try { const res = await getVideoCategories(); categories.value = res.data || [] } catch (e) {} }
onMounted(() => { loadData(); loadCategories() })
</script>

<style scoped>
.page-container{padding:4px}.page-header{margin-bottom:20px}.page-header h2{font-size:1.4rem}
.search-bar{padding:16px 20px;margin-bottom:20px;display:flex;align-items:center}
.video-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
.video-card{padding:0;overflow:hidden;cursor:pointer;transition:all var(--transition-base)}.video-card:hover{transform:translateY(-6px);box-shadow:0 0 30px rgba(99,102,241,.15)}
.video-cover{position:relative;aspect-ratio:16/9;overflow:hidden}.video-cover img{width:100%;height:100%;object-fit:cover;transition:transform .3s}.video-card:hover .video-cover img{transform:scale(1.05)}
.duration-badge{position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.7);color:#fff;padding:2px 8px;border-radius:4px;font-size:.75rem}
.video-info{padding:14px}.video-info h4{font-size:.95rem;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.video-meta{display:flex;gap:16px;font-size:.8rem;color:var(--text-muted)}.video-meta span{display:flex;align-items:center;gap:4px}
.empty-state{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:12px;padding:60px;color:var(--text-muted)}
.pagination-wrap{margin-top:24px;display:flex;justify-content:center}
</style>
