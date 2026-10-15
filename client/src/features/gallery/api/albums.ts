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
