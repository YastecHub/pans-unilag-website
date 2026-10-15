import { type Model, Types } from 'mongoose'
import type {
  AdminCollection,
  AdminRecord,
} from '../src/modules/admin/application/adminResources.js'

type Row = Record<string, unknown> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date }

/**
 * An in-memory dashboard collection that validates through the real Mongoose model
 * (field rules and cross-field hooks), and enforces unique slugs like the database index.
 */
export function memoryAdminCollection(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>,
  seed: Record<string, unknown>[] = [],
  clock = () => new Date(),
) {
  const rows: Row[] = seed.map((data) => {
    const at = clock()
    return { ...new model(data).toObject(), createdAt: at, updatedAt: at } as Row
  })
  const toRecord = (row: Row) => new model(row).toJSON() as AdminRecord
  const find = (id: string) => rows.find((r) => r._id.toString() === id)

  async function check(row: Row, selfId?: string) {
    await new model(row).validate()
    if (
      typeof row.slug === 'string' &&
      rows.some((r) => r.slug === row.slug && r._id.toString() !== selfId)
    ) {
      throw Object.assign(new Error('duplicate key'), { code: 11000, keyValue: { slug: row.slug } })
    }
  }

  const collection: AdminCollection & { rows: Row[] } = {
    rows,
    async list(page, pageSize) {
      const sorted = [...rows].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      const items = sorted.slice((page - 1) * pageSize, page * pageSize).map(toRecord)
      return { items, total: rows.length, page, pageSize }
    },
    async get(id) {
      const row = find(id)
      return row ? toRecord(row) : null
    },
    async create(data) {
      const at = clock()
      const row = { ...new model(data).toObject(), createdAt: at, updatedAt: at } as Row
      await check(row)
      rows.push(row)
      return toRecord(row)
    },
    async update(id, changes) {
      const row = find(id)
      if (!row) return null
      const next = { ...row, updatedAt: clock() } as Row
      for (const [field, value] of Object.entries(changes)) {
        if (value === null) delete next[field]
        else next[field] = value
      }
      await check(next, id)
      Object.assign(row, next)
      for (const field of Object.keys(row)) if (!(field in next)) delete row[field]
      return toRecord(row)
    },
    async remove(id) {
      const i = rows.findIndex((r) => r._id.toString() === id)
      if (i === -1) return false
      rows.splice(i, 1)
      return true
    },
  }
  return collection
}
