import type { EventReader, StoredEvent } from '../application/eventView.js'
import { EventModel } from './event.model.js'

export const mongoEventReader: EventReader = {
  list: ({ series }) => EventModel.find(series ? { series } : {}).lean<StoredEvent[]>(),
  findBySlug: (slug) => EventModel.findOne({ slug }).lean<StoredEvent>(),
}
