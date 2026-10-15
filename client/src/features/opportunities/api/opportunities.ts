import { useQuery } from '@tanstack/react-query'
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

export function useOpportunities(type?: OpportunityType) {
  return useQuery({
    queryKey: ['opportunities', type ?? 'all'],
    queryFn: ({ signal }) =>
      api.get<{ opportunities: Opportunity[] }>(
        `/api/opportunities${type ? `?type=${type}` : ''}`,
        signal,
      ),
    select: (data) => data.opportunities,
  })
}
