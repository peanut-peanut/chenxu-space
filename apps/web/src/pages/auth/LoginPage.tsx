import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Lock, Phone, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import type { ApiResponse, User } from '@chenxu/types'

export function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [form, setForm] = useState({ phone: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<never, ApiResponse<{ user: User }>>('/auth/login', form)
      setUser(res.data.user)
      navigate({ to: '/' })
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e?.message ?? '登录失败，请检查账号密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[var(--color-accent)]/5 rounded-full blur-[80px] pointer-events-none" />

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
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">欢迎回来</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">登录你的账号继续</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="手机号"
              type="tel"
              placeholder="请输入手机号"
              icon={<Phone size={15} />}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
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
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className={[
                    'w-full h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-tertiary)] outline-none transition-all duration-200 pl-10 pr-10',
                    'focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-glow)]',
                    error
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
              {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              登录
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--color-text-secondary)] mt-6">
            还没有账号？{' '}
            <Link to="/register" className="text-[var(--color-accent)] hover:underline">
              立即注册
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
