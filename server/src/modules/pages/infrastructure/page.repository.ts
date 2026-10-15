import { type PageReader, type StoredPage, toPageView } from '../application/pageView.js'
import { PageModel } from './page.model.js'

/** Reads pages from MongoDB. */
export const mongoPageReader: PageReader = {
  async findBySlug(slug) {
    const page = await PageModel.findOne({ slug }).lean<StoredPage>()
    return page ? toPageView(page) : null
  },
}
