<template>
  <div class="student-layout" :class="{ 'is-exam-mode': isTakingExam }">
    <!-- 顶部导航 -->
    <header class="topbar">
      <div class="topbar-inner">
        <router-link to="/student/home" class="brand">
          <BrandMark subtitle="教 · 学 · 考 · 评" />
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
          <el-button v-if="userStore.isAdminSide" size="small" plain type="primary" @click="router.push('/admin/dashboard')">
            返回管理端
          </el-button>
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="30" class="avatar">{{ avatarText }}</el-avatar>
              <span class="username">{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="records">我的成绩</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="content">
      <router-view />
    </main>

    <footer class="footer">智能考试系统 · 教学、考试与学习反馈</footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import BrandMark from '@/components/brand/BrandMark.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const navItems = [
  { path: '/student/home', title: '首页' },
  { path: '/student/exams', title: '在线考试' },
  { path: '/student/records', title: '我的成绩' },
  { path: '/student/knowledge', title: '学习资料库' },
  { path: '/student/ranking', title: '排行榜' },
  { path: '/student/videos', title: '视频学习' },
]

/** 作答页不暴露资料库入口；直接 URL 绕过仍由学生 API 的后端 403 拦截。 */
const isTakingExam = computed(() => route.name === 'ExamTaking')
const visibleNavItems = computed(() => navItems.filter((item) => {
  if (item.path !== '/student/knowledge') return true
  return userStore.role === 'STUDENT' && !isTakingExam.value
}))

const avatarText = computed(() => (userStore.userInfo?.realName || userStore.userInfo?.username || '?').charAt(0))

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
  --student-topbar-height: 68px;
}

.topbar {
  background: color-mix(in srgb, var(--surface-1) 88%, transparent);
  backdrop-filter: saturate(140%) blur(10px);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.topbar-inner {
  max-width: var(--content-max);
  margin: 0 auto;
  min-height: var(--student-topbar-height);
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 4px;
  flex: 1;
}

.nav-item {
  position: relative;
  padding: 9px 14px;
  color: var(--text-secondary);
  font-size: 15px;
  border-radius: 999px;
  transition:
    background-color var(--duration-fast) var(--ease-out-expo),
    color var(--duration-fast) var(--ease-out-expo);
}

.nav-item:hover {
  color: var(--text-strong);
  background-color: var(--surface-2);
}

.nav-item.active {
  color: var(--brand-700);
  font-weight: 600;
  background-color: var(--brand-50);
}

.right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 5px;
  cursor: pointer;
  color: var(--text-primary);
  border-radius: var(--radius-md);
}

.avatar {
  background: var(--brand-600);
  color: var(--text-on-brand);
  font-weight: 500;
}

.content {
  flex: 1;
  max-width: var(--content-max);
  width: 100%;
  margin: 0 auto;
  padding: 28px 24px 48px;
}

.footer {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  padding: 24px 16px 28px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-1);
}

.student-layout.is-exam-mode {
  --student-topbar-height: 64px;
}

.is-exam-mode .topbar-inner {
  min-height: var(--student-topbar-height);
}

.is-exam-mode .nav,
.is-exam-mode .footer {
  display: none;
}

.is-exam-mode .content {
  max-width: 1160px;
  padding-top: 20px;
}

@media (max-width: 900px) {
  .topbar-inner {
    gap: 16px;
    padding: 0 16px;
  }

  .nav-item {
    padding: 8px 10px;
    font-size: 14px;
  }

  .content {
    padding: 24px 16px 32px;
  }
}

@media (max-width: 680px) {
  .student-layout {
    --student-topbar-height: 164px;
  }

  .topbar-inner {
    min-height: var(--student-topbar-height);
    align-content: center;
    flex-wrap: wrap;
    gap: 0;
    padding: 10px 14px 8px;
  }

  .brand :deep(.brand-mark__subtitle) {
    display: none;
  }

  .right {
    margin-left: auto;
    gap: 8px;
  }

  .right :deep(.el-button) {
    padding: 6px 8px;
  }

  .username {
    display: none;
  }

  .nav {
    order: 3;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    flex-basis: 100%;
    gap: 4px;
    padding: 10px 0 0;
    border-top: 1px solid var(--border-subtle);
  }

  .nav-item {
    padding: 7px 4px;
    font-size: 12px;
    text-align: center;
  }

  .content {
    padding: 20px 14px 28px;
  }

  .is-exam-mode .topbar-inner {
    min-height: 64px;
    flex-wrap: nowrap;
    padding: 8px 14px;
  }
}
</style>
