import { Link, useRouterState } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  Home, BookOpen, Lightbulb, FolderOpen, HardDrive, LogIn, LogOut,
  Settings, Menu, X, Sparkles
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/thoughts', label: '想法', icon: Lightbulb },
  { to: '/articles', label: '文章', icon: BookOpen },
  { to: '/resources', label: '资源', icon: FolderOpen },
]

const adminNavItems = [
  { to: '/files', label: '文件', icon: HardDrive },
]

export function Navbar() {
  const { user, isLoggedIn, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouterState()
  const pathname = router.location.pathname

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-cyan)] flex items-center justify-center shadow-[0_0_15px_var(--color-accent-glow)]">
              <Sparkles size={14} className="text-white" />
            </span>
            <span className="font-semibold text-sm gradient-text">chenxu.xyz</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = pathname === to || (to !== '/' && pathname.startsWith(to))
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm transition-all duration-200',
                    active
                      ? 'text-[var(--color-accent)] bg-[var(--color-accent-glow)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]'
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
            {user?.role === 'admin' && adminNavItems.map(({ to, label, icon: Icon }) => {
              const active = pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm transition-all duration-200',
                    active
                      ? 'text-[var(--color-accent)] bg-[var(--color-accent-glow)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]'
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoggedIn() ? (
              <div className="hidden md:flex items-center gap-2">
                {user?.role === 'admin' && (
                  <Link to="/admin">
                    <Button variant="ghost" size="icon-sm">
                      <Settings size={15} />
                    </Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Avatar src={user?.avatar} alt={user?.nickname ?? ''} size="sm" />
                </Link>
                <Button variant="ghost" size="icon-sm" onClick={logout}>
                  <LogOut size={15} />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    <LogIn size={14} />
                    登录
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">注册</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 left-0 right-0 z-40 glass border-b border-[var(--color-border)] px-4 py-3 flex flex-col gap-1 md:hidden"
          >
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            {user?.role === 'admin' && adminNavItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <div className="h-px bg-[var(--color-border)] my-1" />
            {isLoggedIn() ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <Avatar src={user?.avatar} alt={user?.nickname ?? ''} size="sm" />
                <span className="text-sm text-[var(--color-text-primary)]">{user?.nickname}</span>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { logout(); setMenuOpen(false) }}>
                  <LogOut size={14} />
                  退出
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 px-3 py-2">
                <Link to="/login" className="flex-1" onClick={() => setMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">登录</Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setMenuOpen(false)}>
                  <Button size="sm" className="w-full">注册</Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
