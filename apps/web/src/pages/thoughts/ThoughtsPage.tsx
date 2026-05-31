import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, Image, Send, X, Plus, Lightbulb } from 'lucide-react'
import { PageLayout, PageContainer, SectionHeader } from '@/components/layout/PageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import type { Thought, ThoughtComment, PaginatedResult, ApiResponse } from '@chenxu/types'

// ── API hooks ──────────────────────────────────────────────────────────────
function useThoughts() {
  return useQuery({
    queryKey: ['thoughts'],
    queryFn: () => api.get<never, ApiResponse<PaginatedResult<Thought>>>('/thoughts?pageSize=20'),
    select: (res) => res.data.data,
  })
}

function useComments(thoughtId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['thoughts', thoughtId, 'comments'],
    queryFn: () =>
      api.get<never, ApiResponse<ThoughtComment[]>>(`/thoughts/${thoughtId}/comments`),
    select: (res) => res.data,
    enabled,
  })
}

// ── Image grid ─────────────────────────────────────────────────────────────
function ImageGrid({ images, onPreview }: { images: string[]; onPreview: (i: number) => void }) {
  if (!images.length) return null
  const gridClass = images.length === 1
    ? 'grid-cols-1'
    : images.length === 2
    ? 'grid-cols-2'
    : images.length <= 4
    ? 'grid-cols-2'
    : 'grid-cols-3'

  return (
    <div className={`grid gap-1 mt-3 ${gridClass} rounded-[var(--radius-md)] overflow-hidden`}>
      {images.map((url, i) => (
        <button
          key={i}
          onClick={() => onPreview(i)}
          className={cn(
            'aspect-square overflow-hidden group',
            images.length === 1 && 'aspect-video max-w-sm'
          )}
        >
          <img
            src={url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  )
}

// ── Comment section ────────────────────────────────────────────────────────
function CommentSection({ thoughtId }: { thoughtId: number; onClose: () => void }) {
  const { isLoggedIn, user } = useAuthStore()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const { data: comments = [], isLoading } = useComments(thoughtId, true)

  const postComment = useMutation({
    mutationFn: (content: string) =>
      api.post(`/thoughts/${thoughtId}/comments`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['thoughts', thoughtId, 'comments'] })
      qc.invalidateQueries({ queryKey: ['thoughts'] })
      setText('')
    },
  })

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="border-t border-[var(--color-border)] mt-4 pt-4 space-y-3">
        {isLoading ? (
          <p className="text-xs text-[var(--color-text-tertiary)] text-center py-2">加载中...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-[var(--color-text-tertiary)] text-center py-2">暂无评论</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar src={c.user.avatar} alt={c.user.nickname} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">{c.user.nickname}</span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">{formatDate(c.createdAt, { relative: true })}</span>
                </div>
                {c.parent && (
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-0.5">
                    回复 <span className="text-[var(--color-accent)]">@{c.parent.user.nickname}</span>
                  </p>
                )}
                <p className="text-sm text-[var(--color-text-secondary)]">{c.content}</p>
              </div>
            </div>
          ))
        )}

        {isLoggedIn() ? (
          <div className="flex gap-2 pt-1">
            <Avatar src={user?.avatar} alt={user?.nickname ?? ''} size="sm" />
            <div className="flex-1 flex gap-2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="写下你的想法..."
                className="min-h-[36px] max-h-24 text-xs py-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && text.trim()) {
                    e.preventDefault()
                    postComment.mutate(text.trim())
                  }
                }}
              />
              <Button
                size="icon-sm"
                onClick={() => text.trim() && postComment.mutate(text.trim())}
                loading={postComment.isPending}
                disabled={!text.trim()}
              >
                <Send size={13} />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-tertiary)] text-center">
            <a href="/login" className="text-[var(--color-accent)] hover:underline">登录</a> 后发表评论
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ── Thought card ───────────────────────────────────────────────────────────
function ThoughtCard({ thought }: { thought: Thought }) {
  const { isLoggedIn } = useAuthStore()
  const qc = useQueryClient()
  const [showComments, setShowComments] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const toggleLike = useMutation({
    mutationFn: () => api.post(`/thoughts/${thought.id}/like`),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['thoughts'] })
      const prev = qc.getQueryData(['thoughts'])
      qc.setQueryData(['thoughts'], (old: ApiResponse<PaginatedResult<Thought>>) => ({
        ...old,
        data: {
          ...old.data,
          data: old.data.data.map((t) =>
            t.id === thought.id
              ? { ...t, liked: !t.liked, likesCount: t.liked ? t.likesCount - 1 : t.likesCount + 1 }
              : t
          ),
        },
      }))
      return { prev }
    },
    onError: (_err, _vars, ctx) => qc.setQueryData(['thoughts'], ctx?.prev),
  })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card hover className="overflow-visible">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar src={thought.user.avatar} alt={thought.user.nickname} size="md" />
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{thought.user.nickname}</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">{formatDate(thought.createdAt, { relative: true })}</p>
            </div>
          </div>

          {/* Content */}
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
            {thought.content}
          </p>

          {/* Images */}
          <ImageGrid images={thought.images} onPreview={setPreviewIndex} />

          {/* Actions */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => isLoggedIn() && toggleLike.mutate()}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors',
                thought.liked
                  ? 'text-red-400'
                  : 'text-[var(--color-text-tertiary)] hover:text-red-400',
                !isLoggedIn() && 'cursor-default'
              )}
            >
              <Heart size={14} className={thought.liked ? 'fill-red-400' : ''} />
              {thought.likesCount > 0 && thought.likesCount}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <MessageCircle size={14} />
              {thought.commentsCount > 0 && thought.commentsCount}
            </button>
          </div>

          {/* Comments */}
          <AnimatePresence>
            {showComments && (
              <CommentSection
                thoughtId={thought.id}
                onClose={() => setShowComments(false)}
              />
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Image preview overlay */}
      <AnimatePresence>
        {previewIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setPreviewIndex(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/60 hover:text-white"
              onClick={() => setPreviewIndex(null)}
            >
              <X size={24} />
            </button>
            <img
              src={thought.images[previewIndex]}
              alt=""
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-[var(--radius-md)]"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Post form (admin only) ─────────────────────────────────────────────────
function PostThoughtForm({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const qc = useQueryClient()

  const handleSubmit = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const imageUrls: string[] = []

      for (const file of images) {
        const presignRes = await api.post('/resources/presign', {
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
        })

        const { uploadUrl, publicUrl } = presignRes.data as {
          uploadUrl: string
          key: string
          publicUrl: string
        }

        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        })

        imageUrls.push(publicUrl)
      }

      await api.post('/thoughts', { content: text, images: imageUrls })
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
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="分享你的想法..."
            className="min-h-[100px]"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)] cursor-pointer hover:text-[var(--color-text-primary)] transition-colors">
              <Image size={14} />
              添加图片 {images.length > 0 && `(${images.length})`}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => setImages(Array.from(e.target.files ?? []))}
              />
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>取消</Button>
              <Button size="sm" onClick={handleSubmit} loading={loading} disabled={!text.trim()}>
                发布
              </Button>
            </div>
          </div>
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((f, i) => (
                <div key={i} className="relative w-16 h-16 rounded-[var(--radius-sm)] overflow-hidden">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
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
  const { data: thoughts = [], isLoading } = useThoughts()

  return (
    <PageLayout>
      <PageContainer className="max-w-2xl">
        <SectionHeader
          title="想法"
          subtitle="生活碎片与瞬间灵感"
          action={
            isAdmin() && (
              <Button size="sm" onClick={() => setShowForm(!showForm)}>
                <Plus size={14} />
                发布
              </Button>
            )
          }
        />

        <AnimatePresence>
          {showForm && <PostThoughtForm onClose={() => setShowForm(false)} />}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-[var(--radius-lg)] bg-[var(--color-surface)] animate-pulse" />
            ))}
          </div>
        ) : thoughts.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-text-tertiary)]">
            <Lightbulb size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">还没有想法，快来分享第一条吧</p>
          </div>
        ) : (
          <motion.div layout className="space-y-4">
            {thoughts.map((t) => (
              <ThoughtCard key={t.id} thought={t} />
            ))}
          </motion.div>
        )}
      </PageContainer>
    </PageLayout>
  )
}
