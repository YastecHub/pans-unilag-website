import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './http.ts'

/**
 * Server-state cache for the whole app (TanStack Query).
 * Errors the user caused (4xx) are not retried; network and server errors are retried twice.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
          return failureCount < 2
        },
      },
    },
  })
}
