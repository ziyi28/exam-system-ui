/**
 * 明暗主题唯一状态入口。
 *
 * 主题初始化（首屏无闪烁）在 index.html 的内联脚本中完成，这里负责组件内的
 * 状态、切换和持久化。为避免与登录业务耦合，主题不进入 Pinia user store，
 * 也不监听登录态。
 */

import { computed, ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'exam_theme'

/** 模块级单例：初始化时跟随 index.html 内联脚本已经应用的 DOM 状态 */
const theme = ref<Theme>(document.documentElement.classList.contains('dark') ? 'dark' : 'light')

function apply(next: Theme) {
  const root = document.documentElement
  root.dataset.theme = next
  root.classList.toggle('dark', next === 'dark')
  root.style.colorScheme = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // 隐私模式等场景下 localStorage 不可写，仅跳过持久化
  }
}

export function setTheme(next: Theme) {
  theme.value = next
  apply(next)
}

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, isDark, setTheme, toggleTheme }
}
