import { Sun, Moon, SunMoon } from 'lucide-react'
import { useThemeStore, resolveTheme } from '@/store/theme'
import { Button } from '@/components/ui/button'

const MODES = ['auto', 'light', 'dark'] as const

const config = {
  auto:  { icon: SunMoon, label: '跟随时间' },
  light: { icon: Sun,     label: '浅色模式' },
  dark:  { icon: Moon,    label: '深色模式' },
} as const

export function ThemeToggle() {
  const { mode, setMode } = useThemeStore()

  const cycle = () => {
    const idx = MODES.indexOf(mode)
    setMode(MODES[(idx + 1) % MODES.length])
  }

  const { icon: Icon, label } = config[mode]
  const resolved = resolveTheme(mode)

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={cycle}
      title={`${label}（当前：${resolved === 'light' ? '浅色' : '深色'}）`}
    >
      <Icon size={15} />
    </Button>
  )
}
