import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { title: '登录 - 智能考试系统' }
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/guest',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/HomePage.vue'),
        meta: { title: '首页 - 智能考试系统' }
      },
      // ========== 管理后台 ==========
      {
        path: 'admin/questions',
        name: 'QuestionManagement',
        component: () => import('@/views/admin/QuestionManagement.vue'),
        meta: { title: '题目管理' }
      },
      {
        path: 'admin/questions/batch',
        name: 'QuestionBatch',
        component: () => import('@/views/admin/QuestionBatch.vue'),
        meta: { title: '题目批量操作' }
      },
      {
        path: 'admin/categories',
        name: 'CategoryManagement',
        component: () => import('@/views/admin/CategoryManagement.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'admin/papers',
        name: 'PaperManagement',
        component: () => import('@/views/admin/PaperManagement.vue'),
        meta: { title: '试卷管理' }
      },
      {
        path: 'admin/exam-records',
        name: 'ExamRecordManagement',
        component: () => import('@/views/admin/ExamRecordManagement.vue'),
        meta: { title: '考试记录管理' }
      },
      {
        path: 'admin/notices',
        name: 'NoticeManagement',
        component: () => import('@/views/admin/NoticeManagement.vue'),
        meta: { title: '公告管理' }
      },
      {
        path: 'admin/banners',
        name: 'BannerManagement',
        component: () => import('@/views/admin/BannerManagement.vue'),
        meta: { title: '轮播图管理' }
      },
      {
        path: 'admin/videos',
        name: 'VideoAdminManagement',
        component: () => import('@/views/admin/VideoAdminManagement.vue'),
        meta: { title: '视频管理' }
      },
      {
        path: 'admin/video-categories',
        name: 'VideoCategoryManagement',
        component: () => import('@/views/admin/VideoCategoryManagement.vue'),
        meta: { title: '视频分类管理' }
      },
      // ========== 前台页面 ==========
      {
        path: 'papers',
        name: 'PaperList',
        component: () => import('@/views/exam/PaperList.vue'),
        meta: { title: '试卷列表' }
      },
      {
        path: 'my-exams',
        name: 'MyExams',
        component: () => import('@/views/admin/ExamRecordManagement.vue'),
        meta: { title: '我的考试' }
      },
      {
        path: 'ranking',
        name: 'Ranking',
        component: () => import('@/views/RankingPage.vue'),
        meta: { title: '排行榜' }
      },
      {
        path: 'videos',
        name: 'VideoList',
        component: () => import('@/views/video/VideoList.vue'),
        meta: { title: '视频学习' }
      },
      {
        path: 'video/:id',
        name: 'VideoDetail',
        component: () => import('@/views/video/VideoDetail.vue'),
        meta: { title: '视频播放' }
      },
      {
        path: 'video/submit',
        name: 'VideoSubmit',
        component: () => import('@/views/video/VideoSubmit.vue'),
        meta: { title: '视频投稿' }
      }
    ]
  },
  // 考试页面（独立全屏，不使用布局）
  {
    path: '/exam/:paperId',
    name: 'ExamPage',
    component: () => import('@/views/exam/ExamPage.vue'),
    meta: { title: '在线考试', guest: true }
  },
  {
    path: '/exam-result/:id',
    name: 'ExamResult',
    component: () => import('@/views/exam/ExamResult.vue'),
    meta: { title: '考试结果', guest: true }
  },
  // ========== 访客路由（免登录） ==========
  {
    path: '/guest',
    component: () => import('@/layouts/GuestLayout.vue'),
    meta: { guest: true },
    children: [
      {
        path: '',
        name: 'GuestHome',
        component: () => import('@/views/guest/GuestHome.vue'),
        meta: { title: '首页 - 智能考试系统', guest: true }
      },
      {
        path: 'papers',
        name: 'GuestPapers',
        component: () => import('@/views/exam/PaperList.vue'),
        meta: { title: '考试中心', guest: true }
      },
      {
        path: 'ranking',
        name: 'GuestRanking',
        component: () => import('@/views/RankingPage.vue'),
        meta: { title: '排行榜', guest: true }
      },
      {
        path: 'videos',
        name: 'GuestVideos',
        component: () => import('@/views/video/VideoList.vue'),
        meta: { title: '视频学习', guest: true }
      },
      {
        path: 'video/:id',
        name: 'GuestVideoDetail',
        component: () => import('@/views/video/VideoDetail.vue'),
        meta: { title: '视频播放', guest: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '智能考试系统'
  const userInfo = localStorage.getItem('userInfo')
  if (to.path !== '/login' && !to.meta.guest && !userInfo) {
    next('/guest')
  } else {
    next()
  }
})

export default router
