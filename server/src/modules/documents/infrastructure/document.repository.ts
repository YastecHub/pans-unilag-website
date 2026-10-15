import type { DocumentReader, StoredDocument } from '../application/documentView.js'
import { DocumentModel } from './document.model.js'

export const mongoDocumentReader: DocumentReader = {
  list: () => DocumentModel.find().lean<StoredDocument[]>(),
}
