import type { PublicationReader, StoredPublication } from '../application/publicationView.js'
import { PublicationModel } from './publication.model.js'

export const mongoPublicationReader: PublicationReader = {
  list: ({ series }) => PublicationModel.find(series ? { series } : {}).lean<StoredPublication[]>(),
}
