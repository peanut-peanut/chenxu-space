import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { cn } from '@/lib/utils'

// 富文本编辑器输出的标签白名单，配合后端只读渲染
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 's', 'span', 'ul', 'ol', 'li', 'blockquote', 'code', 'h1', 'h2', 'h3']
const ALLOWED_ATTR = ['style', 'class']

// 旧数据为纯文本（不含 HTML 标签），新数据为富文本 HTML
function isHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content)
}

export function RichText({ content, className }: { content: string; className?: string }) {
  const html = useMemo(() => {
    if (!content) return ''
    if (!isHtml(content)) {
      // 纯文本：转义后保留换行
      const escaped = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      return escaped.replace(/\n/g, '<br>')
    }
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      // 只允许 color 相关内联样式，禁止注入危险样式
      ALLOWED_URI_REGEXP: /^$/,
    })
  }, [content])

  return (
    <div
      className={cn('tiptap-content', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
