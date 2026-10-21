/**
 * Loads server/seed/*.json into MongoDB. Run from the repository root:
 *   npm run seed -w server                 add missing documents (safe to run any time)
 *   npm run seed -w server -- --update     also overwrite existing documents with the seed values
 *   npm run seed -w server -- --update --only=executives
 *                                          refresh just one file (comma-separate several)
 *   npm run seed -w server -- --reset      empty the seeded collections first (development only)
 *   npm run seed:check -w server           validate the files without a database
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { EnvError, loadEnv } from '../src/config/env.js'
import { SEED_TARGETS } from '../src/seed/registry.js'
import { runSeed, SeedError, type SeedFileResult, type SeedMode } from '../src/seed/runSeed.js'

const FLAGS = new Set(['--check', '--update', '--reset', '--help'])
const SEED_DIR = fileURLToPath(new URL('../seed/', import.meta.url))

function printResults(results: SeedFileResult[], mode: SeedMode) {
  if (results.length === 0) {
    console.log('No seed files are registered yet (see server/src/seed/registry.ts).')
    return
  }
  for (const r of results) {
    const name = r.file.padEnd(22)
    if (r.status === 'missing') console.log(`${name} not written yet, skipped`)
    else if (mode === 'check') console.log(`${name} ${String(r.total).padStart(3)} items  valid`)
    else
      console.log(
        `${name} ${String(r.total).padStart(3)} items  +${r.inserted} inserted  ${r.updated} updated  ${r.unchanged} unchanged`,
      )
  }
}

async function main() {
  const args = process.argv.slice(2)
  const onlyArg = args.find((a) => a.startsWith('--only='))
  const only = onlyArg
    ?.slice('--only='.length)
    .split(',')
    .map((n) => n.trim().replace(/\.json$/, ''))
    .filter(Boolean)
  const unknown = args.filter((a) => !FLAGS.has(a) && a !== onlyArg)
  if (args.includes('--help') || unknown.length > 0) {
    if (unknown.length > 0) console.error(`Unknown option: ${unknown.join(' ')}`)
    console.log(
      'Usage: npm run seed -w server [-- --update | --reset] [--only=executives,events]   or   npm run seed:check -w server',
    )
    process.exit(unknown.length > 0 ? 1 : 0)
  }

  const mode: SeedMode = args.includes('--check')
    ? 'check'
    : args.includes('--update')
      ? 'update'
      : 'insert'
  const reset = args.includes('--reset')

  if (mode === 'check') {
    printResults(
      await runSeed({ dir: SEED_DIR, targets: SEED_TARGETS, mode, isProduction: false }),
      mode,
    )
    return
  }

  if (existsSync('.env')) process.loadEnvFile('.env')
  const env = loadEnv()
  const isProduction = env.NODE_ENV === 'production'
  if (reset && isProduction)
    throw new SeedError(['--reset refuses to run when NODE_ENV=production'])

  await connectDb(env.MONGODB_URI)
  try {
    const { host, name } = mongoose.connection
    console.log(
      `Seeding database "${name}" on ${host} (${mode}${reset ? ', reset first' : ''}${only ? `, only ${only.join(', ')}` : ''})\n`,
    )
    printResults(
      await runSeed({ dir: SEED_DIR, targets: SEED_TARGETS, mode, reset, isProduction, only }),
      mode,
    )
  } finally {
    await disconnectDb()
  }
}

main().catch((error: unknown) => {
  if (error instanceof SeedError || error instanceof EnvError) console.error(`\n${error.message}\n`)
  else console.error('\nSeed failed:', error instanceof Error ? error.message : error, '\n')
  process.exit(1)
})
