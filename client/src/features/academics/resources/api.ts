import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/http.ts'

export const LEVELS = ['100L', '200L', '300L', '400L', '500L'] as const
export type Level = (typeof LEVELS)[number]
export type Semester = 'first' | 'second'
export const SEMESTERS: { value: Semester; label: string }[] = [
  { value: 'first', label: 'First semester' },
  { value: 'second', label: 'Second semester' },
]

export function isLevel(value: string | null): value is Level {
  return (LEVELS as readonly (string | null)[]).includes(value)
}

/** GET /api/resources: by level, semester and course. */
export type Resource = {
  id: string
  title: string
  level: Level
  semester: Semester
  course: string
  description: string
  url: string
  /** Who checked the link, e.g. "Academics Committee". */
  verifiedBy: string
  isPlaceholder: boolean
  placeholderNote?: string
}

/**
 * Sites known for pirated textbooks and papers. Resources are checked by the Academics Committee
 * before they are added; this is a second safety net so the site never links to copyrighted books.
 */
const BLOCKED_HOSTS = [
  'libgen',
  'library.lol',
  'z-lib',
  'zlibrary',
  'z-library',
  '1lib',
  'b-ok',
  'pdfdrive',
  'annas-archive',
  'sci-hub',
  'ebookee',
  'vdoc.pub',
  'dokumen.pub',
]

/** True for a working http(s) link that isn't on a known piracy site. */
export function isAllowedLink(url: string): boolean {
  let host: string
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    host = parsed.hostname.toLowerCase()
  } catch {
    return false
  }
  return !BLOCKED_HOSTS.some((blocked) => host.includes(blocked))
}

/** Real, checked resources only: placeholders and disallowed links are left out. */
export function useResources() {
  return useQuery({
    queryKey: ['resources'],
    queryFn: ({ signal }) => api.get<{ resources: Resource[] }>('/api/resources', signal),
    select: (data) =>
      data.resources.filter((r) => !r.isPlaceholder && r.url && isAllowedLink(r.url)),
  })
}

export type LevelGroup = {
  level: Level
  semesters: { semester: Semester; label: string; resources: Resource[] }[]
  count: number
}

/** Every level and both semesters, in order, even when empty (so placeholders can show). */
export function groupResources(resources: Resource[]): LevelGroup[] {
  return LEVELS.map((level) => {
    const semesters = SEMESTERS.map(({ value, label }) => ({
      semester: value,
      label,
      resources: resources.filter((r) => r.level === level && r.semester === value),
    }))
    return { level, semesters, count: semesters.reduce((n, s) => n + s.resources.length, 0) }
  })
}
