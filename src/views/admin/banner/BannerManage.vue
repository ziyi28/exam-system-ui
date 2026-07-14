<template>
  <div class="page-header">
    <div>
      <h2 class="page-header__title">轮播图管理</h2>
      <p class="page-header__desc">共 {{ banners.length }} 张轮播图，展示在学生端首页顶部</p>
    </div>
    <div class="page-header__actions">
      <el-button type="primary" :icon="Plus" @click="openDialog()">添加轮播图</el-button>
    </div>
  </div>

  <el-card shadow="never">

    <el-table v-loading="loading" :data="banners" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="预览" width="150">
        <template #default="{ row }">
          <el-image :src="row.imageUrl" fit="cover" style="width: 120px; height: 60px; border-radius: 6px" :preview-src-list="[row.imageUrl]" preview-teleported />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
      <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
      <el-table-column prop="linkUrl" label="跳转链接" min-width="150" show-overflow-tooltip />
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-switch :model-value="row.isActive" @change="handleToggle(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑轮播图' : '添加轮播图'" width="560px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="图片" prop="imageUrl">
        <el-upload
          :show-file-list="false"
          :auto-upload="false"
          accept="image/*"
          :on-change="handleImageChange"
        >
          <el-image v-if="form.imageUrl" :src="form.imageUrl" fit="cover" class="upload-preview" />
          <div v-else class="upload-placeholder" v-loading="uploading">
            <el-icon :size="28"><Plus /></el-icon>
            <span>上传图片</span>
          </div>
        </el-upload>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="轮播图标题" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="轮播图描述（可选）" />
      </el-form-item>
      <el-form-item label="跳转链接">
        <el-input v-model="form.linkUrl" placeholder="点击跳转地址（可选）" />
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="form.sortOrder" :min="0" />
      </el-form-item>
      <el-form-item label="启用">
        <el-switch v-model="form.isActive" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { listBanners, uploadBannerImage, addBanner, updateBanner, deleteBanner, toggleBanner } from '@/api/banner'
import type { Banner } from '@/types'

const loading = ref(false)
const banners = ref<Banner[]>([])

async function loadData() {
  loading.value = true
  try {
    banners.value = await listBanners()
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const saving = ref(false)
const uploading = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<Banner>({ title: '', description: '', imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true })

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  imageUrl: [{ required: true, message: '请上传图片', trigger: 'change' }],
}

function openDialog(row?: Banner) {
  form.id = row?.id
  form.title = row?.title ?? ''
  form.description = row?.description ?? ''
  form.imageUrl = row?.imageUrl ?? ''
  form.linkUrl = row?.linkUrl ?? ''
  form.sortOrder = row?.sortOrder ?? 0
  form.isActive = row?.isActive ?? true
  dialogVisible.value = true
}

async function handleImageChange(file: UploadFile) {
  if (!file.raw) return
  uploading.value = true
  try {
    form.imageUrl = await uploadBannerImage(file.raw)
    ElMessage.success('图片上传成功')
  } finally {
    uploading.value = false
  }
}

async function handleSave() {
  await formRef.value?.validate()
  saving.value = true
  try {
    if (form.id) {
      await updateBanner({ ...form })
      ElMessage.success('轮播图更新成功')
    } else {
      await addBanner({ ...form })
      ElMessage.success('轮播图添加成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleToggle(row: Banner) {
  await toggleBanner(row.id!, !row.isActive)
  ElMessage.success(row.isActive ? '已禁用' : '已启用')
  loadData()
}

async function handleDelete(row: Banner) {
  await ElMessageBox.confirm(`确定删除轮播图「${row.title}」吗？`, '删除确认', { type: 'warning' })
  await deleteBanner(row.id!)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.upload-preview {
  width: 240px;
  height: 120px;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.upload-placeholder {
  width: 240px;
  height: 120px;
  border: 1px dashed var(--gray-300);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--gray-500);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out-expo),
    color var(--duration-fast) var(--ease-out-expo);
}

.upload-placeholder:hover {
  border-color: var(--brand-600);
  color: var(--brand-600);
}
</style>
