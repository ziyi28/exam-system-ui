<template>
  <div class="login-page">
    <div class="login-panel">
      <section class="brand-side">
        <div class="brand-lockup">
          <span class="brand-mark"><el-icon :size="24"><Reading /></el-icon></span>
          <div>
            <strong>智能考试系统</strong>
            <small>教 · 学 · 考 · 评</small>
          </div>
        </div>

        <div class="brand-copy">
          <span class="brand-kicker">面向教学全过程</span>
          <h1>考试不是终点，<br /><em>反馈才是。</em></h1>
          <p>组织考试、完成作答、查看结果。把复杂流程收进一套清楚、可靠的教学工具。</p>
        </div>

        <ul class="feature-list">
          <li><span>01</span><div><b>组织考试</b><small>配置试卷、考试范围与参与人员</small></div></li>
          <li><span>02</span><div><b>在线作答</b><small>专注完成答题并实时保存进度</small></div></li>
          <li><span>03</span><div><b>查看反馈</b><small>回顾得分、解析与知识薄弱点</small></div></li>
        </ul>

        <div class="brand-footnote">让考试过程更清楚，让反馈真正回到学习。</div>
      </section>

      <aside class="form-side">
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
  background: #e9edf0;
  padding: 32px;
}

.login-panel {
  display: grid;
  grid-template-columns: minmax(0, 0.94fr) minmax(420px, 1.06fr);
  align-items: stretch;
  width: min(1180px, 100%);
  min-height: min(700px, calc(100vh - 64px));
  border: 1px solid #d7dde2;
  border-radius: var(--radius-xl);
  background: var(--surface);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.brand-side {
  color: var(--gray-800);
  padding: clamp(36px, 5vw, 64px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #f3f5f4;
  border-right: 1px solid var(--gray-200);
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-mark {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  color: var(--brand-600);
  background: var(--surface);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
}

.brand-lockup div {
  display: flex;
  flex-direction: column;
}

.brand-lockup strong {
  color: var(--gray-900);
  font-size: 17px;
}

.brand-lockup small {
  color: var(--gray-500);
  font-size: 10px;
  letter-spacing: 0.12em;
}

.brand-copy {
  max-width: 540px;
  margin: auto 0;
  padding: 54px 0 42px;
}

.brand-copy h1 {
  margin: 18px 0 20px;
  color: var(--gray-900);
  font-size: clamp(40px, 4vw, 56px);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.05em;
}

.brand-copy h1 em {
  color: var(--brand-600);
  font-style: normal;
}

.brand-copy p {
  max-width: 480px;
  margin: 0;
  color: var(--gray-600);
  font-size: 15px;
  line-height: 1.8;
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

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding: 14px 0;
  border-top: 1px solid var(--gray-200);
}

.feature-list li > span {
  width: 28px;
  display: block;
  flex: none;
  color: var(--gray-400);
  font-size: 11px;
  font-weight: 700;
}

.feature-list li > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.feature-list b {
  color: var(--gray-800);
  font-size: 13px;
}

.feature-list small {
  color: var(--gray-500);
  font-size: 11px;
}

.brand-footnote {
  margin-top: 24px;
  color: var(--gray-500);
  font-size: 11px;
}

.form-side {
  position: relative;
  width: 100%;
  max-width: none;
  background: var(--surface);
  padding: clamp(54px, 6vw, 84px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: none;
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
  color: var(--gray-500);
  font-size: 14px;
}

.login-tabs :deep(.el-tabs__header) {
  margin-bottom: 28px;
}

.login-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--gray-100);
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
  background: var(--surface);
  box-shadow: 0 0 0 1px var(--gray-200) inset;
}

.login-tabs :deep(.el-input__wrapper.is-focus) {
  background: #fff;
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
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--gray-50);
  text-align: left;
}

.tips span {
  color: var(--brand-600);
  font-size: 11px;
  font-weight: 700;
}

.tips p {
  margin: 3px 0 0;
  color: var(--gray-700);
  font-size: 12px;
}

.tips small {
  color: var(--gray-400);
}

.form-footer {
  margin-top: 28px;
  color: var(--gray-400);
  font-size: 11px;
}

@media (max-width: 1100px) {
  .login-page {
    padding: 24px;
  }

  .login-panel {
    grid-template-columns: minmax(0, 0.86fr) minmax(390px, 1.14fr);
  }

  .brand-copy h1 {
    font-size: 48px;
  }

  .feature-list li:nth-child(3) {
    display: none;
  }
}

@media (max-width: 760px) {
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
    border-bottom: 1px solid var(--gray-200);
  }

  .brand-copy {
    padding: 38px 0 12px;
  }

  .brand-copy h1 {
    margin: 16px 0 14px;
    font-size: clamp(34px, 10vw, 44px);
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
    padding: 36px 24px 32px;
  }

  .form-intro h2 {
    font-size: 26px;
  }

}
</style>
