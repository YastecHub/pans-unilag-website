import { isValidObjectId } from 'mongoose'
import { HttpError } from '../../../lib/httpError.js'
import type { AccountStore, AccountView } from '../application/accounts.js'
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

type AccountDoc = Doc & { lastLoginAt?: Date | null; createdAt?: Date | null }

const toAccount = (d: AccountDoc): AccountView => ({
  id: d._id.toString(),
  name: d.name,
  email: d.email,
  role: d.role,
  lastLoginAt: d.lastLoginAt ? d.lastLoginAt.toISOString() : null,
  createdAt: d.createdAt ? d.createdAt.toISOString() : null,
})

const isDuplicateKey = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000

/** The Accounts page's view of the admins collection (application/accounts.ts). */
export const mongoAccountStore: AccountStore = {
  async list() {
    return (await AdminModel.find().lean<AccountDoc[]>()).map(toAccount)
  },
  async findById(id) {
    if (!isValidObjectId(id)) return null
    const doc = await AdminModel.findById(id).lean<AccountDoc>()
    return doc ? toAccount(doc) : null
  },
  async findByEmail(email) {
    const doc = await AdminModel.findOne({ email }).lean<AccountDoc>()
    return doc ? toAccount(doc) : null
  },
  async create(input) {
    try {
      const doc = await AdminModel.create(input)
      return toAccount(doc.toObject() as AccountDoc)
    } catch (error) {
      if (isDuplicateKey(error))
        throw HttpError.conflict('There is already an account with that email.')
      throw error
    }
  },
  async update(id, { role, passwordHash }) {
    if (!isValidObjectId(id)) return null
    const doc = await AdminModel.findByIdAndUpdate(
      id,
      {
        $set: { ...(role && { role }), ...(passwordHash && { passwordHash }) },
        ...(passwordHash && { $inc: { tokenVersion: 1 } }),
      },
      { new: true, runValidators: true },
    ).lean<AccountDoc>()
    return doc ? toAccount(doc) : null
  },
  async remove(id) {
    if (!isValidObjectId(id)) return false
    return (await AdminModel.deleteOne({ _id: id })).deletedCount === 1
  },
}
