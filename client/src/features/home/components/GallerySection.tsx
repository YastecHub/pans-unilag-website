import { Link } from 'react-router'
import { Img } from '../../../components/ui/Img.tsx'
import { PlaceholderImage } from '../../../components/ui/Placeholder.tsx'
import { SkeletonCard } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import {
  type SeriesHighlight,
  seriesAnchor,
  seriesHighlights,
  useAlbums,
} from '../../gallery/api/albums.ts'
import { CardGrid, HomeSection } from './HomeSection.tsx'

/** One card per event series (Health Week 2026, Pharmalympics 2026), linking to the gallery. */
export function GallerySection() {
  const query = useAlbums()

  return (
    <HomeSection
      id="gallery"
      title="From the gallery"
      link={{ to: '/gallery', label: 'Open the gallery' }}
    >
      {query.isPending ? (
        <LoadingState label="Loading the gallery">
          <CardGrid as="div">
            <SkeletonCard />
            <SkeletonCard />
          </CardGrid>
        </LoadingState>
      ) : query.isError ? (
        <ErrorState
          title="We couldn’t load the gallery."
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <EmptyState title="No albums yet." />
      ) : (
        <CardGrid>
          {seriesHighlights(query.data).map((h) => (
            <li key={h.series}>
              <HighlightCard highlight={h} />
            </li>
          ))}
        </CardGrid>
      )}
    </HomeSection>
  )
}

function HighlightCard({ highlight: h }: { highlight: SeriesHighlight }) {
  const days = `${h.albumCount} ${h.albumCount === 1 ? 'album' : 'albums'}`
  return (
    <Link
      to={`/gallery#${seriesAnchor(h.series)}`}
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface text-text no-underline hover:border-border-strong"
    >
      {h.cover ? (
        <Img publicId={h.cover.publicId} alt={h.cover.albumTitle} width={600} height={400} />
      ) : (
        <span className="p-3 pb-0">
          <PlaceholderImage kind="badge" />
        </span>
      )}
      <span className="flex flex-col gap-1 p-4">
        <span className="font-heading text-[1.25rem] font-medium">{h.series}</span>
        <span className="text-small text-text-muted">
          {h.photoCount > 0 ? `${days} · ${h.photoCount} photos` : `${days} · photos coming soon`}
        </span>
      </span>
    </Link>
  )
}
