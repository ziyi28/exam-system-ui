<template>
  <div class="page-container">
    <div class="search-bar glass-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="考生姓名"><el-input v-model="searchForm.studentName" placeholder="搜索" clearable prefix-icon="Search" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="进行中" :value="0" /><el-option label="已完成" :value="1" /><el-option label="已批阅" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="loadData"><el-icon><Search /></el-icon> 搜索</el-button></el-form-item>
      </el-form>
    </div>
    <div class="table-card glass-card">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="studentName" label="考生姓名" width="120" />
        <el-table-column label="试卷" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.paper?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="score" label="得分" width="80" align="center">
          <template #default="{ row }"><span :style="{ color: (row.score || 0) >= 60 ? '#10b981' : '#ef4444', fontWeight: 700 }">{{ row.score || '-' }}</span></template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }"><el-tag :type="row.status === '已批阅' ? 'success' : row.status === '已完成' ? 'warning' : 'info'" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="170" />
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)"><el-icon><View /></el-icon> 查看</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)"><el-icon><Delete /></el-icon></el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size" :total="pagination.total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" @size-change="loadData" @current-change="loadData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getExamRecords, deleteExamRecord } from '@/api/examRecord'
import { ElMessage, ElMessageBox } from 'element-plus'
const router = useRouter(); const loading = ref(false); const tableData = ref([])
const searchForm = reactive({ studentName: '', status: null })
const pagination = reactive({ page: 1, size: 20, total: 0 })
async function loadData() { loading.value = true; try { const res = await getExamRecords({ ...searchForm, page: pagination.page, size: pagination.size }); tableData.value = res.data?.records || []; pagination.total = Number(res.data?.total || 0) } catch (e) {} loading.value = false }
function viewDetail(row) { router.push(`/exam-result/${row.id}`) }
async function handleDelete(row) { await ElMessageBox.confirm('确定删除？', '确认', { type: 'warning' }); try { await deleteExamRecord(row.id); ElMessage.success('删除成功'); loadData() } catch (e) {} }
onMounted(() => loadData())
</script>
<style scoped>.page-container{padding:4px}.search-bar{padding:20px 20px 4px;margin-bottom:16px}.table-card{padding:0;overflow:hidden}.pagination-wrap{padding:16px 20px;display:flex;justify-content:flex-end}</style>
