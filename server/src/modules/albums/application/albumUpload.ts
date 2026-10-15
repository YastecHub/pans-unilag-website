/** Pure helpers for scripts/upload-album.ts: naming, alt text and the albums.json update. */

export const MAX_LONG_EDGE = 2500
export const MAX_PHOTOS = 40
export const RECOMMENDED_MIN_PHOTOS = 20
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

type SeedEvent = { slug: string; title: string; series?: string; dayNumber?: number }
export type AlbumPhoto = { publicId: string; alt: string; caption: string }
export type SeedAlbum = Record<string, unknown> & { slug: string; photos?: AlbumPhoto[] }

/**
 * Cloudinary folder from the README: pans-unilag/events/health-week-2026/day-3
 * (series days), or pans-unilag/events/<slug> for single events.
 */
export function albumFolder(eventSlug: string): string {
  const day = /^(.+)-(day-\d+)$/.exec(eventSlug)
  return day ? `pans-unilag/events/${day[1]}/${day[2]}` : `pans-unilag/events/${eventSlug}`
}

export const photoPublicId = (folder: string, index: number) =>
  `${folder}/photo-${String(index + 1).padStart(2, '0')}`

/** A truthful starting alt text; editors should replace it with what each photo shows. */
export function defaultAlt(event: SeedEvent, index: number): string {
  const where =
    event.series && event.dayNumber
      ? `${event.series}, Day ${event.dayNumber}: ${event.title}`
      : event.title
  return `Photo ${index + 1} from ${where}`
}

/** Returns albums.json with this album's photos, cover and consent set (other albums untouched). */
export function updateAlbums(
  albums: SeedAlbum[],
  event: SeedEvent,
  publicIds: string[],
  coverIndex = 0,
): SeedAlbum[] {
  if (publicIds.length === 0) throw new Error('No photos to add')
  if (coverIndex < 0 || coverIndex >= publicIds.length)
    throw new Error(`--cover must be between 1 and ${publicIds.length}`)
  const existing = albums.find((a) => a.slug === event.slug)
  const previous = new Map((existing?.photos ?? []).map((p) => [p.publicId, p]))
  const photos = publicIds.map((publicId, i) => ({
    publicId,
    // Keep alt text and captions an editor already improved.
    alt: previous.get(publicId)?.alt ?? defaultAlt(event, i),
    caption: previous.get(publicId)?.caption ?? '',
  }))
  const album: SeedAlbum = {
    slug: event.slug,
    title: event.title,
    event: event.slug,
    ...(event.series ? { series: event.series } : {}),
    cover: publicIds[coverIndex],
    photos,
    consentConfirmed: true,
  }
  return existing ? albums.map((a) => (a.slug === event.slug ? album : a)) : [...albums, album]
}
