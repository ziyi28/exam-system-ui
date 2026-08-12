<template>
  <span class="brand-mark" :class="{ 'is-compact': compact }">
    <svg class="brand-mark__glyph" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient :id="gradId" x1="6" y1="3" x2="34" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" style="stop-color: var(--brand-600)" />
          <stop offset="1" style="stop-color: var(--brand-700)" />
        </linearGradient>
      </defs>
      <!-- 答卷页片 -->
      <rect x="3" y="3" width="28" height="33" rx="7" :fill="`url(#${gradId})`" />
      <!-- 右上折角 -->
      <path d="M22 3h6.5A2.5 2.5 0 0 1 31 5.5V11h-9z" fill="var(--brand-800)" opacity=".55" />
      <!-- 知识轨道（折线连接三节点） -->
      <path d="M11 15.5 19.5 11 28 15.5" stroke="var(--surface-1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".9" />
      <!-- 三个知识节点 -->
      <circle cx="11" cy="15.5" r="2.8" fill="var(--surface-1)" />
      <circle cx="19.5" cy="11" r="2.8" fill="var(--accent-cyan)" stroke="var(--surface-1)" stroke-width="1.4" />
      <circle cx="28" cy="15.5" r="2.8" fill="var(--accent-violet)" stroke="var(--surface-1)" stroke-width="1.4" />
      <!-- 页内作答线 -->
      <rect x="9" y="22" width="17" height="2.6" rx="1.3" fill="var(--surface-1)" opacity=".5" />
      <rect x="9" y="27.5" width="11" height="2.6" rx="1.3" fill="var(--surface-1)" opacity=".35" />
      <!-- 完成勾 -->
      <path d="M24 28.5l2 2.2 3.6-4.3" stroke="var(--accent-cyan)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span v-if="!compact" class="brand-mark__word">
      <span class="brand-mark__name">智能考试系统</span>
      <span v-if="subtitle" class="brand-mark__subtitle">{{ subtitle }}</span>
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

const gradId = `bm-page-${useId()}`
</script>

<style scoped>
.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-mark__glyph {
  flex: none;
  width: 40px;
  height: 40px;
  display: block;
}

.is-compact .brand-mark__glyph {
  width: 30px;
  height: 30px;
}

.brand-mark__word {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.brand-mark__name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-strong);
  white-space: nowrap;
}

.brand-mark__subtitle {
  margin-top: 3px;
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
