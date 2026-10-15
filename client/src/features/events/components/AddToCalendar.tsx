import { Button, ButtonAnchor } from '../../../components/ui/Button.tsx'
import { CalendarIcon } from '../../../components/ui/icons.tsx'
import type { EventItem } from '../api/events.ts'
import { canAddToCalendar, downloadIcs, googleCalendarUrl } from '../lib/ics.ts'

/** The event's page on this site, for the calendar entry's link back. */
const eventUrl = (slug: string) => `${window.location.origin}/events/${slug}`

/**
 * "Add to calendar" (.ics, for iOS, Outlook and Google) and a direct Google Calendar link.
 * Renders nothing until the event has exact dates, so no one saves a guessed day.
 */
export function AddToCalendar({ event, size = 'md' }: { event: EventItem; size?: 'md' | 'sm' }) {
  if (!canAddToCalendar(event)) return null
  const url = eventUrl(event.slug)
  return (
    <>
      <Button variant="outline" size={size} onClick={() => downloadIcs(event, url)}>
        <CalendarIcon />
        Add to calendar <span className="sr-only">({event.title}, downloads an .ics file)</span>
      </Button>
      <ButtonAnchor
        variant="ghost"
        size={size}
        href={googleCalendarUrl(event, url)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Google Calendar <span className="sr-only">(opens in a new tab)</span>
      </ButtonAnchor>
    </>
  )
}

/** Register, when the event has a registration link and is still to come. */
export function RegisterButton({ event, size = 'md' }: { event: EventItem; size?: 'md' | 'sm' }) {
  if (!event.registrationUrl || event.status !== 'upcoming') return null
  return (
    <ButtonAnchor
      href={event.registrationUrl}
      size={size}
      target="_blank"
      rel="noopener noreferrer"
    >
      Register <span className="sr-only">for {event.title} (opens in a new tab)</span>
    </ButtonAnchor>
  )
}
