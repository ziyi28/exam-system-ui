<template>
  <div class="guest-layout">
    <header class="guest-navbar glass-card">
      <div class="navbar-inner">
        <div class="navbar-left" @click="$router.push('/guest')">
          <div class="logo-icon">
            <el-icon :size="22"><Monitor /></el-icon>
          </div>
          <span class="logo-text">智能考试系统</span>
        </div>
        <nav class="navbar-center">
          <router-link to="/guest" class="nav-link" exact-active-class="active">首页</router-link>
          <router-link to="/guest/papers" class="nav-link" active-class="active">考试中心</router-link>
          <router-link to="/guest/videos" class="nav-link" active-class="active">视频学习</router-link>
          <router-link to="/guest/ranking" class="nav-link" active-class="active">排行榜</router-link>
        </nav>
        <div class="navbar-right">
          <el-button type="primary" @click="$router.push('/login')">
            <el-icon><User /></el-icon> 登录
          </el-button>
        </div>
      </div>
    </header>
    <main class="guest-content">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.guest-layout {
  min-height: 100vh;
  background: var(--bg-deep);
}

.guest-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 64px;
  margin: 0;
  border-radius: 0;
  border-bottom: 1px solid var(--border);
}

.navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}
.navbar-left:hover { opacity: 0.85; }

.logo-icon {
  width: 36px;
  height: 36px;
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
  font-size: 1.05rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-light), var(--accent-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
}

.navbar-center {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  padding: 8px 18px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}
.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
.nav-link.active {
  color: var(--primary-light);
  background: rgba(99, 102, 241, 0.1);
}

.navbar-right {
  display: flex;
  align-items: center;
}

.guest-content {
  padding: 88px 24px 32px;
  max-width: 1280px;
  margin: 0 auto;
}
</style>
