<template>
  <div class="page-header">
    <div>
      <h2 class="page-header__title">分类管理</h2>
      <p class="page-header__desc">共 {{ flatCount }} 个分类，支持多级嵌套</p>
    </div>
    <div class="page-header__actions">
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增分类</el-button>
    </div>
  </div>

  <el-card shadow="never" class="data-card">

    <el-table v-loading="loading" :data="tree" row-key="id" default-expand-all>
      <el-table-column prop="name" label="分类名称" min-width="220" />
      <el-table-column prop="count" label="题目数量" width="120">
        <template #default="{ row }">
          <el-tag size="small" type="info" effect="plain">{{ row.count ?? 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="100" />
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
        <el-input-number v-model="form.sort" :min="0" />
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
import { getCategoryTree, addCategory, updateCategory, deleteCategory } from '@/api/category'
import type { Category } from '@/types'

const loading = ref(false)
const tree = ref<Category[]>([])

const flatCount = computed(() => {
  let count = 0
  const walk = (nodes: Category[]) => {
    for (const node of nodes) {
      count++
      if (node.children?.length) walk(node.children)
    }
  }
  walk(tree.value)
  return count
})

/** 编辑时父分类选项需排除自身（避免选自己为父级） */
const parentOptions = computed(() => {
  const exclude = (nodes: Category[]): Category[] =>
    nodes
      .filter((n) => n.id !== form.id)
      .map((n) => ({ ...n, children: n.children ? exclude(n.children) : undefined }))
  return exclude(tree.value)
})

async function loadData() {
  loading.value = true
  try {
    tree.value = await getCategoryTree()
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<Category>({ name: '', parentId: undefined, sort: 0 })

const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

function openDialog(row?: Category, parentId?: number) {
  form.id = row?.id
  form.name = row?.name ?? ''
  form.parentId = row?.parentId && row.parentId !== 0 ? row.parentId : parentId
  form.sort = row?.sort ?? 0
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value?.validate()
  saving.value = true
  try {
    const payload: Category = { id: form.id, name: form.name, parentId: form.parentId ?? 0, sort: form.sort }
    if (form.id) {
      await updateCategory(payload)
      ElMessage.success('分类更新成功')
    } else {
      await addCategory(payload)
      ElMessage.success('分类创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: Category) {
  await ElMessageBox.confirm(`确定删除分类「${row.name}」吗？分类下有题目或子分类时无法删除。`, '删除确认', { type: 'warning' })
  await deleteCategory(row.id!)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>
