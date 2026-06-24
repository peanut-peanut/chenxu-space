// ===== User =====
export type UserRole = 'admin' | 'user'

export interface User {
  id: number
  phone: string
  email: string | null
  nickname: string
  avatar: string | null
  role: UserRole
  createdAt: string
}

export interface LoginDto {
  phone: string
  password: string
}

export interface RegisterDto {
  phone: string
  email?: string
  password: string
  nickname: string
  avatar?: string
}

// ===== Thought =====
export type ThoughtType = 'daily' | 'sport' | 'diet' | 'investment' | 'literature' | 'idea'
export type SportType = 'basketball' | 'fitness' | 'swimming'

export interface Thought {
  id: number
  content: string
  images: string[]
  type: ThoughtType
  sportType: SportType | null
  sportDuration: number | null
  sportCalories: number | null
  userId: number
  user: Pick<User, 'id' | 'nickname' | 'avatar'>
  likesCount: number
  dislikesCount: number
  commentsCount: number
  liked: boolean
  disliked: boolean
  deletedAt?: string | null
  createdAt: string
}

export interface ThoughtComment {
  id: number
  content: string
  userId: number
  user: Pick<User, 'id' | 'nickname' | 'avatar'>
  parentId: number | null
  parent?: Pick<ThoughtComment, 'id' | 'user'>
  createdAt: string
}

export interface MonthlyThoughtStat {
  value: string
  label: string
  count: number
}

export interface SportTypeStat {
  value: SportType
  label: string
  count: number
  duration: number
  calories: number
}

export interface SportInsightRecentItem {
  id: number
  content: string
  sportType: SportType | null
  sportDuration: number | null
  sportCalories: number | null
  createdAt: string
}

export interface InvestmentInsightRecentItem {
  id: number
  content: string
  imagesCount: number
  createdAt: string
}

export interface ThoughtInsights {
  sport: {
    totalPosts: number
    totalDuration: number
    totalCalories: number
    avgDuration: number
    avgCalories: number
    activeDays: number
    byType: SportTypeStat[]
    monthly: MonthlyThoughtStat[]
    recent: SportInsightRecentItem[]
  }
  investment: {
    totalPosts: number
    activeDays: number
    totalImages: number
    monthly: MonthlyThoughtStat[]
    recent: InvestmentInsightRecentItem[]
  }
}

// ===== Article =====
export type ArticleStatus = 'draft' | 'published'

export interface Category {
  id: number
  name: string
  slug: string
}

export interface Tag {
  id: number
  name: string
}

export interface Article {
  id: number
  title: string
  slug: string
  cover: string | null
  summary: string | null
  content: string
  status: ArticleStatus
  viewCount: number
  readingTime: number
  category: Category | null
  tags: Tag[]
  createdAt: string
  updatedAt: string
}

export interface ArticleListItem extends Omit<Article, 'content'> {}

// ===== Resource =====
export type ResourceType = 'image' | 'video' | 'file'

export interface ResourceCategory {
  id: number
  name: string
}

export interface Resource {
  id: number
  name: string
  url: string
  type: ResourceType
  size: number
  category: ResourceCategory | null
  createdAt: string
}

export interface PresignResult {
  uploadUrl: string
  key: string
  publicUrl: string
}

// ===== Cats =====
export type CatId = 'danhuang' | 'liuliu'
export type CatMediaType = 'image' | 'video'

export interface CatProfile {
  id: CatId
  name: string
  breed: string
  gender: string
  birthday: string
}

export interface CatMedia {
  id: number
  name: string
  url: string
  key: string
  type: CatMediaType
  size: number
  cat: CatId
  shotAt: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface CatUploadResult {
  uploadUrl?: string
  key: string
  publicUrl: string
  name: string
  size?: number
  type: CatMediaType
}

// ===== Folders =====

export interface Folder {
  id: number
  name: string
  parentId: number | null
  level: number
  isPublic: boolean
  createdAt: string
}

export interface FolderFile {
  id: number
  name: string
  url: string
  key: string
  type: ResourceType
  size: number
  folderId: number
  createdAt: string
}

export interface FolderContent {
  folder: Folder
  subfolders: Folder[]
  files: FolderFile[]
}

// ===== Pagination =====
export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

// ===== Common =====
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}
