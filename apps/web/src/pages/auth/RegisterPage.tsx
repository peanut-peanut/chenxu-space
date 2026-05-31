import { useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, Eye, EyeOff, Sparkles, Camera, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import type { ApiResponse, User as UserType, PresignResult } from '@chenxu/types'

export function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ phone: '', email: '', password: '', nickname: '', avatar: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.phone.trim()) errs.phone = '手机号不能为空'
    else if (!/^1[3-9]\d{9}$/.test(form.phone)) errs.phone = '手机号格式不正确'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = '邮箱格式不正确'
    if (!form.nickname.trim()) errs.nickname = '昵称不能为空'
    if (form.password.length < 8) errs.password = '密码至少8位'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      setAvatarPreview(URL.createObjectURL(file))
      const presignRes = await api.post<never, ApiResponse<PresignResult>>('/resources/avatar/presign', {
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
      })
      const { uploadUrl, publicUrl } = presignRes.data
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      setForm((f) => ({ ...f, avatar: publicUrl }))
    } catch {
      setErrors((e) => ({ ...e, avatar: '头像上传失败，请重试' }))
      setAvatarPreview('')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        phone: form.phone,
        password: form.password,
        nickname: form.nickname,
        ...(form.email && { email: form.email }),
        ...(form.avatar && { avatar: form.avatar }),
      }
      const res = await api.post<never, ApiResponse<{ user: UserType }>>('/auth/register', payload)
      setUser(res.data.user)
      navigate({ to: '/' })
    } catch (err: unknown) {
      const e = err as { message?: string }
      setErrors({ phone: e?.message ?? '注册失败，请稍后重试' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[var(--color-cyan)]/5 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-cyan)] flex items-center justify-center shadow-[0_0_20px_var(--color-accent-glow)]">
              <Sparkles size={18} className="text-white" />
            </span>
            <span className="font-bold text-lg gradient-text">chenxu.xyz</span>
          </Link>
        </div>

        <div className="glow-border rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-8">
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">创建账号</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">加入这里，留下你的足迹</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 头像上传 */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative group"
                disabled={avatarUploading}
              >
                <Avatar src={avatarPreview || undefined} alt={form.nickname || '头像'} size="xl" />
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {avatarUploading
                    ? <Loader size={18} className="text-white animate-spin" />
                    : <Camera size={18} className="text-white" />
                  }
                </div>
              </button>
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {avatarUploading ? '上传中...' : '点击上传头像（选填）'}
              </span>
              {errors.avatar && <p className="text-xs text-[var(--color-danger)]">{errors.avatar}</p>}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* 手机号 必填 */}
            <Input
              label="手机号"
              type="tel"
              placeholder="请输入手机号"
              icon={<Phone size={15} />}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              error={errors.phone}
            />

            {/* 昵称 */}
            <Input
              label="昵称"
              placeholder="你的名字"
              icon={<User size={15} />}
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              error={errors.nickname}
            />

            {/* 邮箱 选填 */}
            <Input
              label="邮箱（选填）"
              type="email"
              placeholder="hi@example.com"
              icon={<Mail size={15} />}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
            />

            {/* 密码 + 可见切换 */}
            <div className="w-full space-y-1.5">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">密码</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
                  <Lock size={15} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="至少8位"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={[
                    'w-full h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-tertiary)] outline-none transition-all duration-200 pl-10 pr-10',
                    'focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-glow)]',
                    errors.password
                      ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_3px_rgba(248,113,113,0.15)]'
                      : 'border-[var(--color-border)]',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-[var(--color-danger)]">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              注册
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--color-text-secondary)] mt-6">
            已有账号？{' '}
            <Link to="/login" className="text-[var(--color-accent)] hover:underline">
              立即登录
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
