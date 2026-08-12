/**
 * ECharts 主题工具：把 design tokens（CSS 自定义属性）解析成 ECharts 可用的具体色值。
 *
 * ECharts 的 canvas 渲染不认识 `var(--xxx)`，必须经 getComputedStyle 取值，
 * 且需在组件 onMounted 之后调用（此时 tokens.css 已生效）。
 */

/** 读取 :root 上的 CSS 变量值（如 cssVar('--brand-600')） */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** 图表默认调色：单一度量场景一律用品牌色，不做彩虹色 */
export function chartColors() {
  return {
    primary: cssVar('--chart-primary'),
    primaryDark: cssVar('--brand-700'),
    primaryLight: cssVar('--brand-100'),
    cyan: cssVar('--chart-cyan'),
    violet: cssVar('--chart-violet'),
    success: cssVar('--success'),
    warning: cssVar('--warning'),
    danger: cssVar('--danger'),
    axisLabel: cssVar('--chart-axis'),
    axisLine: cssVar('--chart-grid'),
    splitLine: cssVar('--chart-grid'),
    text: cssVar('--chart-text'),
    // 浮层（tooltip）背景：随主题的悬浮表面，避免深色下白底 tooltip
    surface: cssVar('--surface-elevated'),
  }
}
