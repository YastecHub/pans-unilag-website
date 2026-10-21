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
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const cardWidth = container.firstElementChild?.clientWidth ?? 340
    const gap = 20
    const scrollPosition = container.scrollLeft
    const index = Math.round(scrollPosition / (cardWidth + gap))
    setActiveIndex(Math.min(Math.max(0, index), executives.length - 1))
  }

  const scrollToCard = (index: number) => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const cardWidth = container.firstElementChild?.clientWidth ?? 340
    const gap = 20
    container.scrollTo({ left: index * (cardWidth + gap), behavior: 'smooth' })
    setActiveIndex(index)
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const maxIndex = executives.length - 1
    if (direction === 'right') {
      const nextIndex = activeIndex >= maxIndex ? 0 : activeIndex + 1
      scrollToCard(nextIndex)
    } else {
      const prevIndex = activeIndex <= 0 ? maxIndex : activeIndex - 1
      scrollToCard(prevIndex)
    }
  }

  // Auto-play moving carousel every 4 seconds when not paused
  useEffect(() => {
    if (isPaused || executives.length === 0) return
    const interval = setInterval(() => {
      scroll('right')
    }, 4000)
    return () => clearInterval(interval)
  }, [isPaused, activeIndex, executives.length])

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
          <div className="flex gap-5 overflow-hidden">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-80 w-80 shrink-0 rounded-2xl bg-surface" />
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
          {/* Controls Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                2026/2027 Executive Council
              </span>
              <span className="hidden sm:inline text-xs text-text-muted">
                {isPaused ? '• Paused on hover' : '• Auto-sliding'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Pagination indicators */}
              <div className="hidden md:flex items-center gap-1.5 mr-2">
                {executives.map((exec, idx) => (
                  <button
                    key={exec.office}
                    type="button"
                    onClick={() => scrollToCard(idx)}
                    aria-label={`Go to ${exec.office}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-text-muted'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  aria-label="Scroll left"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text shadow-xs hover:border-primary/50 hover:bg-surface-alt hover:text-primary transition-all active:scale-95"
                >
                  <ChevronLeftIcon className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  aria-label="Scroll right"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text shadow-xs hover:border-primary/50 hover:bg-surface-alt hover:text-primary transition-all active:scale-95"
                >
                  <ChevronRightIcon className="size-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Carousel Track */}
          <ul
            ref={scrollRef}
            onScroll={handleScroll}
            aria-label="Executive leadership"
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth focus:outline-none"
            tabIndex={0}
          >
            {executives.map((exec, idx) => (
              <li key={exec.office} className="w-[19rem] shrink-0 snap-start sm:w-[22rem]">
                <LeadershipCard executive={exec} isActive={idx === activeIndex} />
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-text-muted">
              Showing {activeIndex + 1} of {executives.length} executives
            </span>
            <ButtonLink to="/leadership/executive-council" variant="outline">
              Explore full Executive Council & Senate
            </ButtonLink>
          </div>
        </div>
      )}
    </HomeSection>
  )
}

function LeadershipCard({ executive: e, isActive }: { executive: Executive; isActive: boolean }) {
  const isStandIn = isStandInName(e)

  return (
    <Card
      as="article"
      className={`group flex h-full flex-col overflow-hidden bg-surface transition-all duration-300 border hover:border-primary/40 hover:shadow-md ${
        isActive ? 'ring-2 ring-primary/20 border-primary/40 shadow-sm' : 'border-border shadow-xs'
      }`}
    >
      {/* Photo / Avatar Frame */}
      <div className="p-3 pb-0">
        {e.photo !== undefined &&
          (e.photo ? (
            <Img publicId={e.photo} alt={`${e.name}, ${e.office}`} width={480} height={320} />
          ) : (
            <PlaceholderImage kind="person" />
          ))}
      </div>

      {/* Content Body */}
      <div className="flex flex-1 flex-col justify-between p-5 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
              {e.office}
            </span>
            {e.level && (
              <span className="inline-flex items-center rounded-full bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-text-muted border border-border">
                {e.level}
              </span>
            )}
          </div>

          <h3 className="font-heading text-xl font-bold text-text tracking-tight group-hover:text-primary transition-colors mt-1">
            {isStandIn ? <PlaceholderText>{e.name}</PlaceholderText> : e.name}
          </h3>

          {e.bio ? (
            <p className="text-small text-text-muted leading-relaxed line-clamp-5">{e.bio}</p>
          ) : (
            <PlaceholderText>Bio coming soon</PlaceholderText>
          )}
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between">
          <Link
            to="/leadership/executive-council"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark group-hover:translate-x-0.5 transition-all"
          >
            <span>Read more</span>
            <ChevronRightIcon className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </Card>
  )
}
