import { Link, useSearchParams } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { ButtonLink } from '../../../components/ui/Button.tsx'
import { CalendarIcon, PinIcon } from '../../../components/ui/icons.tsx'
import { PlaceholderText } from '../../../components/ui/Placeholder.tsx'
import { SkeletonCard } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { lagosDay, lagosMonth } from '../../../lib/dates.ts'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import { type EventItem, eventDateLabel, useAllEvents } from '../api/events.ts'
import { AddToCalendar, RegisterButton } from '../components/AddToCalendar.tsx'
import { MonthCalendar } from '../components/MonthCalendar.tsx'
import { plainText } from '../lib/ics.ts'
import { isMonthKey } from '../lib/month.ts'

/** /events: what's on this session, as a list or (?view=month&month=2026-11) a month calendar. */
export function UpcomingEventsPage() {
  const [params] = useSearchParams()
  const view = params.get('view') === 'month' ? 'month' : 'list'
  const requested = params.get('month')
  const month = isMonthKey(requested) ? requested : lagosMonth(new Date())

  return (
    <InnerPageLayout
      title="Upcoming events"
      section={navSection('Events')}
      intro="What’s on this session. All dates and times are Lagos time."
      wide
    >
      <ViewSwitch view={view} month={month} />
      {view === 'month' ? <MonthCalendar month={month} /> : <UpcomingList />}
    </InnerPageLayout>
  )
}

function ViewSwitch({ view, month }: { view: 'list' | 'month'; month: string }) {
  const tab = (active: boolean) =>
    `rounded-lg px-4 py-2 font-heading text-small font-medium no-underline ${active ? 'bg-primary text-on-primary' : 'text-text-brand hover:bg-surface-alt'}`
  return (
    <nav aria-label="Event views" className="self-start">
      <ul className="flex gap-1 rounded-xl border border-border p-1">
        <li>
          <Link
            to={{ search: '' }}
            aria-current={view === 'list' ? 'page' : undefined}
            className={tab(view === 'list')}
          >
            List
          </Link>
        </li>
        <li>
          <Link
            to={{ search: `?view=month&month=${month}` }}
            aria-current={view === 'month' ? 'page' : undefined}
            className={tab(view === 'month')}
          >
            Month
          </Link>
        </li>
      </ul>
    </nav>
  )
}

function UpcomingList() {
  const query = useAllEvents({ status: 'upcoming' })

  if (query.isPending) {
    return (
      <LoadingState label="Loading upcoming events">
        <div className="flex flex-col gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </LoadingState>
    )
  }
  if (query.isError) {
    return (
      <ErrorState
        title="We couldn’t load upcoming events."
        error={query.error}
        onRetry={() => query.refetch()}
      />
    )
  }
  if (query.data.length === 0) {
    return (
      <EmptyState
        title="No upcoming events yet. Check back soon."
        action={<Link to="/events/past">See past events</Link>}
      />
    )
  }
  return (
    <ul className="flex flex-col gap-4">
      {query.data.map((event) => (
        <li key={event.slug}>
          <UpcomingEvent event={event} />
        </li>
      ))}
    </ul>
  )
}

const shortMonth = (day: string) =>
  new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(
    new Date(`${day}T00:00:00Z`),
  )

/** The tear-off-calendar block: the first day ("30 NOV"), or "APR – MAY" when only months are known. */
function DateBlock({ event }: { event: EventItem }) {
  if (event.datePrecision === 'unknown' || !event.startsAt || !event.endsAt) return null
  const [start, end] = [lagosDay(event.startsAt), lagosDay(event.endsAt)]
  const months =
    event.datePrecision === 'day' || shortMonth(start) === shortMonth(end)
      ? shortMonth(start)
      : `${shortMonth(start)} – ${shortMonth(end)}`
  return (
    <div
      aria-hidden
      className="flex w-24 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-alt px-2 py-3 text-center font-heading text-text-brand"
    >
      {event.datePrecision === 'day' && (
        <span className="text-h3 leading-none font-semibold">{Number(start.slice(8))}</span>
      )}
      <span className="text-small font-medium uppercase">{months}</span>
    </div>
  )
}

function UpcomingEvent({ event }: { event: EventItem }) {
  const date = eventDateLabel(event)
  const summary = plainText(event.description).split('\n')[0]
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row">
      <DateBlock event={event} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {event.series && event.series !== event.title && (
          <span className="text-small font-medium text-text-muted">{event.series}</span>
        )}
        <h2 className="text-h3">
          <Link to={`/events/${event.slug}`}>{event.title}</Link>
        </h2>
        <p className="inline-flex flex-wrap items-center gap-2 text-small">
          <CalendarIcon />
          {date ?? <PlaceholderText>Date to be announced</PlaceholderText>}
          {event.datePrecision === 'month' && (
            <PlaceholderText>Exact dates to be confirmed</PlaceholderText>
          )}
        </p>
        <p className="inline-flex items-center gap-2 text-small text-text-muted">
          <PinIcon />
          {event.venue || <PlaceholderText>Venue to be announced</PlaceholderText>}
        </p>
        {summary && <p>{summary}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          <RegisterButton event={event} size="sm" />
          <AddToCalendar event={event} size="sm" />
          <ButtonLink to={`/events/${event.slug}`} variant="ghost" size="sm">
            Details <span className="sr-only">about {event.title}</span>
          </ButtonLink>
        </div>
      </div>
    </article>
  )
}
