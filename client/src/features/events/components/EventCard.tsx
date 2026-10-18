import { Link } from 'react-router'
import { cardLink } from '../../../components/ui/Card.tsx'
import { CalendarIcon, PinIcon } from '../../../components/ui/icons.tsx'
import { PlaceholderText } from '../../../components/ui/Placeholder.tsx'
import { type EventItem, eventDateLabel } from '../api/events.ts'

type Props = {
  event: EventItem
  /** h3 under a section heading (home page), h2 directly under the page title. */
  headingLevel?: 'h2' | 'h3'
  /** Hide the series line, e.g. when the card already sits under its series heading. */
  hideSeries?: boolean
}

/** Date, title, series and venue, linking to the event page. */
export function EventCard({ event, headingLevel: Heading = 'h3', hideSeries = false }: Props) {
  const date = eventDateLabel(event)
  return (
    <Link to={`/events/${event.slug}`} className={cardLink}>
      <span className="inline-flex items-center gap-2 text-small font-medium text-text-brand">
        <CalendarIcon />
        {date ?? <PlaceholderText>Date to be announced</PlaceholderText>}
      </span>
      {event.dayNumber !== null && event.series && (
        <span className="text-small font-medium text-text-muted">Day {event.dayNumber}</span>
      )}
      <Heading className="text-[1.25rem]">{event.title}</Heading>
      {!hideSeries && event.series && event.series !== event.title && (
        <span className="text-small text-text-muted">{event.series}</span>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-small text-text-muted">
        <span className="inline-flex items-center gap-2">
          <PinIcon />
          {event.venue || <PlaceholderText>Venue to be announced</PlaceholderText>}
        </span>
        {event.registrationUrl ? (
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Register
          </span>
        ) : (
          <span className="shrink-0 text-xs text-text-brand">View details</span>
        )}
      </div>
    </Link>
  )
}
