import { Link } from 'react-router'
import { SkeletonCard } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { useEvents } from '../../events/api/events.ts'
import { EventCard } from '../../events/components/EventCard.tsx'
import { CardGrid, HomeSection } from './HomeSection.tsx'

/** The next three upcoming events, soonest first. */
export function UpcomingEventsSection() {
  const query = useEvents({ status: 'upcoming', pageSize: 3 })

  return (
    <HomeSection id="events" title="Upcoming events" link={{ to: '/events', label: 'All events' }}>
      {query.isPending ? (
        <LoadingState label="Loading upcoming events">
          <CardGrid as="div">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </CardGrid>
        </LoadingState>
      ) : query.isError ? (
        <ErrorState
          title="We couldn’t load upcoming events."
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : query.data.events.length === 0 ? (
        <EmptyState
          title="No upcoming events yet. Check back soon."
          action={<Link to="/events/past">See past events</Link>}
        />
      ) : (
        <CardGrid>
          {query.data.events.map((event) => (
            <li key={event.slug}>
              <EventCard event={event} />
            </li>
          ))}
        </CardGrid>
      )}
    </HomeSection>
  )
}
