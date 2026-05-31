import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Image, Video, FileText, Download, FolderOpen, X, Play } from 'lucide-react'
import { PageLayout, PageContainer, SectionHeader } from '@/components/layout/PageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatFileSize } from '@/lib/utils'
import type { ApiResponse, PaginatedResult, Resource, ResourceType } from '@chenxu/types'

const TYPE_ICONS: Record<ResourceType, typeof Image> = {
  image: Image,
  video: Video,
  file: FileText,
}

const TYPE_LABELS: Record<ResourceType, string> = {
  image: '图片',
  video: '视频',
  file: '文件',
}

function useResources(type?: ResourceType) {
  return useQuery({
    queryKey: ['resources', type],
    queryFn: () =>
      api.get<never, ApiResponse<PaginatedResult<Resource>>>(
        `/resources?pageSize=50${type ? `&type=${type}` : ''}`
      ),
    select: (res) => res.data.data,
  })
}

function ImageCard({ file, onPreview }: { file: Resource; onPreview: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onPreview}
      className="group relative aspect-square rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 transition-all duration-300"
    >
      <img
        src={file.url}
        alt={file.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-2">
        <span className="text-xs text-white/0 group-hover:text-white/90 transition-all duration-300 truncate">
          {file.name}
        </span>
      </div>
    </motion.button>
  )
}

function VideoCard({ file, onPreview }: { file: Resource; onPreview: () => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <Card hover className="group cursor-pointer" onClick={onPreview}>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center flex-shrink-0">
            <Play size={16} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{file.name}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">{formatFileSize(file.size)}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function FileCard({ file }: { file: Resource }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <Card hover className="group">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{file.name}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">{formatFileSize(file.size)}</p>
          </div>
          <a href={file.url} download={file.name} onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm">
              <Download size={14} />
            </Button>
          </a>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ResourcesPage() {
  const [activeType, setActiveType] = useState<ResourceType | undefined>()
  const [previewFile, setPreviewFile] = useState<Resource | null>(null)

  const { data: files = [], isLoading } = useResources(activeType)

  const images = files.filter((f) => f.type === 'image')
  const videos = files.filter((f) => f.type === 'video')
  const docs = files.filter((f) => f.type === 'file')

  return (
    <PageLayout>
      <PageContainer>
        <SectionHeader title="资源" subtitle="图片、视频与文件归档" />

        {/* Type filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Button
            variant={activeType === undefined ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setActiveType(undefined)}
          >
            全部
          </Button>
          {(['image', 'video', 'file'] as ResourceType[]).map((type) => {
            const Icon = TYPE_ICONS[type]
            return (
              <Button
                key={type}
                variant={activeType === type ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setActiveType(type)}
              >
                <Icon size={13} />
                {TYPE_LABELS[type]}
              </Button>
            )
          })}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="aspect-square bg-[var(--color-surface)] rounded-[var(--radius-md)] animate-pulse" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-text-tertiary)]">
            <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">暂无资源</p>
          </div>
        ) : (
          <div className="space-y-8">
            {(!activeType || activeType === 'image') && images.length > 0 && (
              <section>
                {!activeType && (
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                    <Image size={14} /> 图片
                  </h3>
                )}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {images.map((f) => (
                    <ImageCard key={f.id} file={f} onPreview={() => setPreviewFile(f)} />
                  ))}
                </div>
              </section>
            )}

            {(!activeType || activeType === 'video') && videos.length > 0 && (
              <section>
                {!activeType && (
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                    <Video size={14} /> 视频
                  </h3>
                )}
                <div className="grid md:grid-cols-2 gap-3">
                  {videos.map((f) => (
                    <VideoCard key={f.id} file={f} onPreview={() => setPreviewFile(f)} />
                  ))}
                </div>
              </section>
            )}

            {(!activeType || activeType === 'file') && docs.length > 0 && (
              <section>
                {!activeType && (
                  <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                    <FileText size={14} /> 文件
                  </h3>
                )}
                <div className="grid md:grid-cols-2 gap-3">
                  {docs.map((f) => (
                    <FileCard key={f.id} file={f} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </PageContainer>

      {/* Preview modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setPreviewFile(null)}
          >
            <button className="absolute top-4 right-4 text-white/60 hover:text-white z-10">
              <X size={24} />
            </button>
            {previewFile.type === 'image' && (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-[var(--radius-md)]"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {previewFile.type === 'video' && (
              <video
                src={previewFile.url}
                controls
                autoPlay
                className="max-h-[90vh] max-w-[90vw] rounded-[var(--radius-md)]"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/40">
              {previewFile.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  )
}
