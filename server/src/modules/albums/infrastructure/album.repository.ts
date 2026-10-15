import type { AlbumReader, StoredAlbum } from '../application/albumView.js'
import { AlbumModel } from './album.model.js'

export const mongoAlbumReader: AlbumReader = {
  // Cards only need the photo count; the folder link and consent flag stay out of the list.
  list: ({ series }) =>
    AlbumModel.find(series ? { series } : {})
      .select('-sourceFolderUrl -consentConfirmed')
      .lean<StoredAlbum[]>(),
  findBySlug: (slug) =>
    AlbumModel.findOne({ slug }).select('-consentConfirmed').lean<StoredAlbum>(),
}
