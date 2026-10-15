import mongoose from 'mongoose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AlbumModel } from '../src/modules/albums/infrastructure/album.model.js'
import { mongoAlbumReader } from '../src/modules/albums/infrastructure/album.repository.js'
import { EventModel } from '../src/modules/events/infrastructure/event.model.js'
import { mongoEventReader } from '../src/modules/events/infrastructure/event.repository.js'

/** Runs only when MONGODB_URI_TEST points at a throwaway database (see seed.integration.test.ts). */
const uri = process.env.MONGODB_URI_TEST
const series = 'Integration Test Series'

describe.skipIf(!uri)('event and album readers against a real MongoDB', () => {
  const cleanUp = async () => {
    await EventModel.deleteMany({ series })
    await AlbumModel.deleteMany({ series })
  }

  beforeAll(async () => {
    await mongoose.connect(uri!)
    await cleanUp()
    await EventModel.create({
      slug: 'integration-test-day-1',
      title: 'Day 1',
      series,
      dayNumber: 1,
      startsAt: new Date('2027-01-10T09:00:00+01:00'),
      endsAt: new Date('2027-01-10T17:00:00+01:00'),
    })
    // isPlaceholder/placeholderNote come from contentPlugin, which the inferred model type doesn't see.
    const album: Record<string, unknown> = {
      slug: 'integration-test-day-1',
      title: 'Day 1',
      event: 'integration-test-day-1',
      series,
      isPlaceholder: true,
      placeholderNote: 'Photos to come',
      sourceFolderUrl: 'https://example.com/folder',
    }
    await AlbumModel.create(album)
  })

  afterAll(async () => {
    await cleanUp()
    await mongoose.disconnect()
  })

  it('filters events by series and finds one by slug', async () => {
    expect((await mongoEventReader.list({ series })).map((e) => e.slug)).toEqual([
      'integration-test-day-1',
    ])
    expect(await mongoEventReader.findBySlug('integration-test-day-1')).toMatchObject({
      datePrecision: 'day',
    })
  })

  it('leaves the folder link and consent flag out of the album list', async () => {
    const [card] = await mongoAlbumReader.list({ series })
    expect(card).not.toHaveProperty('sourceFolderUrl')
    expect(card).not.toHaveProperty('consentConfirmed')
    const album = await mongoAlbumReader.findBySlug('integration-test-day-1')
    expect(album?.sourceFolderUrl).toBe('https://example.com/folder')
  })
})
