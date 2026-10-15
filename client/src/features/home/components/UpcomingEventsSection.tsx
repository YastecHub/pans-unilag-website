import { Link } from 'react-router'
import { CalendarIcon, PinIcon } from '../../../components/ui/icons.tsx'
import { PlaceholderText } from '../../../components/ui/Placeholder.tsx'
import { SkeletonCard } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { type EventItem, eventDateLabel, useEvents } from '../../events/api/events.ts'
import { CardGrid, cardLink, HomeSection } from './HomeSection.tsx'

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

function EventCard({ event }: { event: EventItem }) {
  const date = eventDateLabel(event)
  return (
    <Link to={`/events/${event.slug}`} className={cardLink}>
      <span className="inline-flex items-center gap-2 text-small font-medium text-text-brand">
        <CalendarIcon />
        {date ?? <PlaceholderText>Date to be announced</PlaceholderText>}
      </span>
      <h3 className="text-[1.25rem]">{event.title}</h3>
      {event.series && event.series !== event.title && (
        <span className="text-small text-text-muted">{event.series}</span>
      )}
      <span className="mt-auto inline-flex items-center gap-2 pt-2 text-small text-text-muted">
        <PinIcon />
        {event.venue || <PlaceholderText>Venue to be announced</PlaceholderText>}
      </span>
    </Link>
  )
}
