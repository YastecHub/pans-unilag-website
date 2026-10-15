import { navSection } from '../../../app/siteMap.ts'
import { Markdown } from '../../../components/ui/Markdown.tsx'
import { PlaceholderText } from '../../../components/ui/Placeholder.tsx'
import { SkeletonCard } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { shortSession } from '../../committees/api/committees.ts'
import { usePage } from '../../pages/api/pages.ts'
import { ArticleRefs } from '../../pages/components/ArticleRefs.tsx'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import { type Executive, isStandInName, useExecutives } from '../api/leadership.ts'
import { dutiesFor } from '../components/duties.ts'
import { PeopleGrid } from '../components/PeopleGrid.tsx'
import { PersonCard } from '../components/PersonCard.tsx'

/** /leadership/executive-council: the 14 offices in constitutional order, with each office's duties. */
export function ExecutiveCouncilPage() {
  const query = useExecutives()
  const duties = usePage('executive-council')
  const session = query.data?.session
  const title = session ? `Executive Council ${shortSession(session)}` : 'Executive Council'

  return (
    <InnerPageLayout
      title={title}
      section={navSection('Leadership')}
      intro="The officers elected to run PANS UNILAG this session, in the order the constitution lists them (Art. 6)."
      wide
    >
      {query.isPending ? (
        <LoadingState label="Loading the Executive Council">
          <PeopleGrid>
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i}>
                <SkeletonCard />
              </li>
            ))}
          </PeopleGrid>
        </LoadingState>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.executives.length === 0 ? (
        <EmptyState title="The Executive Council for this session will be listed soon." />
      ) : (
        <PeopleGrid>
          {query.data.executives.map((e) => (
            <li key={e.office}>
              <ExecutiveCard executive={e} duties={duties.data?.sections ?? []} />
            </li>
          ))}
        </PeopleGrid>
      )}
    </InnerPageLayout>
  )
}

function ExecutiveCard({
  executive: e,
  duties,
}: {
  executive: Executive
  duties: Parameters<typeof dutiesFor>[1]
}) {
  const office = dutiesFor(e.office, duties)
  return (
    <PersonCard
      role={e.office}
      name={e.name}
      nameIsStandIn={isStandInName(e)}
      level={e.level}
      photo={e.photo}
    >
      {e.bio ? <p>{e.bio}</p> : <PlaceholderText>Bio coming soon</PlaceholderText>}
      {e.roleEmail && (
        <a href={`mailto:${e.roleEmail}`} className="text-small">
          {e.roleEmail}
        </a>
      )}
      {office && (
        <details className="mt-auto border-t border-border pt-3">
          <summary className="cursor-pointer font-heading text-small font-medium text-text-brand">
            Duties
          </summary>
          <div className="flex flex-col gap-2 pt-2 text-small">
            <Markdown>{office.markdown}</Markdown>
            <ArticleRefs refs={office.articleRefs} />
          </div>
        </details>
      )}
    </PersonCard>
  )
}
