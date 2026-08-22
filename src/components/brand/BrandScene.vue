<template>
  <!-- login：竖向构图；home：横向构图。纯装饰，忽略读屏与鼠标事件。 -->
  <svg
    v-if="variant === 'login'"
    class="brand-scene brand-scene--login"
    viewBox="0 0 340 420"
    fill="none"
    aria-hidden="true"
    preserveAspectRatio="xMidYMid meet"
  >
    <!-- 背景装饰环 -->
    <circle cx="292" cy="74" r="104" stroke="var(--brand-100)" stroke-width="2" opacity=".8" />
    <circle cx="292" cy="74" r="120" stroke="var(--accent-cyan)" stroke-width="1.5" stroke-dasharray="3 9" opacity=".4" />
    <!-- 左上漂浮勾选徽章 -->
    <g class="scene-float">
      <circle cx="58" cy="134" r="17" fill="var(--accent-cyan-soft)" />
      <path d="M50.5 135.5l5 5 9-10.5" stroke="var(--accent-cyan)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    </g>
    <!-- 进度环 -->
    <circle cx="250" cy="122" r="34" fill="var(--surface-glass)" stroke="var(--border-default)" />
    <circle cx="250" cy="122" r="23" stroke="var(--brand-100)" stroke-width="6" />
    <circle cx="250" cy="122" r="23" stroke="var(--brand-600)" stroke-width="6" stroke-linecap="round" stroke-dasharray="101 144.5" transform="rotate(-90 250 122)" />
    <text x="250" y="127" text-anchor="middle" font-size="15" font-weight="700" fill="var(--text-strong)">86</text>
    <!-- 主试卷卡片 -->
    <rect x="72" y="150" width="196" height="168" rx="16" fill="var(--surface-glass)" stroke="var(--border-default)" />
    <rect x="96" y="174" width="96" height="10" rx="5" fill="var(--brand-600)" opacity=".9" />
    <rect x="96" y="194" width="60" height="8" rx="4" fill="var(--text-muted)" opacity=".5" />
    <path d="M96 216h148" stroke="var(--border-default)" />
    <!-- 作答选项 -->
    <circle cx="100" cy="240" r="5" fill="var(--surface-1)" stroke="var(--border-strong)" />
    <rect x="114" y="237" width="106" height="6" rx="3" fill="var(--text-muted)" opacity=".42" />
    <circle cx="100" cy="262" r="5" fill="var(--brand-600)" />
    <rect x="114" y="259" width="88" height="6" rx="3" fill="var(--text-muted)" opacity=".42" />
    <circle cx="100" cy="284" r="5" fill="var(--surface-1)" stroke="var(--border-strong)" />
    <rect x="114" y="281" width="70" height="6" rx="3" fill="var(--text-muted)" opacity=".34" />
    <!-- 完成徽章 -->
    <circle cx="234" cy="296" r="13" fill="var(--accent-cyan)" />
    <path d="M228.5 296.5l4 4.2 7-7.8" stroke="var(--surface-1)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    <!-- 知识轨道与节点 -->
    <path d="M126 318c24 34-30 50-8 82" stroke="var(--accent-violet)" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 7" />
    <circle cx="126" cy="318" r="9" fill="var(--brand-100)" />
    <circle cx="126" cy="318" r="4" fill="var(--brand-600)" />
    <circle cx="130" cy="352" r="9" fill="var(--accent-cyan-soft)" />
    <circle cx="130" cy="352" r="4" fill="var(--accent-cyan)" />
    <circle cx="118" cy="400" r="10" fill="var(--accent-violet-soft)" />
    <circle cx="118" cy="400" r="4.6" fill="var(--accent-violet)" />
    <!-- 浮动知识小卡 -->
    <g class="scene-float scene-float--delay">
      <rect x="42" y="352" width="66" height="30" rx="9" fill="var(--surface-glass)" stroke="var(--border-default)" />
      <circle cx="58" cy="367" r="4.5" fill="var(--accent-cyan)" />
      <rect x="70" y="364" width="24" height="6" rx="3" fill="var(--text-muted)" opacity=".5" />
    </g>
    <!-- 装饰点 -->
    <circle cx="280" cy="368" r="6" fill="var(--accent-violet)" opacity=".45" />
    <circle cx="70" cy="56" r="4" fill="var(--accent-cyan)" opacity=".5" />
  </svg>

  <svg
    v-else
    class="brand-scene brand-scene--home"
    viewBox="0 0 560 340"
    fill="none"
    aria-hidden="true"
    preserveAspectRatio="xMidYMid meet"
  >
    <!-- 背景装饰环 -->
    <circle cx="486" cy="88" r="110" stroke="var(--brand-100)" stroke-width="2" opacity=".8" />
    <circle cx="486" cy="88" r="128" stroke="var(--accent-cyan)" stroke-width="1.5" stroke-dasharray="3 9" opacity=".4" />
    <!-- 左上漂浮勾选徽章 -->
    <g class="scene-float">
      <circle cx="50" cy="92" r="17" fill="var(--accent-cyan-soft)" />
      <path d="M42.5 93.5l5 5 9-10.5" stroke="var(--accent-cyan)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    </g>
    <!-- 主试卷卡片 -->
    <rect x="64" y="86" width="236" height="168" rx="16" fill="var(--surface-glass)" stroke="var(--border-default)" />
    <rect x="88" y="110" width="104" height="10" rx="5" fill="var(--brand-600)" opacity=".9" />
    <rect x="88" y="130" width="66" height="8" rx="4" fill="var(--text-muted)" opacity=".5" />
    <path d="M88 152h188" stroke="var(--border-default)" />
    <circle cx="92" cy="178" r="5" fill="var(--surface-1)" stroke="var(--border-strong)" />
    <rect x="106" y="175" width="128" height="6" rx="3" fill="var(--text-muted)" opacity=".42" />
    <circle cx="92" cy="200" r="5" fill="var(--brand-600)" />
    <rect x="106" y="197" width="104" height="6" rx="3" fill="var(--text-muted)" opacity=".42" />
    <circle cx="92" cy="222" r="5" fill="var(--surface-1)" stroke="var(--border-strong)" />
    <rect x="106" y="219" width="84" height="6" rx="3" fill="var(--text-muted)" opacity=".34" />
    <circle cx="272" cy="234" r="13" fill="var(--accent-cyan)" />
    <path d="M266.5 234.5l4 4.2 7-7.8" stroke="var(--surface-1)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    <!-- 知识轨道横贯 -->
    <path d="M170 254c90 38 166 40 254-16" stroke="var(--accent-violet)" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 7" />
    <circle cx="170" cy="254" r="9" fill="var(--brand-100)" />
    <circle cx="170" cy="254" r="4" fill="var(--brand-600)" />
    <circle cx="282" cy="288" r="9" fill="var(--accent-cyan-soft)" />
    <circle cx="282" cy="288" r="4" fill="var(--accent-cyan)" />
    <circle cx="424" cy="238" r="13" fill="var(--accent-violet-soft)" />
    <circle cx="424" cy="238" r="6" fill="var(--accent-violet)" />
    <!-- 浮动知识小卡 -->
    <g class="scene-float scene-float--delay">
      <rect x="474" y="216" width="72" height="32" rx="9" fill="var(--surface-glass)" stroke="var(--border-default)" />
      <circle cx="490" cy="232" r="4.5" fill="var(--accent-cyan)" />
      <rect x="502" y="229" width="28" height="6" rx="3" fill="var(--text-muted)" opacity=".5" />
    </g>
    <!-- 装饰点 -->
    <circle cx="120" cy="60" r="5" fill="var(--accent-cyan)" opacity=".5" />
    <circle cx="520" cy="152" r="5" fill="var(--accent-violet)" opacity=".45" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant: 'login' | 'home'
}>(), {
  variant: 'login',
})
</script>

<style scoped>
.brand-scene {
  width: 100%;
  height: auto;
  display: block;
}

.brand-scene--login {
  max-width: 320px;
}

.brand-scene--home {
  max-width: 560px;
}

.scene-float {
  animation: scene-float 6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.scene-float--delay {
  animation-delay: -2.6s;
}

@keyframes scene-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-7px);
  }
}
</style>
