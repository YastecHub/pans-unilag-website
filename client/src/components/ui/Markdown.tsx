import { lazy, Suspense } from 'react'

const MarkdownRenderer = lazy(() => import('./MarkdownRenderer.tsx'))

/**
 * Renders content Markdown safely (see MarkdownRenderer). The parser is downloaded only when a page
 * actually shows Markdown, keeping the home page light; until then the plain text is shown.
 */
export function Markdown({ children, className = '' }: { children: string; className?: string }) {
  return (
    <Suspense fallback={<div className={`whitespace-pre-line ${className}`}>{children}</div>}>
      <MarkdownRenderer className={className}>{children}</MarkdownRenderer>
    </Suspense>
  )
}
