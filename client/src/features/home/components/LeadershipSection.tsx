import { useCallback, useEffect, useRef, useState } from 'react'
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

const GAP_PX = 20
const SLIDE_MS = 5000

/** Visitors who ask their device for less motion get no auto-sliding or smooth scrolling. */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

/**
 * The 2026/2027 Executive Council as a carousel: one card per office, in constitutional order.
 * A card without a photo shows the photo placeholder until one is added in the dashboard
 * (Content → Executive Council → Photo).
 *
 * Accessibility (WCAG 2.2.2): it slides by itself only while nobody is pointing at it or
 * focused inside it, never when the device asks for reduced motion, and there's always a
 * visible Pause button. Previous/next and the dots move one card at a time.
 */
export function LeadershipSection() {
  const query = useExecutives()
  // Only the officers whose details have been published; offices still to be filled stay off the slider.
  const executives = (query.data?.executives ?? []).filter((e) => !e.isPlaceholder)
  const count = executives.length
  const scrollRef = useRef<HTMLUListElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(() => !prefersReducedMotion())
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const sliding = playing && !hovered && !focused && count > 1

  const goTo = useCallback((index: number) => {
    const container = scrollRef.current
    if (!container) return
    const cardWidth = container.firstElementChild?.clientWidth ?? 340
    container.scrollTo?.({
      left: index * (cardWidth + GAP_PX),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
    setActiveIndex(index)
  }, [])

  const step = (by: 1 | -1) => goTo((activeIndex + by + count) % count)

  useEffect(() => {
    if (!sliding) return
    const timer = setTimeout(() => goTo((activeIndex + 1) % count), SLIDE_MS)
    return () => clearTimeout(timer)
  }, [sliding, activeIndex, count, goTo])

  // Swiping or scrolling by hand moves the dots too.
  const onScroll = () => {
    const container = scrollRef.current
    if (!container || count === 0) return
    const cardWidth = container.firstElementChild?.clientWidth ?? 340
    const index = Math.round(container.scrollLeft / (cardWidth + GAP_PX))
    setActiveIndex(Math.min(Math.max(0, index), count - 1))
  }

  return (
    <HomeSection
      id="leadership"
      title="PANS Leadership 26/27"
      intro="Meet the Executive Council serving PANSites in the 2026/2027 session, in constitutional order."
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
      ) : count === 0 ? (
        <EmptyState
          title="Leadership for the 2026/27 session will be announced soon."
          className="bg-surface"
        />
      ) : (
        <section
          aria-roledescription="carousel"
          aria-label="2026/2027 Executive Council"
          className="relative flex flex-col gap-6"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-text-brand">
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full bg-primary ${sliding ? 'motion-safe:animate-pulse' : ''}`}
                />
                2026/2027 Executive Council
              </span>
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="inline-flex min-h-11 items-center rounded-full px-3 text-xs font-semibold text-text-brand underline-offset-4 hover:underline"
              >
                {playing ? 'Pause slideshow' : 'Play slideshow'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center md:flex">
                {executives.map((exec, idx) => (
                  <button
                    key={exec.office}
                    type="button"
                    onClick={() => goTo(idx)}
                    aria-label={`Show ${exec.office}`}
                    aria-current={idx === activeIndex ? 'true' : undefined}
                    className="group/dot inline-flex size-6 items-center justify-center"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === activeIndex
                          ? 'w-5 bg-primary'
                          : 'w-2 bg-border-strong group-hover/dot:bg-text-muted'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous executive"
                  className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-text shadow-xs transition-all hover:border-primary/50 hover:bg-surface-alt hover:text-text-brand active:scale-95"
                >
                  <ChevronLeftIcon className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next executive"
                  className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-text shadow-xs transition-all hover:border-primary/50 hover:bg-surface-alt hover:text-text-brand active:scale-95"
                >
                  <ChevronRightIcon className="size-5" />
                </button>
              </div>
            </div>
          </div>

          <ul
            ref={scrollRef}
            onScroll={onScroll}
            aria-label="Executive Council members"
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pt-1 pb-4 motion-safe:scroll-smooth"
            tabIndex={0}
          >
            {executives.map((exec, idx) => (
              <li
                key={exec.office}
                aria-roledescription="slide"
                aria-label={`${idx + 1} of ${count}: ${exec.office}`}
                className="w-[19rem] shrink-0 snap-start sm:w-[22rem]"
              >
                <LeadershipCard executive={exec} isActive={idx === activeIndex} />
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {/* Announced only when someone moves it, not on every automatic slide. */}
            <span aria-live={sliding ? 'off' : 'polite'} className="text-xs text-text-muted">
              Showing {activeIndex + 1} of {count}: {executives[activeIndex]?.office}
            </span>
            <ButtonLink to="/leadership/executive-council" variant="outline">
              Explore full Executive Council & Senate
            </ButtonLink>
          </div>
        </section>
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
        {/* The official photo once it's added in the dashboard; until then, a placeholder. */}
        {e.photo ? (
          <Img publicId={e.photo} alt={`${e.name}, ${e.office}`} width={480} height={360} />
        ) : (
          <PlaceholderImage kind="person" label={`Photo of ${e.name} coming soon`} />
        )}
      </div>

      {/* Content Body */}
      <div className="flex flex-1 flex-col justify-between p-5 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-text-brand border border-primary/20">
              {e.office}
            </span>
            {e.level && (
              <span className="inline-flex items-center rounded-full bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-text-muted border border-border">
                {e.level}
              </span>
            )}
          </div>

          <h3 className="font-heading text-xl font-bold text-text tracking-tight group-hover:text-text-brand transition-colors mt-1">
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
            aria-label={`Read more about ${e.name}`}
            className="inline-flex min-h-11 items-center gap-1.5 text-xs font-bold text-text-brand underline-offset-4 hover:underline"
          >
            <span>Read more</span>
            <ChevronRightIcon className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </Card>
  )
}
