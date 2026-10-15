import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/http.ts'

/** GET /api/announcements: only those active now, pinned first. */
export type Announcement = {
  id: string
  title: string
  /** Markdown, short. */
  body: string
  publishAt: string
  expiresAt: string | null
  pinned: boolean
  link: string
  isPlaceholder: boolean
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: ({ signal }) =>
      api.get<{ announcements: Announcement[] }>('/api/announcements', signal),
    select: (data) => data.announcements,
  })
}
