import { isValidObjectId } from 'mongoose'
import { AlumnusModel } from '../../submissions/infrastructure/alumnus.model.js'
import { FeedbackModel } from '../../submissions/infrastructure/feedback.model.js'
import type {
  AlumnusRecord,
  FeedbackRecord,
  SubmissionAdminStore,
} from '../application/submissionsAdmin.js'

type Lean = Record<string, unknown> & { _id: { toString(): string } }
const iso = (value: unknown) => new Date(value as string).toISOString()

const toFeedback = (d: Lean): FeedbackRecord => ({
  id: d._id.toString(),
  category: d.category as string,
  message: d.message as string,
  ...(d.contactEmail ? { contactEmail: d.contactEmail as string } : {}),
  status: d.status as FeedbackRecord['status'],
  createdAt: iso(d.createdAt),
})

const toAlumnus = (d: Lean): AlumnusRecord => ({
  id: d._id.toString(),
  name: d.name as string,
  graduationYear: d.graduationYear as number,
  email: d.email as string,
  ...(d.phone ? { phone: d.phone as string } : {}),
  interests: (d.interests as string[]) ?? [],
  consentAt: iso(d.consentAt),
  createdAt: iso(d.createdAt),
  updatedAt: iso(d.updatedAt),
})

export const mongoSubmissionAdminStore: SubmissionAdminStore = {
  async listFeedback({ status, page, pageSize }) {
    const filter = status ? { status } : {}
    const [docs, total] = await Promise.all([
      FeedbackModel.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<Lean[]>(),
      FeedbackModel.countDocuments(filter),
    ])
    return { items: docs.map(toFeedback), total, page, pageSize }
  },
  async setFeedbackStatus(id, status) {
    if (!isValidObjectId(id)) return null
    const doc = await FeedbackModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true },
    ).lean<Lean>()
    return doc ? toFeedback(doc) : null
  },
  async listAlumni({ page, pageSize }) {
    const [docs, total] = await Promise.all([
      AlumnusModel.find()
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<Lean[]>(),
      AlumnusModel.countDocuments(),
    ])
    return { items: docs.map(toAlumnus), total, page, pageSize }
  },
  async removeAlumnus(id) {
    if (!isValidObjectId(id)) return false
    return (await AlumnusModel.deleteOne({ _id: id })).deletedCount === 1
  },
}
