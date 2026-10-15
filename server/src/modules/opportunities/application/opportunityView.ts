import { isOnOrBeforeLagosDay } from '../../../lib/lagosTime.js'
import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'
import type { OPPORTUNITY_TYPES } from '../infrastructure/opportunity.model.js'

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number]

export type StoredOpportunity = {
  slug: string
  title: string
  type: OpportunityType
  organisation?: string
  eligibility?: string
  description?: string
  deadline?: Date | string | null
  applyUrl?: string
  lastCheckedAt?: Date | string | null
  isPlaceholder?: boolean
  placeholderNote?: string
}

export type OpportunityView = PlaceholderView & {
  slug: string
  title: string
  type: OpportunityType
  organisation: string
  eligibility: string
  /** Markdown. */
  description: string
  /** Last day to apply (inclusive, Lagos); null for rolling opportunities. */
  deadline: string | null
  applyUrl: string
  lastCheckedAt: string | null
}

const iso = (value: Date | string | null | undefined) =>
  value ? new Date(value).toISOString() : null

/** Open until the end of the Lagos day of its deadline; rolling opportunities are always open. */
export function isOpen(o: Pick<StoredOpportunity, 'deadline'>, now: Date): boolean {
  return !o.deadline || isOnOrBeforeLagosDay(now, new Date(o.deadline))
}

/** Closing soonest first; rolling opportunities (no deadline) last. */
export function compareOpportunities(a: OpportunityView, b: OpportunityView): number {
  if (a.deadline !== b.deadline) {
    if (a.deadline === null) return 1
    if (b.deadline === null) return -1
    return Date.parse(a.deadline) - Date.parse(b.deadline)
  }
  return a.title.localeCompare(b.title)
}

export function toOpportunityView(o: StoredOpportunity): OpportunityView {
  return {
    slug: o.slug,
    title: o.title,
    type: o.type,
    organisation: o.organisation ?? '',
    eligibility: o.eligibility ?? '',
    description: o.description ?? '',
    deadline: iso(o.deadline),
    applyUrl: o.applyUrl ?? '',
    lastCheckedAt: iso(o.lastCheckedAt),
    ...placeholderView(o),
  }
}

export function openOpportunities(
  stored: StoredOpportunity[],
  now: Date,
  type?: OpportunityType,
): OpportunityView[] {
  return stored
    .filter((o) => (!type || o.type === type) && isOpen(o, now))
    .map(toOpportunityView)
    .sort(compareOpportunities)
}

export type OpportunityReader = {
  list(filter: { type?: OpportunityType }): Promise<StoredOpportunity[]>
  findBySlug(slug: string): Promise<StoredOpportunity | null>
}
