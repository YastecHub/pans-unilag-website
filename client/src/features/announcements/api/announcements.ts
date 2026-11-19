import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/http.ts'

export type Announcement = {
  id: string
  title: string
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
