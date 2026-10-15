import type { AnnouncementReader, StoredAnnouncement } from '../application/announcementView.js'
import { AnnouncementModel } from './announcement.model.js'

export const mongoAnnouncementReader: AnnouncementReader = {
  // Pre-filter in the database; activeAnnouncements applies the same rule again.
  list: (now) =>
    AnnouncementModel.find({
      publishAt: { $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).lean<StoredAnnouncement[]>(),
}
