import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import mongoose, { Schema } from 'mongoose'
import { beforeEach, describe, expect, it } from 'vitest'
import { contentPlugin } from '../src/lib/contentPlugin.js'
import type { SeedTarget } from '../src/seed/registry.js'
import { buildUpserts, runSeed, SeedError } from '../src/seed/runSeed.js'
import { FakeCollection } from './fakeCollection.js'

// A small model shaped like the real ones (committees): unique slug, required name, enum, dates.
const committeeSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  kind: { type: String, enum: ['committee', 'board'], default: 'committee' },
  foundedOn: { type: Date },
})
committeeSchema.plugin(contentPlugin)
const SeedCommittee =
  mongoose.models.SeedCommittee ?? mongoose.model('SeedCommittee', committeeSchema)
const target: SeedTarget = { file: 'committees.json', model: SeedCommittee, key: ['slug'] }

const committees = [
  { slug: 'ppht', name: 'PANS Public Health Team', foundedOn: '2020-01-15T00:00:00.000Z' },
  { slug: 'sdg', name: 'Sustainable Development Goals Committee' },
  {
    slug: 'content',
    name: 'Content Committee',
    isPlaceholder: true,
    placeholderNote: 'Write-up needed',
  },
]

let dir: string
let collection: FakeCollection

async function writeSeed(file: string, data: unknown) {
  await writeFile(path.join(dir, file), typeof data === 'string' ? data : JSON.stringify(data))
}

function seed(options: Partial<Parameters<typeof runSeed>[0]> = {}) {
  return runSeed({
    dir,
    targets: [target],
    mode: 'insert',
    isProduction: false,
    getCollection: () => collection,
    now: new Date('2026-10-15T12:00:00Z'),
    ...options,
  })
}

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'pans-seed-'))
  collection = new FakeCollection()
})

describe('runSeed', () => {
  it('inserts every document on the first run', async () => {
    await writeSeed('committees.json', committees)

    const [result] = await seed()

    expect(result).toMatchObject({
      file: 'committees.json',
      status: 'seeded',
      total: 3,
      inserted: 3,
      updated: 0,
    })
    expect(collection.docs).toHaveLength(3)
  })

  it('creates no duplicates when run twice', async () => {
    await writeSeed('committees.json', committees)

    await seed()
    const [second] = await seed()

    expect(second).toMatchObject({ inserted: 0, updated: 0, unchanged: 3 })
    expect(collection.docs).toHaveLength(3)
  })

  it('never overwrites content that was edited in the dashboard (default mode)', async () => {
    await writeSeed('committees.json', committees)
    await seed()
    const content = collection.docs.find((d) => d.slug === 'content')!
    Object.assign(content, { name: 'Content Committee', isPlaceholder: false, placeholderNote: '' })

    await seed()

    expect(collection.docs.find((d) => d.slug === 'content')).toMatchObject({
      isPlaceholder: false,
    })
  })

  it('overwrites existing documents only with --update', async () => {
    await writeSeed('committees.json', committees)
    await seed()
    await writeSeed('committees.json', [{ ...committees[1], name: 'SDG Committee' }])

    const [result] = await seed({ mode: 'update' })

    expect(result).toMatchObject({ inserted: 0, updated: 1 })
    expect(collection.docs.find((d) => d.slug === 'sdg')?.name).toBe('SDG Committee')
  })

  it('--only writes just the named files, but still validates every file', async () => {
    const other: SeedTarget = { file: 'boards.json', model: SeedCommittee, key: ['slug'] }
    const boards = new FakeCollection()
    await writeSeed('committees.json', committees)
    await writeSeed('boards.json', [{ slug: 'board', name: 'A board', kind: 'board' }])
    const run = (options: Partial<Parameters<typeof runSeed>[0]>) =>
      seed({
        targets: [target, other],
        getCollection: (t) => (t === other ? boards : collection),
        ...options,
      })

    const results = await run({ only: ['committees'] })
    expect(results.map((r) => r.file)).toEqual(['committees.json'])
    expect(collection.docs).toHaveLength(3)
    expect(boards.docs).toHaveLength(0)

    await writeSeed('boards.json', [{ slug: 'board' }]) // missing the required name
    await expect(run({ only: ['committees'], mode: 'update' })).rejects.toThrow(/boards\.json/)
    await expect(run({ only: ['commitees'] })).rejects.toThrow(
      /--only commitees: no such seed file/,
    )
  })

  it('casts values with the schema: dates become Date objects and defaults are applied', async () => {
    await writeSeed('committees.json', committees)
    await seed()

    const ppht = collection.docs.find((d) => d.slug === 'ppht')!
    expect(ppht.foundedOn).toBeInstanceOf(Date)
    expect(ppht).toMatchObject({ kind: 'committee', isPlaceholder: false, placeholderNote: '' })
    expect(ppht.createdAt).toEqual(new Date('2026-10-15T12:00:00Z'))
    expect(ppht).not.toHaveProperty('_id')
  })

  it('--reset empties the collection first in development', async () => {
    await writeSeed('committees.json', committees)
    await seed()
    collection.docs.push({ slug: 'stale', name: 'Removed committee' })

    await seed({ reset: true })

    expect(collection.deleteCalls).toBe(1)
    expect(collection.docs.map((d) => d.slug)).toEqual(['ppht', 'sdg', 'content'])
  })

  it('--reset refuses to run when NODE_ENV=production and deletes nothing', async () => {
    await writeSeed('committees.json', committees)

    await expect(seed({ reset: true, isProduction: true })).rejects.toThrow(
      /refuses to run when NODE_ENV=production/,
    )
    expect(collection.deleteCalls).toBe(0)
  })

  it('validates every file before writing anything, and lists all problems', async () => {
    await writeSeed('committees.json', [
      { slug: 'ok', name: 'Fine' },
      { name: 'No slug' },
      { slug: 'ok', name: 'Duplicate slug' },
      { slug: 'bad-kind', name: 'Bad', kind: 'club' },
      { slug: 'typo', name: 'Typo', nmae: 'x' },
      { slug: 'ph', name: 'Placeholder without a note', isPlaceholder: true },
    ])

    const error = (await seed().catch((e: unknown) => e)) as SeedError
    expect(error).toBeInstanceOf(SeedError)
    expect(error.problems).toHaveLength(5)
    expect(error.problems.join('\n')).toMatch(/item 2: missing key field slug/)
    expect(error.problems.join('\n')).toMatch(/item 3 \(slug="ok"\): duplicate of item 1/)
    expect(error.problems.join('\n')).toMatch(/item 4 \(slug="bad-kind"\): .*club/)
    expect(error.problems.join('\n')).toMatch(/item 5 \(slug="typo"\): .*nmae/)
    expect(error.problems.join('\n')).toMatch(/item 6 \(slug="ph"\): placeholderNote is required/)
    expect(collection.docs).toHaveLength(0)
  })

  it('rejects files that are not a JSON array', async () => {
    await writeSeed('committees.json', '{"slug": "x"}')
    await expect(seed()).rejects.toThrow(/must be a JSON array/)

    await writeSeed('committees.json', '[{ broken')
    await expect(seed()).rejects.toThrow(/not valid JSON/)
  })

  it('refuses JSON files that have no registered model', async () => {
    await writeSeed('committees.json', committees)
    await writeSeed('comittees.json', committees)

    await expect(seed()).rejects.toThrow(/comittees\.json has no model registered/)
  })

  it('skips registered files that have not been written yet', async () => {
    const [result] = await seed()
    expect(result).toMatchObject({ status: 'missing', total: 0 })
  })

  it('--check validates without touching the database', async () => {
    await writeSeed('committees.json', committees)

    const [result] = await seed({
      mode: 'check',
      getCollection: () => {
        throw new Error('check mode must not use the database')
      },
    })
    expect(result).toMatchObject({ status: 'checked', total: 3 })
  })
})

describe('buildUpserts', () => {
  const now = new Date('2026-10-15T12:00:00Z')
  const doc = { slug: 'ppht', name: 'PANS Public Health Team' }

  it('insert mode only sets values when the document is new', () => {
    expect(buildUpserts(target, [doc], 'insert', now)).toEqual([
      {
        updateOne: {
          filter: { slug: 'ppht' },
          update: { $setOnInsert: { ...doc, createdAt: now, updatedAt: now } },
          upsert: true,
        },
      },
    ])
  })

  it('update mode overwrites values but keeps the original createdAt', () => {
    const [op] = buildUpserts(target, [doc], 'update', now)
    expect(op?.updateOne.update).toEqual({
      $set: { ...doc, updatedAt: now },
      $setOnInsert: { createdAt: now },
    })
  })

  it('matches on every key field', () => {
    const executives: SeedTarget = { ...target, key: ['session', 'office'] }
    const [op] = buildUpserts(
      executives,
      [{ session: '2026/2027', office: 'President', name: 'x' }],
      'insert',
      now,
    )
    expect(op?.updateOne.filter).toEqual({ session: '2026/2027', office: 'President' })
  })
})
