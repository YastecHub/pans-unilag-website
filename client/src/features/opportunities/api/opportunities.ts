import { useQuery } from '@tanstack/react-query'
import { lagosDay } from '../../../lib/dates.ts'
import { api } from '../../../lib/http.ts'

export const OPPORTUNITY_TYPE_LABELS = {
  scholarship: 'Scholarship',
  internship: 'Internship',
  competition: 'Competition',
  conference: 'Conference',
  training: 'Training',
  job: 'Job',
  other: 'Opportunity',
} as const

export type OpportunityType = keyof typeof OPPORTUNITY_TYPE_LABELS

export const OPPORTUNITY_TYPES = Object.keys(OPPORTUNITY_TYPE_LABELS) as OpportunityType[]

export function isOpportunityType(value: string | null): value is OpportunityType {
  return value !== null && value in OPPORTUNITY_TYPE_LABELS
}

/** GET /api/opportunities: open ones only, closing soonest first. */
export type Opportunity = {
  slug: string
  title: string
  type: OpportunityType
  organisation: string
  eligibility: string
  description: string
  /** Last day to apply (Lagos); null for rolling listings. */
  deadline: string | null
  applyUrl: string
  lastCheckedAt: string | null
  isPlaceholder: boolean
  placeholderNote?: string
}

/**
 * Open until the end of its deadline day in Lagos; no deadline means rolling (always open).
 * The API already leaves out closed listings; checking again here means a list loaded before
 * midnight never shows yesterday's deadline to someone who keeps the tab open.
 */
export function isOpen(o: Pick<Opportunity, 'deadline'>, now: Date = new Date()): boolean {
  return !o.deadline || lagosDay(o.deadline) >= lagosDay(now)
}

/** Whole Lagos days from today to the deadline: 0 on the last day; null when rolling. */
export function daysLeft(o: Pick<Opportunity, 'deadline'>, now: Date = new Date()): number | null {
  if (!o.deadline) return null
  const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`)
  return Math.round((day(lagosDay(o.deadline)) - day(lagosDay(now))) / 86_400_000)
}

/** Every open opportunity, closing soonest first. Filter by type on the page, so counts show. */
export function useOpportunities() {
  return useQuery({
    queryKey: ['opportunities'],
    queryFn: ({ signal }) =>
      api.get<{ opportunities: Opportunity[] }>('/api/opportunities', signal),
    select: (data) => data.opportunities.filter((o) => isOpen(o)),
  })
}

/** GET /api/opportunities/:slug: 404 once the deadline has passed. */
export function useOpportunity(slug: string) {
  return useQuery({
    queryKey: ['opportunity', slug],
    queryFn: ({ signal }) =>
      api.get<Opportunity>(`/api/opportunities/${encodeURIComponent(slug)}`, signal),
  })
}
