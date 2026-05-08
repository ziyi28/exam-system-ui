<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="gradient-text">选择考试试卷</h2>
      <p class="page-desc">选择已发布的试卷开始考试</p>
    </div>

    <div class="papers-grid" v-loading="loading">
      <div v-for="paper in papers" :key="paper.id" class="paper-card glass-card" @click="startExam(paper)">
        <div class="paper-badge">
          <el-icon :size="20"><Notebook /></el-icon>
        </div>
        <h3 class="paper-name">{{ paper.name }}</h3>
        <p class="paper-desc">{{ paper.description || '暂无描述' }}</p>
        <div class="paper-meta">
          <span><el-icon><Document /></el-icon> {{ paper.questionCount || 0 }} 题</span>
          <span><el-icon><Timer /></el-icon> {{ paper.duration || 0 }} 分钟</span>
          <span><el-icon><StarFilled /></el-icon> {{ paper.totalScore || 0 }} 分</span>
        </div>
        <el-button type="primary" class="start-btn" round>开始考试</el-button>
      </div>

      <div v-if="!loading && papers.length === 0" class="empty-state glass-card">
        <el-icon :size="48"><Document /></el-icon>
        <p>暂无可用试卷</p>
      </div>
    </div>

    <!-- 输入姓名对话框 -->
    <el-dialog v-model="nameDialogVisible" title="开始考试" width="400px">
      <el-form @submit.prevent="confirmStart">
        <el-form-item label="考生姓名" required>
          <el-input v-model="studentName" placeholder="请输入您的姓名" size="large" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStart">确认开始</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listPapers } from '@/api/paper'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const papers = ref([])
const nameDialogVisible = ref(false)
const studentName = ref('')
const selectedPaper = ref(null)

async function loadPapers() {
  loading.value = true
  try {
    const res = await listPapers({ status: 'PUBLISHED' })
    papers.value = res.data || []
  } catch (e) { /* ignore */ }
  loading.value = false
}

function startExam(paper) {
  selectedPaper.value = paper
  studentName.value = userStore.realName || ''
  nameDialogVisible.value = true
}

function confirmStart() {
  if (!studentName.value.trim()) return
  router.push({
    path: `/exam/${selectedPaper.value.id}`,
    query: { name: studentName.value }
  })
}

onMounted(() => loadPapers())
</script>

<style scoped>
.page-container { padding: 4px; }
.page-header { margin-bottom: 24px; }
.page-header h2 { font-size: 1.5rem; margin-bottom: 4px; }
.page-desc { color: var(--text-muted); font-size: 0.9rem; }

.papers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.paper-card {
  padding: 28px;
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
}
.paper-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.2);
}
.paper-badge {
  width: 44px; height: 44px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 16px;
}
.paper-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.paper-desc {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 16px;
  flex: 1;
}
.paper-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 0.82rem;
  color: var(--text-secondary);
}
.paper-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.start-btn { width: 100%; }

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px;
  color: var(--text-muted);
}
</style>
