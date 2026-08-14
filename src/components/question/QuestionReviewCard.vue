<template>
  <article class="question-review-card">
    <div class="qrc-title">
      <span class="qrc-index">{{ index + 1 }}.</span>
      <el-tag v-if="question" :type="typeTag(question.type)" size="small">
        {{ typeText(question.type, question.multi) }}
      </el-tag>
      <el-tag v-if="scoreText" type="info" size="small" effect="plain">{{ scoreText }}</el-tag>
      <slot name="status" />
      <span class="qrc-text">{{ question?.title ?? titleFallback }}</span>
    </div>

    <div v-if="question?.choices?.length" class="qrc-choices">
      <div v-for="(c, ci) in question.choices" :key="ci" class="qrc-choice" :class="{ correct: c.isCorrect }">
        {{ letter(ci) }}. {{ c.content }}
        <el-icon v-if="c.isCorrect" class="qrc-check"><Check /></el-icon>
      </div>
    </div>

    <div v-if="$slots.answer" class="qrc-answer">
      <slot name="answer" />
    </div>

    <div class="qrc-answer-line">
      <el-text type="success">标准答案：{{ question?.answer?.answer || '-' }}</el-text>
      <el-text v-if="question?.answer?.keywords" type="info">关键词：{{ question.answer.keywords }}</el-text>
    </div>

    <div v-if="$slots.feedback" class="qrc-feedback">
      <slot name="feedback" />
    </div>

    <div v-if="question?.analysis" class="qrc-analysis">解析：{{ question.analysis }}</div>
  </article>
</template>

<script setup lang="ts">
import { Check } from '@element-plus/icons-vue'
import type { Question } from '@/types'
import { typeText, typeTag, letter } from '@/utils/format'

withDefaults(defineProps<{
  index: number
  question?: Question | null
  /** 题目缺失时标题的回退文本 */
  titleFallback?: string
  /** 纯分值展示，如 “5 分” */
  scoreText?: string
}>(), {
  question: null,
  titleFallback: '',
  scoreText: '',
})
</script>

<style scoped>
.qrc-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 500;
}

.qrc-index {
  color: var(--text-muted);
}

.qrc-text {
  flex: 1;
  min-width: 0;
}

.qrc-choices {
  margin: var(--space-3) 0 0 var(--space-6);
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--text-secondary);
}

.qrc-choice.correct {
  color: var(--success);
  font-weight: 600;
}

.qrc-check {
  color: var(--success);
  vertical-align: -2px;
}

.qrc-answer {
  margin: var(--space-3) 0 0 var(--space-6);
  font-size: 13px;
}

.qrc-answer-line {
  margin: var(--space-3) 0 0 var(--space-6);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.qrc-feedback {
  margin: var(--space-2) 0 0 var(--space-6);
}

.qrc-analysis {
  margin: var(--space-2) 0 0 var(--space-6);
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 768px) {
  .qrc-choices,
  .qrc-answer,
  .qrc-answer-line,
  .qrc-feedback,
  .qrc-analysis {
    margin-left: 0;
  }

  .qrc-title {
    flex-wrap: wrap;
  }
}
</style>
