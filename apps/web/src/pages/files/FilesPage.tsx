import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Folder, FolderOpen, FileText, Image, Video, Plus, Upload as UploadIcon,
  Pencil, Trash2, ChevronRight, Download, Play,
} from 'lucide-react'
import { Modal, Input, Switch, Upload, theme, ConfigProvider, Progress } from 'antd'
import type { UploadFile } from 'antd'
import { PageLayout, PageContainer, SectionHeader } from '@/components/layout/PageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatFileSize } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import type {
  Folder as FolderType, FolderFile, FolderContent,
  ApiResponse, PresignResult, ResourceType,
} from '@chenxu/types'

const { Dragger } = Upload

// ─── helpers ──────────────────────────────────────────────────────────────────

function getFileType(mime: string): ResourceType {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  return 'file'
}

const FILE_ICONS: Record<ResourceType, typeof FileText> = {
  image: Image,
  video: Video,
  file: FileText,
}

const FILE_COLORS: Record<ResourceType, string> = {
  image: 'from-blue-500/20 to-cyan-500/10 text-blue-400',
  video: 'from-violet-500/20 to-purple-500/10 text-violet-400',
  file: 'from-emerald-500/20 to-teal-500/10 text-emerald-400',
}

// ─── API hooks ─────────────────────────────────────────────────────────────────

function useRootFolders() {
  return useQuery({
    queryKey: ['folders', 'root'],
    queryFn: () => api.get<never, ApiResponse<FolderType[]>>('/folders'),
    select: (res) => res.data,
  })
}

function useFolderContent(id: number) {
  return useQuery({
    queryKey: ['folders', id],
    queryFn: () => api.get<never, ApiResponse<FolderContent>>(`/folders/${id}`),
    select: (res) => res.data,
    enabled: id > 0,
  })
}

// ─── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({ trail, onNavigate }: { trail: FolderType[]; onNavigate: (i: number) => void }) {
  return (
    <div className="flex items-center gap-1 text-sm flex-wrap">
      <button
        onClick={() => onNavigate(-1)}
        className="flex items-center gap-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <FolderOpen size={14} />
        根目录
      </button>
      {trail.map((f, i) => (
        <span key={f.id} className="flex items-center gap-1">
          <ChevronRight size={12} className="text-[var(--color-text-tertiary)]" />
          <button
            onClick={() => onNavigate(i)}
            className={
              i === trail.length - 1
                ? 'text-[var(--color-text-primary)] font-medium'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors'
            }
          >
            {f.name}
          </button>
        </span>
      ))}
    </div>
  )
}

// ─── FolderCard ────────────────────────────────────────────────────────────────

function FolderCard({ folder, isAdmin, onOpen, onEdit, onDelete }: {
  folder: FolderType; isAdmin: boolean
  onOpen: () => void; onEdit: () => void; onDelete: () => void
}) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
      <Card hover className="cursor-pointer" onClick={onOpen}>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center flex-shrink-0">
            <Folder size={18} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{folder.name}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">{folder.isPublic ? '公开' : '私有'}</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon-sm" onClick={onEdit}>
                <Pencil size={13} />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onDelete} className="hover:text-red-400">
                <Trash2 size={13} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── FileRow ───────────────────────────────────────────────────────────────────

function FileRow({ file, isAdmin, onPreview, onDelete }: {
  file: FolderFile; isAdmin: boolean
  onPreview: () => void; onDelete: () => void
}) {
  const Icon = FILE_ICONS[file.type]
  const colors = FILE_COLORS[file.type]

  const handleClick = () => {
    if (file.type === 'image' || file.type === 'video') {
      onPreview()
    } else {
      window.open(file.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
      <Card hover className="cursor-pointer" onClick={handleClick}>
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-[var(--radius-sm)] bg-gradient-to-br ${colors} flex items-center justify-center flex-shrink-0`}>
            {file.type === 'video'
              ? <Play size={16} className={colors.split(' ').pop()} />
              : <Icon size={16} className={colors.split(' ').pop()} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{file.name}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">{formatFileSize(file.size)}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <a href={file.url} download={file.name}>
              <Button variant="ghost" size="icon-sm">
                <Download size={13} />
              </Button>
            </a>
            {isAdmin && (
              <Button variant="ghost" size="icon-sm" onClick={onDelete} className="hover:text-red-400">
                <Trash2 size={13} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── PreviewModal ──────────────────────────────────────────────────────────────

function PreviewModal({ file, onClose }: { file: FolderFile | null; onClose: () => void }) {
  return (
    <Modal
      open={!!file}
      onCancel={onClose}
      footer={null}
      centered
      width="auto"
      styles={{ body: { padding: 0 }, mask: { background: 'rgba(0,0,0,0.92)' } }}
      closeIcon={<span className="text-white/60 hover:text-white text-xl">✕</span>}
    >
      {file?.type === 'image' && (
        <img
          src={file.url}
          alt={file.name}
          className="max-h-[85vh] max-w-[85vw] object-contain rounded-[var(--radius-md)] block"
        />
      )}
      {file?.type === 'video' && (
        <video
          src={file.url}
          controls
          autoPlay
          className="max-h-[85vh] max-w-[85vw] rounded-[var(--radius-md)] block"
        />
      )}
      {file && (
        <p className="text-center text-xs text-white/40 mt-2">{file.name}</p>
      )}
    </Modal>
  )
}

// ─── CreateFolderModal ─────────────────────────────────────────────────────────

function CreateFolderModal({ open, parentId, onClose }: {
  open: boolean; parentId: number | null; onClose: () => void
}) {
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      api.post<never, ApiResponse<FolderType>>('/folders', {
        name,
        ...(parentId !== null && { parentId }),
        isPublic,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] })
      setName('')
      setIsPublic(false)
      onClose()
    },
  })

  const handleOk = () => { if (name.trim()) mutation.mutate() }

  return (
    <Modal
      title="新建文件夹"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="创建"
      cancelText="取消"
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: !name.trim() }}
      afterClose={() => { setName(''); setIsPublic(false) }}
    >
      <div className="space-y-4 py-2">
        <Input
          placeholder="文件夹名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPressEnter={handleOk}
          autoFocus
        />
        <div className="flex items-center justify-between">
          <span className="text-sm">公开展示给所有用户</span>
          <Switch checked={isPublic} onChange={setIsPublic} />
        </div>
      </div>
    </Modal>
  )
}

// ─── EditFolderModal ───────────────────────────────────────────────────────────

function EditFolderModal({ folder, onClose }: { folder: FolderType; onClose: () => void }) {
  const [name, setName] = useState(folder.name)
  const [isPublic, setIsPublic] = useState(folder.isPublic)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      api.patch<never, ApiResponse<FolderType>>(`/folders/${folder.id}`, { name, isPublic }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] })
      onClose()
    },
  })

  return (
    <Modal
      title="编辑文件夹"
      open
      onCancel={onClose}
      onOk={() => { if (name.trim()) mutation.mutate() }}
      okText="保存"
      cancelText="取消"
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: !name.trim() }}
    >
      <div className="space-y-4 py-2">
        <Input
          placeholder="文件夹名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPressEnter={() => { if (name.trim()) mutation.mutate() }}
          autoFocus
        />
        <div className="flex items-center justify-between">
          <span className="text-sm">公开展示给所有用户</span>
          <Switch checked={isPublic} onChange={setIsPublic} />
        </div>
      </div>
    </Modal>
  )
}

// ─── UploadModal ───────────────────────────────────────────────────────────────

interface UploadItem {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  percent: number
  error?: string
}

function UploadModal({ open, folderId, onClose }: {
  open: boolean; folderId: number; onClose: () => void
}) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const qc = useQueryClient()

  const update = (i: number, patch: Partial<UploadItem>) =>
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it))

  const handleUpload = async () => {
    setUploading(true)
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'done') continue
      update(i, { status: 'uploading', percent: 10 })
      try {
        const item = items[i]
        const type = getFileType(item.file.type)
        const presignRes = await api.post<never, ApiResponse<PresignResult>>(
          `/folders/${folderId}/presign`,
          { filename: item.file.name, contentType: item.file.type },
        )
        update(i, { percent: 40 })
        const { uploadUrl, key, publicUrl } = presignRes.data
        await fetch(uploadUrl, {
          method: 'PUT',
          body: item.file,
          headers: { 'Content-Type': item.file.type },
        })
        update(i, { percent: 80 })
        await api.post(`/folders/${folderId}/files`, {
          name: item.file.name, url: publicUrl, key, type,
          size: item.file.size, folderId,
        })
        update(i, { status: 'done', percent: 100 })
      } catch {
        update(i, { status: 'error', percent: 0, error: '上传失败' })
      }
    }
    setUploading(false)
    qc.invalidateQueries({ queryKey: ['folders', folderId] })
  }

  const allDone = items.length > 0 && items.every((it) => it.status === 'done')

  const antdFileList: UploadFile[] = items.map((it, i) => ({
    uid: String(i),
    name: it.file.name,
    size: it.file.size,
    status: it.status === 'done' ? 'done' : it.status === 'error' ? 'error' : it.status === 'uploading' ? 'uploading' : 'done',
    percent: it.percent,
  }))

  const handleClose = () => {
    if (!uploading) {
      setItems([])
      onClose()
    }
  }

  return (
    <Modal
      title="上传文件"
      open={open}
      onCancel={handleClose}
      onOk={allDone ? handleClose : handleUpload}
      okText={allDone ? '完成' : '开始上传'}
      cancelText="取消"
      confirmLoading={uploading}
      okButtonProps={{ disabled: items.length === 0 }}
      afterClose={() => setItems([])}
    >
      <div className="py-2 space-y-3">
        <Dragger
          multiple
          fileList={antdFileList}
          beforeUpload={(file) => {
            setItems((prev) => [...prev, { file, status: 'pending', percent: 0 }])
            return false
          }}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadIcon size={32} className="mx-auto text-gray-400" />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">支持图片、视频、PDF 等任意格式，可多选</p>
        </Dragger>

        {items.length > 0 && (
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {items.map((it, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-0.5">
                  <span className="truncate flex-1 mr-2 text-[var(--color-text-primary)]">{it.file.name}</span>
                  <span className="text-xs text-[var(--color-text-tertiary)] flex-shrink-0">{formatFileSize(it.file.size)}</span>
                </div>
                <Progress
                  percent={it.percent}
                  status={it.status === 'error' ? 'exception' : it.status === 'done' ? 'success' : 'active'}
                  size="small"
                  showInfo={it.status !== 'uploading'}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── FilesPage ─────────────────────────────────────────────────────────────────

export function FilesPage() {
  const { isAdmin } = useAuthStore()
  const admin = isAdmin()
  const qc = useQueryClient()
  const [modal, contextHolder] = Modal.useModal()

  const [breadcrumb, setBreadcrumb] = useState<FolderType[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null)
  const [previewFile, setPreviewFile] = useState<FolderFile | null>(null)

  const currentLevel = breadcrumb.length + 1

  const rootQuery = useRootFolders()
  const contentQuery = useFolderContent(currentFolderId ?? 0)

  const folders: FolderType[] = currentFolderId === null
    ? (rootQuery.data ?? [])
    : (contentQuery.data?.subfolders ?? [])

  const files: FolderFile[] = currentFolderId === null
    ? []
    : (contentQuery.data?.files ?? [])

  const isLoading = currentFolderId === null ? rootQuery.isLoading : contentQuery.isLoading

  const openFolder = (folder: FolderType) => {
    setBreadcrumb((prev) => [...prev, folder])
    setCurrentFolderId(folder.id)
  }

  const navigateTo = (index: number) => {
    if (index === -1) {
      setBreadcrumb([])
      setCurrentFolderId(null)
    } else {
      const trail = breadcrumb.slice(0, index + 1)
      setBreadcrumb(trail)
      setCurrentFolderId(trail[trail.length - 1].id)
    }
  }

  const deleteFolderMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/folders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  })

  const deleteFileMutation = useMutation({
    mutationFn: ({ folderId, fileId }: { folderId: number; fileId: number }) =>
      api.delete(`/folders/${folderId}/files/${fileId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders', currentFolderId] }),
  })

  const handleDeleteFolder = (folder: FolderType) => {
    modal.confirm({
      title: '删除文件夹',
      content: `确认删除「${folder.name}」及其所有内容？此操作不可撤销。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => deleteFolderMutation.mutateAsync(folder.id),
    })
  }

  const handleDeleteFile = (file: FolderFile) => {
    modal.confirm({
      title: '删除文件',
      content: `确认删除「${file.name}」？此操作不可撤销。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => deleteFileMutation.mutateAsync({ folderId: file.folderId, fileId: file.id }),
    })
  }

  const isEmpty = folders.length === 0 && files.length === 0

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      {contextHolder}
      <PageLayout>
        <PageContainer>
          <SectionHeader
            title="文件"
            subtitle="文件夹与文件管理"
            action={
              admin ? (
                <div className="flex items-center gap-2">
                  {currentLevel <= 3 && (
                    <Button size="sm" variant="secondary" onClick={() => setShowCreate(true)}>
                      <Plus size={13} />
                      新建文件夹
                    </Button>
                  )}
                  {currentFolderId !== null && (
                    <Button size="sm" onClick={() => setShowUpload(true)}>
                      <UploadIcon size={13} />
                      上传文件
                    </Button>
                  )}
                </div>
              ) : undefined
            }
          />

          <div className="mb-6">
            <Breadcrumb trail={breadcrumb} onNavigate={navigateTo} />
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-[var(--color-surface)] rounded-[var(--radius-md)] animate-pulse" />
              ))}
            </div>
          ) : isEmpty ? (
            <div className="text-center py-20 text-[var(--color-text-tertiary)]">
              <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无内容</p>
              {admin && currentFolderId !== null && (
                <p className="text-xs mt-1">点击右上角上传文件</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {folders.length > 0 && (
                <section>
                  {files.length > 0 && (
                    <h3 className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">文件夹</h3>
                  )}
                  <div className="grid md:grid-cols-2 gap-3">
                    {folders.map((f) => (
                      <FolderCard
                        key={f.id} folder={f} isAdmin={admin}
                        onOpen={() => openFolder(f)}
                        onEdit={() => setEditingFolder(f)}
                        onDelete={() => handleDeleteFolder(f)}
                      />
                    ))}
                  </div>
                </section>
              )}
              {files.length > 0 && (
                <section>
                  {folders.length > 0 && (
                    <h3 className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">文件</h3>
                  )}
                  <div className="grid md:grid-cols-2 gap-3">
                    {files.map((f) => (
                      <FileRow
                        key={f.id} file={f} isAdmin={admin}
                        onPreview={() => setPreviewFile(f)}
                        onDelete={() => handleDeleteFile(f)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </PageContainer>

        <CreateFolderModal
          open={showCreate}
          parentId={currentFolderId}
          onClose={() => setShowCreate(false)}
        />
        {editingFolder && (
          <EditFolderModal
            key={editingFolder.id}
            folder={editingFolder}
            onClose={() => setEditingFolder(null)}
          />
        )}
        <UploadModal
          open={showUpload}
          folderId={currentFolderId ?? 0}
          onClose={() => setShowUpload(false)}
        />
        <PreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      </PageLayout>
    </ConfigProvider>
  )
}
