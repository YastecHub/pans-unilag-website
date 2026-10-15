import { Link } from 'react-router'
import { Badge } from '../../../components/ui/Badge.tsx'
import { SkeletonCard } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { formatDate } from '../../../lib/dates.ts'
import {
  OPPORTUNITY_TYPE_LABELS,
  type Opportunity,
  useOpportunities,
} from '../../opportunities/api/opportunities.ts'
import { CardGrid, cardLink, HomeSection } from './HomeSection.tsx'

const SHOWN = 3

/** Open opportunities, closing soonest first (the API leaves out closed ones). */
export function OpportunitiesSection() {
  const query = useOpportunities()

  return (
    <HomeSection
      id="opportunities"
      title="Open opportunities"
      link={{ to: '/opportunities', label: 'Opportunities hub' }}
    >
      {query.isPending ? (
        <LoadingState label="Loading opportunities">
          <CardGrid as="div">
            <SkeletonCard />
            <SkeletonCard />
          </CardGrid>
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
          description="Internships, scholarships and competitions, shared by the CPD & CBC Committee."
        />
      ) : (
        <CardGrid>
          {query.data.slice(0, SHOWN).map((o) => (
            <li key={o.slug}>
              <OpportunityCard opportunity={o} />
            </li>
          ))}
        </CardGrid>
      )}
    </HomeSection>
  )
}

function OpportunityCard({ opportunity: o }: { opportunity: Opportunity }) {
  return (
    <Link to={`/opportunities/${o.slug}`} className={cardLink}>
      <Badge>{OPPORTUNITY_TYPE_LABELS[o.type]}</Badge>
      <h3 className="text-[1.25rem]">{o.title}</h3>
      {o.organisation && <span className="text-small text-text-muted">{o.organisation}</span>}
      <span className="mt-auto pt-2 text-small font-medium text-text-brand">
        {o.deadline ? (
          <>
            Closes <time dateTime={o.deadline}>{formatDate(o.deadline)}</time>
          </>
        ) : (
          'Open: apply any time'
        )}
      </span>
    </Link>
  )
}
