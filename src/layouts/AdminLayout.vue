<template>
  <el-container class="admin-layout">
    <!-- 侧边终端导轨 -->
    <el-aside :width="collapsed ? '64px' : '240px'" class="sidebar" :class="{ 'is-collapsed': collapsed }">
      <button type="button" class="logo" @click="router.push('/admin/dashboard')" aria-label="返回管理仪表盘">
        <BrandMark :compact="collapsed" subtitle="TERMINAL_ADMIN" />
      </button>
      <el-menu
        :default-active="route.path"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        class="sidebar-menu"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>
            <span class="menu-item-title">{{ item.title }}</span>
          </template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="content-container">
      <!-- 终端顶栏 -->
      <el-header class="header">
        <div class="header-left">
          <button
            type="button"
            class="collapse-btn"
            :aria-label="collapsed ? '展开侧栏导航' : '折叠侧栏导航'"
            @click="collapsed = !collapsed"
          >
            <el-icon :size="16">
              <Expand v-if="collapsed" />
              <Fold v-else />
            </el-icon>
          </button>
          <el-breadcrumb separator="/" class="terminal-breadcrumb">
            <el-breadcrumb-item>管理端终端</el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <ThemeToggle />
          <el-tag size="small" :type="userStore.role === 'ADMIN' ? 'danger' : 'warning'" effect="plain" class="role-badge">
            {{ roleText }}
          </el-tag>
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="26" class="avatar">{{ avatarText }}</el-avatar>
              <span class="username">{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</span>
              <el-icon :size="12"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="student">学生端视图</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出终端</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 核心工作台内容区 -->
      <el-main class="main">
        <div class="page-content">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Expand, Fold, ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import BrandMark from '@/components/brand/BrandMark.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const collapsed = ref(false)

const roleText = computed(() => (userStore.role === 'ADMIN' ? 'SYS_ADMIN' : 'INSTRUCTOR'))
const avatarText = computed(() => (userStore.userInfo?.realName || userStore.userInfo?.username || '?').charAt(0).toUpperCase())

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
    await ElMessageBox.confirm('确定要安全退出管理终端吗？', '提示', { type: 'warning' })
    await userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100%;
  min-width: 0;
  background: var(--bg-canvas);
}

.content-container {
  min-width: 0;
  height: 100%;
}

.sidebar {
  background: var(--surface-1);
  border-right: 1px solid var(--border-default);
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  user-select: none;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  color: var(--brand-600);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--border-subtle);
  font: inherit;
  white-space: nowrap;
  flex-shrink: 0;
}

.sidebar-menu {
  border-right: none;
  padding: 10px 8px 24px;
  background: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-item-height: 40px;
}

.sidebar-menu :deep(.el-menu-item) {
  border-radius: var(--radius-md);
  margin-bottom: 2px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  padding: 0 12px !important;
  transition:
    background-color var(--duration-fast) var(--ease-out-expo),
    color var(--duration-fast) var(--ease-out-expo);
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: var(--radius-xs);
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: var(--surface-2);
  color: var(--text-strong);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: color-mix(in srgb, var(--brand-600) 12%, var(--surface-1));
  color: var(--brand-600);
  font-weight: 700;
  border: 1px solid color-mix(in srgb, var(--brand-600) 25%, transparent);
}

.sidebar-menu :deep(.el-menu-item.is-active .el-icon) {
  color: var(--brand-600);
}

.menu-item-title {
  letter-spacing: -0.01em;
}

.header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface-1);
  border-bottom: 1px solid var(--border-default);
  height: var(--header-height);
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.collapse-btn {
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  background: var(--surface-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.collapse-btn:hover {
  color: var(--brand-600);
  border-color: var(--brand-600);
}

.terminal-breadcrumb :deep(.el-breadcrumb__inner) {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
}

.terminal-breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--text-strong);
  font-weight: 700;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-badge {
  font-family: var(--font-mono);
  font-size: 11px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px 4px 4px;
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

.main {
  min-width: 0;
  background: var(--bg-canvas);
  padding: 16px 24px 32px;
  overflow-y: auto;
}

.page-content {
  max-width: var(--content-max-admin);
  margin: 0 auto;
  min-height: 100%;
}
</style>
