<template>
  <div class="login-page">
    <div class="login-panel">
      <!-- 左侧品牌与终端声明 -->
      <section class="brand-side">
        <div class="brand-header">
          <BrandMark class="brand-side__mark" subtitle="AUTH_TERMINAL_V1" />
          <span class="system-status-indicator">
            <span class="pulse-dot"></span>
            SYSTEM_ONLINE
          </span>
        </div>

        <div class="brand-hero">
          <div class="brand-copy">
            <h1 class="brand-title">
              精密考务分析与<br />
              <span class="highlight-text">数智评估终端</span>
            </h1>
            <p class="brand-desc">
              集成大语言模型自动化出题、多维度主客观题智能批阅与 RAG 知识库检索溯源，构筑严谨高效的数字化考教闭环。
            </p>
          </div>

          <div class="brand-bottom">
            <div class="terminal-stats-grid">
              <div class="stat-cell">
                <span class="stat-label">AI_PIPELINE</span>
                <b class="stat-value">RAG + LLM</b>
                <small class="stat-meta">多模态试卷生成</small>
              </div>
              <div class="stat-cell">
                <span class="stat-label">DEFENSE_GATE</span>
                <b class="stat-value">403_ISOLATED</b>
                <small class="stat-meta">防作弊考场阻断</small>
              </div>
              <div class="stat-cell">
                <span class="stat-label">ASSESSMENT</span>
                <b class="stat-value">INSTANT_GRADING</b>
                <small class="stat-meta">学情全维透视</small>
              </div>
            </div>
          </div>
        </div>

        <div class="brand-footnote">
          <span class="mono-code">TERMINAL_HASH: 0x8F9A // SECURE_SOCKET_READY</span>
        </div>
      </section>

      <!-- 右侧登录与注册接入终端 -->
      <aside class="form-side">
        <div class="login-theme-toggle">
          <ThemeToggle />
        </div>

        <div class="form-intro">
          <div class="terminal-badge">GATEWAY_ACCESS</div>
          <h2 class="form-title">接入终端</h2>
          <p class="form-subtitle">验证身份凭据以进入对应考务或学员工作台</p>
        </div>

        <el-tabs v-model="activeTab" class="login-tabs">
          <!-- 登录选项卡 -->
          <el-tab-pane label="凭据登录" name="login">
            <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" size="default" @keyup.enter="handleLogin">
              <el-form-item prop="username">
                <el-input
                  v-model="loginForm.username"
                  placeholder="用户名 / Username"
                  :prefix-icon="User"
                  autocomplete="username"
                />
              </el-form-item>
              <el-form-item prop="password">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="密码 / Password"
                  show-password
                  :prefix-icon="Lock"
                  autocomplete="current-password"
                />
              </el-form-item>
              <el-form-item class="submit-form-item">
                <el-button type="primary" class="submit-btn" :loading="loading" @click="handleLogin">
                  AUTHENTICATE // 登录
                </el-button>
              </el-form-item>
            </el-form>

            <div class="demo-account-card">
              <div class="demo-card-head">
                <span class="demo-tag">DEMO_PRESETS</span>
                <span class="demo-pwd">DEFAULT_PWD: 123456</span>
              </div>
              <div class="demo-chips">
                <button type="button" class="chip-btn" @click="quickFill('admin')">admin (管理员)</button>
                <button type="button" class="chip-btn" @click="quickFill('teacher_zhang')">teacher_zhang (教师)</button>
                <button type="button" class="chip-btn" @click="quickFill('student_li')">student_li (学生)</button>
              </div>
            </div>
          </el-tab-pane>

          <!-- 注册选项卡 -->
          <el-tab-pane label="注册学员" name="register">
            <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" size="default" @keyup.enter="handleRegister">
              <el-form-item prop="username">
                <el-input v-model="registerForm.username" placeholder="用户名 (3-50 字符)" :prefix-icon="User" />
              </el-form-item>
              <el-form-item prop="realName">
                <el-input v-model="registerForm.realName" placeholder="学员真实姓名" :prefix-icon="Postcard" />
              </el-form-item>
              <el-form-item prop="password">
                <el-input v-model="registerForm.password" type="password" placeholder="设置密码 (6-32 字符)" show-password :prefix-icon="Lock" />
              </el-form-item>
              <el-form-item prop="confirmPassword">
                <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认登录密码" show-password :prefix-icon="Lock" />
              </el-form-item>
              <el-form-item class="submit-form-item">
                <el-button type="primary" class="submit-btn" :loading="loading" @click="handleRegister">
                  REGISTER_ACCOUNT // 注册
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>

        <div class="form-footer">
          <span>如遇账户锁死或权限异常，请联系考务系统管理员</span>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Postcard } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import * as userApi from '@/api/user'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import BrandMark from '@/components/brand/BrandMark.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeTab = ref<'login' | 'register'>('login')
const loading = ref(false)

// ---- 登录 ----
const loginFormRef = ref<FormInstance>()
const loginForm = reactive({ username: '', password: '' })
const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

function quickFill(uname: string) {
  loginForm.username = uname
  loginForm.password = '123456'
}

async function handleLogin() {
  await loginFormRef.value?.validate()
  loading.value = true
  try {
    await userStore.login(loginForm.username, loginForm.password)
    ElMessage.success('身份验证通过，进入系统')
    const redirect = route.query.redirect as string | undefined
    router.push(redirect && redirect !== '/login' ? redirect : userStore.homePath)
  } finally {
    loading.value = false
  }
}

// ---- 注册 ----
const registerFormRef = ref<FormInstance>()
const registerForm = reactive({ username: '', realName: '', password: '', confirmPassword: '' })
const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度需在3-50个字符之间', trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度需在6-32个字符之间', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== registerForm.password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

async function handleRegister() {
  await registerFormRef.value?.validate()
  loading.value = true
  try {
    await userApi.register({
      username: registerForm.username,
      password: registerForm.password,
      realName: registerForm.realName,
    })
    ElMessage.success('注册成功，请使用新凭据登录')
    loginForm.username = registerForm.username
    loginForm.password = ''
    activeTab.value = 'login'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-canvas);
  padding: 24px;
}

.login-panel {
  display: grid;
  grid-template-columns: minmax(0, 56fr) minmax(420px, 44fr);
  align-items: stretch;
  width: min(1120px, 100%);
  min-height: 620px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--surface-1);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

/* ============ 品牌左侧（56%） ============ */
.brand-side {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 40px 48px;
  border-right: 1px solid var(--border-default);
  background:
    radial-gradient(480px 300px at 0% 0%, color-mix(in srgb, var(--brand-600) 8%, transparent), transparent 60%),
    var(--surface-1);
}

.brand-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.system-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--brand-600);
  background: color-mix(in srgb, var(--brand-600) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--brand-600) 25%, transparent);
  padding: 3px 8px;
  border-radius: var(--radius-xs);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-600);
  box-shadow: 0 0 8px var(--brand-600);
}

.brand-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 24px 0;
}

.brand-title {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.03em;
  color: var(--text-strong);
  margin-bottom: 12px;
}

.highlight-text {
  color: var(--brand-600);
}

.brand-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  max-width: 480px;
  margin: 0 0 28px;
}

.terminal-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 20px;
}

.stat-cell {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 800;
  color: var(--text-strong);
  margin: 3px 0 2px;
}

.stat-meta {
  font-size: 11px;
  color: var(--text-secondary);
}

.brand-footnote {
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}

.mono-code {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

/* ============ 表单右侧（44%） ============ */
.form-side {
  position: relative;
  background: var(--surface-1);
  padding: 40px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
}

.form-intro {
  margin-bottom: 20px;
}

.terminal-badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--brand-600);
  margin-bottom: 6px;
}

.form-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-strong);
}

.form-subtitle {
  margin: 0;
  font-size: 11px;
  color: var(--text-muted);
}

.login-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.login-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--border-subtle);
}

.login-tabs :deep(.el-tabs__item) {
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
}

.login-tabs :deep(.el-form-item) {
  margin-bottom: 16px;
}

.submit-form-item {
  margin-top: 20px;
  margin-bottom: 12px !important;
}

.submit-btn {
  width: 100%;
  height: 38px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.demo-account-card {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-2);
}

.demo-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.demo-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--brand-600);
}

.demo-pwd {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}

.demo-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-btn {
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  color: var(--text-primary);
  font-size: 11px;
  padding: 3px 8px;
  cursor: pointer;
  font-family: var(--font-mono);
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.chip-btn:hover {
  border-color: var(--brand-600);
  color: var(--brand-600);
  background: color-mix(in srgb, var(--brand-600) 8%, var(--surface-1));
}

.form-footer {
  margin-top: 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 11px;
}
</style>
