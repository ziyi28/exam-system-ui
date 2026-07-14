<template>
  <div class="page-header">
    <div>
      <h2 class="page-header__title">用户管理</h2>
      <p class="page-header__desc">管理账号、角色与启用状态</p>
    </div>
    <div class="page-header__actions">
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增用户</el-button>
    </div>
  </div>

  <el-card shadow="never">
    <div class="filter-bar">
      <el-input v-model="query.username" placeholder="用户名" clearable style="width: 150px" @keyup.enter="handleSearch" />
      <el-input v-model="query.realName" placeholder="真实姓名" clearable style="width: 150px" @keyup.enter="handleSearch" />
      <el-select v-model="query.role" placeholder="全部角色" clearable style="width: 130px">
        <el-option label="管理员" value="ADMIN" />
        <el-option label="教师" value="TEACHER" />
        <el-option label="学生" value="STUDENT" />
      </el-select>
      <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 130px">
        <el-option label="正常" value="ACTIVE" />
        <el-option label="禁用" value="INACTIVE" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
    </div>

    <el-table v-loading="loading" :data="records" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="用户名" min-width="130" />
      <el-table-column prop="realName" label="真实姓名" min-width="110" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="roleTag(row.role)">{{ roleText(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.status === 'ACTIVE' ? 'success' : 'danger'" effect="plain">
            {{ row.status === 'ACTIVE' ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link :type="row.status === 'ACTIVE' ? 'warning' : 'success'" :disabled="isSelf(row)" @click="handleToggle(row)">
            {{ row.status === 'ACTIVE' ? '禁用' : '启用' }}
          </el-button>
          <el-button link type="warning" @click="handleResetPassword(row)">重置密码</el-button>
          <el-button link type="danger" :disabled="isSelf(row)" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="query.current"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @change="loadData"
      />
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="form.id ? '编辑用户' : '新增用户'" width="480px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" :disabled="!!form.id" placeholder="登录用户名" />
      </el-form-item>
      <el-form-item label="真实姓名" prop="realName">
        <el-input v-model="form.realName" placeholder="真实姓名" />
      </el-form-item>
      <el-form-item v-if="!form.id" label="密码">
        <el-input v-model="form.password" type="password" show-password placeholder="留空则默认为 123456" />
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="form.role" style="width: 160px">
          <el-option label="管理员" value="ADMIN" />
          <el-option label="教师" value="TEACHER" />
          <el-option label="学生" value="STUDENT" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio-button value="ACTIVE">正常</el-radio-button>
          <el-radio-button value="INACTIVE">禁用</el-radio-button>
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { pageUsers, addUser, updateUser, deleteUser, toggleUserStatus, resetUserPassword } from '@/api/user'
import { useUserStore } from '@/stores/user'
import type { Role, User, UserStatus } from '@/types'

const userStore = useUserStore()
const loading = ref(false)
const records = ref<User[]>([])
const total = ref(0)
const query = reactive({
  current: 1,
  size: 10,
  username: '',
  realName: '',
  role: undefined as string | undefined,
  status: undefined as string | undefined,
})

function roleText(role: Role) {
  return { ADMIN: '管理员', TEACHER: '教师', STUDENT: '学生' }[role] ?? role
}

function roleTag(role: Role): 'danger' | 'warning' | 'success' {
  return ({ ADMIN: 'danger', TEACHER: 'warning', STUDENT: 'success' }[role] ?? 'success') as never
}

function isSelf(row: User) {
  return row.id === userStore.userInfo?.userId
}

async function loadData() {
  loading.value = true
  try {
    const data = await pageUsers({
      ...query,
      username: query.username || undefined,
      realName: query.realName || undefined,
    })
    records.value = data.records
    total.value = Number(data.total)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.current = 1
  loadData()
}

function handleReset() {
  query.username = ''
  query.realName = ''
  query.role = undefined
  query.status = undefined
  handleSearch()
}

// ---- 编辑 ----
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<Partial<User>>({ username: '', realName: '', password: '', role: 'STUDENT' as Role, status: 'ACTIVE' as UserStatus })

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度需在3-50个字符之间', trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

function openDialog(row?: User) {
  form.id = row?.id
  form.username = row?.username ?? ''
  form.realName = row?.realName ?? ''
  form.password = ''
  form.role = row?.role ?? ('STUDENT' as Role)
  form.status = row?.status ?? ('ACTIVE' as UserStatus)
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value?.validate()
  saving.value = true
  try {
    if (form.id) {
      await updateUser(form.id, { realName: form.realName, role: form.role, status: form.status })
      ElMessage.success('用户更新成功')
    } else {
      await addUser({ ...form, password: form.password || undefined })
      ElMessage.success('用户创建成功，默认密码 123456')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleToggle(row: User) {
  const action = row.status === 'ACTIVE' ? '禁用' : '启用'
  await ElMessageBox.confirm(`确定${action}用户「${row.username}」吗？${row.status === 'ACTIVE' ? '禁用后将强制其下线。' : ''}`, `${action}确认`, { type: 'warning' })
  await toggleUserStatus(row.id)
  ElMessage.success(`${action}成功`)
  loadData()
}

async function handleResetPassword(row: User) {
  await ElMessageBox.confirm(`确定将用户「${row.username}」的密码重置为 123456 吗？`, '重置确认', { type: 'warning' })
  await resetUserPassword(row.id)
  ElMessage.success('密码已重置为 123456')
}

async function handleDelete(row: User) {
  await ElMessageBox.confirm(`确定删除用户「${row.username}」吗？`, '删除确认', { type: 'warning' })
  await deleteUser(row.id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>
