import type { ElementType, ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** "outlined" (default): white with a border. "filled": pale green-grey, no border. */
  tone?: 'outlined' | 'filled'
  /** Element to render: a list item in grids, an article for standalone content. */
  as?: ElementType
  className?: string
}

/** The standard content box: rounded corners, 20 px padding, brand surface colours. */
export function Card({ children, tone = 'outlined', as: Tag = 'div', className = '' }: Props) {
  const toneClass = tone === 'filled' ? 'bg-surface-alt' : 'border border-border bg-surface'
  return (
    <Tag className={`flex flex-col gap-2 rounded-xl p-5 ${toneClass} ${className}`}>{children}</Tag>
  )
}
