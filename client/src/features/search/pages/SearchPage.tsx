import { Link, useSearchParams } from 'react-router'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import { groupHits, normaliseQuery, QUERY_MIN, type SearchHit, useSearch } from '../api.ts'
import { SearchForm } from '../components/SearchForm.tsx'

/** /search is a page of its own, not part of a menu section. */
const SECTION = { label: 'Search', to: '/search' }

/** /search?q=…: results from GET /api/search, grouped by type. */
export function SearchPage() {
  const [params] = useSearchParams()
  const q = normaliseQuery(params.get('q') ?? '')
  const query = useSearch(q)

  return (
    <InnerPageLayout
      title={q ? `Search results for “${q}”` : 'Search'}
      section={SECTION}
      aside={<SearchTips />}
    >
      {/* Remounts when the query changes, so the box always shows the current search. */}
      <SearchForm key={q} id="search-page-q" initialQuery={q} />

      {!q ? (
        <p>
          Type a word or two, then press Enter. For example, “Pharmathon”, “internship” or “ADMAP”.
        </p>
      ) : q.length < QUERY_MIN ? (
        <p role="status">Please type at least {QUERY_MIN} characters.</p>
      ) : query.isPending ? (
        <LoadingState label={`Searching for ${q}`}>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </LoadingState>
      ) : query.isError ? (
        <ErrorState
          title="We couldn’t search just now."
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <EmptyState
          title={`No results for “${q}”.`}
          description="Try a different or shorter word. Search matches whole words, so try “pharmacy” rather than “pharm”."
          action={<Link to="/">Go to the home page</Link>}
        />
      ) : (
        <Results q={q} hits={query.data} />
      )}
    </InnerPageLayout>
  )
}

function Results({ q, hits }: { q: string; hits: SearchHit[] }) {
  const groups = groupHits(hits)
  return (
    <>
      <p role="status" className="text-small text-text-muted">
        {hits.length} {hits.length === 1 ? 'result' : 'results'} for “{q}”
      </p>
      {groups.map((group) => (
        <section
          key={group.type}
          aria-labelledby={`results-${group.type}`}
          className="flex flex-col gap-3"
        >
          <h2 id={`results-${group.type}`} className="text-h3">
            {group.label}{' '}
            <span className="text-small font-normal text-text-muted">({group.hits.length})</span>
          </h2>
          <ol className="flex flex-col gap-3">
            {group.hits.map((hit) => (
              <li
                key={`${hit.url}-${hit.title}`}
                className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4"
              >
                <Link to={hit.url} className="font-heading text-[1.125rem] font-medium">
                  {hit.title}
                </Link>
                {hit.summary && <p className="text-small">{hit.summary}</p>}
                {hit.externalUrl && (
                  <a
                    href={hit.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${hit.title} (opens in a new tab)`}
                    className="self-start text-small"
                  >
                    Open the resource
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  )
}

function SearchTips() {
  return (
    <section aria-labelledby="search-tips-title" className="flex flex-col gap-2">
      <h2 id="search-tips-title" className="text-[1.25rem]">
        What search covers
      </h2>
      <p className="text-small">
        Events, open opportunities, publications, academic resources and committees. Pages still
        waiting for their content aren’t included yet.
      </p>
      <p className="text-small">
        Tip: press <kbd className="rounded border border-border-strong px-1">/</kbd> on any page to
        open search.
      </p>
    </section>
  )
}
