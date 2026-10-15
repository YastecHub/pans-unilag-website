import type { ReactNode } from 'react'

export type BadgeTone = 'accent' | 'brand' | 'neutral'

const TONES: Record<BadgeTone, string> = {
  /** "New", "Pinned": yellow with dark text. */
  accent: 'bg-accent text-on-accent',
  /** Categories, series, "Open": pale green-grey with green text. */
  brand: 'bg-surface-alt text-text-brand',
  /** Low-key labels such as "Closed". */
  neutral: 'border border-border-strong text-text-muted',
}

/** A short label. For missing details ("Date to be announced") use PlaceholderText instead. */
export function Badge({
  children,
  tone = 'brand',
  className = '',
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 self-start rounded-full px-2.5 py-0.5 text-small font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
