<template>
  <div>
    <div class="page-title">
      <h2>视频学习</h2>
      <div class="filters">
        <el-select v-model="query.categoryId" placeholder="全部分类" clearable style="width: 160px" @change="handleSearch">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id!" />
        </el-select>
        <el-input v-model="query.keyword" placeholder="搜索视频" clearable style="width: 200px" :prefix-icon="Search" @keyup.enter="handleSearch" @clear="handleSearch" />
        <el-button type="primary" plain :icon="Upload" @click="submitVisible = true">我要投稿</el-button>
      </div>
    </div>

    <el-empty v-if="!loading && !videos.length" description="暂无视频" />

    <el-row v-loading="loading" :gutter="16">
      <el-col v-for="video in videos" :key="video.id" :xs="12" :sm="8" :md="6">
        <div class="video-card" @click="router.push(`/student/videos/${video.id}`)">
          <div class="video-cover">
            <img v-if="video.coverUrl" :src="video.coverUrl" :alt="video.title" />
            <div v-else class="cover-placeholder"><el-icon :size="32"><VideoCamera /></el-icon></div>
            <span v-if="video.durationText || video.duration" class="duration">
              {{ video.durationText ?? formatDuration(video.duration) }}
            </span>
          </div>
          <div class="video-title">{{ video.title }}</div>
          <div class="video-meta">
            <span>{{ video.categoryName ?? '未分类' }}</span>
            <span>{{ video.viewCount ?? 0 }} 观看 · {{ video.likeCount ?? 0 }} 赞</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :total="total"
        layout="total, prev, pager, next"
        @change="loadData"
      />
    </div>

    <!-- 投稿对话框 -->
    <el-dialog v-model="submitVisible" title="视频投稿（需管理员审核）" width="540px" destroy-on-close>
      <el-form :model="submitForm" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="submitForm.title" placeholder="视频标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="submitForm.description" type="textarea" :rows="2" placeholder="视频描述（可选）" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="submitForm.categoryId" placeholder="选择分类" style="width: 200px">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id!" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="submitForm.tags" placeholder="多个标签用逗号分隔（可选）" />
        </el-form-item>
        <el-form-item label="视频文件" required>
          <el-upload :auto-upload="false" :limit="1" accept="video/*" :on-change="(f: UploadFile) => (videoFile = f.raw ?? null)">
            <el-button :icon="VideoCamera">选择视频文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="封面图片">
          <el-upload :auto-upload="false" :limit="1" accept="image/*" :on-change="(f: UploadFile) => (coverFile = f.raw ?? null)">
            <el-button :icon="Picture">选择封面（可选）</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmitVideo">提交投稿</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type UploadFile } from 'element-plus'
import { Search, Upload, VideoCamera, Picture } from '@element-plus/icons-vue'
import { pageVideos, submitVideo } from '@/api/video'
import { listVideoCategories } from '@/api/videoCategory'
import type { Video, VideoCategory } from '@/types'
import { formatDuration } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const videos = ref<Video[]>([])
const total = ref(0)
const categories = ref<VideoCategory[]>([])
const query = reactive({ page: 1, size: 12, categoryId: undefined as number | undefined, keyword: '' })

async function loadData() {
  loading.value = true
  try {
    const data = await pageVideos({ ...query, keyword: query.keyword || undefined })
    videos.value = data.records
    total.value = Number(data.total)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

// ---- 投稿 ----
const submitVisible = ref(false)
const submitting = ref(false)
const videoFile = ref<File | null>(null)
const coverFile = ref<File | null>(null)
const submitForm = reactive({ title: '', description: '', categoryId: undefined as number | undefined, tags: '' })

async function handleSubmitVideo() {
  if (!submitForm.title.trim() || !submitForm.categoryId || !videoFile.value) {
    ElMessage.warning('请填写标题、选择分类并选择视频文件')
    return
  }
  submitting.value = true
  try {
    await submitVideo({
      title: submitForm.title,
      description: submitForm.description,
      categoryId: submitForm.categoryId,
      tags: submitForm.tags,
      duration: 0,
      videoFile: videoFile.value,
      coverFile: coverFile.value ?? undefined,
    })
    ElMessage.success('投稿成功，请等待管理员审核')
    submitVisible.value = false
    videoFile.value = null
    coverFile.value = null
    Object.assign(submitForm, { title: '', description: '', categoryId: undefined, tags: '' })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loadData()
  categories.value = await listVideoCategories().catch(() => [])
})
</script>

<style scoped>
.page-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title h2 {
  margin: 0;
}

.filters {
  display: flex;
  gap: 12px;
}

.video-card {
  cursor: pointer;
  margin-bottom: 16px;
}

.video-cover {
  position: relative;
  height: 130px;
  border-radius: 10px;
  overflow: hidden;
  background: #f0f2f5;
}

.video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.video-card:hover .video-cover img {
  transform: scale(1.05);
}

.cover-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.duration {
  position: absolute;
  right: 6px;
  bottom: 6px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
  padding: 1px 6px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}
</style>
