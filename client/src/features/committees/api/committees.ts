import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/http.ts'

/** GET /api/committees: the committees of the current session, in display order. */
export type Committee = {
  slug: string
  name: string
  shortName: string
  session: string
  order: number
  description: string
  activities: string[]
  achievements: string[]
  plans: string[]
  motto: string
  officers: { title: string; name: string; level: string }[]
  coverImage: string
  isPlaceholder: boolean
  placeholderNote?: string
}

export type CommitteeList = { session: string | null; sessions: string[]; committees: Committee[] }

export function useCommittees() {
  return useQuery({
    queryKey: ['committees'],
    queryFn: ({ signal }) => api.get<CommitteeList>('/api/committees', signal),
  })
}

/** "2026/2027" → "2026/27", as the site writes sessions. */
export function shortSession(session: string): string {
  const [first, second] = session.split('/')
  return second ? `${first}/${second.slice(-2)}` : session
}
