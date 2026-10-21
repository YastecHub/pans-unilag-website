import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ButtonLink } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { ChevronLeftIcon, ChevronRightIcon } from '../../../components/ui/icons.tsx'
import { Img } from '../../../components/ui/Img.tsx'
import { PlaceholderImage, PlaceholderText } from '../../../components/ui/Placeholder.tsx'
import { Skeleton } from '../../../components/ui/Skeleton.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States.tsx'
import { type Executive, isStandInName, useExecutives } from '../../leadership/api/leadership.ts'
import { HomeSection } from './HomeSection.tsx'

export function LeadershipSection() {
  const query = useExecutives()
  const executives = query.data?.executives ?? []
  const scrollRef = useRef<HTMLUListElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const cardWidth = 340
    const currentScroll = scrollRef.current.scrollLeft
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth

    if (direction === 'right') {
      if (currentScroll >= maxScroll - 10) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' })
      }
    } else {
      if (currentScroll <= 10) {
        scrollRef.current.scrollTo({ left: maxScroll, behavior: 'smooth' })
      } else {
        scrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' })
      }
    }
  }

  // Auto-play moving carousel every 3.5 seconds when not paused
  useEffect(() => {
    if (isPaused || executives.length === 0) return
    const interval = setInterval(() => {
      scroll('right')
    }, 3500)
    return () => clearInterval(interval)
  }, [isPaused, executives.length])

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
        <div
          className="relative flex flex-col gap-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          <div className="flex items-center justify-between">
            <span className="text-small font-medium text-text-muted">
              Auto-playing Executive Council • Hover to pause
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scroll('left')}
                aria-label="Scroll left"
                className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-surface-alt transition-colors"
              >
                <ChevronLeftIcon className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                aria-label="Scroll right"
                className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-surface-alt transition-colors"
              >
                <ChevronRightIcon className="size-5" />
              </button>
            </div>
          </div>

          <ul
            ref={scrollRef}
            aria-label="Executive leadership"
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 scroll-smooth focus:outline-none"
            tabIndex={0}
          >
            {executives.map((exec) => (
              <li key={exec.office} className="w-[18rem] shrink-0 snap-start sm:w-[22rem]">
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
  const isStandIn = isStandInName(e)
  return (
    <Card as="article" className="flex h-full flex-col overflow-hidden bg-surface p-0 shadow-sm">
      {e.photo !== undefined &&
        (e.photo ? (
          <Img publicId={e.photo} alt={`${e.name}, ${e.office}`} width={480} height={320} />
        ) : (
          <div className="p-3 pb-0">
            <PlaceholderImage kind="person" />
          </div>
        ))}
      <div className="flex flex-1 flex-col justify-between p-5 gap-3">
        <div className="flex flex-col gap-2">
          <span className="inline-block w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {e.office}
          </span>
          <h3 className="font-heading text-lg font-semibold text-text">
            {isStandIn ? <PlaceholderText>{e.name}</PlaceholderText> : e.name}
          </h3>
          {e.level && <span className="text-small font-medium text-text-muted">{e.level}</span>}
          {e.bio ? (
            <p className="text-small text-text-muted leading-relaxed whitespace-pre-line">
              {e.bio}
            </p>
          ) : (
            <PlaceholderText>Bio coming soon</PlaceholderText>
          )}
        </div>

        <div className="pt-2 border-t border-border">
          <Link
            to="/leadership/executive-council"
            className="inline-flex items-center gap-1.5 font-heading text-small font-semibold text-text-brand hover:underline"
          >
            Read more
            <ChevronRightIcon className="size-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  )
}
