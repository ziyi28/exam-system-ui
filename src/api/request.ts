import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'
import type { Result } from '@/types'

export interface ApiRequestError extends Error {
  status?: number
}

export interface ApiRequestConfig extends AxiosRequestConfig {
  /** 页面会自行展示错误状态时，关闭全局消息提示；401 登录失效仍会统一处理。 */
  suppressGlobalError?: boolean
}

function createApiError(message: string, status?: number): ApiRequestError {
  const error = new Error(message) as ApiRequestError
  error.status = status
  return error
}

export function getApiErrorStatus(error: unknown) {
  if (!error || typeof error !== 'object') return undefined
  const directStatus = Number((error as ApiRequestError).status)
  if (Number.isFinite(directStatus)) return directStatus
  const responseStatus = Number((error as { response?: { status?: number } }).response?.status)
  return Number.isFinite(responseStatus) ? responseStatus : undefined
}

export function getApiErrorMessage(error: unknown, fallback = '请求失败') {
  return error instanceof Error && error.message ? error.message : fallback
}

function handleUnauthorized(message: string) {
  const userStore = useUserStore()
  userStore.clearLogin()
  if (router.currentRoute.value.path !== '/login') {
    ElMessage.warning(message)
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
  }
}

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
    const suppressGlobalError = (response.config as ApiRequestConfig).suppressGlobalError === true
    // 文件流（Excel 模板下载等）直接透传
    if (response.config.responseType === 'blob') {
      return response
    }
    if (result.code === 200) {
      return result.data as never
    }
    if (result.code === 401) {
      const message = result.message || '登录已过期，请重新登录'
      handleUnauthorized(message)
      return Promise.reject(createApiError(message, result.code))
    }
    const message = result.message || '请求失败'
    if (!suppressGlobalError) {
      if (result.code === 403) {
        ElMessage.warning(message)
      } else {
        ElMessage.error(message)
      }
    }
    return Promise.reject(createApiError(message, result.code))
  },
  (error) => {
    const responseData = error.response?.data && typeof error.response.data === 'object'
      ? error.response.data as Partial<Result>
      : undefined
    const statusValue = Number(responseData?.code ?? error.response?.status)
    const status = Number.isFinite(statusValue) ? statusValue : undefined
    const message = responseData?.message
      || (error.message === 'Network Error' ? '网络错误，请检查后端服务是否启动' : (error.message || '请求异常'))

    const suppressGlobalError = (error.config as ApiRequestConfig | undefined)?.suppressGlobalError === true
    if (status === 401) {
      handleUnauthorized(message)
    } else if (!suppressGlobalError) {
      if (status === 403) {
        ElMessage.warning(message)
      } else {
        ElMessage.error(message)
      }
    }

    const apiError = error as ApiRequestError
    apiError.message = message
    apiError.status = status
    return Promise.reject(apiError)
  },
)

/**
 * 类型化请求封装：resolve 出的直接是 Result.data
 */
function request<T = void>(config: ApiRequestConfig): Promise<T> {
  return instance.request(config)
}

export function get<T = void>(url: string, params?: Record<string, unknown>, config?: ApiRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'get', url, params })
}

export function post<T = void>(url: string, data?: unknown, config?: ApiRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'post', url, data })
}

export function put<T = void>(url: string, data?: unknown, config?: ApiRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'put', url, data })
}

export function del<T = void>(url: string, params?: Record<string, unknown>): Promise<T> {
  return request<T>({ method: 'delete', url, params })
}

export { instance }
export default request
