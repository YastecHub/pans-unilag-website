import type { ContentFields } from '../../../lib/contentPlugin.js'
import { type PlaceholderView, placeholderView } from '../../../lib/publicView.js'

/** What the public API returns for one page. Built from the stored document so internal fields never leak. */
export type PageView = PlaceholderView & {
  slug: string
  title: string
  order: number
  sections: { heading: string; bodyMarkdown: string; articleRefs: string[] }[]
  /** ISO date-time of the last edit, for "Last updated" lines. */
  updatedAt?: string
}

/** The stored fields toPageView reads (a lean Mongoose document or a seed entry). */
export type StoredPage = Pick<PageView, 'slug' | 'title' | 'order'> &
  Partial<Pick<ContentFields, 'isPlaceholder' | 'placeholderNote' | 'updatedAt'>> & {
    sections: { heading: string; bodyMarkdown: string; articleRefs?: string[] }[]
  }

export function toPageView(page: StoredPage): PageView {
  return {
    slug: page.slug,
    title: page.title,
    order: page.order,
    sections: page.sections.map(({ heading, bodyMarkdown, articleRefs }) => ({
      heading,
      bodyMarkdown,
      articleRefs: articleRefs ?? [],
    })),
    ...placeholderView(page),
    ...(page.updatedAt ? { updatedAt: new Date(page.updatedAt).toISOString() } : {}),
  }
}

/** Where pages are read from. MongoDB in the app; an in-memory list in tests. */
export type PageReader = {
  findBySlug(slug: string): Promise<PageView | null>
}
