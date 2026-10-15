import { navSection } from '../../../app/siteMap.ts'
import { Markdown } from '../../../components/ui/Markdown.tsx'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { shortSession } from '../../committees/api/committees.ts'
import { usePage } from '../../pages/api/pages.ts'
import { ArticleRefs } from '../../pages/components/ArticleRefs.tsx'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import { isStandInName, useSenate } from '../api/leadership.ts'
import { PeopleGrid } from '../components/PeopleGrid.tsx'
import { PersonCard } from '../components/PersonCard.tsx'

/** /leadership/senate: the four principal officers, then how the Senate works (pages.json "senate"). */
export function SenatePage() {
  const query = useSenate()
  const about = usePage('senate')
  const session = query.data?.session
  const title = session ? `Senate ${shortSession(session)}` : 'Senate'
  const notes = new Set(
    query.data?.senators.filter((s) => s.isPlaceholder).map((s) => s.placeholderNote),
  )

  return (
    <InnerPageLayout title={title} section={navSection('Leadership')} wide>
      <section aria-labelledby="officers-title" className="flex flex-col gap-4">
        <h2 id="officers-title" className="text-h3">
          Principal officers
        </h2>
        {query.isPending ? (
          <LoadingState label="Loading the Senate">
            <Skeleton className="h-32" />
          </LoadingState>
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : query.data.senators.length === 0 ? (
          <EmptyState title="The Senate officers for this session will be listed soon." />
        ) : (
          <>
            {[...notes].filter(Boolean).map((note) => (
              <p key={note} className="text-text-muted">
                {note}.
              </p>
            ))}
            <PeopleGrid>
              {query.data.senators.map((s) => (
                <li key={s.position}>
                  <PersonCard
                    role={s.position}
                    name={s.name}
                    nameIsStandIn={isStandInName(s)}
                    level={s.level}
                  />
                </li>
              ))}
            </PeopleGrid>
          </>
        )}
      </section>

      {about.data?.sections.map((s) => (
        <section key={s.heading} className="flex max-w-[45rem] flex-col gap-3">
          <h2 className="text-h3">{s.heading}</h2>
          <Markdown>{s.bodyMarkdown}</Markdown>
          <ArticleRefs refs={s.articleRefs} />
        </section>
      ))}
    </InnerPageLayout>
  )
}
