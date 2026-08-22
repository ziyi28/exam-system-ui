<template>
  <AppPageHeader title="视频管理" description="上传课程视频，审核用户投稿">
    <template #actions>
      <el-button type="primary" :icon="Upload" @click="uploadVisible = true">上传视频</el-button>
    </template>
  </AppPageHeader>

  <el-card shadow="never" class="data-card">
    <div class="filter-bar">
      <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 130px">
        <el-option label="待审核" :value="0" />
        <el-option label="已发布" :value="1" />
        <el-option label="已拒绝" :value="2" />
        <el-option label="已下架" :value="3" />
      </el-select>
      <el-select v-model="query.uploaderType" placeholder="全部来源" clearable style="width: 130px">
        <el-option label="管理员上传" :value="1" />
        <el-option label="用户投稿" :value="2" />
      </el-select>
      <el-input v-model="query.keyword" placeholder="标题关键词" clearable style="width: 180px" @keyup.enter="handleSearch" />
      <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="records" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="封面" width="120">
        <template #default="{ row }">
          <el-image v-if="row.coverUrl" :src="row.coverUrl" fit="cover" class="video-cover-img" />
          <span v-else class="no-cover">无封面</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="categoryName" label="分类" width="110" show-overflow-tooltip />
      <el-table-column prop="uploaderName" label="上传者" width="110" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="videoStatusTag(row.status)" size="small">{{ videoStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="viewCount" label="播放" width="80" />
      <el-table-column prop="likeCount" label="点赞" width="80" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button link type="success" @click="handleAudit(row, 1)">通过</el-button>
            <el-button link type="warning" @click="handleAudit(row, 2)">拒绝</el-button>
          </template>
          <el-button v-if="row.status === 1" link type="warning" @click="handleOffline(row)">下架</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="loadData"
      />
    </div>
  </el-card>

  <!-- 上传视频对话框 -->
  <el-dialog
    v-model="uploadVisible"
    title="上传视频（直接发布）"
    width="540px"
    destroy-on-close
    :close-on-click-modal="!uploading"
    :close-on-press-escape="!uploading"
    :show-close="!uploading"
  >
    <el-form :model="uploadForm" label-width="90px">
      <el-form-item label="标题" required>
        <el-input v-model="uploadForm.title" placeholder="视频标题" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="uploadForm.description" type="textarea" :rows="2" placeholder="视频描述（可选）" />
      </el-form-item>
      <el-form-item label="分类" required>
        <el-select v-model="uploadForm.categoryId" placeholder="选择分类" style="width: 200px">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id!" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签">
        <el-input v-model="uploadForm.tags" placeholder="多个标签用逗号分隔（可选）" />
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
    <div v-if="uploading" class="upload-progress">
      <el-progress :percentage="uploadPercent" :stroke-width="16" text-inside />
      <p class="upload-tip">
        {{ uploadPercent >= 100 ? '已接收，服务器正在转存到云存储，请耐心等待，勿关闭页面…' : '正在上传到服务器…' }}
      </p>
    </div>
    <template #footer>
      <el-button :disabled="uploading" @click="uploadVisible = false">取消</el-button>
      <el-button type="primary" :loading="uploading" @click="handleUpload">上传并发布</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import { Search, Upload, VideoCamera, Picture } from '@element-plus/icons-vue'
import { pageVideosForAdmin, uploadVideo, auditVideo, offlineVideo, deleteVideo } from '@/api/videoAdmin'
import { listVideoCategories } from '@/api/videoCategory'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import { useUserStore } from '@/stores/user'
import type { Video, VideoCategory as VideoCategoryType } from '@/types'
import { videoStatusText, videoStatusTag } from '@/utils/format'

const userStore = useUserStore()
const loading = ref(false)
const records = ref<Video[]>([])
const total = ref(0)
const categories = ref<VideoCategoryType[]>([])
const query = reactive({
  page: 1,
  size: 10,
  status: undefined as number | undefined,
  uploaderType: undefined as number | undefined,
  keyword: '',
})

async function loadData() {
  loading.value = true
  try {
    const data = await pageVideosForAdmin({ ...query, keyword: query.keyword || undefined })
    records.value = data.records
    total.value = Number(data.total)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

async function handleAudit(row: Video, status: 1 | 2) {
  if (status === 2) {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝审核', { inputPlaceholder: '如：内容与分类不符' })
    await auditVideo(row.id!, 2, value || '不符合发布要求')
    ElMessage.success('已拒绝')
  } else {
    await ElMessageBox.confirm(`确定通过视频「${row.title}」的审核吗？`, '审核确认', { type: 'warning' })
    await auditVideo(row.id!, 1)
    ElMessage.success('审核通过，视频已发布')
  }
  loadData()
}

async function handleOffline(row: Video) {
  await ElMessageBox.confirm(`确定下架视频「${row.title}」吗？`, '下架确认', { type: 'warning' })
  await offlineVideo(row.id!)
  ElMessage.success('已下架')
  loadData()
}

async function handleDelete(row: Video) {
  await ElMessageBox.confirm(`确定删除视频「${row.title}」吗？将删除所有相关数据，不可恢复！`, '删除确认', { type: 'error' })
  await deleteVideo(row.id!)
  ElMessage.success('删除成功')
  loadData()
}

// ---- 上传 ----
const uploadVisible = ref(false)
const uploading = ref(false)
const uploadPercent = ref(0)
const videoFile = ref<File | null>(null)
const coverFile = ref<File | null>(null)
const uploadForm = reactive({ title: '', description: '', categoryId: undefined as number | undefined, tags: '' })

async function handleUpload() {
  if (!uploadForm.title.trim() || !uploadForm.categoryId || !videoFile.value) {
    ElMessage.warning('请填写标题、选择分类并选择视频文件')
    return
  }
  uploading.value = true
  uploadPercent.value = 0
  try {
    await uploadVideo(
      {
        title: uploadForm.title,
        description: uploadForm.description,
        categoryId: uploadForm.categoryId,
        tags: uploadForm.tags,
        uploaderName: userStore.userInfo?.realName || userStore.userInfo?.username || '管理员',
        videoFile: videoFile.value,
        coverFile: coverFile.value ?? undefined,
      },
      (p) => (uploadPercent.value = p),
    )
    ElMessage.success('视频上传成功')
    uploadVisible.value = false
    videoFile.value = null
    coverFile.value = null
    Object.assign(uploadForm, { title: '', description: '', categoryId: undefined, tags: '' })
    loadData()
  } finally {
    uploading.value = false
  }
}

onMounted(async () => {
  loadData()
  categories.value = await listVideoCategories()
})
</script>

<style scoped>
.video-cover-img {
  width: 96px;
  height: 54px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}

.no-cover {
  color: var(--text-muted);
  font-size: 11px;
}

.upload-progress {
  margin-top: 8px;
}

.upload-tip {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--text-muted);
}
</style>
