<template>
  <el-container class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside :width="collapsed ? '78px' : '264px'" class="sidebar">
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
          <el-icon class="collapse-btn" :size="20" @click="toggleSidebar">
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

    <el-drawer v-model="mobileMenuVisible" direction="ltr" size="280px" :with-header="false" class="mobile-drawer">
      <div class="drawer-brand" @click="router.push('/admin/dashboard'); mobileMenuVisible = false">
        <span><el-icon :size="24"><Reading /></el-icon></span>
        <div><b>智能考试系统</b><small>管理工作台</small></div>
      </div>
      <el-menu :default-active="route.path" router class="drawer-menu" @select="mobileMenuVisible = false">
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-drawer>
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
const mobileMenuVisible = ref(false)

function toggleSidebar() {
  if (window.matchMedia('(max-width: 768px)').matches) {
    mobileMenuVisible.value = true
    return
  }
  collapsed.value = !collapsed.value
}

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
  min-width: 0;
}

.sidebar {
  background: #f8f9fa;
  border-right: 1px solid var(--gray-200);
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
  height: 72px;
  color: var(--brand-600);
  cursor: pointer;
  font-weight: 600;
  font-size: 17px;
  white-space: nowrap;
  flex-shrink: 0;
}

.logo-text {
  color: var(--gray-900);
  letter-spacing: -0.02em;
}

.sidebar-menu {
  border-right: none;
  padding: 12px 14px 32px;
  background: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-item-height: 48px;
}

.sidebar-menu :deep(.el-menu-item) {
  border-radius: var(--radius-md);
  margin-bottom: 4px;
  color: var(--gray-600);
  transition:
    background-color var(--duration-fast) var(--ease-out-expo),
    color var(--duration-fast) var(--ease-out-expo);
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: var(--gray-100);
  color: var(--gray-900);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: var(--brand-50);
  color: var(--brand-700);
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--brand-600);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface);
  border-bottom: 1px solid var(--gray-200);
  height: 64px;
  padding: 0 28px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.collapse-btn {
  cursor: pointer;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  color: var(--gray-600);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  transition: color var(--duration-fast) var(--ease-out-expo);
}

.collapse-btn:hover {
  color: var(--brand-600);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 10px 6px 6px;
  color: var(--gray-800);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.avatar {
  background: var(--brand-600);
  color: #fff;
  font-weight: 500;
}

.main {
  min-width: 0;
  background: var(--page-bg);
  padding: 8px 28px 32px;
  overflow-y: auto;
}

.drawer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  cursor: pointer;
}

.drawer-brand > span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  color: #fff;
  border-radius: var(--radius-md);
  background: var(--brand-600);
}

.drawer-brand div {
  display: flex;
  flex-direction: column;
}

.drawer-brand b {
  color: var(--gray-900);
}

.drawer-brand small {
  color: var(--gray-400);
  font-size: 10px;
}

.drawer-menu {
  border-right: 0;
}

.drawer-menu :deep(.el-menu-item) {
  margin-bottom: 4px;
  border-radius: 12px;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .header {
    height: 64px;
    padding: 0 16px;
  }

  .header-left :deep(.el-breadcrumb) {
    display: none;
  }

  .username {
    display: none;
  }

  .main {
    padding: 6px 14px 24px;
  }
}
</style>
