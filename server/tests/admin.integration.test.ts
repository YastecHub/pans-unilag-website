import mongoose from 'mongoose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mongoAdminCollection } from '../src/modules/admin/infrastructure/mongoAdminCollection.js'
import { EventModel } from '../src/modules/events/infrastructure/event.model.js'

/** Runs only when MONGODB_URI_TEST points at a throwaway database (see seed.integration.test.ts). */
const uri = process.env.MONGODB_URI_TEST
const slug = 'admin-integration-test-event'
const events = mongoAdminCollection(EventModel)

describe.skipIf(!uri)('dashboard collection against a real MongoDB', () => {
  beforeAll(async () => {
    await mongoose.connect(uri!)
    await EventModel.deleteMany({ slug })
  })

  afterAll(async () => {
    await EventModel.deleteMany({ slug })
    await mongoose.disconnect()
  })

  it('creates, updates (running model hooks), clears a field and deletes', async () => {
    const created = await events.create({
      slug,
      title: 'Test',
      startsAt: new Date('2027-01-10T09:00:00+01:00'),
      endsAt: new Date('2027-01-10T17:00:00+01:00'),
      venue: 'Hall',
    })
    expect(created).toMatchObject({ slug, venue: 'Hall' })

    await expect(
      events.update(created.id, { endsAt: new Date('2027-01-09T00:00:00+01:00') }),
    ).rejects.toThrow(/endsAt must not be before startsAt/)

    const cleared = await events.update(created.id, { venue: null })
    expect(cleared?.venue).toBe('') // the schema default comes back

    expect(await events.remove(created.id)).toBe(true)
    expect(await events.get(created.id)).toBeNull()
    expect(await events.get('not-an-id')).toBeNull()
  })
})
