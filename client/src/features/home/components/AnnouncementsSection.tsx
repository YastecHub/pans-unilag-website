import { Link } from 'react-router'
import { Badge } from '../../../components/ui/Badge.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { formatDate } from '../../../lib/dates.ts'
import { type Announcement, useAnnouncements } from '../../announcements/api/announcements.ts'
import { CardGrid, HomeSection } from './HomeSection.tsx'

/**
 * Active announcements, pinned first (the API hides expired ones).
 * With none to show, the section is left out rather than showing an empty band.
 */
export function AnnouncementsSection() {
  const query = useAnnouncements()
  if (query.isSuccess && query.data.length === 0) return null

  return (
    <HomeSection id="announcements" title="Announcements" tone="alt">
      {query.isPending ? (
        <LoadingState label="Loading announcements">
          <CardGrid as="div">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </CardGrid>
        </LoadingState>
      ) : query.isError ? (
        <ErrorState
          title="We couldn’t load the announcements."
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : (
        <CardGrid>
          {query.data.map((a) => (
            <li key={a.id}>
              <AnnouncementCard announcement={a} />
            </li>
          ))}
        </CardGrid>
      )}
    </HomeSection>
  )
}

function AnnouncementCard({ announcement: a }: { announcement: Announcement }) {
  return (
    <Card as="article" className="h-full">
      <div className="flex flex-wrap items-center gap-2">
        {a.pinned && <Badge tone="accent">Pinned</Badge>}
        <time dateTime={a.publishAt} className="text-small text-text-muted">
          {formatDate(a.publishAt)}
        </time>
      </div>
      <h3>{a.title}</h3>
      {/* Short text; Markdown rendering arrives with the sanitised renderer in the About pages issue. */}
      <p className="whitespace-pre-line">{a.body}</p>
      {a.link &&
        (a.link.startsWith('/') ? (
          <Link to={a.link} className="font-medium">
            Read more
          </Link>
        ) : (
          <a href={a.link} className="font-medium" rel="noopener noreferrer" target="_blank">
            Read more<span className="sr-only"> (opens in a new tab)</span>
          </a>
        ))}
    </Card>
  )
}
