import * as React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: boolean
}

export function Card({ className, hover, glow, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden',
        hover && 'transition-all duration-300 hover:border-[var(--color-border-2)] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(0,0,0,0.18)]',
        glow && 'hover:shadow-[0_0_18px_var(--color-accent-glow)]',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pb-0', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-5 pb-5 flex items-center gap-3', className)}
      {...props}
    />
  )
}
