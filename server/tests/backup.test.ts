import mongoose, { Types } from 'mongoose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  compareSummaries,
  formatComparison,
  type ReadableDb,
  summariseDatabase,
} from '../src/backup/compareDatabases.js'

/** An in-memory database with the two calls the summary uses. */
function fakeDb(collections: Record<string, Record<string, unknown>[]>): ReadableDb {
  return {
    listCollections: () => ({
      toArray: async () => [
        ...Object.keys(collections).map((name) => ({ name, type: 'collection' })),
        { name: 'system.views', type: 'collection' },
        { name: 'upcoming', type: 'view' },
      ],
    }),
    collection: (name) => ({
      find: () => {
        const docs = [...(collections[name] ?? [])].sort((a, b) =>
          String(a._id).localeCompare(String(b._id)),
        )
        return (async function* () {
          yield* docs
        })()
      },
    }),
  }
}

const id = (n: number) => new Types.ObjectId(n.toString(16).padStart(24, '0'))
const live = () => ({
  events: [
    { _id: id(1), title: 'Freshers’ Week', startsAt: new Date('2026-11-30T00:00:00+01:00') },
    { _id: id(2), title: 'Pharmalympics 2027', startsAt: null },
  ],
  alumni: [{ _id: id(3), name: 'Ada', email: 'ada@example.com', consentAt: new Date(0) }],
  ratelimits: [{ _id: 'login:1.2.3.4', hits: 3, resetAt: new Date() }],
})

describe('verifying a restored backup', () => {
  it('passes when every collection and document matches, ignoring rate-limit counters', async () => {
    const restored = live()
    restored.ratelimits = []
    const result = compareSummaries(
      await summariseDatabase(fakeDb(live())),
      await summariseDatabase(fakeDb(restored)),
    )
    expect(result.identical).toBe(true)
    expect(result.collections.map((c) => c.name)).toEqual(['alumni', 'events'])
    expect(formatComparison(result)).toMatch(/events\s+2\s+2\s+identical/)
  })

  it('catches a changed value, a changed type, a missing document and a missing collection', async () => {
    const source = await summariseDatabase(fakeDb(live()))

    const edited = live()
    edited.events[0]!.title = 'Freshers Week'
    expect(compareSummaries(source, await summariseDatabase(fakeDb(edited))).identical).toBe(false)

    // A date restored as text looks the same in plain JSON; canonical EJSON tells them apart.
    const retyped = live()
    retyped.alumni[0]!.consentAt = '1970-01-01T00:00:00.000Z' as unknown as Date
    expect(compareSummaries(source, await summariseDatabase(fakeDb(retyped))).identical).toBe(false)

    const short = live()
    short.events.pop()
    const shortResult = compareSummaries(source, await summariseDatabase(fakeDb(short)))
    expect(shortResult.collections.find((c) => c.name === 'events')).toMatchObject({
      source: 2,
      restored: 1,
      identical: false,
    })

    const withoutAlumni: Record<string, Record<string, unknown>[]> = live()
    delete withoutAlumni.alumni
    const missing = compareSummaries(source, await summariseDatabase(fakeDb(withoutAlumni)))
    expect(missing.collections.find((c) => c.name === 'alumni')).toMatchObject({
      restored: null,
      identical: false,
    })
    expect(formatComparison(missing)).toMatch(/alumni\s+1\s+missing\s+DIFFERENT/)
  })

  it('never puts document contents in the report', async () => {
    const report = formatComparison(
      compareSummaries(
        await summariseDatabase(fakeDb(live())),
        await summariseDatabase(fakeDb({})),
      ),
    )
    expect(report).not.toMatch(/ada@example\.com|Ada|Freshers/)
  })
})

/** Runs only when MONGODB_URI_TEST points at a throwaway database (see seed.integration.test.ts). */
const uri = process.env.MONGODB_URI_TEST
describe.skipIf(!uri)('verifying a restore against a real MongoDB', () => {
  const copyName = 'pans-backup-verify-test'
  let source: mongoose.Connection
  let copy: mongoose.Connection

  beforeAll(async () => {
    source = await mongoose.createConnection(uri!).asPromise()
    copy = source.useDb(copyName)
    await copy.dropDatabase()
    for (const { name } of await source.db!.listCollections().toArray()) {
      if (name.startsWith('system.') || name === 'ratelimits') continue
      const docs = await source.db!.collection(name).find().toArray()
      if (docs.length) await copy.db!.collection(name).insertMany(docs)
      else await copy.db!.createCollection(name)
    }
  })
  afterAll(async () => {
    await copy.dropDatabase()
    await source.close()
  })

  it('finds a faithful copy identical', async () => {
    const result = compareSummaries(
      await summariseDatabase(source.db as unknown as ReadableDb),
      await summariseDatabase(copy.db as unknown as ReadableDb),
    )
    expect(result.identical).toBe(true)
  })
})
