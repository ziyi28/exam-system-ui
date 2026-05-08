<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" @click="$router.push('/admin/videos')"><el-icon><Upload /></el-icon> 上传视频</el-button>
    </div>
    <div class="search-bar glass-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item><el-input v-model="searchForm.keyword" placeholder="搜索视频" clearable prefix-icon="Search" /></el-form-item>
        <el-form-item><el-select v-model="searchForm.status" placeholder="全部状态" clearable><el-option label="待审核" :value="0" /><el-option label="已发布" :value="1" /><el-option label="已拒绝" :value="2" /><el-option label="已下架" :value="3" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="loadData"><el-icon><Search /></el-icon> 搜索</el-button></el-form-item>
      </el-form>
    </div>
    <div class="table-card glass-card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="uploaderName" label="上传者" width="100" />
        <el-table-column prop="statusText" label="状态" width="90" align="center">
          <template #default="{ row }"><el-tag :type="['warning','success','danger','info'][row.status]" size="small">{{ ['待审核','已发布','已拒绝','已下架'][row.status] }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="viewCount" label="观看" width="80" align="center" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status===0" type="success" link size="small" @click="handleAudit(row, 1)">通过</el-button>
            <el-button v-if="row.status===0" type="danger" link size="small" @click="handleAudit(row, 2)">拒绝</el-button>
            <el-button v-if="row.status===1" type="warning" link size="small" @click="handleOffline(row)">下架</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)"><el-icon><Delete /></el-icon></el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="page" :total="total" layout="prev,pager,next" @current-change="loadData" /></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getVideosForAdmin, auditVideo, offlineVideo, deleteVideo } from '@/api/videoAdmin'
import { ElMessage, ElMessageBox } from 'element-plus'
const loading = ref(false); const tableData = ref([]); const page = ref(1); const total = ref(0)
const searchForm = reactive({ keyword: '', status: null })
async function loadData() { loading.value = true; try { const res = await getVideosForAdmin({ page: page.value, size: 20, ...searchForm }); tableData.value = res.data?.records || []; total.value = Number(res.data?.total || 0) } catch (e) {} loading.value = false }
async function handleAudit(row, status) { const reason = status === 2 ? await ElMessageBox.prompt('请输入拒绝原因', '审核', { inputPlaceholder: '原因' }).then(r => r.value).catch(() => null) : null; if (status === 2 && reason === null) return; try { await auditVideo(row.id, status, reason); ElMessage.success('操作成功'); loadData() } catch (e) {} }
async function handleOffline(row) { await ElMessageBox.confirm('确定下架？', '确认', { type: 'warning' }); try { await offlineVideo(row.id); ElMessage.success('已下架'); loadData() } catch (e) {} }
async function handleDelete(row) { await ElMessageBox.confirm('确定删除？', '确认', { type: 'warning' }); try { await deleteVideo(row.id); ElMessage.success('已删除'); loadData() } catch (e) {} }
onMounted(() => loadData())
</script>
<style scoped>.page-container{padding:4px}.toolbar{margin-bottom:16px}.search-bar{padding:20px 20px 4px;margin-bottom:16px}.table-card{padding:0;overflow:hidden}.pagination-wrap{padding:16px 20px;display:flex;justify-content:flex-end}</style>
