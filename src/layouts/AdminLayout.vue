<template>
  <el-container class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside :width="collapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo" @click="router.push('/admin/dashboard')">
        <el-icon :size="26"><Reading /></el-icon>
        <span v-show="!collapsed" class="logo-text">智能考试系统</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        class="sidebar-menu"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" :size="20" @click="collapsed = !collapsed">
            <Expand v-if="collapsed" />
            <Fold v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>管理端</el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag size="small" :type="userStore.role === 'ADMIN' ? 'danger' : 'warning'" effect="plain">
            {{ roleText }}
          </el-tag>
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="30" class="avatar">{{ avatarText }}</el-avatar>
              <span class="username">{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="student">学生端预览</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const collapsed = ref(false)

const roleText = computed(() => (userStore.role === 'ADMIN' ? '管理员' : '教师'))
const avatarText = computed(() => (userStore.userInfo?.realName || userStore.userInfo?.username || '?').charAt(0))

/** 从路由配置生成侧边栏菜单（过滤 hidden 与角色不符项） */
const menuItems = computed(() => {
  const adminRoute = router.options.routes.find((r) => r.path === '/admin')
  return (adminRoute?.children ?? [])
    .filter((child) => !child.meta?.hidden)
    .filter((child) => {
      const roles = child.meta?.roles as string[] | undefined
      return !roles || roles.includes(userStore.role)
    })
    .map((child) => ({
      path: `/admin/${child.path}`,
      title: child.meta?.title as string,
      icon: (child.meta?.icon as string) || 'Menu',
    }))
})

async function handleCommand(command: string) {
  if (command === 'profile') {
    router.push('/admin/profile')
  } else if (command === 'student') {
    router.push('/student/home')
  } else if (command === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
    await userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100%;
}

.sidebar {
  background: #fff;
  border-right: 1px solid var(--gray-100);
  transition: width var(--duration-base) var(--ease-out-expo);
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 56px;
  color: var(--brand-600);
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  white-space: nowrap;
  flex-shrink: 0;
}

.logo-text {
  color: var(--gray-900);
  letter-spacing: -0.01em;
}

.sidebar-menu {
  border-right: none;
  padding: 4px 8px;
  --el-menu-item-height: 44px;
}

.sidebar-menu :deep(.el-menu-item) {
  border-radius: var(--radius-md);
  margin-bottom: 2px;
  color: var(--gray-600);
  transition:
    background-color var(--duration-fast) var(--ease-out-expo),
    color var(--duration-fast) var(--ease-out-expo);
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: var(--gray-50);
  color: var(--gray-800);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: var(--brand-50);
  color: var(--brand-600);
  font-weight: 600;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid var(--gray-100);
  height: 56px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  cursor: pointer;
  color: var(--gray-500);
  transition: color var(--duration-fast) var(--ease-out-expo);
}

.collapse-btn:hover {
  color: var(--brand-600);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--gray-800);
}

.avatar {
  background: var(--brand-600);
  color: #fff;
  font-weight: 500;
}

.main {
  background: var(--gray-50);
  padding: 20px;
  overflow-y: auto;
}
</style>
