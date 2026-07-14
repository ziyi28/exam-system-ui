<template>
  <div class="page-header">
    <div>
      <h2 class="page-header__title">视频分类</h2>
      <p class="page-header__desc">维护视频学习板块的分类结构</p>
    </div>
    <div class="page-header__actions">
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增分类</el-button>
    </div>
  </div>

  <el-card shadow="never">

    <el-table v-loading="loading" :data="tree" row-key="id" default-expand-all>
      <el-table-column prop="name" label="分类名称" min-width="200" />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="videoCount" label="视频数量" width="100">
        <template #default="{ row }">
          <el-tag size="small" type="info" effect="plain">{{ row.videoCount ?? 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="90" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === 1 ? 'success' : 'danger'" effect="plain">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(undefined, row.id)">添加子分类</el-button>
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑分类' : '新增分类'" width="460px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="分类名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="分类描述（可选）" />
      </el-form-item>
      <el-form-item label="父分类">
        <el-tree-select
          v-model="form.parentId"
          :data="parentOptions"
          :props="{ label: 'name', value: 'id', children: 'children' }"
          check-strictly
          clearable
          placeholder="不选则为顶级分类"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="form.sortOrder" :min="0" />
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio-button :value="1">启用</el-radio-button>
          <el-radio-button :value="0">禁用</el-radio-button>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getVideoCategoryTree, addVideoCategory, updateVideoCategory, deleteVideoCategory } from '@/api/videoCategory'
import type { VideoCategory } from '@/types'

const loading = ref(false)
const tree = ref<VideoCategory[]>([])

const parentOptions = computed(() => {
  const exclude = (nodes: VideoCategory[]): VideoCategory[] =>
    nodes
      .filter((n) => n.id !== form.id)
      .map((n) => ({ ...n, children: n.children ? exclude(n.children) : undefined }))
  return exclude(tree.value)
})

async function loadData() {
  loading.value = true
  try {
    tree.value = await getVideoCategoryTree()
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<VideoCategory>({ name: '', description: '', parentId: undefined, sortOrder: 0, status: 1 })

const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

function openDialog(row?: VideoCategory, parentId?: number) {
  form.id = row?.id
  form.name = row?.name ?? ''
  form.description = row?.description ?? ''
  form.parentId = row?.parentId && row.parentId !== 0 ? row.parentId : parentId
  form.sortOrder = row?.sortOrder ?? 0
  form.status = row?.status ?? 1
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value?.validate()
  saving.value = true
  try {
    const payload: VideoCategory = { ...form, parentId: form.parentId ?? 0 }
    if (form.id) {
      await updateVideoCategory(payload)
      ElMessage.success('分类更新成功')
    } else {
      await addVideoCategory(payload)
      ElMessage.success('分类创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: VideoCategory) {
  await ElMessageBox.confirm(`确定删除分类「${row.name}」吗？分类下有视频时无法删除。`, '删除确认', { type: 'warning' })
  await deleteVideoCategory(row.id!)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>
