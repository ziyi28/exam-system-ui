<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()"><el-icon><Plus /></el-icon> 添加轮播图</el-button>
    </div>
    <div class="table-card glass-card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="imageUrl" label="图片" width="120">
          <template #default="{ row }">
            <el-image :src="row.imageUrl" style="width:80px;height:45px;border-radius:6px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column prop="isActive" label="状态" width="80" align="center">
          <template #default="{ row }"><el-switch v-model="row.isActive" @change="handleToggle(row)" /></template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(row)"><el-icon><Edit /></el-icon> 编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)"><el-icon><Delete /></el-icon> 删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑轮播图' : '添加轮播图'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="图片" prop="imageUrl">
          <el-upload action="#" :auto-upload="false" :on-change="handleUpload" :show-file-list="false" accept="image/*">
            <el-button size="small"><el-icon><Upload /></el-icon> 上传图片</el-button>
          </el-upload>
          <el-image v-if="form.imageUrl" :src="form.imageUrl" style="max-width:200px;margin-top:8px;border-radius:8px" />
        </el-form-item>
        <el-form-item label="链接"><el-input v-model="form.linkUrl" placeholder="跳转链接(可选)" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="启用"><el-switch v-model="form.isActive" /></el-form-item></el-col>
        </el-row>
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
import { getAllBanners, addBanner, updateBanner, deleteBanner, toggleBannerStatus, uploadBannerImage } from '@/api/banner'
import { ElMessage, ElMessageBox } from 'element-plus'
const loading = ref(false); const submitting = ref(false); const tableData = ref([]); const dialogVisible = ref(false); const isEdit = ref(false); const formRef = ref()
const form = reactive({ id: null, title: '', description: '', imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true })
const rules = { title: [{ required: true, message: '请输入标题', trigger: 'blur' }] }
async function loadData() { loading.value = true; try { const res = await getAllBanners(); tableData.value = res.data || [] } catch (e) {} loading.value = false }
function openDialog(row) { isEdit.value = !!row; if (row) Object.assign(form, row); else Object.assign(form, { id: null, title: '', description: '', imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true }); dialogVisible.value = true }
async function handleUpload(file) { const fd = new FormData(); fd.append('file', file.raw); try { const res = await uploadBannerImage(fd); form.imageUrl = res.data; ElMessage.success('上传成功') } catch (e) {} }
async function handleSubmit() { const v = await formRef.value?.validate().catch(() => false); if (!v) return; submitting.value = true; try { if (isEdit.value) { await updateBanner(form); ElMessage.success('更新成功') } else { await addBanner(form); ElMessage.success('添加成功') } dialogVisible.value = false; loadData() } catch (e) {} submitting.value = false }
async function handleToggle(row) { try { await toggleBannerStatus(row.id, row.isActive); ElMessage.success('状态已更新') } catch (e) { row.isActive = !row.isActive } }
async function handleDelete(row) { await ElMessageBox.confirm('确定删除？', '确认', { type: 'warning' }); try { await deleteBanner(row.id); ElMessage.success('删除成功'); loadData() } catch (e) {} }
onMounted(() => loadData())
</script>
<style scoped>.page-container{padding:4px}.toolbar{margin-bottom:16px}.table-card{padding:0;overflow:hidden}</style>
