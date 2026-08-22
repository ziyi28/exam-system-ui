<template>
  <span class="brand-mark" :class="{ 'is-compact': compact }">
    <svg class="brand-mark__glyph" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <defs>
        <linearGradient :id="gradId" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="var(--brand-600)" />
          <stop offset="1" stop-color="var(--accent-cyan)" />
        </linearGradient>
      </defs>
      <!-- 终端外框：六角/切角精密外框 -->
      <rect x="2.5" y="2.5" width="31" height="31" rx="4" stroke="var(--border-strong)" stroke-width="1.5" fill="var(--surface-2)" />
      <!-- 内部对角导轨 -->
      <path d="M7 18h22M18 7v22" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="2 2" />
      <!-- 终端核心菱形 -->
      <path d="M18 9l9 9-9 9-9-9z" fill="color-mix(in srgb, var(--brand-600) 15%, transparent)" stroke="url(#BM_GRAD_ID)" stroke-width="1.5" />
      <!-- 中央数据脉冲节点 -->
      <circle cx="18" cy="18" r="2.5" fill="var(--brand-600)" />
      <circle cx="18" cy="18" r="5" stroke="var(--brand-600)" stroke-width="0.8" stroke-dasharray="1.5 1.5" opacity="0.8" />
    </svg>
    <span v-if="!compact" class="brand-mark__word">
      <span class="brand-mark__name">智能考试系统</span>
      <span class="brand-mark__subtitle">{{ subtitle || 'ASSESSMENT_TERMINAL' }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  compact?: boolean
  subtitle?: string
}>(), {
  compact: false,
  subtitle: undefined,
})

const gradId = `BM_GRAD_ID`
</script>

<style scoped>
.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  user-select: none;
}

.brand-mark__glyph {
  flex: none;
  width: 32px;
  height: 32px;
  display: block;
}

.is-compact .brand-mark__glyph {
  width: 26px;
  height: 26px;
}

.brand-mark__word {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.15;
}

.brand-mark__name {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-strong);
  white-space: nowrap;
}

.brand-mark__subtitle {
  margin-top: 2px;
  font-size: 9px;
  font-weight: 700;
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
  color: var(--brand-600);
  white-space: nowrap;
}
</style>
