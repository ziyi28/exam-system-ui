<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()"><el-icon><Plus /></el-icon> 发布公告</el-button>
    </div>
    <div class="table-card glass-card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="{ SYSTEM: 'danger', FEATURE: 'success', NOTICE: 'warning' }[row.type]" size="small">
              {{ { SYSTEM: '系统', FEATURE: '新功能', NOTICE: '通知' }[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="['info', 'warning', 'danger'][row.priority]" size="small">
              {{ ['普通', '重要', '紧急'][row.priority] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.isActive" @change="handleToggle(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)"><el-icon><Edit /></el-icon> 编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)"><el-icon><Delete /></el-icon> 删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑公告' : '发布公告'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="内容" prop="content"><el-input v-model="form.content" type="textarea" :rows="4" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="类型"><el-select v-model="form.type"><el-option label="系统" value="SYSTEM" /><el-option label="新功能" value="FEATURE" /><el-option label="通知" value="NOTICE" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="优先级"><el-select v-model="form.priority"><el-option label="普通" :value="0" /><el-option label="重要" :value="1" /><el-option label="紧急" :value="2" /></el-select></el-form-item></el-col>
        </el-row>
        <el-form-item label="启用"><el-switch v-model="form.isActive" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAllNotices, addNotice, updateNotice, deleteNotice, toggleNoticeStatus } from '@/api/notice'
import { ElMessage, ElMessageBox } from 'element-plus'
const loading = ref(false); const submitting = ref(false); const tableData = ref([]); const dialogVisible = ref(false); const isEdit = ref(false); const formRef = ref()
const form = reactive({ id: null, title: '', content: '', type: 'NOTICE', priority: 0, isActive: true })
const rules = { title: [{ required: true, message: '请输入标题', trigger: 'blur' }], content: [{ required: true, message: '请输入内容', trigger: 'blur' }] }
async function loadData() { loading.value = true; try { const res = await getAllNotices(); tableData.value = res.data || [] } catch (e) {} loading.value = false }
function openDialog(row) { isEdit.value = !!row; if (row) Object.assign(form, row); else Object.assign(form, { id: null, title: '', content: '', type: 'NOTICE', priority: 0, isActive: true }); dialogVisible.value = true }
async function handleSubmit() { const v = await formRef.value?.validate().catch(() => false); if (!v) return; submitting.value = true; try { if (isEdit.value) { await updateNotice(form); ElMessage.success('更新成功') } else { await addNotice(form); ElMessage.success('发布成功') } dialogVisible.value = false; loadData() } catch (e) {} submitting.value = false }
async function handleToggle(row) { try { await toggleNoticeStatus(row.id, row.isActive); ElMessage.success('状态已更新') } catch (e) { row.isActive = !row.isActive } }
async function handleDelete(row) { await ElMessageBox.confirm('确定删除？', '确认', { type: 'warning' }); try { await deleteNotice(row.id); ElMessage.success('删除成功'); loadData() } catch (e) {} }
onMounted(() => loadData())
</script>
<style scoped>.page-container{padding:4px}.toolbar{margin-bottom:16px}.table-card{padding:0;overflow:hidden}</style>
