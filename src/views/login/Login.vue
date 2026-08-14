<template>
  <div class="login-page">
    <div class="login-panel">
      <section class="brand-side">
        <BrandMark class="brand-side__mark" subtitle="教 · 学 · 考 · 评" />

        <div class="brand-hero">
          <div class="brand-copy">
            <span class="brand-kicker">面向教学全过程</span>
            <h1>考试不是终点，<br /><em>反馈才是。</em></h1>
            <p>组织考试、完成作答、查看结果。把复杂流程收进一套清楚、可靠的教学工具。</p>
          </div>

          <div class="brand-bottom">
            <BrandScene variant="login" class="brand-scene" />
            <ul class="feature-list">
              <li><span>01</span><div><b>组织考试</b><small>配置试卷、考试范围与参与人员</small></div></li>
              <li><span>02</span><div><b>在线作答</b><small>专注完成答题并实时保存进度</small></div></li>
              <li><span>03</span><div><b>查看反馈</b><small>回顾得分、解析与知识薄弱点</small></div></li>
            </ul>
          </div>
        </div>

        <div class="brand-footnote">让考试过程更清楚，让反馈真正回到学习。</div>
      </section>

      <aside class="form-side">
        <div class="login-theme-toggle">
          <ThemeToggle />
        </div>
        <div class="form-intro">
          <span>账号入口</span>
          <h2>登录系统</h2>
          <p>使用分配给你的账号进入相应工作台</p>
        </div>
        <el-tabs v-model="activeTab" class="login-tabs">
          <!-- 登录 -->
          <el-tab-pane label="登录" name="login">
            <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" size="large" @keyup.enter="handleLogin">
              <el-form-item prop="username">
                <el-input v-model="loginForm.username" placeholder="用户名" :prefix-icon="User" />
              </el-form-item>
              <el-form-item prop="password">
                <el-input v-model="loginForm.password" type="password" placeholder="密码" show-password :prefix-icon="Lock" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" class="submit-btn" :loading="loading" @click="handleLogin">
                  登 录
                </el-button>
              </el-form-item>
            </el-form>
            <div class="tips">
              <span>体验账号</span>
              <p>admin / teacher_zhang / student_li</p>
              <small>密码均为 123456</small>
            </div>
          </el-tab-pane>

          <!-- 注册 -->
          <el-tab-pane label="注册" name="register">
            <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" size="large" @keyup.enter="handleRegister">
              <el-form-item prop="username">
                <el-input v-model="registerForm.username" placeholder="用户名（3-50个字符）" :prefix-icon="User" />
              </el-form-item>
              <el-form-item prop="realName">
                <el-input v-model="registerForm.realName" placeholder="真实姓名" :prefix-icon="Postcard" />
              </el-form-item>
              <el-form-item prop="password">
                <el-input v-model="registerForm.password" type="password" placeholder="密码（6-32个字符）" show-password :prefix-icon="Lock" />
              </el-form-item>
              <el-form-item prop="confirmPassword">
                <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码" show-password :prefix-icon="Lock" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" class="submit-btn" :loading="loading" @click="handleRegister">
                  注册（学生账号）
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
        <div class="form-footer">账号问题请联系系统管理员</div>
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
import BrandScene from '@/components/brand/BrandScene.vue'

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

async function handleLogin() {
  await loginFormRef.value?.validate()
  loading.value = true
  try {
    await userStore.login(loginForm.username, loginForm.password)
    ElMessage.success('登录成功')
    // 支持 401 跳转回原页面
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
    ElMessage.success('注册成功，请登录')
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
  overflow-y: auto;
  background: var(--bg-canvas-accent);
  padding: 32px;
}

.login-panel {
  display: grid;
  grid-template-columns: minmax(0, 58fr) minmax(440px, 42fr);
  align-items: stretch;
  width: min(1200px, 100%);
  min-height: min(720px, calc(100vh - 64px));
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  background: var(--surface-1);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

/* ============ 品牌左侧（58%） ============ */
.brand-side {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: clamp(32px, 4vw, 52px);
  overflow: hidden;
  border-right: 1px solid var(--border-subtle);
  background:
    radial-gradient(560px 340px at 6% -4%, color-mix(in srgb, var(--accent-violet) 9%, transparent), transparent 62%),
    radial-gradient(520px 320px at 100% 106%, color-mix(in srgb, var(--accent-cyan) 8%, transparent), transparent 60%),
    var(--surface-1);
}

.brand-side__mark {
  flex: none;
}

.brand-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
}

.brand-copy {
  max-width: 540px;
}

.brand-kicker,
.form-intro > span {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.brand-kicker {
  color: var(--brand-600);
}

.brand-copy h1 {
  margin: 16px 0 16px;
  color: var(--text-strong);
  font-size: clamp(38px, 3.4vw, 50px);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.05em;
}

.brand-copy h1 em {
  color: var(--brand-600);
  font-style: normal;
}

.brand-copy p {
  max-width: 480px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.8;
}

.brand-bottom {
  display: flex;
  align-items: flex-end;
  gap: clamp(20px, 3vw, 40px);
  margin-top: clamp(20px, 3vw, 36px);
}

.brand-scene {
  width: clamp(210px, 24vw, 300px);
  flex: none;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 2px;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding: 11px 0;
  border-top: 1px solid var(--border-subtle);
}

.feature-list li:first-child {
  border-top: 0;
  padding-top: 0;
}

.feature-list li > span {
  width: 28px;
  display: block;
  flex: none;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
}

.feature-list li > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.feature-list b {
  color: var(--text-primary);
  font-size: 13px;
}

.feature-list small {
  color: var(--text-muted);
  font-size: 11px;
}

.brand-footnote {
  flex: none;
  margin-top: 20px;
  color: var(--text-muted);
  font-size: 11px;
}

/* ============ 表单右侧（42%） ============ */
.form-side {
  position: relative;
  width: 100%;
  max-width: none;
  background: var(--surface-1);
  padding: clamp(54px, 6vw, 84px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: none;
}

.login-theme-toggle {
  position: absolute;
  top: 24px;
  right: 24px;
}

.form-side::before {
  display: none;
}

.form-intro {
  position: relative;
  margin-bottom: 28px;
}

.form-intro > span {
  color: var(--brand-600);
}

.form-intro h2 {
  margin: 8px 0 6px;
  font-size: 28px;
  letter-spacing: -0.03em;
}

.form-intro p {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.login-tabs :deep(.el-tabs__header) {
  margin-bottom: 28px;
}

.login-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--border-subtle);
}

.login-tabs :deep(.el-tabs__item) {
  height: 44px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 600;
}

.login-tabs :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-tabs :deep(.el-input__wrapper) {
  min-height: 50px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  background: var(--surface-1);
  box-shadow: 0 0 0 1px var(--border-default) inset;
}

.login-tabs :deep(.el-input__wrapper.is-focus) {
  background: var(--surface-1);
  box-shadow: 0 0 0 1px var(--brand-600) inset;
}

.submit-btn {
  width: 100%;
  min-height: 50px;
  border-radius: var(--radius-md);
  font-size: 15px;
  letter-spacing: 0.06em;
}

.tips {
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  text-align: left;
}

.tips span {
  color: var(--brand-600);
  font-size: 11px;
  font-weight: 700;
}

.tips p {
  margin: 3px 0 0;
  color: var(--text-primary);
  font-size: 12px;
}

.tips small {
  color: var(--text-muted);
}

.form-footer {
  margin-top: 28px;
  color: var(--text-muted);
  font-size: 11px;
}

@media (max-width: 1100px) {
  .login-page {
    padding: 24px;
  }

  .login-panel {
    grid-template-columns: minmax(0, 1fr) minmax(400px, 1fr);
  }

  .brand-copy h1 {
    font-size: 42px;
  }

  .brand-scene {
    width: 200px;
  }

  .feature-list li:nth-child(3) {
    display: none;
  }
}

@media (max-width: 860px) {
  .login-page {
    align-items: flex-start;
    overflow-y: auto;
    padding: 14px;
  }

  .login-panel {
    display: flex;
    min-height: 0;
    flex-direction: column;
    border-radius: var(--radius-lg);
  }

  .brand-side {
    padding: 24px;
    border-right: 0;
    border-bottom: 1px solid var(--border-subtle);
  }

  .brand-hero {
    justify-content: flex-start;
    margin-top: 34px;
  }

  .brand-bottom {
    margin-top: 26px;
  }

  .brand-scene {
    display: none;
  }

  .feature-list li:nth-child(3) {
    display: flex;
  }

  .brand-copy h1 {
    font-size: clamp(34px, 9vw, 44px);
  }

  .brand-copy p {
    font-size: 14px;
    line-height: 1.75;
  }

  .feature-list,
  .brand-footnote {
    display: none;
  }

  .form-side {
    max-width: none;
    padding: 40px 24px 36px;
  }

  .form-intro h2 {
    font-size: 26px;
  }
}
</style>
