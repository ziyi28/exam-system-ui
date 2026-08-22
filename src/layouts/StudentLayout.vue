<template>
  <div class="student-layout" :class="{ 'is-exam-mode': isTakingExam }">
    <!-- 顶部终端导航栏 -->
    <header class="topbar">
      <div class="topbar-inner">
        <router-link to="/student/home" class="brand" aria-label="返回学生主页">
          <BrandMark subtitle="STUDENT_PORTAL" />
        </router-link>
        <nav class="nav">
          <router-link
            v-for="item in visibleNavItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: route.path.startsWith(item.path) }"
          >
            {{ item.title }}
          </router-link>
        </nav>
        <div class="right">
          <ThemeToggle />
          <el-button v-if="userStore.isAdminSide" size="small" plain type="primary" class="admin-entry-btn" @click="router.push('/admin/dashboard')">
            管理终端
          </el-button>
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="26" class="avatar">{{ avatarText }}</el-avatar>
              <span class="username">{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</span>
              <el-icon :size="12"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="records">我的成绩</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出终端</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 核心内容区 -->
    <main class="content">
      <router-view />
    </main>

    <footer class="footer">
      <span class="footer-copy">CYBERNETIC ASSESSMENT & LEARNING PLATFORM · 智能考试系统</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import BrandMark from '@/components/brand/BrandMark.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const navItems = [
  { path: '/student/home', title: '概览门户' },
  { path: '/student/exams', title: '在线考试' },
  { path: '/student/records', title: '成绩档案' },
  { path: '/student/knowledge', title: '知识资料库' },
  { path: '/student/ranking', title: '全站排行' },
  { path: '/student/videos', title: '视频自学' },
]

/** 作答页不暴露资料库入口；直接 URL 绕过仍由学生 API 的后端 403 拦截。 */
const isTakingExam = computed(() => route.name === 'ExamTaking')
const visibleNavItems = computed(() => navItems.filter((item) => {
  if (item.path !== '/student/knowledge') return true
  return userStore.role === 'STUDENT' && !isTakingExam.value
}))

const avatarText = computed(() => (userStore.userInfo?.realName || userStore.userInfo?.username || '?').charAt(0).toUpperCase())

async function handleCommand(command: string) {
  if (command === 'profile') {
    router.push('/student/profile')
  } else if (command === 'records') {
    router.push('/student/records')
  } else if (command === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
    await userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.student-layout {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-canvas);
}

.topbar {
  background: var(--surface-1);
  border-bottom: 1px solid var(--border-default);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  height: var(--student-topbar-height);
}

.topbar-inner {
  max-width: var(--content-max);
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
  flex-shrink: 0;
}

.nav {
  display: flex;
  gap: 2px;
  flex: 1;
}

.nav-item {
  position: relative;
  padding: 6px 12px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-out-expo);
  letter-spacing: -0.01em;
}

.nav-item:hover {
  color: var(--text-strong);
  background-color: var(--surface-2);
}

.nav-item.active {
  color: var(--brand-600);
  font-weight: 700;
  background-color: color-mix(in srgb, var(--brand-600) 12%, var(--surface-1));
  border: 1px solid color-mix(in srgb, var(--brand-600) 25%, transparent);
}

.right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-entry-btn {
  font-family: var(--font-mono);
  font-size: 11px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  cursor: pointer;
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  font-size: 13px;
  font-weight: 500;
  transition: border-color var(--duration-fast) var(--ease-out-expo);
}

.user-dropdown:hover {
  border-color: var(--brand-600);
}

.avatar {
  background: var(--brand-600);
  color: var(--text-on-brand);
  font-weight: 700;
  font-size: 12px;
  font-family: var(--font-mono);
  border-radius: var(--radius-xs);
}

.content {
  flex: 1;
  max-width: var(--content-max);
  width: 100%;
  margin: 0 auto;
  padding: 20px 20px 40px;
}

.footer {
  text-align: center;
  color: var(--text-muted);
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 16px 20px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-1);
}

.footer-copy {
  letter-spacing: 0.05em;
}

.student-layout.is-exam-mode .nav,
.student-layout.is-exam-mode .footer {
  display: none;
}

.student-layout.is-exam-mode .content {
  max-width: 1200px;
  padding: 16px 20px;
}
</style>
