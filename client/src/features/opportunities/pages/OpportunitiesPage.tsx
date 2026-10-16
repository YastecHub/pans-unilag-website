import { Link, useSearchParams } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { Badge } from '../../../components/ui/Badge.tsx'
import { cardLink } from '../../../components/ui/Card.tsx'
import { SkeletonCard } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import {
  isOpportunityType,
  OPPORTUNITY_TYPE_LABELS,
  OPPORTUNITY_TYPES,
  type Opportunity,
  type OpportunityType,
  useOpportunities,
} from '../api/opportunities.ts'
import { Deadline } from '../components/Deadline.tsx'
import { HubAside } from '../components/HubAside.tsx'

const grid = 'grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-4'

/**
 * /opportunities?type=internship: open listings, closing soonest first. The type filter lives in
 * the URL, so it survives a reload and can be shared.
 */
export function OpportunitiesPage() {
  const [params] = useSearchParams()
  const requested = params.get('type')
  const type = isOpportunityType(requested) ? requested : null
  const query = useOpportunities()

  return (
    <InnerPageLayout
      title="Opportunities hub"
      section={navSection('Opportunities')}
      intro="Internships, scholarships, competitions and more for pharmacy students, closing soonest first."
      aside={<HubAside />}
      wide
    >
      {query.isPending ? (
        <LoadingState label="Loading opportunities">
          <div className={grid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </LoadingState>
      ) : query.isError ? (
        <ErrorState
          title="We couldn’t load opportunities."
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <EmptyState
          title="No open opportunities right now. Check back soon."
          description="Internships, scholarships and competitions are shared here by the CPD & CBC Committee as they come in."
        />
      ) : (
        <>
          <TypeFilter all={query.data} selected={type} />
          <Listings all={query.data} type={type} />
        </>
      )}
    </InnerPageLayout>
  )
}

/** "All (5) · Internship (2) · Scholarship (1)…": only types with open listings, plus the selected one. */
function TypeFilter({ all, selected }: { all: Opportunity[]; selected: OpportunityType | null }) {
  const counts = new Map<OpportunityType, number>()
  for (const o of all) counts.set(o.type, (counts.get(o.type) ?? 0) + 1)
  const types = OPPORTUNITY_TYPES.filter((t) => counts.has(t) || t === selected)
  const chip = (active: boolean) =>
    `inline-flex min-h-10 items-center rounded-full border-2 px-4 text-small font-medium no-underline ${
      active
        ? 'border-primary-border bg-primary text-on-primary'
        : 'border-border text-text-brand hover:border-border-strong'
    }`

  return (
    <nav aria-label="Filter by type">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            to={{ search: '' }}
            aria-current={selected === null ? 'page' : undefined}
            className={chip(selected === null)}
          >
            All ({all.length})
          </Link>
        </li>
        {types.map((t) => (
          <li key={t}>
            <Link
              to={{ search: `?type=${t}` }}
              aria-current={selected === t ? 'page' : undefined}
              className={chip(selected === t)}
            >
              {OPPORTUNITY_TYPE_LABELS[t]} ({counts.get(t) ?? 0})
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Listings({ all, type }: { all: Opportunity[]; type: OpportunityType | null }) {
  const shown = type ? all.filter((o) => o.type === type) : all
  if (shown.length === 0) {
    return (
      <EmptyState
        title={`No open ${OPPORTUNITY_TYPE_LABELS[type!].toLowerCase()} listings right now.`}
        action={<Link to={{ search: '' }}>See all opportunities</Link>}
      />
    )
  }
  return (
    <>
      <p className="text-small text-text-muted" aria-live="polite">
        {shown.length} open {shown.length === 1 ? 'opportunity' : 'opportunities'}
        {type ? ` · ${OPPORTUNITY_TYPE_LABELS[type]}` : ''}
      </p>
      <ul className={grid}>
        {shown.map((o) => (
          <li key={o.slug}>
            <Link to={`/opportunities/${o.slug}`} className={cardLink}>
              <Badge>{OPPORTUNITY_TYPE_LABELS[o.type]}</Badge>
              <h2 className="text-[1.25rem]">{o.title}</h2>
              {o.organisation && (
                <span className="text-small text-text-muted">{o.organisation}</span>
              )}
              <span className="mt-auto pt-2 text-small font-medium text-text-brand">
                <Deadline opportunity={o} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
