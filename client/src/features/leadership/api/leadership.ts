import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/http.ts'

type SessionList = { session: string | null; sessions: string[] }

/** GET /api/executives: the 14 offices in constitutional order (Art. 6). */
export type Executive = {
  session: string
  office: string
  order: number
  name: string
  level: string
  bio: string
  /** Cloudinary public id; empty until the official photo. */
  photo: string
  roleEmail: string
  isPlaceholder: boolean
  placeholderNote?: string
}

/** GET /api/senate: the principal officers. */
export type Senator = {
  session: string
  position: string
  order: number
  name: string
  level: string
  isPlaceholder: boolean
  placeholderNote?: string
}

/** GET /api/patrons: the Dean first. */
export type Patron = {
  order: number
  name: string
  title: string
  isDean: boolean
  isPlaceholder: boolean
  placeholderNote?: string
}

export function useExecutives() {
  return useQuery({
    queryKey: ['executives'],
    queryFn: ({ signal }) =>
      api.get<SessionList & { executives: Executive[] }>('/api/executives', signal),
  })
}

export function useSenate() {
  return useQuery({
    queryKey: ['senate'],
    queryFn: ({ signal }) => api.get<SessionList & { senators: Senator[] }>('/api/senate', signal),
  })
}

export function usePatrons() {
  return useQuery({
    queryKey: ['patrons'],
    queryFn: ({ signal }) => api.get<{ patrons: Patron[] }>('/api/patrons', signal),
    select: (data) => data.patrons,
  })
}

/**
 * The seed files hold the seat with a stand-in name ("Name to be announced", "Election pending")
 * until the real one is known. Those must never look like a real person's name.
 */
const STAND_IN_NAMES = /^(name to be announced|election pending|to be announced)$/i

export function isStandInName(person: { name: string; isPlaceholder: boolean }): boolean {
  return person.isPlaceholder && STAND_IN_NAMES.test(person.name.trim())
}
