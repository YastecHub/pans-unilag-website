import { type UseQueryResult, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { isUnauthorized } from '../api.ts'

/**
 * Loading, error and data for an admin list. A session that expired while the page was open
 * (401) goes back to sign-in instead of showing an error.
 */
export function AdminQuery<T>({
  query,
  label,
  children,
}: {
  query: UseQueryResult<T>
  label: string
  children: (data: T) => ReactNode
}) {
  if (query.isPending) {
    return (
      <LoadingState label={`Loading ${label}`}>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </LoadingState>
    )
  }
  if (query.isError) {
    if (isUnauthorized(query.error)) return <SessionEnded />
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />
  }
  return <>{children(query.data)}</>
}

/**
 * The session expired while the page was open: forget it (so the sign-in page doesn't think
 * we're still signed in and bounce straight back), then go to sign-in and return here after.
 */
function SessionEnded() {
  const client = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    client.removeQueries({ queryKey: ['admin'] })
    const next = encodeURIComponent(location.pathname + location.search)
    navigate(`/admin/sign-in?next=${next}&expired=1`, { replace: true })
  }, [client, navigate, location.pathname, location.search])
  return null
}

/** "Page 2 of 5" with Previous/Next links that keep the other filters in the URL. */
export function Pager({
  page,
  total,
  pageSize,
  hrefFor,
}: {
  page: number
  total: number
  pageSize: number
  hrefFor: (page: number) => string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3">
      {page > 1 ? <Link to={hrefFor(page - 1)}>← Previous</Link> : <span />}
      <span className="text-small text-text-muted">
        Page {page} of {pages}
      </span>
      {page < pages ? <Link to={hrefFor(page + 1)}>Next →</Link> : <span />}
    </nav>
  )
}
