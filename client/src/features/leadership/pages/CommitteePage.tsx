import { Link, useParams } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { ButtonLink } from '../../../components/ui/Button.tsx'
import { Markdown } from '../../../components/ui/Markdown.tsx'
import { Placeholder, PlaceholderImage } from '../../../components/ui/Placeholder.tsx'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { ApiError } from '../../../lib/http.ts'
import {
  type Committee,
  shortSession,
  useCommittee,
  useCommittees,
} from '../../committees/api/committees.ts'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import { firstSentence } from '../components/text.ts'

const leadership = () => navSection('Leadership')
const trail = [{ label: 'Committees', to: '/leadership/committees' }]

/** /leadership/committees/:slug: write-up, activities, highlights, plans, officers. */
export function CommitteePage() {
  const { slug = '' } = useParams()
  const query = useCommittee(slug)

  if (query.isPending || query.isError) {
    const notFound = query.error instanceof ApiError && query.error.code === 'NOT_FOUND'
    return (
      <InnerPageLayout
        title={notFound ? 'Committee not found' : 'Committee'}
        section={leadership()}
        trail={trail}
      >
        {query.isPending ? (
          <LoadingState label="Loading the committee">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="mt-3 h-24" />
          </LoadingState>
        ) : notFound ? (
          <div className="flex flex-col items-start gap-4">
            <p>We couldn’t find that committee. It may have been renamed.</p>
            <ButtonLink to="/leadership/committees" variant="outline">
              See all committees
            </ButtonLink>
          </div>
        ) : (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        )}
      </InnerPageLayout>
    )
  }

  const c = query.data
  return (
    <InnerPageLayout
      title={c.name}
      section={leadership()}
      trail={trail}
      eyebrow={`Committee · ${shortSession(c.session)}`}
      intro={c.description ? firstSentence(c.description) : undefined}
      aside={<CommitteeAside committee={c} />}
    >
      {c.isPlaceholder && !c.description ? (
        <Placeholder
          title="Write-up coming soon"
          note={
            c.placeholderNote ??
            'This committee’s description, activities and plans will appear here.'
          }
        />
      ) : (
        <>
          <Block title="About">
            <Markdown>{c.description}</Markdown>
          </Block>
          <ListBlock title="What we do" items={c.activities} />
          <ListBlock title="Highlights" items={c.achievements} />
          <ListBlock title="Looking ahead" items={c.plans} />
        </>
      )}
      <Block title="Photos">
        <PlaceholderImage kind="badge" aspectRatio="16 / 7" label="Committee photos coming soon" />
      </Block>
      {c.motto && (
        <blockquote className="rounded-xl border-l-4 border-accent bg-surface-alt p-5 font-heading text-[1.25rem] font-medium">
          “{c.motto}”
        </blockquote>
      )}
    </InnerPageLayout>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  )
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <Block title={title}>
      <ul className="list-disc space-y-1 pl-6">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Block>
  )
}

/** Officers of this committee, then links to the others. */
function CommitteeAside({ committee: c }: { committee: Committee }) {
  const all = useCommittees()
  const others = all.data?.committees.filter((o) => o.slug !== c.slug) ?? []
  return (
    <>
      <section aria-labelledby="officers-title" className="flex flex-col gap-3">
        <h2 id="officers-title" className="text-[1.25rem]">
          Officers {shortSession(c.session)}
        </h2>
        {c.officers.length === 0 ? (
          <Placeholder note="Officers to be announced." />
        ) : (
          <ul className="flex flex-col gap-3">
            {c.officers.map((o) => (
              <li key={`${o.title}-${o.name}`} className="flex items-center gap-3">
                <PlaceholderImage
                  kind="person"
                  aspectRatio="1 / 1"
                  label="Photo coming soon"
                  className="w-16 shrink-0 [&_span]:hidden [&_svg]:size-8"
                />
                <div className="flex flex-col">
                  <span className="text-small text-text-muted">{o.title}</span>
                  <span className="font-medium">{o.name}</span>
                  {o.level && <span className="text-small text-text-muted">{o.level}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {others.length > 0 && (
        <nav aria-label="Other committees" className="flex flex-col gap-2">
          <h2 className="text-[1.25rem]">Other committees</h2>
          <ul className="flex flex-col gap-1">
            {others.map((o) => (
              <li key={o.slug}>
                <Link to={`/leadership/committees/${o.slug}`}>{o.shortName}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  )
}
