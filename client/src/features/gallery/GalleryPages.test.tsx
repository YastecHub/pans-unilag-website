import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiError, jsonResponse, mockApi } from '../../test/mockApi.ts'
import { renderRoute } from '../../test/renderRoute.tsx'
import albumsJson from '../../../../server/seed/albums.json?raw'
import { type AlbumSummary, albumDay, albumYear, groupAlbums } from './api/albums.ts'

/** The seed albums as GET /api/albums returns them (still placeholders: no photos yet). */
const seedAlbums: AlbumSummary[] = (JSON.parse(albumsJson) as AlbumSummary[]).map((a) => ({
  ...a,
  cover: '',
  photoCount: 0,
}))

const photos = [1, 2, 3].map((n) => ({
  publicId: `pans-unilag/events/health-week-2026/day-3/photo-${n}`,
  alt: `Students at the medical outreach, photo ${n}`,
  caption: n === 2 ? 'Free blood-pressure checks' : '',
}))
const withPhotos = {
  ...seedAlbums.find((a) => a.slug === 'health-week-2026-day-3')!,
  isPlaceholder: false,
  placeholderNote: undefined,
  cover: photos[0]!.publicId,
  photoCount: 3,
  photos,
  sourceFolderUrl: 'https://drive.google.com/drive/folders/example',
}

function api(albums = seedAlbums) {
  return mockApi({
    '/api/albums': { albums },
    ...Object.fromEntries(
      albums.map((a) => [`/api/albums/${a.slug}`, { ...a, photos: [], sourceFolderUrl: '' }]),
    ),
    '/api/albums/health-week-2026-day-3': withPhotos,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const main = () => document.getElementById('main')!

describe('album grouping', () => {
  it('groups by year (newest first), then series, keeping day order', () => {
    const extra: AlbumSummary = {
      ...seedAlbums[0]!,
      slug: 'pharmalympics-2027-day-1',
      title: 'Opening',
      event: 'pharmalympics-2027-day-1',
      series: 'Pharmalympics 2027',
    }
    const groups = groupAlbums([...seedAlbums, extra])
    expect(groups.map((g) => g.year)).toEqual(['2027', '2026'])
    expect(groups[1]!.series.map((s) => s.series)).toEqual([
      'PANS Health Week 2026: Redefine+',
      'Pharmalympics 2026',
    ])
    expect(groups[1]!.series[0]!.albums.map(albumDay)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(albumYear({ series: '', title: 'Freshers' })).toBe('')
  })
})

describe('Gallery', () => {
  it('shows every album under its year and series, marking photos still to come', async () => {
    api()
    renderRoute('/gallery')
    expect(await within(main()).findByRole('heading', { level: 2, name: '2026' })).toBeTruthy()
    const series = within(main()).getAllByRole('heading', { level: 3 })
    expect(series.map((h) => h.textContent)).toEqual([
      'PANS Health Week 2026: Redefine+',
      'Pharmalympics 2026',
    ])
    const health = series[0]!.closest('section')!
    expect(health.id).toBe('series-pans-health-week-2026-redefine')
    expect(within(health).getByText('9 albums · photos coming soon')).toBeTruthy()
    const cards = within(health).getAllByRole('link')
    expect(cards).toHaveLength(9)
    expect(cards[2]!.getAttribute('href')).toBe('/gallery/health-week-2026-day-3')
    expect(cards[2]!.textContent).toContain('Day 3')
    expect(cards[2]!.textContent).toContain('Medical Outreach 2026')
  })

  it('shows an album’s cover and photo count once it has photos', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'pans-demo')
    api(seedAlbums.map((a) => (a.slug === withPhotos.slug ? withPhotos : a)))
    renderRoute('/gallery')
    const card = await within(main()).findByRole('link', { name: /Medical Outreach 2026/ })
    expect(card.textContent).toContain('3 photos')
    const cover = card.querySelector('img')!
    expect(cover.getAttribute('src')).toContain('res.cloudinary.com/pans-demo')
    expect(cover.getAttribute('alt')).toBe('')
  })
})

describe('Album page', () => {
  it('shows a placeholder and the event link until the photos are up', async () => {
    api()
    renderRoute('/gallery/pharmalympics-2026-day-1')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Opening Ceremony & Court Games' }),
    ).toBeTruthy()
    expect(screen.getByText('Pharmalympics 2026 · Day 1')).toBeTruthy()
    expect(within(main()).getByText('Photos coming soon')).toBeTruthy()
    expect(
      within(main()).getByRole('link', { name: 'About this event' }).getAttribute('href'),
    ).toBe('/events/pharmalympics-2026-day-1')
    expect(within(main()).queryByRole('link', { name: /Google Drive/ })).toBeNull()
    const days = await screen.findByRole('navigation', { name: 'Pharmalympics 2026' })
    expect(within(days).getByRole('link', { current: 'page' }).textContent).toBe(
      'Day 1: Opening Ceremony & Court Games',
    )
  })

  it('loads small, lazy, responsive thumbnails and links to the full Drive folder', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'pans-demo')
    api()
    renderRoute('/gallery/health-week-2026-day-3')
    const thumbs = await within(main()).findAllByRole('button', { name: /Students at the/ })
    expect(thumbs).toHaveLength(3)
    const img = within(thumbs[0]!).getByRole('img')
    expect(img.getAttribute('loading')).toBe('lazy')
    // Two sizes only (240 and 360 px), automatic format, "eco" quality: small files on phone data.
    expect(img.getAttribute('srcset')).toBe(
      [240, 360]
        .map(
          (w) =>
            `https://res.cloudinary.com/pans-demo/image/upload/c_fill,h_${w},w_${w}/f_auto/q_auto:eco/pans-unilag/events/health-week-2026/day-3/photo-1 ${w}w`,
        )
        .join(', '),
    )
    expect(img.getAttribute('sizes')).toContain('48vw')

    const drive = within(main()).getByRole('link', { name: /All photos on Google Drive/ })
    expect(drive.getAttribute('href')).toBe(withPhotos.sourceFolderUrl)
    expect(drive.getAttribute('target')).toBe('_blank')
    expect(drive.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('opens an accessible lightbox that works from the keyboard', async () => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'pans-demo')
    const user = userEvent.setup()
    api()
    renderRoute('/gallery/health-week-2026-day-3')
    const thumbs = await within(main()).findAllByRole('button', { name: /Students at the/ })

    thumbs[0]!.focus()
    await user.keyboard('{Enter}')
    const dialog = screen.getByRole('dialog', { name: 'Photo 1 of 3' })
    expect(within(dialog).getByRole('img').getAttribute('alt')).toBe(photos[0]!.alt)
    expect(within(dialog).getByRole('img').getAttribute('srcset')).toContain(
      'c_limit,w_1600/f_auto/q_auto/pans-unilag',
    )
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Close' }))

    await user.keyboard('{ArrowRight}')
    expect(within(dialog).getByRole('heading').textContent).toBe('Photo 2 of 3')
    expect(dialog.getAttribute('aria-describedby')).toBe('lightbox-description')
    expect(within(dialog).getByText('Free blood-pressure checks')).toBeTruthy()

    await user.keyboard('{End}')
    expect(within(dialog).getByRole('heading').textContent).toBe('Photo 3 of 3')
    const next = within(dialog).getByRole('button', { name: /Next/ })
    expect(next.getAttribute('aria-disabled')).toBe('true')
    await user.click(next) // stays on the last photo
    expect(within(dialog).getByRole('heading').textContent).toBe('Photo 3 of 3')

    await user.click(within(dialog).getByRole('button', { name: /Previous/ }))
    expect(within(dialog).getByRole('heading').textContent).toBe('Photo 2 of 3')
    await user.keyboard('{Home}')
    expect(within(dialog).getByRole('heading').textContent).toBe('Photo 1 of 3')

    // Move to photo 3, close with Escape: focus returns to that photo's thumbnail.
    await user.keyboard('{End}{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    await vi.waitFor(() =>
      expect(thumbs.indexOf(document.activeElement as HTMLButtonElement)).toBe(2),
    )
  })

  it('explains when the album does not exist', async () => {
    api()
    mockApi({
      '/api/albums/nope': () => jsonResponse(404, apiError('NOT_FOUND', 'Album not found')),
    })
    renderRoute('/gallery/nope')
    expect(await screen.findByRole('heading', { level: 1, name: 'Album not found' })).toBeTruthy()
    expect(within(main()).getByRole('link', { name: 'Back to the gallery' })).toBeTruthy()
  })
})
