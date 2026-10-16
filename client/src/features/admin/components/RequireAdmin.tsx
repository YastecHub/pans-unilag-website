import { Navigate, Outlet, useLocation } from 'react-router'
import { LoadingState, ErrorState } from '../../../components/ui/States.tsx'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { isUnauthorized, useMe } from '../api.ts'

/**
 * Lets signed-in admins through; everyone else goes to the sign-in page, which brings them back
 * here afterwards. The server checks the session on every admin request too: this is the
 * friendly front door, not the lock.
 */
export function RequireAdmin() {
  const me = useMe()
  const location = useLocation()

  if (me.isPending) {
    return (
      <div className="mx-auto max-w-md p-8">
        <LoadingState label="Checking your session">
          <Skeleton className="h-10 w-full" />
        </LoadingState>
      </div>
    )
  }
  if (me.isError) {
    if (isUnauthorized(me.error)) {
      const next = encodeURIComponent(location.pathname + location.search)
      return <Navigate to={`/admin/sign-in?next=${next}`} replace />
    }
    return (
      <div className="mx-auto max-w-md p-8">
        <ErrorState error={me.error} onRetry={() => me.refetch()} />
      </div>
    )
  }
  return <Outlet />
}
