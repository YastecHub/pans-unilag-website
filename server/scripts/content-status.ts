/**
 * Prints what is still a placeholder in server/seed/*.json, as Markdown for the content tracking issue (#14).
 *   npm run content:status -w server
 * No database needed. Files that don't exist yet are skipped.
 */
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fileStatus, formatReport, type SeedDoc } from '../src/seed/contentStatus.js'
import { SEED_TARGETS } from '../src/seed/registry.js'

const SEED_DIR = fileURLToPath(new URL('../seed/', import.meta.url))

const statuses = []
for (const { file } of SEED_TARGETS) {
  const filePath = path.join(SEED_DIR, file)
  if (!existsSync(filePath)) continue
  const data = JSON.parse(await readFile(filePath, 'utf8')) as SeedDoc | SeedDoc[]
  statuses.push(fileStatus(file, Array.isArray(data) ? data : [data]))
}
process.stdout.write(formatReport(statuses))
