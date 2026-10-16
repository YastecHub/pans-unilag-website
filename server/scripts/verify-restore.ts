/**
 * Checks that a restored backup matches the live database, collection by collection.
 *
 *   $env:SOURCE_MONGODB_URI   = "mongodb+srv://…/pans-unilag"               # the live database
 *   $env:RESTORED_MONGODB_URI = "mongodb+srv://…/pans-unilag-restore-test"  # the restored copy
 *   npm run backup:verify -w server
 *
 * Read-only on both databases. Prints only counts and pass/fail, never document contents.
 * Steps around it (mongodump, mongorestore, dropping the scratch copy): docs/backup-restore.md.
 */
import mongoose from 'mongoose'
import {
  compareSummaries,
  formatComparison,
  type ReadableDb,
  summariseDatabase,
} from '../src/backup/compareDatabases.js'

const fail = (message: string): never => {
  console.error(`\n${message}\n`)
  process.exit(1)
}

async function summarise(uri: string) {
  const connection = await mongoose
    .createConnection(uri, {
      serverSelectionTimeoutMS: 15_000,
      readPreference: 'secondaryPreferred',
    })
    .asPromise()
  try {
    const db = connection.db
    if (!db) throw new Error('no database selected')
    return { name: db.databaseName, summary: await summariseDatabase(db as unknown as ReadableDb) }
  } finally {
    await connection.close()
  }
}

async function main() {
  const sourceUri = process.env.SOURCE_MONGODB_URI
  const restoredUri = process.env.RESTORED_MONGODB_URI
  if (!sourceUri || !restoredUri)
    fail('Set SOURCE_MONGODB_URI (the live database) and RESTORED_MONGODB_URI (the restored copy).')

  const source = await summarise(sourceUri!)
  const restored = await summarise(restoredUri!)
  if (source.name === restored.name && sourceUri === restoredUri)
    fail('Both addresses point at the same database: restore into a separate scratch database.')

  const result = compareSummaries(source.summary, restored.summary)
  console.log(`\nComparing "${source.name}" (source) with "${restored.name}" (restored)\n`)
  console.log(formatComparison(result))
  const documents = result.collections.reduce((n, c) => n + (c.source ?? 0), 0)
  if (!result.identical) fail('The restore does NOT match. Do not rely on this backup.')
  console.log(
    `\nRestore verified: ${result.collections.length} collections, ${documents} documents, all identical.\n`,
  )
}

main().catch((error: unknown) =>
  fail(`Could not compare the databases: ${error instanceof Error ? error.message : error}`),
)
