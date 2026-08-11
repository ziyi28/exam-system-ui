<template>
  <div class="profile-page">
    <div class="page-header">
      <div>
        <h2 class="page-header__title">个人中心</h2>
        <p class="page-header__desc">查看账号资料并维护登录密码。</p>
      </div>
    </div>
    <el-row :gutter="16">
      <!-- 基本信息 -->
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="workspace-card">
          <template #header>基本信息</template>
          <div class="user-brief">
            <el-avatar :size="64" class="avatar">{{ avatarText }}</el-avatar>
            <div class="brief-text">
              <div class="name">{{ userStore.userInfo?.realName }}</div>
              <el-tag size="small" :type="roleTagType" effect="plain">{{ roleText }}</el-tag>
            </div>
          </div>
          <el-descriptions :column="1" border class="desc">
            <el-descriptions-item label="用户名">{{ userStore.userInfo?.username }}</el-descriptions-item>
            <el-descriptions-item label="真实姓名">{{ userStore.userInfo?.realName }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ roleText }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 修改密码 -->
      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="workspace-card">
          <template #header>修改密码</template>
          <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" style="max-width: 420px">
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input v-model="form.oldPassword" type="password" show-password placeholder="请输入旧密码" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="form.newPassword" type="password" show-password placeholder="6-32个字符" />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="form.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="handleSubmit">确认修改</el-button>
            </el-form-item>
          </el-form>
          <el-alert type="info" :closable="false" show-icon title="修改密码成功后需要重新登录" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { updatePassword } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

const avatarText = computed(() => (userStore.userInfo?.realName || userStore.userInfo?.username || '?').charAt(0))
const roleText = computed(() => ({ ADMIN: '管理员', TEACHER: '教师', STUDENT: '学生' })[userStore.role as string] || userStore.role)
const roleTagType = computed(() => ({ ADMIN: 'danger', TEACHER: 'warning', STUDENT: 'success' })[userStore.role as string] as 'danger' | 'warning' | 'success' | undefined)

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

const rules: FormRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度需在6-32个字符之间', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.newPassword) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

async function handleSubmit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    await updatePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword })
    ElMessage.success('密码修改成功，请重新登录')
    userStore.clearLogin()
    router.push('/login')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.user-brief {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.avatar {
  background: var(--brand-600);
  color: #fff;
  font-size: 24px;
  font-weight: 500;
}

.name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
}

.desc {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .profile-page :deep(.el-form) {
    max-width: none !important;
  }
}
</style>
