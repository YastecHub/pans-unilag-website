import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { ButtonAnchor, ButtonLink } from '../../../components/ui/Button.tsx'
import { Placeholder } from '../../../components/ui/Placeholder.tsx'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { ApiError } from '../../../lib/http.ts'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import { type Album, albumDay, useAlbum, useAlbums } from '../api/albums.ts'
import { Lightbox } from '../components/Lightbox.tsx'
import { Photo } from '../components/Photo.tsx'

const events = () => navSection('Events')
const trail = [{ label: 'Gallery', to: '/gallery' }]

/** /gallery/:slug: the album's curated photos, a lightbox, and a link to the full Drive folder. */
export function AlbumPage() {
  const { slug = '' } = useParams()
  const query = useAlbum(slug)

  if (query.isPending || query.isError) {
    const notFound = query.error instanceof ApiError && query.error.code === 'NOT_FOUND'
    return (
      <InnerPageLayout
        title={notFound ? 'Album not found' : 'Album'}
        section={events()}
        trail={trail}
      >
        {query.isPending ? (
          <LoadingState label="Loading the album">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="mt-3 h-64" />
          </LoadingState>
        ) : notFound ? (
          <div className="flex flex-col items-start gap-4">
            <p>We couldn’t find that album. It may have been renamed.</p>
            <ButtonLink to="/gallery" variant="outline">
              Back to the gallery
            </ButtonLink>
          </div>
        ) : (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        )}
      </InnerPageLayout>
    )
  }

  const album = query.data
  const day = albumDay(album)
  const eyebrow = [album.series, day !== null ? `Day ${day}` : ''].filter(Boolean).join(' · ')

  return (
    <InnerPageLayout
      title={album.title}
      section={events()}
      trail={trail}
      eyebrow={eyebrow || undefined}
      aside={album.series ? <SeriesAlbums album={album} /> : undefined}
      wide
    >
      <div className="flex flex-wrap gap-3">
        {album.event && (
          <ButtonLink to={`/events/${album.event}`} variant="outline" size="sm">
            About this event
          </ButtonLink>
        )}
        {album.sourceFolderUrl && (
          <ButtonAnchor
            href={album.sourceFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            size="sm"
          >
            All photos on Google Drive <span className="sr-only">(opens in a new tab)</span>
          </ButtonAnchor>
        )}
      </div>

      {album.photos.length === 0 ? (
        <Placeholder
          title="Photos coming soon"
          note="The Media Committee is picking the best photos from this day."
        />
      ) : (
        <PhotoGrid album={album} />
      )}
    </InnerPageLayout>
  )
}

/** Thumbnails (small, lazy-loaded crops); each opens the full photo in the lightbox. */
function PhotoGrid({ album }: { album: Album }) {
  const [open, setOpen] = useState<number | null>(null)
  const thumbnails = useRef<(HTMLButtonElement | null)[]>([])

  const close = () => {
    const last = open
    setOpen(null)
    // Back to the thumbnail of the photo last shown, so keyboard users keep their place.
    if (last !== null) requestAnimationFrame(() => thumbnails.current[last]?.focus())
  }

  return (
    <>
      <p className="text-small text-text-muted">
        {album.photos.length} {album.photos.length === 1 ? 'photo' : 'photos'}. Select one to see it
        full size.
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {album.photos.map((photo, i) => (
          <li key={photo.publicId}>
            <button
              type="button"
              ref={(el) => {
                thumbnails.current[i] = el
              }}
              onClick={() => setOpen(i)}
              aria-haspopup="dialog"
              className="block w-full overflow-hidden rounded-lg focus-visible:outline-offset-2"
            >
              <Photo
                publicId={photo.publicId}
                alt={photo.alt}
                // Capped at 360 px: sharp enough for a thumbnail, even on high-density phones.
                widths={[240, 360]}
                sizes="(min-width: 1024px) 14rem, (min-width: 640px) 30vw, 48vw"
                crop={{ crop: 'fill', aspectRatio: 1 }}
                quality="auto:eco"
                className="aspect-square w-full object-cover transition-transform hover:scale-[1.03] motion-reduce:transition-none"
              />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox photos={album.photos} index={open} onChange={setOpen} onClose={close} />
    </>
  )
}

/** The other albums of the series (Day 1 … Day 9), this one marked. */
function SeriesAlbums({ album }: { album: Album }) {
  const all = useAlbums()
  const siblings = all.data?.filter((a) => a.series === album.series) ?? []
  if (siblings.length < 2) return null
  return (
    <nav aria-labelledby="series-albums-title" className="flex flex-col gap-2">
      <h2 id="series-albums-title" className="text-[1.25rem]">
        {album.series}
      </h2>
      <ol className="flex flex-col gap-1">
        {siblings.map((a) => {
          const day = albumDay(a)
          return (
            <li key={a.slug}>
              <Link
                to={`/gallery/${a.slug}`}
                aria-current={a.slug === album.slug ? 'page' : undefined}
                className={a.slug === album.slug ? 'font-medium text-text no-underline' : ''}
              >
                {day !== null ? `Day ${day}: ` : ''}
                {a.title}
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
