import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  /** "page" (default, 1200 px) or "wide" (1280 px, for the header). */
  width?: 'page' | 'wide'
}

/** Centres content with the standard side padding: 16 px on phones, up to 40 px on desktop. */
export function Container({ children, className = '', width = 'page' }: Props) {
  const maxWidth = width === 'wide' ? 'max-w-[80rem]' : 'max-w-[75rem]'
  return (
    <div className={`mx-auto w-full ${maxWidth} px-4 sm:px-6 lg:px-10 ${className}`}>
      {children}
    </div>
  )
}
