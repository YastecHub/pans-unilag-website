import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { SeedTarget } from './registry.js'

/**
 * insert (default): add documents that don't exist yet; never touch existing ones, so content
 *                   edited in the dashboard is never overwritten.
 * update:           also overwrite existing documents with the seed values (deliberate refresh).
 * check:            validate the files only; no database needed.
 */
export type SeedMode = 'insert' | 'update' | 'check'

type Doc = Record<string, unknown>

type UpsertOp = {
  updateOne: {
    filter: Doc
    update: { $setOnInsert?: Doc; $set?: Doc }
    upsert: true
  }
}

/** The part of a MongoDB collection the seed uses (a test can pass an in-memory one). */
export type SeedCollection = {
  bulkWrite(
    ops: UpsertOp[],
    options: { ordered: boolean },
  ): Promise<{ upsertedCount: number; modifiedCount: number }>
  deleteMany(filter: Doc): Promise<unknown>
}

export type SeedOptions = {
  /** Folder holding the *.json seed files. */
  dir: string
  targets: readonly SeedTarget[]
  mode: SeedMode
  /** Empty the seeded collections first. Development only. */
  reset?: boolean
  isProduction: boolean
  /** Defaults to the model's MongoDB collection. */
  getCollection?: (target: SeedTarget) => SeedCollection
  /** Defaults to new Date(). */
  now?: Date
}

export type SeedFileResult = {
  file: string
  status: 'missing' | 'checked' | 'seeded'
  total: number
  inserted: number
  updated: number
  unchanged: number
}

export class SeedError extends Error {
  readonly problems: string[]

  constructor(problems: string[]) {
    super(`Seed failed:\n${problems.map((p) => `  - ${p}`).join('\n')}`)
    this.name = 'SeedError'
    this.problems = problems
  }
}

const defaultCollection = (target: SeedTarget) =>
  target.model.collection as unknown as SeedCollection

/** Reads, validates and writes every registered seed file. Validates everything before writing anything. */
export async function runSeed(options: SeedOptions): Promise<SeedFileResult[]> {
  const { dir, targets, mode, reset = false, isProduction } = options
  const getCollection = options.getCollection ?? defaultCollection
  const now = options.now ?? new Date()

  if (reset && isProduction) {
    throw new SeedError([
      '--reset refuses to run when NODE_ENV=production: it would delete live content',
    ])
  }
  if (reset && mode === 'check') throw new SeedError(['--reset cannot be combined with --check'])

  // 1. Every JSON file must belong to a registered target (no silently ignored files).
  const registered = new Set(targets.map((t) => t.file))
  const present = (await readdir(dir).catch(() => [] as string[])).filter((f) =>
    f.endsWith('.json'),
  )
  const unknown = present.filter((f) => !registered.has(f))
  if (unknown.length > 0) {
    throw new SeedError(
      unknown.map((f) => `${f} has no model registered in server/src/seed/registry.ts`),
    )
  }

  // 2. Load and validate everything first, so a bad file never leaves a half-seeded database.
  const problems: string[] = []
  const prepared: { target: SeedTarget; docs: Doc[] | undefined }[] = []
  for (const target of targets) {
    if (!present.includes(target.file)) {
      prepared.push({ target, docs: undefined })
      continue
    }
    const docs = await loadDocs(path.join(dir, target.file), target, problems)
    prepared.push({ target, docs })
  }
  if (problems.length > 0) throw new SeedError(problems)

  if (mode === 'check') {
    return prepared.map(({ target, docs }) =>
      result(target.file, docs ? 'checked' : 'missing', docs?.length ?? 0),
    )
  }

  // 3. Write.
  if (reset) {
    for (const target of [...targets].reverse()) await getCollection(target).deleteMany({})
  }

  const results: SeedFileResult[] = []
  for (const { target, docs } of prepared) {
    if (!docs) {
      results.push(result(target.file, 'missing', 0))
      continue
    }
    const ops = buildUpserts(target, docs, mode, now)
    const written =
      ops.length > 0 ? await getCollection(target).bulkWrite(ops, { ordered: true }) : undefined
    const inserted = written?.upsertedCount ?? 0
    const updated = written?.modifiedCount ?? 0
    results.push({
      ...result(target.file, 'seeded', docs.length),
      inserted,
      updated,
      unchanged: docs.length - inserted - updated,
    })
  }
  return results
}

/**
 * One upsert per document, matched on the key fields.
 * insert: $setOnInsert only, so existing documents are left exactly as they are.
 * update: $set the seed values (createdAt only on insert).
 */
export function buildUpserts(
  target: SeedTarget,
  docs: Doc[],
  mode: 'insert' | 'update',
  now: Date,
): UpsertOp[] {
  return docs.map((doc) => {
    const filter = Object.fromEntries(target.key.map((k) => [k, doc[k]]))
    const update =
      mode === 'update'
        ? { $set: { ...doc, updatedAt: now }, $setOnInsert: { createdAt: now } }
        : { $setOnInsert: { ...doc, createdAt: now, updatedAt: now } }
    return { updateOne: { filter, update, upsert: true } }
  })
}

async function loadDocs(
  file: string,
  target: SeedTarget,
  problems: string[],
): Promise<Doc[] | undefined> {
  const name = target.file
  let raw: unknown
  try {
    raw = JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    problems.push(
      `${name}: not valid JSON (${error instanceof Error ? error.message : String(error)})`,
    )
    return undefined
  }
  if (!Array.isArray(raw)) {
    problems.push(`${name}: must be a JSON array of documents`)
    return undefined
  }

  const docs: Doc[] = []
  const seenKeys = new Map<string, number>()
  for (const [index, item] of raw.entries()) {
    const where = `${name} item ${index + 1}`
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      problems.push(`${where}: must be an object`)
      continue
    }
    const missing = target.key.filter(
      (k) => (item as Doc)[k] === undefined || (item as Doc)[k] === '',
    )
    if (missing.length > 0) {
      problems.push(`${where}: missing key field ${missing.join(', ')}`)
      continue
    }
    const keyLabel = target.key.map((k) => `${k}=${JSON.stringify((item as Doc)[k])}`).join(', ')
    const keyId = JSON.stringify(target.key.map((k) => (item as Doc)[k]))
    const firstSeen = seenKeys.get(keyId)
    if (firstSeen !== undefined) {
      problems.push(`${where} (${keyLabel}): duplicate of item ${firstSeen}`)
      continue
    }
    seenKeys.set(keyId, index + 1)

    const casted = await castAndValidate(target, item as Doc)
    if (typeof casted === 'string') problems.push(`${where} (${keyLabel}): ${casted}`)
    else docs.push(casted)
  }
  return docs
}

/** Validates with the Mongoose schema and returns the casted values (dates as Date, defaults applied). */
async function castAndValidate(target: SeedTarget, item: Doc): Promise<Doc | string> {
  try {
    const document = new target.model(item)
    await document.validate()
    const plain = document.toObject({ depopulate: true, versionKey: false }) as Doc
    // Identity and timestamps are managed by the seed runner, not the files.
    delete plain._id
    delete plain.createdAt
    delete plain.updatedAt
    return plain
  } catch (error) {
    if (
      error instanceof Error &&
      'errors' in error &&
      typeof error.errors === 'object' &&
      error.errors
    ) {
      return Object.values(error.errors as Record<string, { message: string }>)
        .map((e) => e.message)
        .join('; ')
    }
    return error instanceof Error ? error.message : String(error)
  }
}

function result(file: string, status: SeedFileResult['status'], total: number): SeedFileResult {
  return {
    file,
    status,
    total,
    inserted: 0,
    updated: 0,
    unchanged: status === 'checked' ? 0 : total,
  }
}
