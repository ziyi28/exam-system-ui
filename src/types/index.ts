/**
 * 全局类型定义 - 与后端实体/VO 一一对应
 */

/** 统一响应结构（common/Result.java） */
export interface Result<T = unknown> {
  code: number
  message: string
  data: T
}

/** 自定义分页结构（vo/PageResult.java，用户管理接口） */
export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}

/** MyBatis-Plus Page 结构（考试记录/视频列表接口） */
export interface MpPage<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages?: number
}

// ==================== 用户 ====================

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT'
export type UserStatus = 'ACTIVE' | 'INACTIVE'

export interface LoginUser {
  userId: number
  username: string
  realName: string
  role: Role
  token?: string
}

export interface User {
  id: number
  username: string
  password?: string | null
  realName: string
  role: Role
  status: UserStatus
  createTime?: string
  updateTime?: string
}

// ==================== 题库 ====================

export type QuestionType = 'CHOICE' | 'JUDGE' | 'TEXT'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface QuestionChoice {
  id?: number
  questionId?: number
  content: string
  isCorrect: boolean
  sort: number
}

export interface QuestionAnswer {
  id?: number
  questionId?: number
  answer: string
  keywords?: string
}

export interface Question {
  id?: number
  title: string
  type: QuestionType
  multi?: boolean
  categoryId?: number
  difficulty: Difficulty
  score?: number
  paperScore?: number
  analysis?: string
  choices?: QuestionChoice[]
  answer?: QuestionAnswer
  category?: Category
  createTime?: string
  updateTime?: string
}

export interface Category {
  id?: number
  name: string
  parentId?: number
  sort?: number
  children?: Category[]
  count?: number
}

// ==================== 试卷 ====================

export type PaperStatus = 'DRAFT' | 'PUBLISHED' | 'STOPPED'

export interface Paper {
  id?: number
  name: string
  description?: string
  status?: PaperStatus
  totalScore?: number
  questionCount?: number
  duration?: number
  questions?: Question[]
  createTime?: string
  updateTime?: string
}

/** 手动组卷参数（vo/PaperVo.java） */
export interface PaperForm {
  name: string
  description?: string
  duration?: number
  /** key: 题目ID, value: 分值 */
  questions: Record<number, number>
}

/** AI 组卷规则（vo/RuleVo.java） */
export interface PaperRule {
  type: QuestionType
  categoryIds?: number[]
  count: number
  score: number
}

/** AI 组卷参数（vo/AiPaperVo.java） */
export interface AiPaperForm {
  name: string
  description?: string
  duration?: number
  rules: PaperRule[]
}

// ==================== 考试 ====================

export type ExamRecordStatus = '进行中' | '已完成' | '已批阅'

export interface AnswerRecord {
  id?: number
  examRecordId: number
  questionId: number
  userAnswer: string
  score?: number
  /** 0 错误 / 1 正确 / 2 部分正确 */
  isCorrect?: number
  aiCorrection?: string
}

export interface ExamRecord {
  id: number
  /** 历史命名：实际是试卷ID */
  examId: number
  userId?: number
  studentName: string
  score: number
  /** 已批阅后为 AI 总评（JSON 字符串或纯文本） */
  answers?: string
  startTime?: string
  endTime?: string
  status: ExamRecordStatus
  windowSwitches?: number
  answerRecords?: AnswerRecord[]
  paper?: Paper
  createTime?: string
}

export interface SubmitAnswer {
  questionId: number
  userAnswer: string
}

export interface ExamRanking {
  id: number
  studentName: string
  score: number
  examId: number
  paperName: string
  paperTotalScore: number
  startTime?: string
  endTime?: string
  duration?: number
  paper?: { id: number; name: string; totalScore: number }
}

// ==================== 公告 / 轮播图 ====================

export type NoticeType = 'SYSTEM' | 'FEATURE' | 'NOTICE'

export interface Notice {
  id?: number
  title: string
  content: string
  type: NoticeType
  /** 0 普通 / 1 重要 / 2 紧急 */
  priority: number
  isActive: boolean
  createTime?: string
  updateTime?: string
}

export interface Banner {
  id?: number
  title: string
  description?: string
  imageUrl: string
  linkUrl?: string
  sortOrder?: number
  isActive: boolean
  createTime?: string
}

// ==================== 视频 ====================

export interface VideoCategory {
  id?: number
  name: string
  description?: string
  parentId?: number
  sortOrder?: number
  status?: number
  children?: VideoCategory[]
  videoCount?: number
  parentName?: string
}

export interface Video {
  id?: number
  title: string
  description?: string
  categoryId?: number
  categoryName?: string
  tags?: string
  uploaderName?: string
  uploaderType?: number
  duration?: number
  durationText?: string
  fileUrl?: string
  coverUrl?: string
  fileSize?: number
  fileSizeText?: string
  /** 0 待审核 / 1 已发布 / 2 已拒绝 / 3 已下架（以后端常量为准） */
  status?: number
  viewCount?: number
  likeCount?: number
  isLiked?: boolean
  createdAt?: string
}

// ==================== AI 知识库 / RAG ====================

export interface KnowledgeBase {
  id: number
  name: string
  description?: string
  ownerId?: number
  ownerName?: string
  status?: string
  published: boolean
  publishedAt?: string
  documentCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface KnowledgeBaseCreateForm {
  name: string
  description?: string
}

/** 学生端已发布知识库的最小只读视图。 */
export interface StudentKnowledgeBase {
  id: number
  name: string
  description?: string
  publishedAt?: string
  documentCount?: number
}

export interface KnowledgeDocument {
  id: number
  knowledgeBaseId: number
  fileName: string
  mimeType?: string
  sizeBytes?: number
  sha256?: string
  /** 后端索引任务状态，例如 PENDING / PROCESSING / READY / FAILED */
  status: string
  progress?: number
  chunkCount?: number
  errorMessage?: string
  jobId?: string
  createdAt?: string
  updatedAt?: string
}

export interface KnowledgeDocumentPreviewChunk {
  chunkId: string | number
  chunkIndex: number
  text: string
  pageStart?: number
  pageEnd?: number
  sectionPath?: string
}

export interface KnowledgeDocumentPreview {
  documentId: number
  fileName: string
  chunkCount: number
  /** 1-based 页码 */
  page: number
  pageSize: number
  total: number
  chunks: KnowledgeDocumentPreviewChunk[]
}

export interface RagCitation {
  documentId: number
  documentName: string
  chunkId?: string | number
  quote: string
  pageStart?: number
  pageEnd?: number
  sectionPath?: string
  score?: number
}

export interface RagAnswerForm {
  knowledgeBaseIds: number[]
  question: string
}

export interface RagAnswer {
  answer: string
  evidenceStatus: string
  citations: RagCitation[]
  model?: string
  latencyMs?: number
}

// ==================== 统计 ====================

export interface Stats {
  questionCount: number
  userCount: number
  examCount: number
  todayExamCount: number
  categoryCount: number
  paperCount: number
}

// ==================== AI 生成题目 ====================

export interface AiGenerateForm {
  topic: string
  count: number
  types?: string
  difficulty?: Difficulty
  categoryId?: number
  includeMultiple?: boolean
  requirements?: string
}
