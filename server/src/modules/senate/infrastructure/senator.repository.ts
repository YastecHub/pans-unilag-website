import {
  type SenatorReader,
  type StoredSenator,
  toSenatorView,
} from '../application/senatorView.js'
import { SenatorModel } from './senator.model.js'

/** Reads the Senate principal officers from MongoDB, in order (Senate President first). */
export const mongoSenatorReader: SenatorReader = {
  sessions: () => SenatorModel.distinct('session'),
  async listBySession(session) {
    const docs = await SenatorModel.find({ session }).sort({ order: 1 }).lean<StoredSenator[]>()
    return docs.map(toSenatorView)
  },
}
