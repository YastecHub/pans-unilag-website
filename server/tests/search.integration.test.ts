import mongoose from 'mongoose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CommitteeModel } from '../src/modules/committees/infrastructure/committee.model.js'
import { mongoSearchSources } from '../src/modules/search/infrastructure/search.sources.js'

/** Runs only when MONGODB_URI_TEST points at a throwaway database (see seed.integration.test.ts). */
const uri = process.env.MONGODB_URI_TEST
const session = '1999/2000'
const committees = mongoSearchSources.find((s) => s.type === 'committee')!

describe.skipIf(!uri)('MongoDB text search', () => {
  beforeAll(async () => {
    await mongoose.connect(uri!)
    await CommitteeModel.syncIndexes()
    await CommitteeModel.deleteMany({ session })
    const base = { session, order: 1, shortName: 'ZZ' }
    // isPlaceholder/placeholderNote come from contentPlugin, which the inferred model type doesn't see.
    const docs: Record<string, unknown>[] = [
      {
        ...base,
        slug: 'zz-quizbowl',
        name: 'Quizbowl Committee',
        description: 'Runs the quizbowl.',
      },
      {
        ...base,
        slug: 'zz-quizbowl-draft',
        name: 'Quizbowl Draft Committee',
        isPlaceholder: true,
        placeholderNote: 'Write-up needed',
      },
    ]
    await CommitteeModel.create(docs)
  })

  afterAll(async () => {
    await CommitteeModel.deleteMany({ session })
    await mongoose.disconnect()
  })

  it('finds by whole word and leaves placeholders out', async () => {
    const hits = await committees.search('quizbowl', 10, new Date())
    expect(hits.map((h) => h.url)).toEqual(['/leadership/committees/zz-quizbowl'])
    expect(hits[0]?.score).toBeGreaterThan(0)
  })
})
