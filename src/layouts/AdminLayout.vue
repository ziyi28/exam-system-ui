<template>
  <el-container class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside :width="collapsed ? '78px' : '264px'" class="sidebar" :class="{ 'is-collapsed': collapsed }">
      <button type="button" class="logo" @click="router.push('/admin/dashboard')">
        <BrandMark :compact="collapsed" subtitle="管理工作台" />
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
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶栏 -->
      <el-header class="header">
        <div class="header-left">
          <button
            type="button"
            class="collapse-btn"
            :aria-label="isMobile ? '打开导航菜单' : collapsed ? '展开侧栏' : '折叠侧栏'"
            @click="toggleSidebar"
          >
            <el-icon :size="18">
              <Expand v-if="collapsed" />
              <Fold v-else />
            </el-icon>
          </button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>管理端</el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <ThemeToggle />
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
        <div class="page-content">
          <router-view />
        </div>
      </el-main>
    </el-container>

    <el-drawer v-model="mobileMenuVisible" direction="ltr" size="280px" :with-header="false" class="mobile-drawer">
      <router-link to="/admin/dashboard" class="drawer-brand" @click="mobileMenuVisible = false">
        <BrandMark subtitle="管理工作台" />
      </router-link>
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
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import BrandMark from '@/components/brand/BrandMark.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const collapsed = ref(false)
const mobileMenuVisible = ref(false)

// ≤768px 时折叠按钮实际打开移动抽屉，语义标签与桌面端不同
const isMobile = computed(() => window.matchMedia('(max-width: 768px)').matches)

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
  background: var(--surface-1);
  border-right: 1px solid var(--border-subtle);
  transition: width var(--duration-base) var(--ease-out-expo);
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  height: 76px;
  padding: 0 18px;
  color: var(--brand-600);
  cursor: pointer;
  background: transparent;
  border: 0;
  font: inherit;
  white-space: nowrap;
  flex-shrink: 0;
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
  color: var(--text-secondary);
  transition:
    background-color var(--duration-fast) var(--ease-out-expo),
    color var(--duration-fast) var(--ease-out-expo);
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 8px;
  transition:
    background-color var(--duration-fast) var(--ease-out-expo),
    color var(--duration-fast) var(--ease-out-expo);
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: var(--surface-2);
  color: var(--text-strong);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  position: relative;
  background: var(--brand-50);
  color: var(--brand-700);
  font-weight: 600;
}

.sidebar-menu :deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  top: 13px;
  bottom: 13px;
  left: 0;
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--brand-600), var(--accent-violet));
}

.sidebar-menu :deep(.el-menu-item.is-active .el-icon) {
  color: var(--brand-600);
  background: color-mix(in srgb, var(--brand-600) 13%, transparent);
}

.sidebar-menu :deep(.el-menu--collapse .el-menu-item.is-active::before) {
  display: none;
}

.header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: color-mix(in srgb, var(--surface-1) 88%, transparent);
  backdrop-filter: saturate(140%) blur(10px);
  border-bottom: 1px solid var(--border-subtle);
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
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-default);
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
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-1);
}

.avatar {
  background: var(--brand-600);
  color: var(--text-on-brand);
  font-weight: 500;
}

.main {
  min-width: 0;
  background: var(--bg-canvas);
  padding: 8px 28px 32px;
  overflow-y: auto;
}

.page-content {
  max-width: var(--content-max-admin);
  margin: 0 auto;
  min-height: 100%;
}

.drawer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 4px 2px;
  cursor: pointer;
}

.drawer-menu {
  border-right: 0;
}

.drawer-menu :deep(.el-menu-item) {
  margin-bottom: 4px;
  border-radius: 12px;
}

@media (max-width: 1024px) {
  /* 平板下展开态收窄到 216px；折叠态保持 el-aside 内联 78px，避免 216px 宽侧栏
     与内部 64px 图标菜单之间出现空表面 */
  .sidebar:not(.is-collapsed) {
    width: 216px !important;
  }

  .header {
    padding: 0 20px;
  }

  .header-right {
    gap: 10px;
  }

  .main {
    padding: 8px 20px 28px;
  }
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
