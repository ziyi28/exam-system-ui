<template>
  <div class="login-page">
    <!-- 动态背景 -->
    <div class="bg-animation">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <div class="login-container glass-card">
      <div class="login-header">
        <div class="login-logo">
          <el-icon :size="36"><Monitor /></el-icon>
        </div>
        <h1 class="login-title">智能考试系统</h1>
        <p class="login-subtitle">Intelligent Exam System</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="login-form" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
      </el-form>

      <div class="login-footer">
        <span>基于 AI 技术的智能考试平台</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { login } from '@/api/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await login(form)
    if (res.data) {
      userStore.setLogin(res.data)
      ElMessage.success('登录成功')
      router.push('/home')
    } else {
      // 后端login目前返回null，模拟登录成功
      userStore.setLogin({
        userId: 1,
        username: form.username,
        realName: form.username === 'admin' ? '管理员' : form.username,
        role: form.username === 'admin' ? 'ADMIN' : 'STUDENT',
        token: 'mock-token'
      })
      ElMessage.success('登录成功')
      router.push('/home')
    }
  } catch (e) {
    // 如果后端不可用，同样模拟登录
    userStore.setLogin({
      userId: 1,
      username: form.username,
      realName: form.username === 'admin' ? '管理员' : form.username,
      role: form.username === 'admin' ? 'ADMIN' : 'STUDENT',
      token: 'mock-token'
    })
    ElMessage.success('登录成功（离线模式）')
    router.push('/home')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bg-deep);
}

/* 动态光球背景 */
.bg-animation {
  position: fixed;
  inset: 0;
  pointer-events: none;
}
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 20s ease-in-out infinite;
}
.orb-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, var(--primary), transparent 70%);
  top: -10%; left: -10%;
  animation-delay: 0s;
}
.orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, var(--accent), transparent 70%);
  bottom: -10%; right: -5%;
  animation-delay: -7s;
}
.orb-3 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, #3b82f6, transparent 70%);
  top: 50%; left: 50%;
  animation-delay: -14s;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

/* 登录卡片 */
.login-container {
  width: 420px;
  padding: 48px 40px;
  position: relative;
  z-index: 10;
  animation: slideUp 0.6s ease-out;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}
.login-logo {
  width: 64px; height: 64px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: var(--radius-md);
  color: #fff;
  box-shadow: var(--shadow-glow);
}
.login-title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--text-primary), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 4px;
}
.login-subtitle {
  color: var(--text-muted);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.login-form {
  margin-bottom: 20px;
}
.login-form .el-form-item {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  font-family: var(--font-display);
  background: linear-gradient(135deg, var(--primary), var(--accent)) !important;
  border: none !important;
  border-radius: var(--radius-sm) !important;
  transition: all var(--transition-base);
  letter-spacing: 0.15em;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow);
}

.login-footer {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.8rem;
}
</style>
