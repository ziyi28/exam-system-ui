<template>
  <div class="student-layout">
    <!-- 顶部导航 -->
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand" @click="router.push('/student/home')">
          <el-icon :size="26" color="#409eff"><Reading /></el-icon>
          <span class="brand-text">智能考试系统</span>
        </div>
        <nav class="nav">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: route.path.startsWith(item.path) }"
          >
            {{ item.title }}
          </router-link>
        </nav>
        <div class="right">
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

    <footer class="footer">智能学习考试平台 · AI 智能批阅 · 在线学习</footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const navItems = [
  { path: '/student/home', title: '首页' },
  { path: '/student/exams', title: '在线考试' },
  { path: '/student/records', title: '我的成绩' },
  { path: '/student/ranking', title: '排行榜' },
  { path: '/student/videos', title: '视频学习' },
]

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
  background: #f5f7fa;
}

.topbar {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  position: sticky;
  top: 0;
  z-index: 100;
}

.topbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 0 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  white-space: nowrap;
}

.nav {
  display: flex;
  gap: 8px;
  flex: 1;
}

.nav-item {
  padding: 8px 16px;
  border-radius: 6px;
  color: #606266;
  font-size: 15px;
  transition: all 0.2s;
}

.nav-item:hover {
  color: #409eff;
  background: #ecf5ff;
}

.nav-item.active {
  color: #409eff;
  background: #ecf5ff;
  font-weight: 600;
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
  cursor: pointer;
}

.avatar {
  background: #409eff;
  color: #fff;
}

.content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 16px;
}

.footer {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 20px 0;
}
</style>
