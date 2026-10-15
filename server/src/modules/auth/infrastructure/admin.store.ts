import { isValidObjectId } from 'mongoose'
import type { AdminRole, AdminStore, StoredAdmin } from '../application/adminView.js'
import { AdminModel } from './admin.model.js'

type Doc = {
  _id: { toString(): string }
  name: string
  email: string
  role: AdminRole
  tokenVersion?: number
  passwordHash?: string
}

const toStored = (d: Doc): StoredAdmin => ({
  id: d._id.toString(),
  name: d.name,
  email: d.email,
  role: d.role,
  tokenVersion: d.tokenVersion ?? 0,
})

export const mongoAdminStore: AdminStore = {
  async findByEmailWithHash(email) {
    const doc = await AdminModel.findOne({ email }).select('+passwordHash').lean<Doc>()
    return doc?.passwordHash ? { ...toStored(doc), passwordHash: doc.passwordHash } : null
  },
  async findById(id) {
    if (!isValidObjectId(id)) return null
    const doc = await AdminModel.findById(id).lean<Doc>()
    return doc ? toStored(doc) : null
  },
  async recordLogin(id, at) {
    await AdminModel.updateOne({ _id: id }, { $set: { lastLoginAt: at } })
  },
}
