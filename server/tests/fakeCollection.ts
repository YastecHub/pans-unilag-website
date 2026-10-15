import type { SeedCollection } from '../src/seed/runSeed.js'

type Doc = Record<string, unknown>

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a instanceof Date ? a.toISOString() : a) ===
  JSON.stringify(b instanceof Date ? b.toISOString() : b)

/**
 * In-memory stand-in for a MongoDB collection, implementing the upsert rules the seed relies on:
 * match on the filter; when nothing matches insert filter + $setOnInsert + $set; when a document
 * matches apply only $set and count it as modified if a value changed.
 */
export class FakeCollection implements SeedCollection {
  docs: Doc[] = []
  deleteCalls = 0

  async bulkWrite(ops: Parameters<SeedCollection['bulkWrite']>[0]) {
    let upsertedCount = 0
    let modifiedCount = 0
    for (const { updateOne } of ops) {
      const { filter, update } = updateOne
      const match = this.docs.find((doc) =>
        Object.entries(filter).every(([k, v]) => same(doc[k], v)),
      )
      if (!match) {
        this.docs.push({ ...filter, ...update.$setOnInsert, ...update.$set })
        upsertedCount++
        continue
      }
      const changes = Object.entries(update.$set ?? {}).filter(([k, v]) => !same(match[k], v))
      for (const [k, v] of changes) match[k] = v
      if (changes.length > 0) modifiedCount++
    }
    return { upsertedCount, modifiedCount }
  }

  async deleteMany() {
    this.deleteCalls++
    this.docs = []
  }
}
