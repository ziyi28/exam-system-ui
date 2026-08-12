<template>
  <header class="app-page-header">
    <div class="app-page-header__copy">
      <span v-if="eyebrow" class="app-page-header__eyebrow">{{ eyebrow }}</span>
      <h1 class="app-page-header__title">{{ title }}</h1>
      <p v-if="description" class="app-page-header__desc">{{ description }}</p>
      <div v-if="$slots.meta" class="app-page-header__meta">
        <slot name="meta" />
      </div>
    </div>
    <div v-if="$slots.actions" class="app-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  eyebrow?: string
}>(), {
  description: undefined,
  eyebrow: undefined,
})
</script>

<style scoped>
.app-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: 92px;
  margin-bottom: var(--space-5);
  padding: 18px 0 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.app-page-header__copy {
  min-width: 0;
}

.app-page-header__eyebrow {
  display: inline-flex;
  align-items: center;
  margin-bottom: 8px;
  color: var(--brand-600);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.app-page-header__title {
  margin: 0;
  font-size: clamp(24px, 2vw, 30px);
  font-weight: 700;
  line-height: 1.25;
  color: var(--text-strong);
  letter-spacing: -0.025em;
}

.app-page-header__desc {
  margin: 8px 0 0;
  max-width: 680px;
  font-size: 14px;
  color: var(--text-secondary);
}

.app-page-header__meta {
  margin-top: 12px;
}

.app-page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .app-page-header {
    align-items: flex-start;
    flex-direction: column;
    min-height: 0;
    margin-bottom: var(--space-5);
    padding: 14px 0 18px;
  }

  .app-page-header__title {
    font-size: 21px;
  }

  .app-page-header__actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
