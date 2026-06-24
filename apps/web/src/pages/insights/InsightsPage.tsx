import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  Dumbbell,
  Flame,
  Image as ImageIcon,
  LineChart,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { PageLayout, PageContainer, SectionHeader } from '@/components/layout/PageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

function StatBlock({
  label,
  value,
  suffix,
  icon: Icon,
  tone,
}: {
  label: string
  value: number | string
  suffix?: string
  icon: typeof Activity
  tone: string
}) {
  return (
    <div className="border-l border-[var(--color-border-2)] py-1 pl-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-tertiary)]">{label}</span>
        <Icon size={16} className={tone} />
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-semibold leading-none text-[var(--color-text-primary)]">{value}</span>
        {suffix && <span className="text-xs text-[var(--color-text-tertiary)]">{suffix}</span>}
      </div>
    </div>
  )
}

function MiniBars({ data, tone }: { data: MonthlyThoughtStat[]; tone: string }) {
  const max = Math.max(...data.map((item) => item.count), 1)

  return (
    <div className="flex h-28 items-end gap-2">
      {data.map((item) => (
        <div key={item.value} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-20 w-full items-end rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]">
            <div
              className={cn('w-full rounded-[var(--radius-sm)] transition-all', tone)}
              style={{ height: `${Math.max((item.count / max) * 100, item.count > 0 ? 12 : 0)}%` }}
            />
          </div>
          <div className="text-center">
            <p className="text-[11px] leading-none text-[var(--color-text-tertiary)]">{item.label}</p>
            <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">{item.count}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] py-10 text-center text-sm text-[var(--color-text-tertiary)]">
      {text}
    </div>
  )
}

export function InsightsPage() {
  const { data, isLoading } = useInsights()
  const sport = data?.sport
  const investment = data?.investment
  const maxSportTypeCount = Math.max(...(sport?.byType.map((item) => item.count) ?? [0]), 1)

  return (
    <PageLayout>
      <PageContainer className="max-w-6xl">
        <SectionHeader
          title="数据面板"
          subtitle="运动记录和投资记录来自日常发布内容"
          action={
            <Link to="/daily">
              <Button size="sm" variant="secondary">查看日常</Button>
            </Link>
          }
        />

        {isLoading || !sport || !investment ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface)]" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]"
            >
              <Card>
                <CardContent className="space-y-5 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">运动记录</h2>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">从运动类型日常中汇总训练数据</p>
                    </div>
                    <Dumbbell size={22} className="text-emerald-400" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <StatBlock label="记录数" value={sport.totalPosts} icon={Activity} tone="text-emerald-400" />
                    <StatBlock label="总时长" value={sport.totalDuration} suffix="分钟" icon={Timer} tone="text-cyan-400" />
                    <StatBlock label="总消耗" value={sport.totalCalories} suffix="千卡" icon={Flame} tone="text-amber-400" />
                    <StatBlock label="活跃天数" value={sport.activeDays} suffix="天" icon={BarChart3} tone="text-violet-400" />
                  </div>
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-[var(--color-text-primary)]">近 6 个月运动发布</h3>
                      <span className="text-xs text-[var(--color-text-tertiary)]">平均 {sport.avgDuration} 分钟 / {sport.avgCalories} 千卡</span>
                    </div>
                    <MiniBars data={sport.monthly} tone="bg-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 p-5">
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)]">运动类型分布</h3>
                  {sport.totalPosts === 0 ? (
                    <EmptyState text="还没有运动记录" />
                  ) : (
                    <div className="space-y-4">
                      {sport.byType.map((item) => (
                        <div key={item.value}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="text-[var(--color-text-secondary)]">{item.label}</span>
                            <span className="text-[var(--color-text-tertiary)]">{item.count} 次 · {item.duration} 分钟</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                            <div
                              className="h-full rounded-full bg-emerald-400"
                              style={{ width: `${(item.count / maxSportTypeCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.05 }}
              className="grid gap-4 lg:grid-cols-[0.95fr_1.35fr]"
            >
              <Card>
                <CardContent className="space-y-5 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">投资记录</h2>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">从投资类型日常中汇总复盘频率</p>
                    </div>
                    <TrendingUp size={22} className="text-rose-400" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <StatBlock label="记录数" value={investment.totalPosts} icon={LineChart} tone="text-rose-400" />
                    <StatBlock label="活跃天数" value={investment.activeDays} suffix="天" icon={BarChart3} tone="text-violet-400" />
                    <StatBlock label="配图数" value={investment.totalImages} icon={ImageIcon} tone="text-cyan-400" />
                  </div>
                  <MiniBars data={investment.monthly} tone="bg-rose-400" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 p-5">
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)]">最近记录</h3>
                  {investment.recent.length === 0 && sport.recent.length === 0 ? (
                    <EmptyState text="还没有运动或投资记录" />
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-emerald-400">运动</p>
                        {sport.recent.length === 0 ? (
                          <p className="text-sm text-[var(--color-text-tertiary)]">暂无运动记录</p>
                        ) : sport.recent.map((item) => (
                          <Link
                            key={item.id}
                            to="/daily"
                            className="block border-b border-[var(--color-border)] py-3 transition-colors hover:text-emerald-400"
                          >
                            <RichText content={item.content || '未填写内容'} className="line-clamp-2 text-sm text-[var(--color-text-secondary)]" />
                            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                              {formatDate(item.createdAt, { relative: true })}
                            </p>
                          </Link>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-rose-400">投资</p>
                        {investment.recent.length === 0 ? (
                          <p className="text-sm text-[var(--color-text-tertiary)]">暂无投资记录</p>
                        ) : investment.recent.map((item) => (
                          <Link
                            key={item.id}
                            to="/daily"
                            className="block border-b border-[var(--color-border)] py-3 transition-colors hover:text-rose-400"
                          >
                            <RichText content={item.content || '未填写内容'} className="line-clamp-2 text-sm text-[var(--color-text-secondary)]" />
                            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                              {formatDate(item.createdAt, { relative: true })}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.section>
          </div>
        )}
      </PageContainer>
    </PageLayout>
  )
}
