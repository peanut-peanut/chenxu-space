import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DatePicker, Modal, Select, Upload as AntUpload } from 'antd'
import type { UploadFile } from 'antd'
import {
  CalendarDays,
  Camera,
  Cat,
  Clapperboard,
  Image as ImageIcon,
  Mars,
  Play,
  Plus,
  Trash2,
  UploadCloud,
  Venus,
  X,
} from 'lucide-react'
import { PageLayout, PageContainer, SectionHeader } from '@/components/layout/PageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { api } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import type {
  ApiResponse,
  CatId,
  CatMedia,
  CatMediaType,
  CatProfile,
  CatUploadResult,
  PaginatedResult,
} from '@chenxu/types'

type CatFilter = CatId | 'all'
type MediaFilter = CatMediaType | 'all'
const { Dragger } = AntUpload

const catTone: Record<CatId, string> = {
  danhuang: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  liuliu: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
}

function ossImageUrl(url: string, width: number) {
  if (!url.includes('.aliyuncs.com/') || url.includes('x-oss-process=')) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}x-oss-process=image/resize,w_${width}/quality,q_82/format,webp`
}

function useCats() {
  return useQuery({
    queryKey: ['cats'],
    queryFn: () => api.get<never, ApiResponse<CatProfile[]>>('/cats'),
    select: (res) => res.data,
  })
}

function useCatMedia(cat: CatFilter, type: MediaFilter) {
  return useQuery({
    queryKey: ['cats', 'media', cat, type],
    queryFn: () => {
      const params = new URLSearchParams({ pageSize: '80' })
      if (cat !== 'all') params.set('cat', cat)
      if (type !== 'all') params.set('type', type)
      return api.get<never, ApiResponse<PaginatedResult<CatMedia>>>(`/cats/media?${params.toString()}`)
    },
    select: (res) => res.data.data,
  })
}

function catAge(birthday: string) {
  const birth = new Date(`${birthday}T00:00:00`)
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) months -= 1
  if (months < 12) return `${Math.max(months, 0)}个月`
  const years = Math.floor(months / 12)
  const rest = months % 12
  return rest > 0 ? `${years}岁${rest}个月` : `${years}岁`
}

function GenderTag({ gender }: { gender: string }) {
  const isMale = gender.includes('公')
  const Icon = isMale ? Mars : Venus
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]',
        isMale
          ? 'border-sky-400/30 bg-sky-400/10 text-sky-300'
          : 'border-pink-400/30 bg-pink-400/10 text-pink-300'
      )}
      title={gender}
    >
      <Icon size={12} />
      {gender}
    </span>
  )
}

function UploadCatMediaModal({
  open,
  cats,
  onClose,
}: {
  open: boolean
  cats: CatProfile[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [cat, setCat] = useState<CatId>('danhuang')
  const [shotAt, setShotAt] = useState('')
  const [note, setNote] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const antdFileList: UploadFile[] = files.map((file, index) => ({
    uid: `${file.name}-${index}`,
    name: file.name,
    size: file.size,
    status: 'done',
  }))

  const uploadMutation = useMutation({
    mutationFn: async () => {
      for (const file of files) {
        const uploadRes = await api.post<never, ApiResponse<CatUploadResult>>('/cats/media/presign', {
          filename: file.name,
          contentType: file.type,
        })
        const uploaded = uploadRes.data
        if (!uploaded.uploadUrl) throw new Error('上传地址生成失败')
        await fetch(uploaded.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
            'x-oss-object-acl': 'public-read',
          },
        })
        await api.post('/cats/media', {
          name: uploaded.name,
          url: uploaded.publicUrl,
          key: uploaded.key,
          type: uploaded.type,
          size: file.size,
          cat,
          shotAt: shotAt || undefined,
          note: note.trim() || undefined,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cats', 'media'] })
      setFiles([])
      setShotAt('')
      setNote('')
      onClose()
    },
  })

  const resetClose = () => {
    if (uploadMutation.isPending) return
    setFiles([])
    setShotAt('')
    setNote('')
    onClose()
  }

  return (
    <Modal
      open={open}
      title="上传猫猫照片 / 视频"
      okText="上传"
      cancelText="取消"
      onOk={() => files.length > 0 && uploadMutation.mutate()}
      onCancel={resetClose}
      okButtonProps={{ disabled: files.length === 0 }}
      confirmLoading={uploadMutation.isPending}
      centered
      afterClose={() => uploadMutation.reset()}
    >
      <div className="space-y-4 py-2">
        <label className="space-y-1.5 block">
          <span className="block text-sm font-medium text-[var(--color-text-secondary)]">是哪只猫</span>
          <Select
            value={cat}
            onChange={(value) => setCat(value)}
            options={cats.map((item) => ({ value: item.id, label: item.name }))}
            className="w-full"
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="block text-sm font-medium text-[var(--color-text-secondary)]">拍摄时间</span>
          <DatePicker
            className="w-full"
            placeholder="选择拍摄日期"
            onChange={(_, value) => setShotAt(Array.isArray(value) ? value[0] : value)}
          />
        </label>

        <Textarea
          label="备注"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="比如：第一次晒太阳、抢了蛋黄的窝..."
          className="min-h-24"
        />

        <Dragger
          multiple
          accept="image/*,video/*"
          fileList={antdFileList}
          beforeUpload={(file) => {
            setFiles((prev) => [...prev, file as File])
            return false
          }}
          onRemove={(file) => {
            setFiles((prev) => prev.filter((item, index) => `${item.name}-${index}` !== file.uid))
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadCloud size={28} className="mx-auto text-[var(--color-text-tertiary)]" />
          </p>
          <p className="ant-upload-text">选择或拖拽照片 / 视频</p>
          <p className="ant-upload-hint">支持多选，图片和视频会使用同一组拍摄信息</p>
        </Dragger>
      </div>
    </Modal>
  )
}

function CatMediaCard({
  item,
  cat,
  isAdmin,
  onPreview,
}: {
  item: CatMedia
  cat: CatProfile
  isAdmin: boolean
  onPreview: (item: CatMedia) => void
}) {
  const qc = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/cats/media/${item.id}`),
    onSuccess: () => {
      setDeleteOpen(false)
      qc.invalidateQueries({ queryKey: ['cats', 'media'] })
    },
  })

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 break-inside-avoid"
    >
      <Card hover className="group cursor-pointer" onClick={() => onPreview(item)}>
        <div className="relative overflow-hidden bg-[var(--color-surface-2)]">
          {item.type === 'image' ? (
            <img
              src={ossImageUrl(item.url, 680)}
              alt={item.note ?? item.name}
              className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="relative aspect-[4/5]">
              <video
                src={item.url}
                className="h-full w-full object-cover"
                preload="metadata"
                muted
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/12">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
                  <Play size={18} className="ml-0.5 fill-white" />
                </span>
              </span>
            </div>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteOpen(true)
              }}
              className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/35 text-white/80 opacity-0 backdrop-blur transition-opacity hover:text-white group-hover:opacity-100"
              aria-label="删除"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <CardContent className="space-y-2 p-4">
          {item.note && (
            <p className="text-sm leading-6 text-[var(--color-text-primary)]">{item.note}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-tertiary)]">
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]', catTone[item.cat])}>
              <Cat size={12} />
              {cat.name}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={12} />
              {item.shotAt ? formatDate(item.shotAt) : '未记录拍摄时间'}
            </span>
            <span className="inline-flex items-center gap-1">
              {item.type === 'image' ? <ImageIcon size={12} /> : <Clapperboard size={12} />}
              {item.type === 'image' ? '照片' : '视频'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={deleteOpen}
        title="删除这条猫猫记录？"
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        confirmLoading={deleteMutation.isPending}
        onOk={() => deleteMutation.mutate()}
        onCancel={() => setDeleteOpen(false)}
        centered
      >
        <p className="text-sm text-[var(--color-text-secondary)]">删除后会同时尝试删除 OSS 文件。</p>
      </Modal>
    </motion.article>
  )
}

function PreviewModal({
  media,
  cat,
  onClose,
}: {
  media: CatMedia | null
  cat?: CatProfile
  onClose: () => void
}) {
  return (
    <Modal
      open={!!media}
      onCancel={onClose}
      footer={null}
      centered
      width="auto"
      styles={{ body: { padding: 0 }, mask: { background: 'rgba(0,0,0,0.82)' } }}
      closeIcon={<X size={18} className="text-white/70 hover:text-white" />}
    >
      {media?.type === 'image' && (
        <img
          src={media.url}
          alt={media.note ?? media.name}
          className="block max-h-[82vh] max-w-[86vw] rounded-[var(--radius-md)] object-contain"
        />
      )}
      {media?.type === 'video' && (
        <video
          src={media.url}
          controls
          autoPlay
          className="block max-h-[82vh] max-w-[86vw] rounded-[var(--radius-md)]"
        />
      )}
      {media && (
        <div className="mt-3 max-w-[86vw] text-center text-xs text-white/70">
          <span>{cat?.name}</span>
          {media.shotAt && <span className="mx-2">·</span>}
          {media.shotAt && <span>{formatDate(media.shotAt)}</span>}
          {media.note && <p className="mt-1 text-white/90">{media.note}</p>}
        </div>
      )}
    </Modal>
  )
}

export function CatsPage() {
  const { isAdmin } = useAuthStore()
  const [catFilter, setCatFilter] = useState<CatFilter>('all')
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [preview, setPreview] = useState<CatMedia | null>(null)
  const { data: cats = [], isLoading: catsLoading } = useCats()
  const catById = useMemo(() => Object.fromEntries(cats.map((cat) => [cat.id, cat])) as Record<CatId, CatProfile>, [cats])
  const { data: media = [], isLoading } = useCatMedia(catFilter, mediaFilter)

  return (
    <PageLayout>
      <PageContainer className="max-w-6xl">
        <SectionHeader
          title="猫猫"
          subtitle="蛋黄和六六的照片墙"
          action={isAdmin() && (
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              <Plus size={14} />
              上传
            </Button>
          )}
        />

        {catsLoading ? (
          <div className="mb-6 grid gap-3 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface)]" />
            ))}
          </div>
        ) : cats.length > 0 ? (
          <div className="mb-6 grid gap-3 md:grid-cols-2">
            {cats.map((cat) => (
              <div key={cat.id} className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full border', catTone[cat.id])}>
                  <Cat size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{cat.name}</h3>
                    <GenderTag gender={cat.gender} />
                    <span className="text-xs text-[var(--color-text-tertiary)]">{cat.breed}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                    生日 {cat.birthday} · {catAge(cat.birthday)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {([
              ['all', '全部'],
              ['danhuang', '蛋黄'],
              ['liuliu', '六六'],
            ] as Array<[CatFilter, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setCatFilter(value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  catFilter === value
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            {([
              ['all', '全部'],
              ['image', '照片'],
              ['video', '视频'],
            ] as Array<[MediaFilter, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMediaFilter(value)}
                className={cn(
                  'rounded-[var(--radius-sm)] px-3 py-1.5 text-xs transition-colors',
                  mediaFilter === value
                    ? 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="mb-4 h-72 break-inside-avoid rounded-[var(--radius-lg)] bg-[var(--color-surface)] animate-pulse" />
            ))}
          </div>
        ) : media.length === 0 ? (
          <div className="py-20 text-center text-[var(--color-text-tertiary)]">
            <Camera size={42} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">还没有猫猫照片或视频</p>
          </div>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {media.map((item) => (
              <CatMediaCard
                key={item.id}
                item={item}
                cat={catById[item.cat]}
                isAdmin={isAdmin()}
                onPreview={setPreview}
              />
            ))}
          </div>
        )}
      </PageContainer>

      <UploadCatMediaModal
        open={uploadOpen}
        cats={cats}
        onClose={() => setUploadOpen(false)}
      />
      {isAdmin() && !uploadOpen && (
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="fixed bottom-5 right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-white shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition-transform active:scale-[0.98] md:hidden"
          aria-label="上传猫猫照片或视频"
        >
          <UploadCloud size={17} />
          上传
        </button>
      )}
      <PreviewModal media={preview} cat={preview ? catById[preview.cat] : undefined} onClose={() => setPreview(null)} />
    </PageLayout>
  )
}
