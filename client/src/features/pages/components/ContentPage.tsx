import type { NavSection } from '../../../app/siteMap.ts'
import { Markdown } from '../../../components/ui/Markdown.tsx'
import { Placeholder } from '../../../components/ui/Placeholder.tsx'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { ApiError } from '../../../lib/http.ts'
import { usePage } from '../api/pages.ts'
import { ArticleRefs } from './ArticleRefs.tsx'
import { InnerPageLayout } from './InnerPageLayout.tsx'

type Props = {
  /** Slug in /api/pages, e.g. "who-we-are". */
  slug: string
  /** Shown while loading and if the page is missing; the API's title replaces it once loaded. */
  title: string
  section: NavSection
}

/**
 * A constitution-derived page (About, Governance…): each section is a heading, sanitised Markdown,
 * and the articles it comes from, so readers can check the constitution.
 */
export function ContentPage({ slug, title, section }: Props) {
  const query = usePage(slug)
  const page = query.data

  return (
    <InnerPageLayout title={page?.title ?? title} section={section}>
      {query.isPending ? (
        <LoadingState label={`Loading ${title}`}>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </LoadingState>
      ) : query.isError ? (
        query.error instanceof ApiError && query.error.code === 'NOT_FOUND' ? (
          // The page hasn't been added to the database yet: missing content, not a failure.
          <Placeholder note="This page’s content will be added soon." />
        ) : (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        )
      ) : (
        <>
          {page?.isPlaceholder && <Placeholder note={page.placeholderNote} />}
          {page?.sections.map((s) => (
            <section
              key={s.heading}
              aria-labelledby={sectionId(s.heading)}
              className="flex flex-col gap-3"
            >
              <h2 id={sectionId(s.heading)} className="text-h3">
                {s.heading}
              </h2>
              <Markdown>{s.bodyMarkdown}</Markdown>
              <ArticleRefs refs={s.articleRefs} />
            </section>
          ))}
        </>
      )}
    </InnerPageLayout>
  )
}

/** "Your rights as a member" → "your-rights-as-a-member", so sections can be linked to. */
function sectionId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
