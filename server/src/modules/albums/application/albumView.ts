import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'

export type AlbumPhotoView = {
  /** Cloudinary public id. */
  publicId: string
  alt: string
  caption: string
}

/** A stored album (lean document or seed entry passed through the model). */
export type StoredAlbum = {
  slug: string
  title: string
  event: string
  series?: string
  cover?: string
  photos?: { publicId: string; alt: string; caption?: string }[]
  sourceFolderUrl?: string
  isPlaceholder?: boolean
  placeholderNote?: string
}

/** Gallery card: no photo list, so the gallery page stays small. */
export type AlbumSummaryView = PlaceholderView & {
  slug: string
  title: string
  /** Slug of the event the album belongs to. */
  event: string
  series: string
  /** Cloudinary public id of the cover; empty until photos are uploaded. */
  cover: string
  photoCount: number
}

export type AlbumView = AlbumSummaryView & {
  photos: AlbumPhotoView[]
  /** Link to the full photo folder, for the photos not on the site; empty if none. */
  sourceFolderUrl: string
}

export function toAlbumSummaryView(album: StoredAlbum): AlbumSummaryView {
  return {
    slug: album.slug,
    title: album.title,
    event: album.event,
    series: album.series ?? '',
    cover: album.cover ?? '',
    photoCount: album.photos?.length ?? 0,
    ...placeholderView(album),
  }
}

export function toAlbumView(album: StoredAlbum): AlbumView {
  return {
    ...toAlbumSummaryView(album),
    photos: (album.photos ?? []).map(({ publicId, alt, caption }) => ({
      publicId,
      alt,
      caption: caption ?? '',
    })),
    sourceFolderUrl: album.sourceFolderUrl ?? '',
  }
}

/** Series, then slug with numbers compared as numbers (day-2 before day-10). */
export function compareAlbums(a: AlbumSummaryView, b: AlbumSummaryView): number {
  return (
    a.series.localeCompare(b.series) || a.slug.localeCompare(b.slug, undefined, { numeric: true })
  )
}

export type AlbumReader = {
  list(filter: { series?: string }): Promise<StoredAlbum[]>
  findBySlug(slug: string): Promise<StoredAlbum | null>
}
