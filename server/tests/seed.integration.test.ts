import mongoose, { Schema } from 'mongoose'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { contentPlugin } from '../src/lib/contentPlugin.js'
import { runSeed } from '../src/seed/runSeed.js'

/**
 * Runs against a real MongoDB only when MONGODB_URI_TEST is set, e.g.
 *   $env:MONGODB_URI_TEST = "mongodb+srv://…/pans-test"; npm test -w server
 * Use a throwaway database: the test creates and drops its own collection.
 */
const uri = process.env.MONGODB_URI_TEST

describe.skipIf(!uri)('seed against a real MongoDB', () => {
  const schema = new Schema({ slug: { type: String, required: true, unique: true }, name: String })
  schema.plugin(contentPlugin)
  const Model =
    mongoose.models.SeedIntegration ??
    mongoose.model('SeedIntegration', schema, 'seed_integration_test')
  let dir: string

  beforeAll(async () => {
    await mongoose.connect(uri!)
    await Model.deleteMany({})
    dir = await mkdtemp(path.join(tmpdir(), 'pans-seed-it-'))
    await writeFile(
      path.join(dir, 'items.json'),
      JSON.stringify([
        { slug: 'a', name: 'A' },
        { slug: 'b', name: 'B' },
      ]),
    )
  })

  afterAll(async () => {
    await Model.collection.drop().catch(() => undefined)
    await mongoose.disconnect()
  })

  it('creates no duplicates when run twice', async () => {
    const options = {
      dir,
      targets: [{ file: 'items.json', model: Model, key: ['slug'] }],
      mode: 'insert' as const,
      isProduction: false,
    }
    const [first] = await runSeed(options)
    const [second] = await runSeed(options)

    expect(first).toMatchObject({ inserted: 2 })
    expect(second).toMatchObject({ inserted: 0, updated: 0, unchanged: 2 })
    expect(await Model.countDocuments()).toBe(2)
  })
})
