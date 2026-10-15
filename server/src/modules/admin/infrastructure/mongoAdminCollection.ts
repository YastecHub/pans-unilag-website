import { isValidObjectId, type Model } from 'mongoose'
import type { AdminCollection, AdminRecord } from '../application/adminResources.js'

const toRecord = (doc: { toJSON(): unknown }) => doc.toJSON() as AdminRecord

/**
 * A MongoDB collection for the dashboard. Updates load the document, apply the changes and save,
 * so every model rule (including cross-field checks like event dates) runs, as it does on create.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mongoAdminCollection(model: Model<any>): AdminCollection {
  return {
    async list(page, pageSize) {
      const [docs, total] = await Promise.all([
        model
          .find()
          .sort({ updatedAt: -1, _id: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize),
        model.countDocuments(),
      ])
      return { items: docs.map(toRecord), total, page, pageSize }
    },
    async get(id) {
      if (!isValidObjectId(id)) return null
      const doc = await model.findById(id)
      return doc ? toRecord(doc) : null
    },
    async create(data) {
      return toRecord(await model.create(data))
    },
    async update(id, changes) {
      if (!isValidObjectId(id)) return null
      const doc = await model.findById(id)
      if (!doc) return null
      for (const [field, value] of Object.entries(changes)) doc.set(field, value ?? undefined)
      await doc.save()
      return toRecord(doc)
    },
    async remove(id) {
      if (!isValidObjectId(id)) return false
      const { deletedCount } = await model.deleteOne({ _id: id })
      return deletedCount === 1
    },
  }
}
