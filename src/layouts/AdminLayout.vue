<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header">
        <div class="logo-section" @click="$router.push('/home')">
          <div class="logo-icon">
            <el-icon :size="isCollapsed ? 24 : 28"><Monitor /></el-icon>
          </div>
          <transition name="fade">
            <span v-if="!isCollapsed" class="logo-text">智能考试系统</span>
          </transition>
        </div>
      </div>

      <el-scrollbar class="sidebar-nav">
        <el-menu
          :default-active="currentRoute"
          :collapse="isCollapsed"
          :collapse-transition="false"
          router
        >
          <el-menu-item index="/home">
            <el-icon><HomeFilled /></el-icon>
            <template #title>首页</template>
          </el-menu-item>

          <el-sub-menu index="exam-center">
            <template #title>
              <el-icon><EditPen /></el-icon>
              <span>考试中心</span>
            </template>
            <el-menu-item index="/papers">
              <el-icon><Document /></el-icon>
              <template #title>参加考试</template>
            </el-menu-item>
            <el-menu-item index="/ranking">
              <el-icon><Trophy /></el-icon>
              <template #title>排行榜</template>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="question-mgmt">
            <template #title>
              <el-icon><Collection /></el-icon>
              <span>题库管理</span>
            </template>
            <el-menu-item index="/admin/questions">
              <el-icon><List /></el-icon>
              <template #title>题目管理</template>
            </el-menu-item>
            <el-menu-item index="/admin/questions/batch">
              <el-icon><Upload /></el-icon>
              <template #title>批量操作</template>
            </el-menu-item>
            <el-menu-item index="/admin/categories">
              <el-icon><FolderOpened /></el-icon>
              <template #title>分类管理</template>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="paper-mgmt">
            <template #title>
              <el-icon><Notebook /></el-icon>
              <span>试卷管理</span>
            </template>
            <el-menu-item index="/admin/papers">
              <el-icon><Tickets /></el-icon>
              <template #title>试卷列表</template>
            </el-menu-item>
            <el-menu-item index="/admin/exam-records">
              <el-icon><DataLine /></el-icon>
              <template #title>考试记录</template>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="content-mgmt">
            <template #title>
              <el-icon><Promotion /></el-icon>
              <span>内容运营</span>
            </template>
            <el-menu-item index="/admin/notices">
              <el-icon><Bell /></el-icon>
              <template #title>公告管理</template>
            </el-menu-item>
            <el-menu-item index="/admin/banners">
              <el-icon><Picture /></el-icon>
              <template #title>轮播图管理</template>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="video-mgmt">
            <template #title>
              <el-icon><VideoCamera /></el-icon>
              <span>视频中心</span>
            </template>
            <el-menu-item index="/videos">
              <el-icon><VideoPlay /></el-icon>
              <template #title>视频学习</template>
            </el-menu-item>
            <el-menu-item index="/admin/videos">
              <el-icon><Film /></el-icon>
              <template #title>视频管理</template>
            </el-menu-item>
            <el-menu-item index="/admin/video-categories">
              <el-icon><Folder /></el-icon>
              <template #title>视频分类</template>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-scrollbar>

      <!-- 折叠按钮 -->
      <div class="sidebar-footer">
        <div class="collapse-btn" @click="isCollapsed = !isCollapsed">
          <el-icon :size="18">
            <component :is="isCollapsed ? 'Expand' : 'Fold'" />
          </el-icon>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-area">
      <!-- 顶栏 -->
      <header class="topbar glass-card">
        <div class="topbar-left">
          <h2 class="page-title">{{ currentPageTitle }}</h2>
        </div>
        <div class="topbar-right">
          <el-dropdown trigger="click" @command="handleUserCmd">
            <div class="user-avatar-section">
              <div class="avatar-ring">
                <el-avatar :size="36" class="user-avatar">
                  {{ userStore.realName?.charAt(0) || 'U' }}
                </el-avatar>
              </div>
              <span class="user-name">{{ userStore.realName || userStore.username || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  <el-icon><User /></el-icon>
                  角色：{{ userStore.userInfo?.role || '-' }}
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapsed = ref(false)

const currentRoute = computed(() => route.path)
const currentPageTitle = computed(() => route.meta.title || '智能考试系统')

function handleUserCmd(cmd) {
  if (cmd === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-deep);
}

/* ===== 侧边栏 ===== */
.sidebar {
  width: 260px;
  background: var(--bg-base);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base);
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}
.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid var(--border);
}
.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}
.logo-section:hover { opacity: 0.85; }
.logo-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: var(--radius-sm);
  color: #fff;
  flex-shrink: 0;
}
.logo-text {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-light), var(--accent-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 8px 0;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--border);
}
.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
  transition: all var(--transition-fast);
}
.collapse-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* ===== 主内容区 ===== */
.main-area {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left var(--transition-base);
}
.sidebar.collapsed ~ .main-area {
  margin-left: 64px;
}

/* ===== 顶栏 ===== */
.topbar {
  height: 64px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
  margin: 12px 16px 0;
}
.page-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.user-avatar-section {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}
.user-avatar-section:hover { background: var(--bg-hover); }
.avatar-ring {
  padding: 2px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
}
.user-avatar {
  background: var(--bg-elevated) !important;
  color: var(--primary-light) !important;
  font-weight: 600;
  font-family: var(--font-display);
}
.user-name {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

/* ===== 内容区 ===== */
.content-area {
  flex: 1;
  padding: 20px 16px 32px;
}

/* ===== 过渡动画 ===== */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
