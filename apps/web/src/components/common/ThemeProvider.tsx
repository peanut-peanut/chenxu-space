import { useEffect } from 'react'
import { useThemeStore, resolveTheme } from '@/store/theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode)

  useEffect(() => {
    const apply = () => {
      const theme = resolveTheme(mode)
      if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light')
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    }

    apply()

    // auto 模式每分钟检查一次时间，实现白天/夜晚自动切换
    if (mode === 'auto') {
      const interval = setInterval(apply, 60_000)
      return () => clearInterval(interval)
    }
  }, [mode])

  return <>{children}</>
}
