<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" @click="openDialog(null)"><el-icon><Plus /></el-icon> 新增分类</el-button>
    </div>

    <div class="table-card glass-card">
      <el-table :data="treeData" v-loading="loading" row-key="id" default-expand-all :tree-props="{ children: 'children' }">
        <el-table-column prop="name" label="分类名称" min-width="240" />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="count" label="题目数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.count || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDialog(null, row.id)">
              <el-icon><Plus /></el-icon> 子分类
            </el-button>
            <el-button type="primary" link size="small" @click="openDialog(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新增分类'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="父分类">
          <el-select v-model="form.parentId" placeholder="顶级分类" clearable>
            <el-option label="顶级分类" :value="0" />
            <el-option v-for="c in flatCategories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { getCategoryTree, getCategories, addCategory, updateCategory, deleteCategory } from '@/api/category'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const submitting = ref(false)
const treeData = ref([])
const allCategories = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const form = reactive({ id: null, name: '', parentId: 0, sort: 0 })
const rules = { name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] }

const flatCategories = computed(() => allCategories.value.filter(c => !c.parentId || c.parentId === 0))

async function loadData() {
  loading.value = true
  try {
    const res = await getCategoryTree()
    treeData.value = res.data || []
    const res2 = await getCategories()
    allCategories.value = res2.data || []
  } catch (e) { /* ignore */ }
  loading.value = false
}

function openDialog(row, parentId) {
  isEdit.value = !!row
  if (row) {
    Object.assign(form, { id: row.id, name: row.name, parentId: row.parentId || 0, sort: row.sort || 0 })
  } else {
    Object.assign(form, { id: null, name: '', parentId: parentId || 0, sort: 0 })
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateCategory(form)
      ElMessage.success('更新成功')
    } else {
      await addCategory(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) { /* ignore */ }
  submitting.value = false
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除分类 "${row.name}" 吗？`, '确认删除', { type: 'warning' })
  try {
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) { /* ignore */ }
}

onMounted(() => loadData())
</script>

<style scoped>
.page-container { padding: 4px; }
.toolbar { margin-bottom: 16px; }
.table-card { padding: 0; overflow: hidden; }
</style>
