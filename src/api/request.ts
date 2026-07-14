import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import type { Result } from '@/types'

/**
 * Axios 实例 - 统一处理 token 携带与业务状态码
 *
 * 后端约定：HTTP 状态基本恒为 200，业务状态在 Result.code 中
 * - 200 成功：直接返回 data
 * - 401 未登录/token失效：清理登录态并跳转登录页
 * - 其他：弹出错误提示
 */
const instance = axios.create({
  baseURL: '/',
  timeout: 120000, // AI 批阅/组卷耗时较长，超时放宽
})

instance.interceptors.request.use((config) => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

instance.interceptors.response.use(
  (response) => {
    const result = response.data as Result
    // 文件流（Excel 模板下载等）直接透传
    if (response.config.responseType === 'blob') {
      return response
    }
    if (result.code === 200) {
      return result.data as never
    }
    if (result.code === 401) {
      const userStore = useUserStore()
      userStore.clearLogin()
      if (router.currentRoute.value.path !== '/login') {
        ElMessage.warning(result.message || '登录已过期，请重新登录')
        router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
      }
      return Promise.reject(new Error(result.message))
    }
    ElMessage.error(result.message || '请求失败')
    return Promise.reject(new Error(result.message))
  },
  (error) => {
    ElMessage.error(error.message === 'Network Error' ? '网络错误，请检查后端服务是否启动' : (error.message || '请求异常'))
    return Promise.reject(error)
  },
)

/**
 * 类型化请求封装：resolve 出的直接是 Result.data
 */
function request<T = void>(config: AxiosRequestConfig): Promise<T> {
  return instance.request(config)
}

export function get<T = void>(url: string, params?: Record<string, unknown>): Promise<T> {
  return request<T>({ method: 'get', url, params })
}

export function post<T = void>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ method: 'post', url, data, ...config })
}

export function put<T = void>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ method: 'put', url, data, ...config })
}

export function del<T = void>(url: string, params?: Record<string, unknown>): Promise<T> {
  return request<T>({ method: 'delete', url, params })
}

export { instance }
export default request
