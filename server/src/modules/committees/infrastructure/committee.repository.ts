import {
  type CommitteeReader,
  type StoredCommittee,
  toCommitteeView,
} from '../application/committeeView.js'
import { CommitteeModel } from './committee.model.js'

export const mongoCommitteeReader: CommitteeReader = {
  sessions: () => CommitteeModel.distinct('session'),
  async listBySession(session) {
    const docs = await CommitteeModel.find({ session }).sort({ order: 1 }).lean<StoredCommittee[]>()
    return docs.map(toCommitteeView)
  },
  async findBySlug(slug) {
    const doc = await CommitteeModel.findOne({ slug }).lean<StoredCommittee>()
    return doc ? toCommitteeView(doc) : null
  },
}
