---
name: 智能考试系统 (Cybernetic Assessment Terminal)
description: 极高信息密度与纯粹理性秩序的现代数智考务与 AI 知识库终端
colors:
  primary: "#00e58b"
  primary-hover: "#33f3a6"
  primary-active: "#00c776"
  accent-cyan: "#00d5ff"
  accent-violet: "#8b5cf6"
  accent-indigo: "#6366f1"
  neutral-bg: "#090d16"
  surface: "#0e1524"
  surface-2: "#151e32"
  surface-elevated: "#1a253c"
  text-strong: "#f8fafc"
  text-primary: "#e2e8f0"
  text-secondary: "#8da0be"
  text-muted: "#53647e"
  border-subtle: "#172238"
  border-default: "#223250"
  border-strong: "#364b73"
  success: "#00e58b"
  warning: "#fbbf24"
  danger: "#f43f5e"
  medal-gold: "#f59e0b"
  medal-silver: "#94a3b8"
  medal-bronze: "#d97706"
typography:
  display:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
rounded:
  xs: "2px"
  sm: "2px"
  md: "4px"
  lg: "6px"
  xl: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#050b14"
    rounded: "{rounded.md}"
    padding: "7px 14px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
---

# Design System: 智能考试系统 (Precision Academic Terminal)

## Overview

**Creative North Star: "精密学术终端与数智考务实验室 (The Precision Academic Terminal & Assessment Laboratory)"**

本设计体系彻底颠覆了通用中后台的圆润糖果色、低信息密度与大面积弥散阴影，构建了一套服务于严肃在线考试、AI 智能出题与 RAG 知识库检索的工业级数智考务终端。全站以暗黑模式（深空碳素）作为第一公民，辅以高反差科研冷白实验室模式。界面通过发丝级精密边框（Hairline Steel）、微倒角（Chiseled Angles）、全量等宽数据排版以及终端高光脉冲信号，为教师提供如工业中控台般的作业效能，为学生提供专注无扰的机考实战环境。

**Key Characteristics:**
- **硬朗微倒角与发丝边框**：全站圆角严格收敛于 2px 与 4px，彻底清除大圆角玩具感；边框采用 1px 精密发丝线。
- **等宽数据第一优先**：所有时间、题号、分数、代码、指标数值一律强制使用等宽单色代码字体与 `tabular-nums`。
- **高饱和终端信号色**：以高光青绿 (`#00e58b`) 作为核心操作与脉冲信号，电离冷青 (`#00d5ff`) 作为知识召回标识。
- **零模糊微发光**：常态下 Flat-by-Default 无阴影，激活态提供精准的微内发光与发丝发光环。

## Colors

色彩体系以深空碳黑作为纯净基底，高饱和电子青绿作为主信号指示，状态分明、拒绝模糊。

### Primary
- **终端高光青绿 (Terminal Neon Emerald)** (`#00e58b` / 明亮模式 `#059669`): 主操作、AI 计算脉冲、提交试卷、激活高光。
- **主操作文字色 (Text on Brand)** (`#050b14` / 明亮模式 `#ffffff`): 保证 WCAG 文本对比度达到 8.5:1 超高清晰度。

### Secondary
- **电离冷青 (Ion Cyan)** (`#00d5ff` / 明亮模式 `#0284c7`): RAG 知识库检索召回、溯源切片、辅助状态。

### Tertiary
- **量子紫 (Quantum Violet)** (`#8b5cf6` / 明亮模式 `#6366f1`): 智能出题、知识图谱与分类标记。

### Neutral
- **画布背景 (Canvas BG)** (`#090d16` / 明亮模式 `#f1f5f9`): 纯净深碳黑底，微细点阵氛围。
- **表面层阶 1 (Surface 1)** (`#0e1524` / 明亮模式 `#ffffff`): 卡片基底、表格行、工作台面板。
- **表面层阶 2 (Surface 2)** (`#151e32` / 明亮模式 `#f8fafc`): 筛选栏容器、表格表头。
- **表面提升层阶 (Surface Elevated)** (`#1a253c` / 明亮模式 `#ffffff`): 对话框、下拉菜单、浮层。
- **精密边框 (Border Default)** (`#223250` / 明亮模式 `#cbd5e1`): 1px 精密发丝线。
- **细分割线 (Border Subtle)** (`#172238` / 明亮模式 `#e2e8f0`): 内部细分隔。

### Functional & Semantic
- **成功绿 (Success)** (`#00e58b` / 明亮模式 `#16a34a`): 判题正确、已发布。
- **警告琥珀 (Warning)** (`#fbbf24` / 明亮模式 `#d97706`): 倒计时临近、待审核。
- **激光警戒红 (Danger)** (`#f43f5e` / 明亮模式 `#dc2626`): 判题错误、删除确认、作弊阻断。

### Named Rules
**The Hairline Precision Rule.** 容器之间仅依靠 1px 发丝边框与表面色阶建立边界，严禁使用 >1px 的单侧粗边框装饰。

**The Monospace-First Numeral Rule.** 凡涉及成绩分数、考试倒计时、题号索引、切屏计数，必须强制开启等宽字体与 `font-variant-numeric: tabular-nums`。

## Typography

字体体系严格区分正文阅读与等宽数据标识。

**Display & Body:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'HarmonyOS Sans SC', sans-serif`
**Mono & Numbers:** `'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace`

### Hierarchy
- **Display** (800, `24px`, 1.2, `-0.03em`): 页面顶层大标与登录终端主标。
- **Headline** (700, `18px`, 1.3, `-0.02em`): 仪表盘主数据卡片、试卷大题分卷标题。
- **Title** (700, `14px`, 1.4, `-0.01em`): 卡片 Header、对话框标题、区块标题。
- **Body** (400, `13px`, 1.55, `normal`): 题目题干、选项正文、表格内容、表单字段。
- **Label / Tag** (600, `11px`, 1.3, `0.02em`): 状态标签、等宽徽章、题号角标。

## Layout

布局面向 1080p~4K 宽屏大画幅优化。

- **最大内容宽度**:
  - 管理端：`max-width: 1600px`（大屏高信息密度）
  - 学生端：`max-width: 1320px`（集中视线）
- **侧边栏结构**:
  - 展开宽度：`240px`，折叠宽度：`64px`
- **顶栏高度**: `56px`

## Elevation & Depth

系统采用 **“发丝分层与微发光”** 的深度哲学。静态平铺，激活发光。

### Shadow Vocabulary
- **微层阴影 (`--shadow-xs`)** (`0 1px 2px rgba(0, 0, 0, 0.4)`): 用于次级小部件。
- **中层阴影 (`--shadow-md`)** (`0 8px 24px rgba(0, 0, 0, 0.6)`): 下拉菜单、消息提示。
- **高层阴影 (`--shadow-lg`)** (`0 16px 40px rgba(0, 0, 0, 0.75)`): 模态对话框。
- **终端微发光 (`--glow-brand`)** (`0 0 12px rgba(0, 229, 139, 0.25)`): 聚焦环与高光按钮悬停。

## Shapes

系统贯彻微倒角语言：
- **微倒角 (`--radius-xs: 2px`)**: 标签、勾选框、分页按钮。
- **标准倒角 (`--radius-md: 4px`)**: 按钮、输入框、下拉框。
- **容器倒角 (`--radius-lg: 6px`)**: 卡片容器、表格外壳、模态对话框。

## Components

### Buttons
- **Shape:** 标准微倒角 (`--radius-md: 4px`)，字重 600。
- **Primary:** 背景 `var(--brand-600)`，文字 `var(--text-on-brand)`。
- **Active:** `transform: translateY(1px)`，提供迅捷机械按压反馈。

### Cards
- **Corner:** 容器倒角 (`--radius-lg: 6px`)，发丝边框 `1px solid var(--border-default)`，无常态阴影。
- **Header:** 紧凑 14px 字号/字重 700，底部 `1px solid var(--border-subtle)`。

### Inputs & Selects
- **Height:** 紧凑 34px，微倒角 (`--radius-md: 4px`)。
- **Focus:** `box-shadow: 0 0 0 1px var(--brand-600) inset, var(--glow-brand)`。

### Tables
- **Header:** 高度 40px，字重 700，字号 12px。
- **Row:** 紧凑 8px 内衬，等宽数字对齐。

## Do's and Don'ts

### Do:
- **Do** 强制在所有包含时间、分值、题号、指标的展示中使用等宽字体与 `tabular-nums`。
- **Do** 遵循 2px/4px/6px 微倒角体系，保持硬朗工业质感。
- **Do** 按钮交互必须配置 `:active { transform: translateY(1px) }` 机械按压反馈。

### Don't:
- **Don't** 禁止使用 >6px 的大圆角与柔和圆角（如 8px/12px/16px）。
- **Don't** 禁止使用单侧粗边框（`border-left: 3px/4px`）作为状态装饰。
- **Don't** 禁止在静态卡片上添加大扩散常态弥散阴影。
