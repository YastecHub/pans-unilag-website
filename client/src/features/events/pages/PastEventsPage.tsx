import { Link } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { SkeletonCard } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { seriesAnchor } from '../../gallery/api/albums.ts'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import { groupBySeries, type SeriesGroup, useAllEvents } from '../api/events.ts'
import { EventCard } from '../components/EventCard.tsx'

const grid = 'grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4'

/** /events/past: past events grouped by series (Health Week 2026, Pharmalympics 2026), day by day. */
export function PastEventsPage() {
  const query = useAllEvents({ status: 'past' })

  return (
    <InnerPageLayout
      title="Past events"
      section={navSection('Events')}
      intro="What PANS UNILAG has put on, grouped by event and listed day by day."
      wide
    >
      {query.isPending ? (
        <LoadingState label="Loading past events">
          <div className={grid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </LoadingState>
      ) : query.isError ? (
        <ErrorState
          title="We couldn’t load past events."
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <EmptyState
          title="No past events yet."
          action={<Link to="/events">See upcoming events</Link>}
        />
      ) : (
        groupBySeries(query.data).map((group) => (
          <SeriesSection key={group.series || 'one-off'} group={group} />
        ))
      )}
    </InnerPageLayout>
  )
}

const headingId = (series: string) =>
  `series-${(series || 'other')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`

function SeriesSection({ group }: { group: SeriesGroup }) {
  const id = headingId(group.series)
  const isSeries = group.series !== ''
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div className="flex flex-col gap-1">
          <h2 id={id} className="text-h3">
            {isSeries ? group.series : 'Other events'}
          </h2>
          {isSeries && (
            <p className="text-small text-text-muted">
              {group.events.length} {group.events.length === 1 ? 'day' : 'days'}
            </p>
          )}
        </div>
        {isSeries && (
          <Link to={`/gallery#${seriesAnchor(group.series)}`} className="font-heading font-medium">
            Photos in the gallery <span className="sr-only">({group.series})</span>
          </Link>
        )}
      </div>
      <ul className={grid}>
        {group.events.map((event) => (
          <li key={event.slug}>
            <EventCard event={event} hideSeries={isSeries} />
          </li>
        ))}
      </ul>
    </section>
  )
}
