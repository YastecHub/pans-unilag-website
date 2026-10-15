import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import {
  albumFolder,
  defaultAlt,
  photoPublicId,
  updateAlbums,
  type SeedAlbum,
} from '../src/modules/albums/application/albumUpload.js'
import { AlbumModel } from '../src/modules/albums/infrastructure/album.model.js'
import { resizeForWeb } from '../scripts/lib/resizeForWeb.js'

const albums = JSON.parse(
  readFileSync(new URL('../seed/albums.json', import.meta.url), 'utf8'),
) as SeedAlbum[]
const events = JSON.parse(
  readFileSync(new URL('../seed/events.json', import.meta.url), 'utf8'),
) as { slug: string }[]
const day3 = {
  slug: 'health-week-2026-day-3',
  title: 'Medical Outreach 2026',
  series: 'PANS Health Week 2026: Redefine+',
  dayNumber: 3,
}

describe('seed/albums.json', () => {
  it('has one album for each of the 18 Health Week and Pharmalympics days, linked to its event', () => {
    expect(albums).toHaveLength(18)
    const slugs = new Set(events.map((e) => e.slug))
    expect(albums.every((a) => slugs.has(String(a.event)) && a.event === a.slug)).toBe(true)
  })

  it('keeps Drive links out of the repository', () => {
    expect(JSON.stringify(albums)).not.toMatch(/drive\.google|sourceFolderUrl":\s*"h/)
  })
})

describe('album upload helpers', () => {
  it('uses the README folder layout', () => {
    expect(albumFolder('health-week-2026-day-3')).toBe('pans-unilag/events/health-week-2026/day-3')
    expect(albumFolder('freshers-week-2026')).toBe('pans-unilag/events/freshers-week-2026')
    expect(photoPublicId('pans-unilag/events/x', 0)).toBe('pans-unilag/events/x/photo-01')
  })

  it('records photos, cover and consent, and keeps alt text an editor improved', () => {
    const ids = ['f/photo-01', 'f/photo-02']
    const first = updateAlbums(albums, day3, ids, 1)
    const album = first.find((a) => a.slug === day3.slug)!
    expect(album).toMatchObject({ cover: 'f/photo-02', consentConfirmed: true })
    expect(album.photos?.[0]?.alt).toBe(
      'Photo 1 from PANS Health Week 2026: Redefine+, Day 3: Medical Outreach 2026',
    )
    expect(album).not.toHaveProperty('isPlaceholder')
    expect(first).toHaveLength(18)

    album.photos![0]!.alt = 'Students checking blood pressure at the outreach'
    const second = updateAlbums(first, day3, ids)
    expect(second.find((a) => a.slug === day3.slug)?.photos?.[0]?.alt).toBe(
      'Students checking blood pressure at the outreach',
    )
  })

  it('rejects a cover outside the album', () => {
    expect(() => updateAlbums(albums, day3, ['a'], 3)).toThrow(/--cover/)
  })

  it('makes an uploaded album valid for the model', async () => {
    const album = updateAlbums(albums, day3, [
      'pans-unilag/events/health-week-2026/day-3/photo-01',
    ]).find((a) => a.slug === day3.slug)
    await expect(new AlbumModel(album).validate()).resolves.toBeUndefined()
    expect(defaultAlt({ slug: 'x', title: 'PANS Dinner' }, 0)).toBe('Photo 1 from PANS Dinner')
  })
})

describe('Album model', () => {
  const photo = { publicId: 'pans-unilag/x/photo-01', alt: 'A photo' }
  const base = {
    slug: 'x',
    title: 'X',
    event: 'x',
    photos: [photo],
    cover: photo.publicId,
    consentConfirmed: true,
  }

  it.each([
    ['photos without confirmed consent', { consentConfirmed: false }, /consent/],
    ['a cover that is not in the album', { cover: 'other' }, /cover must be one of/],
    ['a photo without alt text', { photos: [{ publicId: 'pans-unilag/x/photo-01' }] }, /alt/],
    ['an empty album that is not a placeholder', { photos: [] }, /must be a placeholder/],
  ])('rejects %s', async (_case, change, message) => {
    await expect(new AlbumModel({ ...base, ...change }).validate()).rejects.toThrow(message)
  })
})

describe('resizeForWeb', () => {
  it('fits photos within 2500 px and strips location and camera metadata', async () => {
    const original = await sharp({
      create: { width: 4000, height: 3000, channels: 3, background: '#0e6434' },
    })
      .jpeg()
      .withExif({ IFD0: { Make: 'PhoneMaker', Copyright: 'Owner Name' } })
      .toBuffer()
    expect((await sharp(original).metadata()).exif).toBeDefined()

    const { data, width, height } = await resizeForWeb(original)
    expect([width, height]).toEqual([2500, 1875])
    expect((await sharp(data).metadata()).exif).toBeUndefined()
  })

  it('never enlarges small photos', async () => {
    const small = await sharp({
      create: { width: 800, height: 600, channels: 3, background: '#ffffff' },
    })
      .png()
      .toBuffer()
    expect(await resizeForWeb(small)).toMatchObject({ width: 800, height: 600 })
  })
})
