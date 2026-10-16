import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { ButtonLink } from '../../../components/ui/Button.tsx'
import { Img } from '../../../components/ui/Img.tsx'
import { Markdown } from '../../../components/ui/Markdown.tsx'
import { Placeholder, PlaceholderText } from '../../../components/ui/Placeholder.tsx'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { lagosTime } from '../../../lib/dates.ts'
import { ApiError } from '../../../lib/http.ts'
import { useCommittees } from '../../committees/api/committees.ts'
import { useAlbums } from '../../gallery/api/albums.ts'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import { type EventItem, eventDateLabel, useEvent, useEvents } from '../api/events.ts'
import { AddToCalendar, RegisterButton } from '../components/AddToCalendar.tsx'
import { eventTiming } from '../lib/ics.ts'

const events = () => navSection('Events')

/** /events/:slug: date, time, venue, write-up, Register / Add to calendar, and the photo album. */
export function EventPage() {
  const { slug = '' } = useParams()
  const query = useEvent(slug)

  if (query.isPending || query.isError) {
    const notFound = query.error instanceof ApiError && query.error.code === 'NOT_FOUND'
    return (
      <InnerPageLayout title={notFound ? 'Event not found' : 'Event'} section={events()}>
        {query.isPending ? (
          <LoadingState label="Loading the event">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="mt-3 h-24" />
          </LoadingState>
        ) : notFound ? (
          <div className="flex flex-col items-start gap-4">
            <p>We couldn’t find that event. It may have been renamed or removed.</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to="/events" variant="outline">
                Upcoming events
              </ButtonLink>
              <ButtonLink to="/events/past" variant="outline">
                Past events
              </ButtonLink>
            </div>
          </div>
        ) : (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        )}
      </InnerPageLayout>
    )
  }

  const e = query.data
  const past = e.status === 'past'
  const eyebrow = [e.series && e.series !== e.title ? e.series : '', dayLabel(e)]
    .filter(Boolean)
    .join(' · ')

  return (
    <InnerPageLayout
      title={e.title}
      section={events()}
      trail={past ? [{ label: 'Past events', to: '/events/past' }] : []}
      eyebrow={eyebrow || undefined}
      aside={e.series ? <SeriesDays event={e} /> : undefined}
    >
      {e.coverImage && (
        <Img
          publicId={e.coverImage}
          alt={e.coverImageAlt || `${e.title}${e.series ? `, ${e.series}` : ''}`}
          width={960}
          height={540}
          lazy={false}
          className="w-full rounded-xl"
        />
      )}

      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
        <Fact label="Date">
          {eventDateLabel(e) ?? <PlaceholderText>Date to be announced</PlaceholderText>}
          {e.datePrecision === 'month' && (
            <PlaceholderText className="ml-2">Exact dates to be confirmed</PlaceholderText>
          )}
        </Fact>
        {timeLabel(e) && <Fact label="Time">{timeLabel(e)} (Lagos time)</Fact>}
        <Fact label="Venue">
          {e.venue || <PlaceholderText>Venue to be announced</PlaceholderText>}
        </Fact>
        {e.committee && (
          <Fact label="Organised by">
            <CommitteeLink slug={e.committee} />
          </Fact>
        )}
      </dl>

      {!past && (
        <div className="flex flex-wrap gap-3 empty:hidden">
          <RegisterButton event={e} />
          <AddToCalendar event={e} />
        </div>
      )}

      {e.description ? (
        <Markdown>{e.description}</Markdown>
      ) : (
        <Placeholder
          title="Write-up coming soon"
          note="A short description of this event will be added here."
        />
      )}

      <EventPhotos event={e} />
    </InnerPageLayout>
  )
}

const dayLabel = (e: EventItem) => (e.series && e.dayNumber !== null ? `Day ${e.dayNumber}` : '')

/** "10:00 – 16:00" for timed events; nothing for all-day ones or unknown dates. */
function timeLabel(e: EventItem): string | null {
  if (e.datePrecision !== 'day' || !e.startsAt || !e.endsAt) return null
  if (eventTiming(e.startsAt, e.endsAt).allDay) return null
  return `${lagosTime(e.startsAt)} – ${lagosTime(e.endsAt)}`
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="font-heading font-medium text-text-muted">{label}</dt>
      <dd className="flex flex-wrap items-center gap-y-1">{children}</dd>
    </>
  )
}

/** The organising committee by its short name ("ADMAP"), linking to its page. */
function CommitteeLink({ slug }: { slug: string }) {
  const committees = useCommittees()
  const committee = committees.data?.committees.find((c) => c.slug === slug)
  return (
    <Link to={`/leadership/committees/${slug}`}>{committee?.shortName ?? slug.toUpperCase()}</Link>
  )
}

/** The event's album: a link once photos are up, a placeholder while they're being curated. */
function EventPhotos({ event }: { event: EventItem }) {
  const albums = useAlbums()
  const album = albums.data?.find((a) => a.event === event.slug)
  if (!album) return null
  return (
    <section aria-labelledby="photos-title" className="flex flex-col gap-3">
      <h2 id="photos-title" className="text-h3">
        Photos
      </h2>
      {album.photoCount > 0 && !album.isPlaceholder ? (
        <div>
          <ButtonLink to={`/gallery/${album.slug}`} variant="outline">
            See the album ({album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'})
          </ButtonLink>
        </div>
      ) : (
        <Placeholder
          title="Photos coming soon"
          note="The Media Committee is picking the best photos from this day."
        />
      )}
    </section>
  )
}

/** The other days of the series (Day 1 … Day 9), this one marked. */
function SeriesDays({ event }: { event: EventItem }) {
  const query = useEvents({ series: event.series, pageSize: 50 })
  const days = query.data?.events ?? []
  if (days.length < 2) return null
  return (
    <nav aria-labelledby="series-days-title" className="flex flex-col gap-2">
      <h2 id="series-days-title" className="text-[1.25rem]">
        {event.series}
      </h2>
      <ol className="flex flex-col gap-1">
        {days.map((d) => (
          <li key={d.slug}>
            <Link
              to={`/events/${d.slug}`}
              aria-current={d.slug === event.slug ? 'page' : undefined}
              className={d.slug === event.slug ? 'font-medium text-text no-underline' : ''}
            >
              {dayLabel(d) ? `${dayLabel(d)}: ` : ''}
              {d.title}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
