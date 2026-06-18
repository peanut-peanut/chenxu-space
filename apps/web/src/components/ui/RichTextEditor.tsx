import { useEffect } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Baseline,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const COLORS = [
  { label: '默认', value: '' },
  { label: '紫色', value: '#8b7cf8' },
  { label: '青色', value: '#7dd3fc' },
  { label: '绿色', value: '#34d399' },
  { label: '黄色', value: '#fbbf24' },
  { label: '红色', value: '#f87171' },
]

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]',
        active && 'bg-[var(--color-accent-glow)] text-[var(--color-accent)]'
      )}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const currentColor = (editor.getAttributes('textStyle').color as string) ?? ''

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--color-border)] px-2 py-1.5">
      <ToolbarButton
        title="加粗"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="斜体"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="下划线"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="删除线"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={14} />
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-[var(--color-border)]" />

      <ToolbarButton
        title="无序列表"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        title="有序列表"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={14} />
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-[var(--color-border)]" />

      <span className="inline-flex items-center gap-1">
        <Baseline size={14} className="text-[var(--color-text-tertiary)]" />
        {COLORS.map((c) => (
          <button
            key={c.value || 'default'}
            type="button"
            title={c.label}
            aria-label={`字体颜色 ${c.label}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (c.value) editor.chain().focus().setColor(c.value).run()
              else editor.chain().focus().unsetColor().run()
            }}
            className={cn(
              'h-5 w-5 rounded-full border transition-transform hover:scale-110',
              (currentColor || '') === c.value
                ? 'border-[var(--color-text-primary)]'
                : 'border-[var(--color-border)]'
            )}
            style={c.value ? { background: c.value } : undefined}
          >
            {!c.value && <span className="text-[10px] text-[var(--color-text-tertiary)]">A</span>}
          </button>
        ))}
      </span>
    </div>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}) {
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? '' : editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-content min-h-[100px] px-4 py-3 outline-none',
      },
    },
  })

  // 编辑外部重置内容（如切换新建/编辑）时同步
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm text-[var(--color-text-primary)] transition-all focus-within:border-[var(--color-accent)] focus-within:shadow-[0_0_0_3px_var(--color-accent-glow)]',
        className
      )}
    >
      <Toolbar editor={editor} />
      <div className="relative">
        {editor.isEmpty && placeholder && (
          <span className="pointer-events-none absolute left-4 top-3 text-[var(--color-text-tertiary)]">
            {placeholder}
          </span>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
