import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from 'antd'
import {
  Heart,
  Image,
  X,
  Plus,
  CalendarDays,
  Dumbbell,
  Utensils,
  TrendingUp,
  FileText,
  Lightbulb,
  Trash2,
  Pencil,
  ThumbsDown,
  LayoutList,
  Columns3,
  type LucideIcon,
} from 'lucide-react'
import { PageLayout, PageContainer, SectionHeader } from '@/components/layout/PageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { RichText } from '@/components/ui/RichText'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import type { Thought, ThoughtType, PaginatedResult, ApiResponse, PresignResult } from '@chenxu/types'

type SportType = 'basketball' | 'fitness' | 'swimming'
type FeedLayout = 'list' | 'masonry'

type ThoughtTypeMeta = {
  value: ThoughtType
  label: string
  description: string
  icon: LucideIcon
  tone: string
}

type UploadedImage = {
  id: string
  name: string
  previewUrl: string
  publicUrl: string
}

const thoughtTypes: ThoughtTypeMeta[] = [
  { value: 'daily', label: '日常', description: '生活片段', icon: CalendarDays, tone: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { value: 'sport', label: '运动', description: '训练与恢复', icon: Dumbbell, tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'diet', label: '饮食', description: '吃喝记录', icon: Utensils, tone: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'investment', label: '投资', description: '市场观察', icon: TrendingUp, tone: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { value: 'literature', label: '文献', description: '阅读摘要', icon: FileText, tone: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { value: 'idea', label: '想法', description: '灵感备忘', icon: Lightbulb, tone: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
]

const typeByValue = Object.fromEntries(thoughtTypes.map((type) => [type.value, type])) as Record<ThoughtType, ThoughtTypeMeta>

const sportTypeOptions: Array<{ value: SportType; label: string }> = [
  { value: 'basketball', label: '篮球' },
  { value: 'fitness', label: '健身' },
  { value: 'swimming', label: '游泳' },
]

const sportTypeLabel: Record<SportType, string> = {
  basketball: '篮球',
  fitness: '健身',
  swimming: '游泳',
}

function ossImageUrl(url: string, width: number) {
  if (!url.includes('.aliyuncs.com/') || url.includes('x-oss-process=')) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}x-oss-process=image/resize,w_${width}/quality,q_82/format,webp`
}

function ossImageSrcSet(url: string, widths: number[]) {
  if (!url.includes('.aliyuncs.com/') || url.includes('x-oss-process=')) return undefined
  return widths.map((width) => `${ossImageUrl(url, width)} ${width}w`).join(', ')
}

function preloadOssImage(url: string, width: number) {
  const image = document.createElement('img')
  image.decoding = 'async'
  image.src = ossImageUrl(url, width)
}

function OptimizedImage({
  url,
  alt = '',
  width,
  widths,
  sizes,
  className,
  loading = 'lazy',
  fetchPriority,
}: {
  url: string
  alt?: string
  width: number
  widths: number[]
  sizes: string
  className?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <img
      src={ossImageUrl(url, width)}
      srcSet={ossImageSrcSet(url, widths)}
      sizes={sizes}
      alt={alt}
      className={cn(
        'bg-[var(--color-surface-2)] transition-[opacity,transform] duration-300',
        loaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      onLoad={() => setLoaded(true)}
    />
  )
}

// ── API hooks ──────────────────────────────────────────────────────────────
const PAGE_SIZE = 20

function useThoughts(type?: ThoughtType) {
  return useInfiniteQuery({
    queryKey: ['thoughts', type ?? 'all'],
    queryFn: ({ pageParam = 1 }) =>
      api.get<never, ApiResponse<PaginatedResult<Thought>>>(
        `/thoughts?page=${pageParam}&pageSize=${PAGE_SIZE}${type ? `&type=${type}` : ''}`
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, totalPages } = last.data.meta
      return page < totalPages ? page + 1 : undefined
    },
    select: (data) => ({
      thoughts: data.pages.flatMap((p) => p.data.data),
      hasMore: (data.pages.at(-1)?.data.meta.page ?? 0) < (data.pages.at(-1)?.data.meta.totalPages ?? 0),
    }),
  })
}

// ── Image grid ─────────────────────────────────────────────────────────────
function ImageGrid({ images, onPreview }: { images: string[]; onPreview: (i: number) => void }) {
  if (!images.length) return null
  const imageWidth = images.length === 1 ? 900 : images.length <= 4 ? 520 : 360
  const gridClass = images.length === 1
    ? 'grid-cols-1'
    : images.length === 2
    ? 'grid-cols-2'
    : images.length <= 4
    ? 'grid-cols-2'
    : 'grid-cols-3'

  return (
    <div className={cn(
      `grid gap-1 mt-3 ${gridClass}`,
      images.length > 1 && 'rounded-[var(--radius-md)] overflow-hidden'
    )}>
      {images.map((url, i) => (
        <button
          key={i}
          onClick={() => onPreview(i)}
          className={cn(
            'aspect-square overflow-hidden bg-[var(--color-surface-2)] group',
            images.length === 1 && 'aspect-video max-w-sm rounded-[var(--radius-md)]'
          )}
        >
          <OptimizedImage
            url={url}
            width={imageWidth}
            widths={images.length === 1 ? [360, 720, 900] : [180, 360, 520]}
            sizes={images.length === 1 ? '(max-width: 640px) 100vw, 384px' : '(max-width: 640px) 33vw, 180px'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </button>
      ))}
    </div>
  )
}

// ── Thought card ───────────────────────────────────────────────────────────
function SportMeta({ thought, className }: { thought: Thought; className?: string }) {
  if (thought.type !== 'sport') return null
  const hasMeta = thought.sportType || thought.sportDuration !== null || thought.sportCalories !== null
  if (!hasMeta) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--color-text-tertiary)]', className)}>
      {thought.sportType && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span>{sportTypeLabel[thought.sportType]}</span>
        </span>
      )}
      {thought.sportDuration !== null && thought.sportDuration !== undefined && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-[var(--color-border-2)]" />
          <span>
            <span className="font-medium text-[var(--color-cyan)]">{thought.sportDuration}</span>
            <span className="ml-1">分钟</span>
          </span>
        </span>
      )}
      {thought.sportCalories !== null && thought.sportCalories !== undefined && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-[var(--color-border-2)]" />
          <span>
            <span className="font-medium text-[var(--color-cyan)]">{thought.sportCalories}</span>
            <span className="ml-1">千卡</span>
          </span>
        </span>
      )}
    </div>
  )
}

function ThoughtCard({ thought, onOpenDetail, onEdit }: { thought: Thought; onOpenDetail: (thought: Thought) => void; onEdit: (thought: Thought) => void }) {
  const { isLoggedIn, isAdmin } = useAuthStore()
  const qc = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const typeMeta = typeByValue[thought.type]
  const TypeIcon = typeMeta.icon

  const openDetail = () => {
    onOpenDetail(thought)
  }

  const toggleLike = useMutation({
    mutationFn: () => api.post(`/thoughts/${thought.id}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['thoughts'] }),
  })

  const toggleDislike = useMutation({
    mutationFn: () => api.post(`/thoughts/${thought.id}/dislike`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['thoughts'] }),
  })

  const deleteThought = useMutation({
    mutationFn: () => api.delete(`/thoughts/${thought.id}`),
    onSuccess: () => {
      setDeleteOpen(false)
      qc.invalidateQueries({ queryKey: ['thoughts'] })
    },
  })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card hover className="cursor-pointer overflow-visible" onClick={openDetail}>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar src={thought.user.avatar} alt={thought.user.nickname} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-5 text-[var(--color-text-primary)]">
                {thought.user.nickname}
                <span className="mx-1.5 text-[var(--color-text-tertiary)]">·</span>
                <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
                  {formatDate(thought.createdAt, { relative: true })}
                </span>
              </p>
            </div>
            <span className={cn('ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]', typeMeta.tone)}>
              <TypeIcon size={12} />
              {typeMeta.label}
            </span>
            {isAdmin() && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(thought)
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent)]"
                title="编辑"
                aria-label="编辑这条日常"
              >
                <Pencil size={14} />
              </button>
            )}
            {isAdmin() && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteOpen(true)
                }}
                disabled={deleteThought.isPending}
                className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] disabled:pointer-events-none disabled:opacity-40"
                title="删除"
                aria-label="删除这条日常"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Content */}
          <RichText
            content={thought.content}
            className="text-sm text-[var(--color-text-secondary)] leading-relaxed"
          />

          <SportMeta thought={thought} className="mt-3" />

          {/* Images */}
          <ImageGrid images={thought.images} onPreview={() => openDetail()} />

          {/* Actions */}
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                isLoggedIn() && toggleLike.mutate()
              }}
              className={cn(
                'flex h-7 items-center gap-1.5 rounded-full px-2 text-xs transition-colors',
                thought.liked
                  ? 'bg-red-500/10 text-red-400'
                  : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-red-400',
                !isLoggedIn() && 'cursor-default'
              )}
            >
              <Heart size={14} className={thought.liked ? 'fill-red-400' : ''} />
              {thought.likesCount > 0 && thought.likesCount}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                isLoggedIn() && toggleDislike.mutate()
              }}
              className={cn(
                'flex h-7 items-center gap-1.5 rounded-full px-2 text-xs transition-colors',
                thought.disliked
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-cyan)]'
                  : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-cyan)]',
                !isLoggedIn() && 'cursor-default'
              )}
            >
              <ThumbsDown size={14} className={thought.disliked ? 'fill-[var(--color-cyan)]' : ''} />
              {thought.dislikesCount > 0 ? thought.dislikesCount : '踩一下'}
            </button>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={deleteOpen}
        title="删除这条日常？"
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        confirmLoading={deleteThought.isPending}
        onOk={() => deleteThought.mutate()}
        onCancel={() => setDeleteOpen(false)}
        centered
      >
        <p className="text-sm text-[var(--color-text-secondary)]">
          删除后前台将不再显示，数据库会保留软删除记录。
        </p>
      </Modal>

    </motion.div>
  )
}

function ThoughtDetailModal({
  initialThought,
  open,
  onClose,
}: {
  initialThought: Thought | null
  open: boolean
  onClose: () => void
}) {
  const { isLoggedIn } = useAuthStore()
  const qc = useQueryClient()
  const [activeImage, setActiveImage] = useState(0)
  const thoughtId = initialThought?.id ?? null

  useEffect(() => {
    setActiveImage(0)
  }, [thoughtId])

  const { data: thought, isLoading } = useQuery({
    queryKey: ['thoughts', thoughtId],
    enabled: open && thoughtId !== null,
    queryFn: () => api.get<never, ApiResponse<Thought>>(`/thoughts/${thoughtId}`),
    select: (res) => res.data,
    initialData: initialThought ? ({ data: initialThought } as ApiResponse<Thought>) : undefined,
    staleTime: 10_000,
  })

  const toggleLike = useMutation({
    mutationFn: () => api.post(`/thoughts/${thoughtId}/like`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['thoughts'] })
      qc.invalidateQueries({ queryKey: ['thoughts', thoughtId] })
    },
  })

  const toggleDislike = useMutation({
    mutationFn: () => api.post(`/thoughts/${thoughtId}/dislike`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['thoughts'] })
      qc.invalidateQueries({ queryKey: ['thoughts', thoughtId] })
    },
  })

  const meta = thought ? typeByValue[thought.type] : null
  const TypeIcon = meta?.icon
  const images = thought?.images ?? []
  const currentImage = images[Math.min(activeImage, Math.max(images.length - 1, 0))]

  useEffect(() => {
    if (!open || images.length <= 1) return
    const next = images[(activeImage + 1) % images.length]
    const prev = images[(activeImage - 1 + images.length) % images.length]
    ;[next, prev].forEach((url) => preloadOssImage(url, 1200))
  }, [activeImage, images, open])

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        className="daily-detail-modal"
        width={images.length > 0 ? 'min(1040px, calc(100vw - 32px))' : 'min(620px, calc(100vw - 32px))'}
        styles={{
          body: { padding: 0 },
          mask: { background: 'rgba(0, 0, 0, 0.64)' },
        }}
        closeIcon={<span className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">×</span>}
      >
        {isLoading || !thought || !meta || !TypeIcon ? (
          <div className="grid min-h-[560px] animate-pulse bg-[var(--color-surface)] lg:grid-cols-[minmax(0,1.45fr)_390px]">
            <div className="hidden bg-[var(--color-surface-2)] lg:block" />
            <div className="p-5">
              <div className="mb-6 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" />
              <div className="space-y-3">
                <div className="h-4 w-24 rounded bg-[var(--color-surface-2)]" />
                <div className="h-4 rounded bg-[var(--color-surface-2)]" />
                <div className="h-4 w-3/4 rounded bg-[var(--color-surface-2)]" />
              </div>
            </div>
          </div>
        ) : (
          <article
            className={cn(
              'grid max-h-[86vh] min-h-[560px] overflow-hidden bg-[var(--color-surface)]',
              images.length > 0 ? 'lg:grid-cols-[minmax(0,1.35fr)_390px]' : 'lg:grid-cols-1'
            )}
          >
            {images.length > 0 && (
              <section className="relative min-h-[300px] overflow-hidden bg-[var(--color-surface-2)] lg:min-h-[560px]">
                <div className="absolute inset-0">
                  <OptimizedImage
                    key={currentImage}
                    url={currentImage}
                    width={1200}
                    widths={[640, 900, 1200, 1600]}
                    sizes="(max-width: 1024px) 100vw, 650px"
                    className="h-full w-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                  />
                </div>
                {images.length > 1 && (
                  <div className="absolute inset-x-0 bottom-0 flex gap-2 overflow-x-auto bg-gradient-to-t from-black/40 to-transparent p-3">
                    {images.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        className={cn(
                          'h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border transition-all',
                          activeImage === index
                            ? 'border-white/85 opacity-100'
                            : 'border-white/10 opacity-55 hover:opacity-90'
                        )}
                      >
                        <OptimizedImage
                          url={image}
                          width={180}
                          widths={[120, 180, 240]}
                          sizes="56px"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            <aside className="flex min-h-[420px] flex-col overflow-hidden">
              <header className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-4">
                <Avatar src={thought.user.avatar} alt={thought.user.nickname} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                    {thought.user.nickname}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {formatDate(thought.createdAt, { relative: true })}
                  </p>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                <span className={cn('mb-4 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px]', meta.tone)}>
                  <TypeIcon size={12} />
                  {meta.label}
                </span>
                <RichText
                  content={thought.content}
                  className="text-[15px] leading-7 text-[var(--color-text-primary)]"
                />
                <SportMeta thought={thought} className="mt-4" />
              </div>

              <footer className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] px-5 py-4">
                <button
                  type="button"
                  onClick={() => isLoggedIn() && toggleLike.mutate()}
                  className={cn(
                    'flex h-9 items-center gap-1.5 rounded-full px-3 text-sm transition-colors',
                    thought.liked
                      ? 'bg-red-500/10 text-red-400'
                      : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-red-400',
                    !isLoggedIn() && 'cursor-default'
                  )}
                >
                  <Heart size={16} className={thought.liked ? 'fill-red-400' : ''} />
                  {thought.likesCount > 0 && thought.likesCount}
                </button>
                <button
                  type="button"
                  onClick={() => isLoggedIn() && toggleDislike.mutate()}
                  className={cn(
                    'flex h-9 items-center gap-1.5 rounded-full px-3 text-sm transition-colors',
                    thought.disliked
                      ? 'bg-[var(--color-surface-2)] text-[var(--color-cyan)]'
                      : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-cyan)]',
                    !isLoggedIn() && 'cursor-default'
                  )}
                >
                  <ThumbsDown size={16} className={thought.disliked ? 'fill-[var(--color-cyan)]' : ''} />
                  {thought.dislikesCount > 0 ? thought.dislikesCount : '踩一下'}
                </button>
              </footer>
            </aside>
          </article>
        )}
      </Modal>

    </>
  )
}

// ── Post form (admin only) ─────────────────────────────────────────────────
function PostThoughtForm({
  defaultType,
  editing,
  onClose,
}: {
  defaultType: ThoughtType
  editing?: Thought | null
  onClose: () => void
}) {
  const [text, setText] = useState(editing?.content ?? '')
  const [type, setType] = useState<ThoughtType>(editing?.type ?? defaultType)
  const [sportType, setSportType] = useState<SportType | ''>(editing?.sportType ?? '')
  const [sportDuration, setSportDuration] = useState(
    editing?.sportDuration != null ? String(editing.sportDuration) : ''
  )
  const [sportCalories, setSportCalories] = useState(
    editing?.sportCalories != null ? String(editing.sportCalories) : ''
  )
  const [images, setImages] = useState<UploadedImage[]>(
    (editing?.images ?? []).map((url, index) => ({
      id: `existing-${index}-${url}`,
      name: '',
      previewUrl: url,
      publicUrl: url,
    }))
  )
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const qc = useQueryClient()
  const isEditing = !!editing

  const uploadFile = async (file: File): Promise<UploadedImage> => {
    const formData = new FormData()
    formData.append('file', file)
    const uploadRes = await api.post<never, ApiResponse<Pick<PresignResult, 'key' | 'publicUrl'>>>(
      '/resources/upload',
      formData
    )

    const { publicUrl } = uploadRes.data

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      publicUrl,
    }
  }

  const handleImageChange = async (files: FileList | null) => {
    const selected = Array.from(files ?? [])
    if (!selected.length) return
    setUploading(true)
    try {
      const uploaded = await Promise.all(selected.map(uploadFile))
      setImages((prev) => [...prev, ...uploaded])
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!text.trim() || uploading) return
    setLoading(true)
    try {
      const payload = {
        content: text,
        type,
        ...(type === 'sport'
          ? {
              sportType: sportType || undefined,
              sportDuration: sportDuration ? Number(sportDuration) : undefined,
              sportCalories: sportCalories ? Number(sportCalories) : undefined,
            }
          : {}),
        images: images.map((image) => image.publicUrl),
      }
      if (isEditing && editing) {
        await api.patch(`/thoughts/${editing.id}`, payload)
        qc.invalidateQueries({ queryKey: ['thoughts', editing.id] })
      } else {
        await api.post('/thoughts', payload)
      }
      qc.invalidateQueries({ queryKey: ['thoughts'] })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="mb-6 border-[var(--color-accent)]/30">
        <CardContent className="p-5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {thoughtTypes.map(({ value, label, icon: Icon, tone }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] border px-3 py-2 text-xs transition-all',
                  type === value
                    ? tone
                    : 'border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]'
                )}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
          <RichTextEditor
            value={text}
            onChange={setText}
            placeholder={`记录${typeByValue[type].label}...`}
            className="min-h-[100px]"
          />
          {type === 'sport' && (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1.5">
                <span className="block text-sm font-medium text-[var(--color-text-secondary)]">运动类型</span>
                <select
                  value={sportType}
                  onChange={(e) => setSportType(e.target.value as SportType | '')}
                  className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-all focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-glow)]"
                >
                  <option value="">未选择</option>
                  {sportTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <Input
                label="运动时长"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="分钟"
                value={sportDuration}
                onChange={(e) => setSportDuration(e.target.value)}
              />
              <Input
                label="消耗"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="千卡"
                value={sportCalories}
                onChange={(e) => setSportCalories(e.target.value)}
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)] cursor-pointer hover:text-[var(--color-text-primary)] transition-colors">
              <Image size={14} />
              {uploading ? '上传中...' : `添加图片${images.length > 0 ? ` (${images.length})` : ''}`}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                disabled={uploading || loading}
                onChange={(e) => {
                  void handleImageChange(e.target.files)
                  e.currentTarget.value = ''
                }}
              />
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>取消</Button>
              <Button size="sm" onClick={handleSubmit} loading={loading} disabled={!text.trim() || uploading}>
                {isEditing ? '保存' : '发布'}
              </Button>
            </div>
          </div>
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((image) => (
                <div key={image.id} className="relative w-16 h-16 rounded-[var(--radius-sm)] overflow-hidden">
                  <OptimizedImage
                    url={image.previewUrl}
                    alt={image.name}
                    width={160}
                    widths={[120, 160, 240]}
                    sizes="64px"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((item) => item.id !== image.id))}
                    className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export function ThoughtsPage() {
  const { isAdmin } = useAuthStore()
  const [showForm, setShowForm] = useState(false)
  const [editingThought, setEditingThought] = useState<Thought | null>(null)
  const [selectedType, setSelectedType] = useState<ThoughtType | undefined>()
  const [layout, setLayout] = useState<FeedLayout>('list')
  const [selectedThought, setSelectedThought] = useState<Thought | null>(null)
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useThoughts(selectedType)
  const thoughts = data?.thoughts ?? []
  const defaultPostType = selectedType ?? 'daily'

  const openCreateForm = () => {
    setEditingThought(null)
    setShowForm((prev) => !prev || editingThought !== null)
  }

  const openEditForm = (thought: Thought) => {
    setEditingThought(thought)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingThought(null)
  }

  return (
    <PageLayout>
      <PageContainer className={layout === 'masonry' ? 'max-w-5xl' : 'max-w-2xl'}>
        <SectionHeader
          title="日常"
          subtitle="日常、运动、饮食、投资、文献、想法"
          action={
            <div className="flex items-center gap-2">
              <div className="flex rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
                <Button
                  variant={layout === 'list' ? 'default' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setLayout('list')}
                  title="列表"
                  aria-label="列表"
                >
                  <LayoutList size={14} />
                </Button>
                <Button
                  variant={layout === 'masonry' ? 'default' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setLayout('masonry')}
                  title="瀑布流"
                  aria-label="瀑布流"
                >
                  <Columns3 size={14} />
                </Button>
              </div>
              {isAdmin() && (
                <Button size="sm" onClick={openCreateForm}>
                  <Plus size={14} />
                  发布
                </Button>
              )}
            </div>
          }
        />

        <AnimatePresence>
          {!showForm && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="mb-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2"
            >
              <button
                type="button"
                onClick={() => setSelectedType(undefined)}
                className={cn(
                  'rounded-[var(--radius-md)] border px-3 py-2 text-left transition-all',
                  selectedType === undefined
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
                )}
              >
                <span className="block text-xs font-medium">全部</span>
                <span className="block text-[10px] mt-0.5 opacity-70">时间流</span>
              </button>
              {thoughtTypes.map(({ value, label, description, icon: Icon, tone }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedType(value)}
              className={cn(
                'rounded-[var(--radius-md)] border px-3 py-2 text-left transition-all',
                selectedType === value
                  ? tone
                  : 'border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <Icon size={13} />
                {label}
              </span>
              <span className="block text-[10px] mt-0.5 opacity-70">{description}</span>
            </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showForm && (
            <PostThoughtForm
              key={editingThought?.id ?? 'new'}
              defaultType={editingThought?.type ?? defaultPostType}
              editing={editingThought}
              onClose={closeForm}
            />
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-[var(--radius-lg)] bg-[var(--color-surface)] animate-pulse" />
            ))}
          </div>
        ) : thoughts.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-text-tertiary)]">
            <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {selectedType ? `还没有${typeByValue[selectedType].label}内容` : '还没有日常内容'}
            </p>
          </div>
        ) : (
          <>
            <motion.div
              layout
              className={layout === 'masonry' ? 'columns-1 gap-4 sm:columns-2 lg:columns-3' : 'space-y-4'}
            >
              {thoughts.map((t) => layout === 'masonry' ? (
                <div key={t.id} className="mb-4 break-inside-avoid">
                  <ThoughtCard thought={t} onOpenDetail={setSelectedThought} onEdit={openEditForm} />
                </div>
              ) : (
                <ThoughtCard key={t.id} thought={t} onOpenDetail={setSelectedThought} onEdit={openEditForm} />
              ))}
            </motion.div>
            {hasNextPage && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  loading={isFetchingNextPage}
                >
                  加载更多
                </Button>
              </div>
            )}
            {!hasNextPage && thoughts.length > 0 && (
              <p className="mt-8 text-center text-xs text-[var(--color-text-tertiary)]">已加载全部内容</p>
            )}
          </>
        )}
      </PageContainer>
      <ThoughtDetailModal
        initialThought={selectedThought}
        open={selectedThought !== null}
        onClose={() => setSelectedThought(null)}
      />
    </PageLayout>
  )
}
