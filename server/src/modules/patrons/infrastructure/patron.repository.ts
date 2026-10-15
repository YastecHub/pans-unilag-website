import { type PatronReader, type StoredPatron, toPatronView } from '../application/patronView.js'
import { PatronModel } from './patron.model.js'

export const mongoPatronReader: PatronReader = {
  async list() {
    const docs = await PatronModel.find().sort({ order: 1 }).lean<StoredPatron[]>()
    return docs.map(toPatronView)
  },
}
