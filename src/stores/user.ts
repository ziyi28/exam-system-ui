import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as userApi from '@/api/user'
import type { LoginUser, Role } from '@/types'

const TOKEN_KEY = 'exam_token'
const USER_KEY = 'exam_user'

/**
 * 用户登录态 Store - token 与用户信息持久化在 localStorage
 */
export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  const userInfo = ref<LoginUser | null>(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const role = computed<Role | ''>(() => userInfo.value?.role ?? '')
  /** 是否属于管理端（管理员/教师共用后台） */
  const isAdminSide = computed(() => role.value === 'ADMIN' || role.value === 'TEACHER')
  /** 各角色登录后的默认首页 */
  const homePath = computed(() => (isAdminSide.value ? '/admin/dashboard' : '/student/home'))

  async function login(username: string, password: string) {
    const data = await userApi.login({ username, password })
    token.value = data.token || ''
    userInfo.value = data
    localStorage.setItem(TOKEN_KEY, token.value)
    localStorage.setItem(USER_KEY, JSON.stringify(data))
  }

  /** 拉取最新用户信息（角色/姓名可能被管理员修改） */
  async function fetchUserInfo() {
    const data = await userApi.getUserInfo()
    userInfo.value = { ...userInfo.value, ...data }
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo.value))
  }

  async function logout() {
    try {
      await userApi.logout()
    } catch {
      // 后端登出失败（如 token 已过期）不阻塞本地清理
    }
    clearLogin()
  }

  /** 仅清理本地登录态（401 时由 request.ts 调用） */
  function clearLogin() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, userInfo, isLoggedIn, role, isAdminSide, homePath, login, fetchUserInfo, logout, clearLogin }
})
