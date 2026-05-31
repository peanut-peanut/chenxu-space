import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, Eye, Calendar, Tag, ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import MDEditor from '@uiw/react-md-editor'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Article, ApiResponse } from '@chenxu/types'

export function ArticleDetailPage() {
  const { slug } = useParams({ from: '/articles/$slug' })

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => api.get<never, ApiResponse<Article>>(`/articles/${slug}`),
    select: (res) => res.data,
  })

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-3xl mx-auto px-4 pt-16 space-y-4">
          <div className="h-8 w-2/3 bg-[var(--color-surface)] rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-[var(--color-surface)] rounded animate-pulse" />
          <div className="h-64 bg-[var(--color-surface)] rounded-[var(--radius-lg)] animate-pulse mt-8" />
        </div>
      </PageLayout>
    )
  }

  if (!article) return null

  return (
    <PageLayout>
      <article className="max-w-3xl mx-auto px-4 py-10">
        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link to="/articles">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} />
              返回文章
            </Button>
          </Link>
        </motion.div>

        {/* Cover */}
        {article.cover && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-[var(--radius-xl)] overflow-hidden h-64 md:h-80"
          >
            <img src={article.cover} alt={article.title} className="w-full h-full object-cover" />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Category */}
          {article.category && (
            <span className="inline-flex items-center text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent-glow)] px-3 py-1 rounded-full mb-4">
              {article.category.name}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] leading-tight mb-4">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)] mb-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              {formatDate(article.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              {article.readingTime} 分钟阅读
            </span>
            <span className="flex items-center gap-1.5">
              <Eye size={12} />
              {article.viewCount} 次阅读
            </span>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-8 flex-wrap">
              <Tag size={12} className="text-[var(--color-text-tertiary)]" />
              {article.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-1 rounded-full"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border-2)] to-transparent mb-8" />

          {/* Content */}
          <div data-color-mode="dark">
            <MDEditor.Markdown
              source={article.content}
              style={{
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-serif)',
                fontSize: '16px',
                lineHeight: '1.8',
              }}
            />
          </div>
        </motion.div>
      </article>
    </PageLayout>
  )
}
