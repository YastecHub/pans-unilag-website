import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { SEED_TARGETS } from '../src/seed/registry.js'

const SEED_DIR = fileURLToPath(new URL('../seed/', import.meta.url))
const DATA_DIR = join(SEED_DIR, '../data')
const OUTPUT_FILE = join(DATA_DIR, 'pans-unilag-db.json')

export function bundleDatabase(): Record<string, unknown[]> {
  const db: Record<string, unknown[]> = {}
  let totalItems = 0

  for (const target of SEED_TARGETS) {
    const collectionName = target.file.replace(/\.json$/, '')
    const filePath = join(SEED_DIR, target.file)
    try {
      const content = JSON.parse(readFileSync(filePath, 'utf-8'))
      if (Array.isArray(content)) {
        db[collectionName] = content
        totalItems += content.length
      }
    } catch (err) {
      console.warn(`Could not read ${target.file}:`, err)
    }
  }

  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(OUTPUT_FILE, JSON.stringify(db, null, 2), 'utf-8')
  console.log(`Bundled ${totalItems} records across ${Object.keys(db).length} collections into:`)
  console.log(`  ${OUTPUT_FILE}`)
  return db
}

bundleDatabase()
