import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/http.ts'

/** GET /api/albums: one card per event day, without the photo list. */
export type AlbumSummary = {
  slug: string
  title: string
  event: string
  series: string
  /** Cloudinary public id; empty until photos are uploaded. */
  cover: string
  photoCount: number
  isPlaceholder: boolean
  placeholderNote?: string
}

export function useAlbums() {
  return useQuery({
    queryKey: ['albums'],
    queryFn: ({ signal }) => api.get<{ albums: AlbumSummary[] }>('/api/albums', signal),
    select: (data) => data.albums,
  })
}

export type AlbumPhoto = {
  /** Cloudinary public id. */
  publicId: string
  /** Required for every photo (README → Gallery rules). */
  alt: string
  caption: string
}

/** GET /api/albums/:slug: the album with its photos. */
export type Album = AlbumSummary & {
  photos: AlbumPhoto[]
  /** The full photo folder (Google Drive) for the photos not on the site; empty if none. */
  sourceFolderUrl: string
}

export function useAlbum(slug: string) {
  return useQuery({
    queryKey: ['album', slug],
    queryFn: ({ signal }) => api.get<Album>(`/api/albums/${encodeURIComponent(slug)}`, signal),
  })
}

/** "health-week-2026-day-3" → 3: albums are one per event day. */
export function albumDay(album: Pick<AlbumSummary, 'slug'>): number | null {
  const match = /-day-(\d+)$/.exec(album.slug)
  return match ? Number(match[1]) : null
}

/** The year in a series or title ("Pharmalympics 2026" → "2026"), or "" if it has none. */
export function albumYear(album: Pick<AlbumSummary, 'series' | 'title'>): string {
  return /\b(20\d{2})\b/.exec(album.series || album.title)?.[1] ?? ''
}

export type YearGroup = {
  /** "2026"; empty for albums without a year. */
  year: string
  series: { series: string; albums: AlbumSummary[] }[]
}

/**
 * The gallery's layout: newest year first, then each series in the order the API lists them, each
 * series' albums by day (the API already sorts day-2 before day-10). Undated albums come last.
 */
export function groupAlbums(albums: AlbumSummary[]): YearGroup[] {
  const years = new Map<string, Map<string, AlbumSummary[]>>()
  for (const album of albums) {
    const year = albumYear(album)
    const series = album.series || album.title
    const bySeries = years.get(year) ?? new Map<string, AlbumSummary[]>()
    bySeries.set(series, [...(bySeries.get(series) ?? []), album])
    years.set(year, bySeries)
  }
  return [...years]
    .sort(([a], [b]) => (a && b ? b.localeCompare(a) : a ? -1 : 1))
    .map(([year, bySeries]) => ({
      year,
      series: [...bySeries].map(([series, list]) => ({ series, albums: list })),
    }))
}

/** "Pharmalympics 2026" → "series-pharmalympics-2026", so the home page can link to a series. */
export function seriesAnchor(series: string): string {
  return `series-${series
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`
}

export type SeriesHighlight = {
  series: string
  albumCount: number
  photoCount: number
  /** The first album in the series with photos, if any. */
  cover: { publicId: string; albumTitle: string } | null
}

/** One highlight per series (Health Week 2026, Pharmalympics 2026), in the order the API lists them. */
export function seriesHighlights(albums: AlbumSummary[]): SeriesHighlight[] {
  const bySeries = new Map<string, AlbumSummary[]>()
  for (const album of albums) {
    const key = album.series || album.title
    bySeries.set(key, [...(bySeries.get(key) ?? []), album])
  }
  return [...bySeries].map(([series, list]) => {
    const withCover = list.find((a) => a.cover && a.photoCount > 0)
    return {
      series,
      albumCount: list.length,
      photoCount: list.reduce((n, a) => n + a.photoCount, 0),
      cover: withCover ? { publicId: withCover.cover, albumTitle: withCover.title } : null,
    }
  })
}
