import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { PageLayout, PageContainer } from '@/components/layout/PageLayout'
import { RichText } from '@/components/ui/RichText'
import { api } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import type { ApiResponse, ThoughtInsights, MonthlyThoughtStat } from '@chenxu/types'

function useInsights() {
  return useQuery({
    queryKey: ['thought-insights'],
    queryFn: () => api.get<never, ApiResponse<ThoughtInsights>>('/thoughts/insights'),
    select: (res) => res.data,
  })
}

function StatRow({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="flex items-baseline justify-between py-3 border-b border-[var(--color-border)] last:border-0">
      <span className="text-sm text-[var(--color-text-tertiary)]">{label}</span>
      <span className="text-sm font-medium tabular-nums text-[var(--color-text-primary)]">
        {value}{suffix && <span className="ml-0.5 text-[var(--color-text-tertiary)]">{suffix}</span>}
      </span>
    </div>
  )
}

function BarChart({ data, color }: { data: MonthlyThoughtStat[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex h-32 items-end gap-1.5">
      {data.map((item) => (
        <div key={item.value} className="group relative flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div
            className="absolute -top-7 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}
          >
            {item.count}
          </div>
          <div className="flex h-24 w-full flex-col justify-end">
            <div
              className={cn('w-full rounded-t transition-all duration-300 group-hover:opacity-80', color)}
              style={{ height: `${Math.max((item.count / max) * 100, item.count > 0 ? 8 : 0)}%` }}
            />
          </div>
          <span className="text-[10px] text-[var(--color-text-tertiary)]">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function TypeDistribution({ items, max }: { items: { label: string; value: string; count: number; duration?: number }[]; max: number }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.value} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">{item.label}</span>
            <span className="text-xs tabular-nums text-[var(--color-text-tertiary)]">
              {item.count} 次{item.duration ? ` · ${item.duration} 分` : ''}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${(item.count / max) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function RecentItem({
  item,
  accentClass,
}: {
  item: { id: number; content?: string; createdAt: string }
  accentClass: string
}) {
  return (
    <Link
      to="/daily"
      className="group block py-3 border-b border-[var(--color-border)] last:border-0"
    >
      <RichText
        content={item.content || '未填写内容'}
        className={cn('line-clamp-2 text-sm text-[var(--color-text-secondary)] transition-colors', accentClass)}
      />
      <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">
        {formatDate(item.createdAt, { relative: true })}
      </p>
    </Link>
  )
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface)]', className)} />
}

export function InsightsPage() {
  const { data, isLoading } = useInsights()
  const sport = data?.sport
  const investment = data?.investment
  const maxSportTypeCount = Math.max(...(sport?.byType.map((i) => i.count) ?? [0]), 1)

  return (
    <PageLayout>
      <PageContainer className="max-w-6xl">

        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-widest text-[var(--color-text-tertiary)]">Overview</p>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">数据面板</h1>
          </div>
          <Link
            to="/daily"
            className="group flex items-center gap-1 text-sm text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
          >
            查看日常
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {isLoading || !sport || !investment ? (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <SkeletonBlock className="h-72" />
              <SkeletonBlock className="h-72" />
            </div>
            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
              <SkeletonBlock className="h-60" />
              <SkeletonBlock className="h-60" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">

            {/* 运动：宽主区 + 窄类型分布 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="grid gap-4 lg:grid-cols-[1fr_300px]"
            >
              {/* 运动主卡 */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-base font-medium text-[var(--color-text-primary)]">运动</h2>
                  <span className="text-xs text-[var(--color-text-tertiary)]">近 6 个月</span>
                </div>

                {/* 数据行 — 替代 hero-metric，用 divide 分组 */}
                <div className="mb-6 grid grid-cols-2 gap-x-8 sm:grid-cols-4">
                  <StatRow label="记录" value={sport.totalPosts} suffix="条" />
                  <StatRow label="时长" value={sport.totalDuration} suffix="分钟" />
                  <StatRow label="消耗" value={sport.totalCalories} suffix="千卡" />
                  <StatRow label="活跃" value={sport.activeDays} suffix="天" />
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-tertiary)]">月度发布</span>
                  <span className="text-xs text-[var(--color-text-tertiary)]">均 {sport.avgDuration} 分 · {sport.avgCalories} 千卡</span>
                </div>
                <BarChart data={sport.monthly} color="bg-emerald-500" />
              </div>

              {/* 类型分布 */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <h2 className="mb-5 text-base font-medium text-[var(--color-text-primary)]">类型分布</h2>
                {sport.totalPosts === 0 ? (
                  <p className="text-sm text-[var(--color-text-tertiary)]">还没有运动记录</p>
                ) : (
                  <TypeDistribution items={sport.byType} max={maxSportTypeCount} />
                )}
              </div>
            </motion.div>

            {/* 投资：窄统计 + 宽最近记录 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
              className="grid gap-4 lg:grid-cols-[300px_1fr]"
            >
              {/* 投资统计 */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <h2 className="mb-5 text-base font-medium text-[var(--color-text-primary)]">投资</h2>
                <div className="mb-6">
                  <StatRow label="记录" value={investment.totalPosts} suffix="条" />
                  <StatRow label="活跃" value={investment.activeDays} suffix="天" />
                  <StatRow label="配图" value={investment.totalImages} suffix="张" />
                </div>
                <div className="mb-2">
                  <span className="text-xs text-[var(--color-text-tertiary)]">月度发布</span>
                </div>
                <BarChart data={investment.monthly} color="bg-rose-500" />
              </div>

              {/* 最近记录 */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <h2 className="mb-5 text-base font-medium text-[var(--color-text-primary)]">最近记录</h2>
                {investment.recent.length === 0 && sport.recent.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-tertiary)]">还没有运动或投资记录</p>
                ) : (
                  <div className="grid gap-x-8 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-medium text-emerald-500">运动</p>
                      {sport.recent.length === 0 ? (
                        <p className="py-3 text-sm text-[var(--color-text-tertiary)]">暂无</p>
                      ) : sport.recent.map((item) => (
                        <RecentItem key={item.id} item={item} accentClass="group-hover:text-emerald-500" />
                      ))}
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-rose-500">投资</p>
                      {investment.recent.length === 0 ? (
                        <p className="py-3 text-sm text-[var(--color-text-tertiary)]">暂无</p>
                      ) : investment.recent.map((item) => (
                        <RecentItem key={item.id} item={item} accentClass="group-hover:text-rose-500" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        )}
      </PageContainer>
    </PageLayout>
  )
}
