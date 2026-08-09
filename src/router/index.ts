import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { Role } from '@/types'

/**
 * 路由设计：
 * - /login        登录/注册（未登录唯一入口）
 * - /admin/**     管理端（ADMIN / TEACHER），侧边栏后台布局
 * - /student/**   学生端（STUDENT），门户风格布局
 *
 * meta.roles 声明允许访问的角色；路由守卫按登录态与角色重定向。
 */

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    meta: { roles: ['ADMIN', 'TEACHER'] },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/admin/Dashboard.vue'), meta: { title: '仪表盘', icon: 'Odometer' } },
      { path: 'questions', name: 'QuestionList', component: () => import('@/views/admin/question/QuestionList.vue'), meta: { title: '题库管理', icon: 'Document' } },
      { path: 'questions/import', name: 'QuestionImport', component: () => import('@/views/admin/question/QuestionImport.vue'), meta: { title: '批量导入 / AI出题', icon: 'MagicStick' } },
      { path: 'questions/hot', name: 'HotQuestions', component: () => import('@/views/admin/question/HotQuestions.vue'), meta: { title: '热题看板', icon: 'TrendCharts' } },
      { path: 'knowledge', name: 'KnowledgeBaseManage', component: () => import('@/views/admin/knowledge/KnowledgeBaseManage.vue'), meta: { title: 'AI 知识库', icon: 'Collection', roles: ['ADMIN', 'TEACHER'] } },
      { path: 'categories', name: 'CategoryManage', component: () => import('@/views/admin/category/CategoryManage.vue'), meta: { title: '分类管理', icon: 'FolderOpened' } },
      { path: 'papers', name: 'PaperList', component: () => import('@/views/admin/paper/PaperList.vue'), meta: { title: '试卷管理', icon: 'Notebook' } },
      { path: 'papers/edit', name: 'PaperEdit', component: () => import('@/views/admin/paper/PaperEdit.vue'), meta: { title: '组卷', hidden: true } },
      { path: 'papers/:id', name: 'PaperDetail', component: () => import('@/views/admin/paper/PaperDetail.vue'), meta: { title: '试卷详情', hidden: true } },
      { path: 'exam-records', name: 'ExamRecordList', component: () => import('@/views/admin/exam/ExamRecordList.vue'), meta: { title: '考试记录', icon: 'List' } },
      { path: 'exam-records/:id', name: 'ExamRecordDetail', component: () => import('@/views/admin/exam/ExamRecordDetail.vue'), meta: { title: '记录详情', hidden: true } },
      { path: 'notices', name: 'NoticeManage', component: () => import('@/views/admin/notice/NoticeManage.vue'), meta: { title: '公告管理', icon: 'Bell' } },
      { path: 'banners', name: 'BannerManage', component: () => import('@/views/admin/banner/BannerManage.vue'), meta: { title: '轮播图管理', icon: 'Picture' } },
      { path: 'videos', name: 'VideoManage', component: () => import('@/views/admin/video/VideoManage.vue'), meta: { title: '视频管理', icon: 'VideoCamera' } },
      { path: 'video-categories', name: 'VideoCategoryManage', component: () => import('@/views/admin/video/VideoCategoryManage.vue'), meta: { title: '视频分类', icon: 'Films' } },
      { path: 'users', name: 'UserManage', component: () => import('@/views/admin/user/UserManage.vue'), meta: { title: '用户管理', icon: 'User', roles: ['ADMIN'] } },
      { path: 'profile', name: 'AdminProfile', component: () => import('@/views/common/Profile.vue'), meta: { title: '个人中心', hidden: true } },
    ],
  },
  {
    path: '/student',
    component: () => import('@/layouts/StudentLayout.vue'),
    redirect: '/student/home',
    meta: { roles: ['STUDENT', 'ADMIN', 'TEACHER'] },
    children: [
      { path: 'home', name: 'StudentHome', component: () => import('@/views/student/Home.vue'), meta: { title: '首页' } },
      { path: 'exams', name: 'StudentExamList', component: () => import('@/views/student/ExamList.vue'), meta: { title: '在线考试' } },
      { path: 'exam/:recordId', name: 'ExamTaking', component: () => import('@/views/student/ExamTaking.vue'), meta: { title: '答题中' } },
      { path: 'result/:recordId', name: 'ExamResult', component: () => import('@/views/student/ExamResult.vue'), meta: { title: '考试结果' } },
      { path: 'records', name: 'MyRecords', component: () => import('@/views/student/MyRecords.vue'), meta: { title: '我的成绩' } },
      { path: 'knowledge', name: 'StudentKnowledgeLibrary', component: () => import('@/views/student/KnowledgeLibrary.vue'), meta: { title: '学习资料库', roles: ['STUDENT'] } },
      { path: 'ranking', name: 'StudentRanking', component: () => import('@/views/student/Ranking.vue'), meta: { title: '排行榜' } },
      { path: 'videos', name: 'StudentVideoList', component: () => import('@/views/student/video/VideoList.vue'), meta: { title: '视频学习' } },
      { path: 'videos/:id', name: 'VideoPlay', component: () => import('@/views/student/video/VideoPlay.vue'), meta: { title: '视频播放' } },
      { path: 'profile', name: 'StudentProfile', component: () => import('@/views/common/Profile.vue'), meta: { title: '个人中心' } },
    ],
  },
  { path: '/', redirect: '/login' },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const userStore = useUserStore()

  // 未登录：只能访问登录页
  if (!userStore.isLoggedIn) {
    if (to.path === '/login') return true
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // 已登录访问登录页：回各自首页
  if (to.path === '/login' || to.path === '/') {
    return { path: userStore.homePath }
  }

  // 角色校验：取最近一级声明了 roles 的路由记录
  const required = [...to.matched].reverse().find((r) => r.meta.roles)?.meta.roles as Role[] | undefined
  if (required && !required.includes(userStore.role as Role)) {
    return { path: userStore.homePath }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - 智能考试系统` : '智能考试系统'
})

export default router
