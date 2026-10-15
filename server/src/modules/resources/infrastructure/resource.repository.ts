import type { ResourceReader, StoredResource } from '../application/resourceView.js'
import { ResourceModel } from './resource.model.js'

export const mongoResourceReader: ResourceReader = {
  list: ({ level, semester }) =>
    ResourceModel.find({
      ...(level ? { level } : {}),
      ...(semester ? { semester } : {}),
    }).lean<StoredResource[]>(),
}
