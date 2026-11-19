import { navSection } from '../../../app/siteMap.ts'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { ArticleRefs } from '../../pages/components/ArticleRefs.tsx'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import { isStandInName, usePatrons } from '../api/leadership.ts'
import { PeopleGrid } from '../components/PeopleGrid.tsx'
import { PersonCard } from '../components/PersonCard.tsx'
import { FEATURES } from '../../../lib/features.ts'

/** /leadership/patrons: the Dean of the Faculty of Pharmacy and four others (Art. 4 S.C). */
export function PatronsPage() {
  const query = usePatrons()
  // At launch, patrons not yet named are left out (lib/features.ts).
  const patrons = (query.data ?? []).filter((p) => FEATURES.comingSoon || !p.isPlaceholder)
  return (
    <InnerPageLayout
      title="Patrons"
      section={navSection('Leadership')}
      intro="The Dean of the Faculty of Pharmacy and four others of proven integrity, appointed by the Executive Council and approved by the Senate."
      wide
    >
      {query.isPending ? (
        <LoadingState label="Loading the patrons">
          <Skeleton className="h-32" />
        </LoadingState>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : patrons.length === 0 ? (
        FEATURES.comingSoon && <EmptyState title="The patrons will be listed soon." />
      ) : (
        <PeopleGrid>
          {patrons.map((p) => (
            <li key={p.order}>
              <PersonCard role={p.title} name={p.name} nameIsStandIn={isStandInName(p)} />
            </li>
          ))}
        </PeopleGrid>
      )}
      <ArticleRefs refs={['Art. 4 S.C']} />
    </InnerPageLayout>
  )
}
