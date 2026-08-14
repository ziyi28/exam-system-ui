<template>
  <AppPageHeader title="公告管理" description="共 {{ notices.length }} 条公告，紧急公告会在学生端置顶提示">
    <template #actions>
      <el-button type="primary" :icon="Plus" @click="openDialog()">发布公告</el-button>
    </template>
  </AppPageHeader>

  <el-card shadow="never" class="data-card">

    <el-table v-loading="loading" :data="notices" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="content" label="内容" min-width="240" show-overflow-tooltip />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="noticeTypeTag(row.type)" effect="plain">{{ noticeTypeText(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="优先级" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="(['info', 'warning', 'danger'][row.priority] ?? 'info') as any">
            {{ ['普通', '重要', '紧急'][row.priority] ?? '普通' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-switch :model-value="row.isActive" @change="handleToggle(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="发布时间" width="160" />
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑公告' : '发布公告'" width="560px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="公告标题" />
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input v-model="form.content" type="textarea" :rows="5" placeholder="公告内容" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="form.type" style="width: 160px">
          <el-option label="系统" value="SYSTEM" />
          <el-option label="新功能" value="FEATURE" />
          <el-option label="通知" value="NOTICE" />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级">
        <el-radio-group v-model="form.priority">
          <el-radio-button :value="0">普通</el-radio-button>
          <el-radio-button :value="1">重要</el-radio-button>
          <el-radio-button :value="2">紧急</el-radio-button>
        </el-radio-group>
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
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { listNotices, addNotice, updateNotice, deleteNotice, toggleNotice } from '@/api/notice'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import type { Notice, NoticeType } from '@/types'

const loading = ref(false)
const notices = ref<Notice[]>([])

function noticeTypeText(type?: string) {
  return { SYSTEM: '系统', FEATURE: '新功能', NOTICE: '通知' }[type ?? ''] ?? type
}

function noticeTypeTag(type?: string): 'primary' | 'success' | 'warning' {
  return ({ SYSTEM: 'primary', FEATURE: 'success', NOTICE: 'warning' }[type ?? ''] ?? 'primary') as never
}

async function loadData() {
  loading.value = true
  try {
    notices.value = await listNotices()
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<Notice>({ title: '', content: '', type: 'NOTICE' as NoticeType, priority: 0, isActive: true })

const rules: FormRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }],
}

function openDialog(row?: Notice) {
  form.id = row?.id
  form.title = row?.title ?? ''
  form.content = row?.content ?? ''
  form.type = row?.type ?? ('NOTICE' as NoticeType)
  form.priority = row?.priority ?? 0
  form.isActive = row?.isActive ?? true
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value?.validate()
  saving.value = true
  try {
    if (form.id) {
      await updateNotice({ ...form })
      ElMessage.success('公告更新成功')
    } else {
      await addNotice({ ...form })
      ElMessage.success('公告发布成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleToggle(row: Notice) {
  await toggleNotice(row.id!, !row.isActive)
  ElMessage.success(row.isActive ? '已禁用' : '已启用')
  loadData()
}

async function handleDelete(row: Notice) {
  await ElMessageBox.confirm(`确定删除公告「${row.title}」吗？`, '删除确认', { type: 'warning' })
  await deleteNotice(row.id!)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>
