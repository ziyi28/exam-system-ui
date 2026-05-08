<template>
  <div class="page-container">
    <div class="page-header"><h2 class="gradient-text">视频投稿</h2><p class="page-desc">上传您的视频作品</p></div>
    <div class="submit-form glass-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="视频标题" prop="title"><el-input v-model="form.title" placeholder="请输入视频标题" /></el-form-item>
        <el-form-item label="视频描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="分类" prop="categoryId"><el-select v-model="form.categoryId" placeholder="选择分类"><el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="上传者" prop="uploaderName"><el-input v-model="form.uploaderName" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="标签"><el-input v-model="form.tags" placeholder="标签,逗号分隔" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="时长(秒)"><el-input-number v-model="form.duration" :min="1" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="视频文件" prop="videoFile"><el-upload action="#" :auto-upload="false" :on-change="f => form.videoFile = f.raw" :limit="1" accept="video/*"><el-button><el-icon><Upload /></el-icon> 选择视频</el-button></el-upload></el-form-item>
        <el-form-item label="封面图片"><el-upload action="#" :auto-upload="false" :on-change="f => form.coverFile = f.raw" :limit="1" accept="image/*"><el-button><el-icon><Picture /></el-icon> 选择封面</el-button></el-upload></el-form-item>
        <el-form-item><el-button type="primary" @click="handleSubmit" :loading="submitting" size="large"><el-icon><Upload /></el-icon> 提交投稿</el-button></el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { submitVideo } from '@/api/video'
import { getVideoCategories } from '@/api/videoCategory'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
const userStore = useUserStore(); const formRef = ref(); const submitting = ref(false); const categories = ref([])
const form = reactive({ title: '', description: '', categoryId: null, tags: '', uploaderName: userStore.realName || '', duration: 60, videoFile: null, coverFile: null })
const rules = { title: [{ required: true, message: '请输入标题' }], categoryId: [{ required: true, message: '请选择分类' }], uploaderName: [{ required: true, message: '请输入名称' }] }
async function handleSubmit() { const v = await formRef.value?.validate().catch(() => false); if (!v) return; if (!form.videoFile) return ElMessage.warning('请选择视频文件'); submitting.value = true; try { const fd = new FormData(); Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k === 'videoFile' ? 'videoFile' : k === 'coverFile' ? 'coverFile' : k, v) }); await submitVideo(fd); ElMessage.success('投稿成功，等待审核') } catch (e) {} submitting.value = false }
onMounted(async () => { try { const res = await getVideoCategories(); categories.value = res.data || [] } catch (e) {} })
</script>
<style scoped>.page-container{padding:4px;max-width:800px}.page-header{margin-bottom:24px}.page-header h2{font-size:1.4rem;margin-bottom:4px}.page-desc{color:var(--text-muted);font-size:.9rem}.submit-form{padding:32px}</style>
