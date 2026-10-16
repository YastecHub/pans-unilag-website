import type { ReactNode } from 'react'
import { useParams } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { Badge } from '../../../components/ui/Badge.tsx'
import { ButtonAnchor, ButtonLink } from '../../../components/ui/Button.tsx'
import { Markdown } from '../../../components/ui/Markdown.tsx'
import { Placeholder } from '../../../components/ui/Placeholder.tsx'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { formatDate } from '../../../lib/dates.ts'
import { ApiError } from '../../../lib/http.ts'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import { isOpen, OPPORTUNITY_TYPE_LABELS, useOpportunity } from '../api/opportunities.ts'
import { usePageMeta } from '../../../lib/usePageMeta.ts'
import { Deadline } from '../components/Deadline.tsx'
import { HubAside } from '../components/HubAside.tsx'

const section = () => navSection('Opportunities')

/** "forms.gle", so people know where Apply takes them. */
const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** /opportunities/:slug: who it's for, the deadline, the details and the official link. */
export function OpportunityPage() {
  const { slug = '' } = useParams()
  const query = useOpportunity(slug)
  const o = query.data

  usePageMeta({
    title: o?.title,
    description: o?.description
      ? o.description.slice(0, 160).trim().replace(/\n+/g, ' ')
      : o
        ? `${o.title} · PANS UNILAG`
        : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  })

  // The API returns 404 for closed listings; a page left open past midnight is closed too.
  const closed =
    (query.error instanceof ApiError && query.error.code === 'NOT_FOUND') ||
    (query.isSuccess && (!o || !isOpen(o)))

  if (query.isPending || query.isError || closed || !o) {
    return (
      <InnerPageLayout
        title={closed ? 'Opportunity closed' : 'Opportunity'}
        section={section()}
        aside={<HubAside />}
      >
        {query.isPending ? (
          <LoadingState label="Loading the opportunity">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="mt-3 h-24" />
          </LoadingState>
        ) : closed ? (
          <div className="flex flex-col items-start gap-4">
            <p>This opportunity has closed or been removed. Have a look at what’s open now.</p>
            <ButtonLink to="/opportunities" variant="outline">
              See open opportunities
            </ButtonLink>
          </div>
        ) : (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        )}
      </InnerPageLayout>
    )
  }

  return (
    <InnerPageLayout
      title={o.title}
      section={section()}
      eyebrow={OPPORTUNITY_TYPE_LABELS[o.type]}
      intro={o.organisation || undefined}
      aside={<HubAside />}
    >
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
        <Fact label="Deadline">
          <Deadline opportunity={o} />
        </Fact>
        <Fact label="Type">
          <Badge>{OPPORTUNITY_TYPE_LABELS[o.type]}</Badge>
        </Fact>
        {o.organisation && <Fact label="Offered by">{o.organisation}</Fact>}
        {o.eligibility && <Fact label="Who can apply">{o.eligibility}</Fact>}
      </dl>

      {o.applyUrl && (
        <div>
          <ButtonAnchor href={o.applyUrl} target="_blank" rel="noopener noreferrer">
            Apply on the official site{' '}
            <span className="sr-only">
              ({host(o.applyUrl) ? `${host(o.applyUrl)}, ` : ''}opens in a new tab)
            </span>
          </ButtonAnchor>
          {host(o.applyUrl) && (
            <p className="mt-2 text-small text-text-muted">Opens {host(o.applyUrl)}</p>
          )}
        </div>
      )}

      {o.description ? (
        <Markdown>{o.description}</Markdown>
      ) : (
        <Placeholder
          title="Details coming soon"
          note={o.placeholderNote || 'Check the official site for the full details.'}
        />
      )}

      {o.lastCheckedAt && (
        <p className="text-small text-text-muted">
          Details last checked on{' '}
          <time dateTime={o.lastCheckedAt}>{formatDate(o.lastCheckedAt)}</time>. Always confirm on
          the official site before applying.
        </p>
      )}
    </InnerPageLayout>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="font-heading font-medium text-text-muted">{label}</dt>
      <dd className="flex flex-wrap items-center gap-y-1">{children}</dd>
    </>
  )
}
