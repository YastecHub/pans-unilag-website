import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, api } from '../../lib/http.ts'

/** The signed-in admin (GET /api/auth/me). Never includes the password hash. */
export type Admin = { id: string; name: string; email: string; role: 'admin' | 'editor' }

export const ME_KEY = ['admin', 'me'] as const

/** True when the session is missing or expired: send the person to sign in. */
export const isUnauthorized = (error: unknown) =>
  error instanceof ApiError && error.code === 'UNAUTHORIZED'

export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: ({ signal }) => api.get<{ admin: Admin }>('/api/auth/me', signal).then((r) => r.admin),
    retry: false,
    staleTime: 60_000,
  })
}

/**
 * Feedback and alumni sign-ups are personal data: only the "admin" role reads them (the API
 * refuses editors with 403). Editors manage content only.
 */
export function useCanReadSubmissions(): boolean {
  return useMe().data?.role === 'admin'
}

export function useSignIn() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api.post<{ admin: Admin }>('/api/auth/login', input).then((r) => r.admin),
    onSuccess: (admin) => client.setQueryData(ME_KEY, admin),
  })
}

export function useSignOut() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<void>('/api/auth/logout'),
    // Forget everything the session loaded, so nothing is left on screen or in memory.
    onSettled: () => client.removeQueries({ queryKey: ['admin'] }),
  })
}

/** GET /api/admin/placeholders: the to-do list, grouped by the page each item shows on. */
export type PlaceholderGroup = {
  collection: string
  page: string
  /** The public page, e.g. "/leadership/executive-council". */
  path: string
  items: { id: string; label: string; note: string; updatedAt: string | null }[]
}

export function usePlaceholders() {
  return useQuery({
    queryKey: ['admin', 'placeholders'],
    queryFn: ({ signal }) =>
      api.get<{ total: number; groups: PlaceholderGroup[] }>('/api/admin/placeholders', signal),
  })
}

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number }

export const FEEDBACK_STATUSES = ['new', 'read', 'resolved'] as const
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

export type FeedbackRecord = {
  id: string
  category: 'suggestion' | 'complaint' | 'welfare' | 'other'
  message: string
  contactEmail?: string
  status: FeedbackStatus
  createdAt: string
}

export const PAGE_SIZE = 25

export function useFeedback(filter: { status?: FeedbackStatus; page: number }, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'feedback', filter],
    enabled,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ page: String(filter.page), pageSize: String(PAGE_SIZE) })
      if (filter.status) params.set('status', filter.status)
      return api.get<Paged<FeedbackRecord>>(`/api/admin/submissions/feedback?${params}`, signal)
    },
  })
}

export type AlumnusRecord = {
  id: string
  name: string
  graduationYear: number
  email: string
  phone?: string
  interests: string[]
  consentAt: string
  createdAt: string
  updatedAt: string
}

export function useAlumni(page: number, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'alumni', page],
    enabled,
    queryFn: ({ signal }) =>
      api.get<Paged<AlumnusRecord>>(
        `/api/admin/submissions/alumni?page=${page}&pageSize=${PAGE_SIZE}`,
        signal,
      ),
  })
}

/**
 * Where to go after signing in. Only admin pages are allowed, so a crafted link can't send
 * someone off the site (or to a public page pretending to be the dashboard).
 */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/admin') || next.startsWith('//') || next.includes('\\')) {
    return '/admin'
  }
  return next.startsWith('/admin/sign-in') ? '/admin' : next
}
