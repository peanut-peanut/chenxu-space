import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload as AntUpload } from 'antd'
import type { UploadFile } from 'antd'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { PageLayout, PageContainer } from '@/components/layout/PageLayout'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { User, Save, Camera, LogOut, UploadCloud } from 'lucide-react'
import type { ApiResponse, PresignResult } from '@chenxu/types'

const { Dragger } = AntUpload

export function ProfilePage() {
  const { user, setUser, logout } = useAuthStore()
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [avatar, setAvatar] = useState(user?.avatar ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const avatarFileList: UploadFile[] = avatarFile
    ? [{ uid: avatarFile.name, name: avatarFile.name, size: avatarFile.size, status: 'done' }]
    : []

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true)
    setSuccess(false)
    try {
      const res = await api.post<never, ApiResponse<PresignResult>>('/resources/avatar/presign', {
        filename: file.name,
        contentType: file.type,
      })
      const { uploadUrl, publicUrl } = res.data
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'x-oss-object-acl': 'public-read',
        },
      })
      setAvatar(publicUrl)
      setAvatarFile(file)
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSuccess(false)
    try {
      const res = await api.patch<never, ApiResponse<typeof user>>('/users/me', { nickname, avatar })
      if (res.data) {
        setUser(res.data)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch {
      // error handled by interceptor
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout>
      <PageContainer>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-[var(--color-accent-glow)]">
            <User size={20} className="text-[var(--color-accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">个人资料</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">管理你的个人信息</p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          {/* Avatar preview */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative group">
              <Avatar src={avatar || user?.avatar} alt={nickname} size="xl" />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={18} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">上传图片后保存即可更新头像</p>
          </motion.div>

          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-[var(--color-text-secondary)]">头像图片</span>
            <Dragger
              accept="image/*"
              maxCount={1}
              fileList={avatarFileList}
              showUploadList={!!avatarFile}
              beforeUpload={(file) => {
                void uploadAvatar(file as File)
                return false
              }}
              onRemove={() => {
                setAvatarFile(null)
                return true
              }}
              disabled={uploadingAvatar || saving}
            >
              <p className="ant-upload-drag-icon">
                <UploadCloud size={28} className="mx-auto text-[var(--color-text-tertiary)]" />
              </p>
              <p className="ant-upload-text">{uploadingAvatar ? '上传中...' : '点击或拖拽图片上传'}</p>
              <p className="ant-upload-hint">支持 jpg、png、webp 等图片格式</p>
            </Dragger>
          </div>

          <Input
            label="昵称"
            placeholder="你的昵称"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
          />

          <div className="pt-2 flex items-center gap-3">
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!nickname.trim() || uploadingAvatar}
              className="flex-1"
            >
              <Save size={15} />
              保存更改
            </Button>
            {success && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-green-400"
              >
                已保存 ✓
              </motion.span>
            )}
          </div>
        </Card>

        <Card className="p-6 mt-4">
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">账号信息</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">邮箱</span>
              <span className="text-[var(--color-text-primary)]">{user?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">角色</span>
              <span className={user?.role === 'admin' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}>
                {user?.role === 'admin' ? '管理员' : '普通用户'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 mt-4">
          <Button
            variant="danger"
            className="w-full"
            onClick={() => { void logout() }}
          >
            <LogOut size={15} />
            退出登录
          </Button>
        </Card>
      </div>
      </PageContainer>
    </PageLayout>
  )
}
