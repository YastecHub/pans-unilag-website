import { Link } from 'react-router'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { lagosDay, lagosMonth } from '../../../lib/dates.ts'
import { type EventItem, eventDateLabel, useEvents } from '../api/events.ts'
import { type MonthKey, monthTitle, monthWeeks, placeEvents, shiftMonth } from '../lib/month.ts'

const WEEKDAYS = [
  ['Mon', 'Monday'],
  ['Tue', 'Tuesday'],
  ['Wed', 'Wednesday'],
  ['Thu', 'Thursday'],
  ['Fri', 'Friday'],
  ['Sat', 'Saturday'],
  ['Sun', 'Sunday'],
] as const

const monthLink = (month: MonthKey) => ({ search: `?view=month&month=${month}` })

/** "Mon 30 Nov", for the phone agenda. */
const agendaDay = (date: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))

/** "← October 2026" on wide screens, "← Oct" on phones; the full month is always announced. */
function MonthStep({ month, direction }: { month: MonthKey; direction: 'previous' | 'next' }) {
  const [y, m] = month.split('-').map(Number) as [number, number]
  const short = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  )
  return (
    <Link
      to={monthLink(month)}
      aria-label={`${direction === 'previous' ? 'Previous' : 'Next'} month: ${monthTitle(month)}`}
      className="shrink-0 font-heading font-medium whitespace-nowrap"
    >
      {direction === 'previous' && <span aria-hidden>← </span>}
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{monthTitle(month)}</span>
      {direction === 'next' && <span aria-hidden> →</span>}
    </Link>
  )
}

/**
 * A month of events on the Lagos calendar. Wide screens get the grid; phones get an agenda of the
 * days that have something on. Month-precision events are listed under the grid, never on a day.
 */
export function MonthCalendar({ month }: { month: MonthKey }) {
  const title = monthTitle(month)
  const query = useEvents({ month, pageSize: 50 })

  return (
    <section aria-labelledby="month-title" className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <MonthStep month={shiftMonth(month, -1)} direction="previous" />
        <h2 id="month-title" className="text-h3" aria-live="polite">
          {title}
        </h2>
        <MonthStep month={shiftMonth(month, 1)} direction="next" />
      </div>

      {query.isPending ? (
        <LoadingState label={`Loading events in ${title}`}>
          <Skeleton className="h-96 w-full rounded-xl" />
        </LoadingState>
      ) : query.isError ? (
        <ErrorState
          title="We couldn’t load this month’s events."
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : (
        <MonthBody month={month} title={title} events={query.data.events} />
      )}
    </section>
  )
}

function MonthBody({
  month,
  title,
  events,
}: {
  month: MonthKey
  title: string
  events: EventItem[]
}) {
  const { byDay, undated } = placeEvents(events)
  const weeks = monthWeeks(month)
  const today = lagosDay(new Date())
  const daysWithEvents = weeks.flat().filter((d) => d.inMonth && byDay.has(d.date))

  return (
    <>
      <table className="hidden w-full table-fixed border-collapse sm:table">
        <caption className="sr-only">Events in {title}</caption>
        <thead>
          <tr>
            {WEEKDAYS.map(([short, long]) => (
              <th
                key={short}
                scope="col"
                abbr={long}
                className="pb-2 text-small font-medium text-text-muted"
              >
                {short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]!.date}>
              {week.map((day) => (
                <td
                  key={day.date}
                  className={`h-24 border border-border p-1.5 align-top ${day.inMonth ? 'bg-surface' : 'bg-surface-alt text-text-muted'}`}
                >
                  <time
                    dateTime={day.date}
                    aria-current={day.date === today ? 'date' : undefined}
                    className={`inline-flex size-7 items-center justify-center rounded-full text-small ${day.date === today ? 'bg-primary font-medium text-on-primary' : ''}`}
                  >
                    {day.dayOfMonth}
                  </time>
                  {day.inMonth && byDay.has(day.date) && (
                    <ul className="mt-1 flex flex-col gap-1">
                      {byDay.get(day.date)!.map((e) => (
                        <li key={e.slug}>
                          <Link
                            to={`/events/${e.slug}`}
                            className="block truncate rounded-md bg-surface-alt px-1.5 py-0.5 text-small font-medium text-text-brand no-underline hover:underline"
                            title={e.title}
                          >
                            {e.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {daysWithEvents.length > 0 && (
        <ol className="flex flex-col gap-3 sm:hidden" aria-label={`Days with events in ${title}`}>
          {daysWithEvents.map((day) => (
            <li key={day.date} className="flex gap-4 rounded-xl border border-border p-4">
              <time
                dateTime={day.date}
                className="w-24 shrink-0 font-heading font-medium whitespace-nowrap"
              >
                {agendaDay(day.date)}
              </time>
              <ul className="flex flex-col gap-1">
                {byDay.get(day.date)!.map((e) => (
                  <li key={e.slug}>
                    <Link to={`/events/${e.slug}`}>{e.title}</Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}

      {undated.length > 0 && (
        <section aria-labelledby="undated-title" className="flex flex-col gap-2">
          <h3 id="undated-title" className="text-[1.25rem]">
            Exact dates to be confirmed
          </h3>
          <p className="text-small text-text-muted">
            Planned for this month; the days will be added once they are fixed.
          </p>
          <ul className="flex flex-col gap-1">
            {undated.map((e) => (
              <li key={e.slug}>
                <Link to={`/events/${e.slug}`}>{e.title}</Link>
                {eventDateLabel(e) && (
                  <span className="text-text-muted"> · {eventDateLabel(e)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {events.length === 0 && <NothingThisMonth month={month} title={title} />}
    </>
  )
}

/** An empty month points to the next month that has something on. */
function NothingThisMonth({ month, title }: { month: MonthKey; title: string }) {
  const next = useEvents({ status: 'upcoming', pageSize: 1 })
  const first = next.data?.events[0]
  const nextMonth = first?.startsAt ? lagosMonth(first.startsAt) : null
  return (
    <EmptyState
      title={`Nothing scheduled for ${title}.`}
      action={
        nextMonth && nextMonth > month ? (
          <Link to={monthLink(nextMonth)}>Jump to {monthTitle(nextMonth)}</Link>
        ) : (
          <Link to="/events/past">See past events</Link>
        )
      }
    />
  )
}
