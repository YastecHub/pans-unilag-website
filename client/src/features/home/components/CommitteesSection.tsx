import { Link } from 'react-router'
import { cardLink } from '../../../components/ui/Card.tsx'
import { ButtonLink } from '../../../components/ui/Button.tsx'
import { PlaceholderText } from '../../../components/ui/Placeholder.tsx'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { type Committee, shortSession, useCommittees } from '../../committees/api/committees.ts'
import { CardGrid, HomeSection } from './HomeSection.tsx'

const SHOWN = 6

/** A first look at the committees of the current session, linking to each one. */
export function CommitteesSection() {
  const query = useCommittees()
  const committees = query.data?.committees ?? []
  const intro =
    query.isSuccess && query.data.session && committees.length > 0
      ? `${committees.length} committees run PANS projects in the ${shortSession(query.data.session)} session.`
      : undefined

  return (
    <HomeSection id="committees" title="Our committees" intro={intro} tone="alt">
      {query.isPending ? (
        <LoadingState label="Loading committees">
          <CardGrid as="div" min="16rem">
            {Array.from({ length: SHOWN }, (_, i) => (
              <Skeleton key={i} className="h-28 bg-surface" />
            ))}
          </CardGrid>
        </LoadingState>
      ) : query.isError ? (
        <ErrorState
          title="We couldn’t load the committees."
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : committees.length === 0 ? (
        <EmptyState
          title="Committees for this session will be listed soon."
          className="bg-surface"
        />
      ) : (
        <>
          <CardGrid min="16rem">
            {committees.slice(0, SHOWN).map((c) => (
              <li key={c.slug}>
                <CommitteeCard committee={c} />
              </li>
            ))}
          </CardGrid>
          <div>
            <ButtonLink to="/leadership/committees" variant="outline">
              All {committees.length} committees
            </ButtonLink>
          </div>
        </>
      )}
    </HomeSection>
  )
}

function CommitteeCard({ committee: c }: { committee: Committee }) {
  const lead = c.officers[0]
  return (
    <Link to={`/leadership/committees/${c.slug}`} className={cardLink}>
      <span className="text-small font-medium tracking-[0.08em] text-text-brand uppercase">
        {c.shortName}
      </span>
      <h3 className="text-[1.125rem]">{c.name}</h3>
      <span className="mt-auto pt-1 text-small text-text-muted">
        {lead ? (
          `${lead.title}: ${lead.name}`
        ) : (
          <PlaceholderText>Officers to be announced</PlaceholderText>
        )}
      </span>
    </Link>
  )
}
