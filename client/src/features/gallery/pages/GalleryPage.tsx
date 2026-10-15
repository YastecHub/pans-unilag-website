import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { cardLink } from '../../../components/ui/Card.tsx'
import { PlaceholderText } from '../../../components/ui/Placeholder.tsx'
import { SkeletonCard } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import { type AlbumSummary, albumDay, groupAlbums, seriesAnchor, useAlbums } from '../api/albums.ts'
import { Photo } from '../components/Photo.tsx'

const grid = 'grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4'

/** /gallery: one card per album (event day), grouped by year and series. Covers only, no photos. */
export function GalleryPage() {
  const query = useAlbums()
  const { hash } = useLocation()

  // "/gallery#series-pharmalympics-2026" (from the home page): scroll there once the albums are in.
  useEffect(() => {
    if (query.isSuccess && hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [query.isSuccess, hash])

  return (
    <InnerPageLayout
      title="Gallery"
      section={navSection('Events')}
      intro="Photos from our events, one album per day. Each album holds a curated selection; the full sets are linked from the album."
      wide
    >
      {query.isPending ? (
        <LoadingState label="Loading the gallery">
          <div className={grid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </LoadingState>
      ) : query.isError ? (
        <ErrorState
          title="We couldn’t load the gallery."
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <EmptyState
          title="No albums yet."
          action={<Link to="/events/past">See past events</Link>}
        />
      ) : (
        groupAlbums(query.data).map((group) => (
          <section
            key={group.year || 'undated'}
            aria-labelledby={`year-${group.year || 'undated'}`}
            className="flex flex-col gap-8"
          >
            <h2 id={`year-${group.year || 'undated'}`}>{group.year || 'Other albums'}</h2>
            {group.series.map(({ series, albums }) => (
              <section
                key={series}
                id={seriesAnchor(series)}
                aria-labelledby={`${seriesAnchor(series)}-title`}
                className="flex scroll-mt-24 flex-col gap-4"
              >
                <div className="flex flex-col gap-1">
                  <h3 id={`${seriesAnchor(series)}-title`} className="text-h3">
                    {series}
                  </h3>
                  <p className="text-small text-text-muted">{summary(albums)}</p>
                </div>
                <ul className={grid}>
                  {albums.map((album) => (
                    <li key={album.slug}>
                      <AlbumCard album={album} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </section>
        ))
      )}
    </InnerPageLayout>
  )
}

function summary(albums: AlbumSummary[]): string {
  const photos = albums.reduce((n, a) => n + a.photoCount, 0)
  const count = `${albums.length} ${albums.length === 1 ? 'album' : 'albums'}`
  return photos > 0 ? `${count} · ${photos} photos` : `${count} · photos coming soon`
}

function AlbumCard({ album }: { album: AlbumSummary }) {
  const day = albumDay(album)
  return (
    <Link to={`/gallery/${album.slug}`} className={`${cardLink} overflow-hidden p-0`}>
      {album.cover ? (
        <Photo
          publicId={album.cover}
          alt=""
          widths={[360, 540]}
          sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 100vw"
          crop={{ crop: 'fill', aspectRatio: 3 / 2 }}
          className="aspect-[3/2] w-full object-cover"
        />
      ) : (
        <span aria-hidden className="block p-3 pb-0">
          <span className="flex aspect-[3/2] items-center justify-center rounded-lg border-2 border-dashed border-text-muted bg-surface-alt text-small text-text-muted">
            Photos coming soon
          </span>
        </span>
      )}
      <span className="flex flex-col gap-1 p-4">
        {day !== null && <span className="text-small font-medium text-text-muted">Day {day}</span>}
        <span className="font-heading text-[1.125rem] font-medium">{album.title}</span>
        {album.photoCount > 0 && !album.isPlaceholder ? (
          <span className="text-small text-text-muted">
            {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
          </span>
        ) : (
          <PlaceholderText>Photos coming soon</PlaceholderText>
        )}
      </span>
    </Link>
  )
}
