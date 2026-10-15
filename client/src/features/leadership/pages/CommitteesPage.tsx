import { Link } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { PlaceholderText } from '../../../components/ui/Placeholder.tsx'
import { SkeletonCard } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { type Committee, shortSession, useCommittees } from '../../committees/api/committees.ts'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import { firstSentence } from '../components/text.ts'

/** /leadership/committees: every committee of the session, linking to its page. */
export function CommitteesPage() {
  const query = useCommittees()
  const session = query.data?.session
  const count = query.data?.committees.length ?? 0
  return (
    <InnerPageLayout
      title="Committees"
      section={navSection('Leadership')}
      intro={
        session && count > 0
          ? `The ${count} committees appointed for the ${shortSession(session)} session, and who leads them.`
          : undefined
      }
      wide
    >
      {query.isPending ? (
        <LoadingState label="Loading committees">
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i}>
                <SkeletonCard />
              </li>
            ))}
          </ul>
        </LoadingState>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.committees.length === 0 ? (
        <EmptyState title="Committees for this session will be listed soon." />
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-4">
          {query.data.committees.map((c) => (
            <li key={c.slug}>
              <CommitteeCard committee={c} />
            </li>
          ))}
        </ul>
      )}
    </InnerPageLayout>
  )
}

function CommitteeCard({ committee: c }: { committee: Committee }) {
  return (
    <Link
      to={`/leadership/committees/${c.slug}`}
      className="flex h-full flex-col gap-2 rounded-xl border border-border bg-surface p-5 text-text no-underline hover:border-border-strong"
    >
      <span className="text-small font-medium tracking-[0.08em] text-text-brand uppercase">
        {c.shortName}
      </span>
      <h2 className="text-[1.25rem]">{c.name}</h2>
      {c.description ? (
        <p className="text-small text-text-muted">{firstSentence(c.description)}</p>
      ) : (
        <PlaceholderText>Write-up coming soon</PlaceholderText>
      )}
      {c.officers.length > 0 && (
        <ul className="mt-auto flex flex-col gap-0.5 pt-2 text-small">
          {c.officers.map((o) => (
            <li key={`${o.title}-${o.name}`}>
              <span className="text-text-muted">{o.title}:</span> {o.name}
            </li>
          ))}
        </ul>
      )}
    </Link>
  )
}
