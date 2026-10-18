import { useRef } from 'react'
import { Link } from 'react-router'
import { ButtonLink } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { ChevronLeftIcon, ChevronRightIcon } from '../../../components/ui/icons.tsx'
import { PlaceholderText } from '../../../components/ui/Placeholder.tsx'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { type Executive, useExecutives } from '../../leadership/api/leadership.ts'
import { HomeSection } from './HomeSection.tsx'

export function LeadershipSection() {
  const query = useExecutives()
  const executives = query.data?.executives ?? []
  const scrollRef = useRef<HTMLUListElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const offset = direction === 'left' ? -320 : 320
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <HomeSection
      id="leadership"
      title="PANS Leadership 26/27"
      intro="Meet the executive officers elected to steer the 2026/2027 parliamentary session in constitutional order."
      tone="alt"
      link={{ to: '/leadership/executive-council', label: 'All leaders' }}
    >
      {query.isPending ? (
        <LoadingState label="Loading leadership">
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-56 w-72 shrink-0 rounded-2xl bg-surface" />
            ))}
          </div>
        </LoadingState>
      ) : query.isError ? (
        <ErrorState
          title="We couldn’t load the leadership."
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : executives.length === 0 ? (
        <EmptyState
          title="Leadership for the 2026/27 session will be announced soon."
          className="bg-surface"
        />
      ) : (
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-surface-alt"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-surface-alt"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          </div>

          <ul
            ref={scrollRef}
            aria-label="Executive leadership"
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 scroll-smooth focus:outline-none"
            tabIndex={0}
          >
            {executives.map((exec) => (
              <li key={exec.office} className="w-[18rem] shrink-0 snap-start sm:w-[20rem]">
                <LeadershipCard executive={exec} />
              </li>
            ))}
          </ul>

          <div>
            <ButtonLink to="/leadership/executive-council" variant="outline">
              Explore full Executive Council & Senate
            </ButtonLink>
          </div>
        </div>
      )}
    </HomeSection>
  )
}

function LeadershipCard({ executive: e }: { executive: Executive }) {
  return (
    <Card as="article" className="flex h-full flex-col justify-between bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-2">
        <span className="inline-block w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {e.office}
        </span>
        <h3 className="font-heading text-lg font-semibold text-text">
          {e.name || <PlaceholderText>Name to be announced</PlaceholderText>}
        </h3>
        {e.level && <span className="text-small font-medium text-text-muted">{e.level}</span>}
        {e.bio && <p className="line-clamp-3 text-small text-text-muted">{e.bio}</p>}
      </div>

      <div className="pt-4">
        <Link
          to="/leadership/executive-council"
          className="inline-flex items-center gap-1.5 font-heading text-small font-semibold text-text-brand hover:underline"
        >
          Read more
          <ChevronRightIcon className="size-3.5" />
        </Link>
      </div>
    </Card>
  )
}
