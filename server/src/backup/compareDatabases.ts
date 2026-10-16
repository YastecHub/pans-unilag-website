import { createHash } from 'node:crypto'
import mongoose from 'mongoose'

/**
 * Proves a backup restores completely: each collection's document count, and a SHA-256 over
 * every document (sorted by _id, as canonical Extended JSON, so types like dates and ObjectIds
 * count too). Only counts and hashes are ever reported, never the documents (they include
 * alumni details).
 */

export type CollectionSummary = { count: number; sha256: string }
export type DatabaseSummary = Record<string, CollectionSummary>

/** The few driver calls used here; mongoose's `connection.db` provides them. */
export type ReadableDb = {
  listCollections(): { toArray(): Promise<{ name: string; type?: string }[]> }
  collection(name: string): {
    find(filter: object, options: { sort: Record<string, 1> }): AsyncIterable<unknown>
  }
}

/** Rate-limit counters expire within the hour and are never backed up on purpose. */
export const SKIPPED_COLLECTIONS = ['ratelimits']

export async function summariseDatabase(
  db: ReadableDb,
  skip: string[] = SKIPPED_COLLECTIONS,
): Promise<DatabaseSummary> {
  const collections = (await db.listCollections().toArray())
    .filter((c) => c.type !== 'view' && !c.name.startsWith('system.') && !skip.includes(c.name))
    .map((c) => c.name)
    .sort()
  const summary: DatabaseSummary = {}
  for (const name of collections) {
    const hash = createHash('sha256')
    let count = 0
    for await (const doc of db.collection(name).find({}, { sort: { _id: 1 } })) {
      hash.update(mongoose.mongo.BSON.EJSON.stringify(doc, { relaxed: false }))
      hash.update('\n')
      count++
    }
    summary[name] = { count, sha256: hash.digest('hex') }
  }
  return summary
}

export type CollectionComparison = {
  name: string
  source: number | null
  restored: number | null
  identical: boolean
}

/** Every collection in either database, and whether its contents match exactly. */
export function compareSummaries(
  source: DatabaseSummary,
  restored: DatabaseSummary,
): { collections: CollectionComparison[]; identical: boolean } {
  const names = [...new Set([...Object.keys(source), ...Object.keys(restored)])].sort()
  const collections = names.map((name) => {
    const a = source[name]
    const b = restored[name]
    return {
      name,
      source: a?.count ?? null,
      restored: b?.count ?? null,
      identical: !!a && !!b && a.count === b.count && a.sha256 === b.sha256,
    }
  })
  return { collections, identical: collections.every((c) => c.identical) }
}

/** A plain-text table for the terminal. */
export function formatComparison(result: ReturnType<typeof compareSummaries>): string {
  const width = Math.max(10, ...result.collections.map((c) => c.name.length))
  const cell = (n: number | null) => (n === null ? 'missing' : String(n)).padStart(8)
  const lines = [
    `${'collection'.padEnd(width)}  ${'source'.padStart(8)}  ${'restored'.padStart(8)}  result`,
    ...result.collections.map(
      (c) =>
        `${c.name.padEnd(width)}  ${cell(c.source)}  ${cell(c.restored)}  ${c.identical ? 'identical' : 'DIFFERENT'}`,
    ),
  ]
  return lines.join('\n')
}
