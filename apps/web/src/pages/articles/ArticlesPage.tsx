import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Clock, Eye, Tag, BookOpen } from 'lucide-react'
import { PageLayout, PageContainer, SectionHeader } from '@/components/layout/PageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { ArticleListItem, Category, PaginatedResult, ApiResponse } from '@chenxu/types'

function useArticles(categoryId?: number) {
  return useQuery({
    queryKey: ['articles', categoryId],
    queryFn: () =>
      api.get<never, ApiResponse<PaginatedResult<ArticleListItem>>>(
        `/articles?pageSize=20${categoryId ? `&categoryId=${categoryId}` : ''}`
      ),
    select: (res) => res.data,
  })
}

function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<never, ApiResponse<Category[]>>('/categories'),
    select: (res) => res.data,
  })
}

function ArticleCard({ article, index }: { article: ArticleListItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to="/articles/$slug" params={{ slug: article.slug }}>
        <Card hover glow className="group">
          <CardContent className="p-0">
            {article.cover && (
              <div className="h-44 overflow-hidden rounded-t-[var(--radius-lg)]">
                <img
                  src={article.cover}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            )}
            <div className="p-5">
              {article.category && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-accent)] bg-[var(--color-accent-glow)] px-2 py-0.5 rounded-full mb-3">
                  {article.category.name}
                </span>
              )}
              <h2 className="font-semibold text-[var(--color-text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors">
                {article.title}
              </h2>
              {article.summary && (
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">
                  {article.summary}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)]">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {article.readingTime} 分钟
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={11} />
                  {article.viewCount}
                </span>
                <span className="ml-auto">{formatDate(article.createdAt)}</span>
              </div>
              {article.tags.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <Tag size={10} className="text-[var(--color-text-tertiary)]" />
                  {article.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-[10px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export function ArticlesPage() {
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const { data: categories = [] } = useCategories()
  const { data, isLoading } = useArticles(selectedCategory)
  const articles = data?.data ?? []

  return (
    <PageLayout>
      <PageContainer>
        <SectionHeader title="文章" subtitle="技术思考与深度探索" />

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Button
              variant={selectedCategory === undefined ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory(undefined)}
            >
              全部
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-[var(--radius-lg)] bg-[var(--color-surface)] animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-text-tertiary)]">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">暂无文章</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article, i) => (
              <ArticleCard key={article.id} article={article} index={i} />
            ))}
          </div>
        )}
      </PageContainer>
    </PageLayout>
  )
}
