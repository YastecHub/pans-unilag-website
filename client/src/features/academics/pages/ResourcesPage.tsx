import { Link, useSearchParams } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { Placeholder } from '../../../components/ui/Placeholder.tsx'
import { SkeletonCard } from '../../../components/ui/Skeleton.tsx'
import { ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import {
  groupResources,
  isLevel,
  type Level,
  type LevelGroup,
  LEVELS,
  type Resource,
  useResources,
} from '../resources/api.ts'

/** /academics/resources?level=300L: vetted links by level and semester. */
export function ResourcesPage() {
  const [params] = useSearchParams()
  const requested = params.get('level')
  const level = isLevel(requested) ? requested : null
  const query = useResources()

  return (
    <InnerPageLayout
      title="Academic resources"
      section={navSection('Academics')}
      intro="Free, legal study links for each level and semester, checked by the Academics Committee."
      wide
    >
      <p className="rounded-lg border-l-4 border-primary-border bg-surface-alt p-4 text-small">
        We only list free and legal material: course outlines, open courseware, official guidelines
        and similar. We never host or link to copyrighted textbooks. Spotted a broken or
        questionable link? <Link to="/connect/feedback">Tell us</Link>.
      </p>

      <LevelFilter selected={level} />

      {query.isPending ? (
        <LoadingState label="Loading resources">
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </LoadingState>
      ) : query.isError ? (
        <ErrorState
          title="We couldn’t load resources."
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : (
        groupResources(query.data)
          .filter((g) => !level || g.level === level)
          .map((group) => <LevelSection key={group.level} group={group} />)
      )}
    </InnerPageLayout>
  )
}

/** Level filter in the URL, so a reload or a shared link keeps it. */
function LevelFilter({ selected }: { selected: Level | null }) {
  const chip = (active: boolean) =>
    `inline-flex min-h-10 items-center rounded-full border-2 px-4 text-small font-medium no-underline ${
      active
        ? 'border-primary-border bg-primary text-on-primary'
        : 'border-border text-text-brand hover:border-border-strong'
    }`
  const options: { label: string; level: Level | null }[] = [
    { label: 'All levels', level: null },
    ...LEVELS.map((l) => ({ label: l, level: l })),
  ]
  return (
    <nav aria-label="Filter by level">
      <ul className="flex flex-wrap gap-2">
        {options.map((o) => (
          <li key={o.label}>
            <Link
              to={{ search: o.level ? `?level=${o.level}` : '' }}
              aria-current={selected === o.level ? 'page' : undefined}
              className={chip(selected === o.level)}
            >
              {o.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function LevelSection({ group }: { group: LevelGroup }) {
  const id = `level-${group.level}`
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-h3">
        {group.level}
      </h2>
      {group.count === 0 ? (
        // Nothing for this level yet (README → Placeholder rules: say what will appear).
        <Placeholder note={`${group.level} resources coming soon, from the Academics Committee.`} />
      ) : (
        group.semesters.map((s) => (
          <section
            key={s.semester}
            aria-labelledby={`${id}-${s.semester}`}
            className="flex flex-col gap-3"
          >
            <h3 id={`${id}-${s.semester}`} className="text-[1.125rem]">
              {s.label}
            </h3>
            {s.resources.length === 0 ? (
              <p className="text-small text-text-muted">
                {group.level} {s.label.toLowerCase()} resources coming soon.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {s.resources.map((r) => (
                  <li key={r.id || r.url}>
                    <ResourceCard resource={r} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </section>
  )
}

const host = (url: string) => new URL(url).hostname.replace(/^www\./, '')

function ResourceCard({ resource: r }: { resource: Resource }) {
  return (
    <article className="flex h-full flex-col gap-1 rounded-xl border border-border bg-surface p-4">
      {r.course && <span className="text-small font-medium text-text-brand">{r.course}</span>}
      <h4 className="font-heading text-base font-medium">
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${r.title} (opens ${host(r.url)} in a new tab)`}
        >
          {r.title}
        </a>
      </h4>
      {r.description && <p className="text-small">{r.description}</p>}
      <p className="mt-auto pt-1 text-small text-text-muted">
        {host(r.url)}
        {r.verifiedBy && ` · Checked by ${r.verifiedBy}`}
      </p>
    </article>
  )
}
