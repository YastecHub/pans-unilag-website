import type { ReactNode } from 'react'
import { ApiError } from '../../lib/http.ts'
import { Button } from './Button.tsx'

/*
 * The three states every data-driven section needs, so all pages handle them the same way:
 *   const query = useQuery(...)
 *   if (query.isPending) return <LoadingState label="Loading events" />
 *   if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />
 *   if (query.data.length === 0) return <EmptyState title="No upcoming events yet. Check back soon." />
 */

/** Announces "Loading…" to screen readers while showing skeletons (pass them as children). */
export function LoadingState({
  label = 'Loading',
  children,
}: {
  label?: string
  children?: ReactNode
}) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  )
}

type EmptyStateProps = {
  /** README wording, e.g. "No upcoming events yet. Check back soon." */
  title: string
  description?: ReactNode
  /** A link or button, e.g. "See past events". */
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

/** A list with nothing in it (not missing content: that is a Placeholder). Plain panel, no dashes. */
export function EmptyState({ title, description, action, icon, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl bg-surface-alt px-6 py-8 text-center ${className}`}
    >
      <span className="text-text-brand">{icon ?? <InboxIcon />}</span>
      <p className="font-medium">{title}</p>
      {description && <div className="text-small text-text-muted">{description}</div>}
      {action}
    </div>
  )
}

type ErrorStateProps = {
  /** The thrown error. An ApiError supplies the message and the request id to quote. */
  error?: unknown
  title?: string
  onRetry?: () => void
  className?: string
}

/** Something failed to load. Shows a friendly message, a retry button and a reference to quote. */
export function ErrorState({
  error,
  title = 'We couldn’t load this.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  const apiError = error instanceof ApiError ? error : undefined
  const message = apiError?.message ?? 'Check your connection and try again.'

  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-xl border-2 border-danger px-6 py-8 text-center ${className}`}
    >
      <svg
        className="size-10 text-danger"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 16.5v.5" />
      </svg>
      <p className="font-medium">{title}</p>
      <p className="text-small text-text-muted">{message}</p>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
      {apiError?.requestId && (
        <p className="text-small text-text-muted">
          Reference: <span className="font-mono">{apiError.requestId}</span>
        </p>
      )}
    </div>
  )
}

function InboxIcon() {
  return (
    <svg
      className="size-10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}
