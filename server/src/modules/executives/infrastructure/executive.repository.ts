import {
  type ExecutiveReader,
  type StoredExecutive,
  toExecutiveView,
} from '../application/executiveView.js'
import { ExecutiveModel } from './executive.model.js'

/** Reads the Executive Council from MongoDB, in constitutional order (the `order` field). */
export const mongoExecutiveReader: ExecutiveReader = {
  sessions: () => ExecutiveModel.distinct('session'),
  async listBySession(session) {
    const docs = await ExecutiveModel.find({ session }).sort({ order: 1 }).lean<StoredExecutive[]>()
    return docs.map(toExecutiveView)
  },
}
