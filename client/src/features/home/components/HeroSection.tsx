import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import lectureHall from '../../../assets/hero/lecture-hall.webp'
import panelSession from '../../../assets/hero/panel-session.webp'
import pansFamily from '../../../assets/hero/pans-family.webp'
import { Container } from '../../../components/layout/Container.tsx'
import { ButtonLink } from '../../../components/ui/Button.tsx'
import { SITE } from '../../../lib/site.ts'

/**
 * Photos behind the hero, in order. Cropped from the photographer's originals (watermark
 * removed) and saved as WebP under 100 KB each. `position` keeps the people in frame.
 */
const SLIDES = [
  { src: pansFamily, position: '50% 60%', label: 'PANSites together at a faculty event' },
  { src: panelSession, position: '50% 35%', label: 'A panel session' },
  { src: lectureHall, position: '50% 55%', label: 'Students in the lecture hall' },
]
const SLIDE_MS = 6000

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

/**
 * Full name, motto, one-line purpose and the two main ways in (README → Home page sections), on a
 * frosted-glass panel over a slow crossfade of PANS photos.
 *
 * - The photos are decoration (the text says what matters), so screen readers skip them.
 * - A dark brand-coloured wash keeps white and yellow text readable on every photo.
 * - WCAG 2.2.2: there's a visible Pause button, and nothing moves for people whose device asks
 *   for reduced motion.
 */
export function HeroSection() {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(() => !prefersReducedMotion())

  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => setActive((i) => (i + 1) % SLIDES.length), SLIDE_MS)
    return () => clearTimeout(timer)
  }, [playing, active])

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-primary text-on-primary"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {SLIDES.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt=""
            // The first photo is on screen at once; the others load when the browser is idle.
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'low'}
            decoding="async"
            style={{ objectPosition: slide.position }}
            className={`absolute inset-0 size-full object-cover transition-[opacity,transform] duration-[1600ms] ease-out motion-reduce:transition-none ${
              i === active ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
          />
        ))}
        {/* Brand wash: deepest behind the text (left), lighter where the photo shows (right). */}
        <div className="absolute inset-0 bg-linear-to-r from-primary/95 via-primary/80 to-navy/55" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-navy/60 to-transparent" />
      </div>

      <Container className="flex min-h-[34rem] flex-col justify-center gap-8 py-16 lg:min-h-[38rem] lg:py-24">
        <div className="flex max-w-[44rem] flex-col gap-5 rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md sm:p-10">
          <p className="font-heading text-sm font-medium tracking-[0.12em] uppercase">
            {SITE.shortName} · Faculty of Pharmacy
          </p>
          <h1 id="hero-title">{SITE.name}</h1>
          {/*
            Yellow on dark green is 4.3:1, allowed only for large text (README → brand), so the
            motto never drops below 24px, WCAG's large size for normal weight.
          */}
          <p className="font-heading text-[length:max(1.5rem,var(--text-h3))] leading-tight font-medium text-accent">
            {SITE.motto}
          </p>
          <p className="max-w-[40rem]">{SITE.purpose}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink to="/about" variant="accent">
              About PANS
            </ButtonLink>
            {/* White outline on green: no shared variant for this, so it is styled here. */}
            <Link
              to="/about/impact"
              className="inline-flex min-h-12 items-center rounded-lg border-2 border-white px-6 font-heading font-medium text-white no-underline hover:bg-navy"
            >
              Read our impact reports
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 py-1 pr-1 pl-3 backdrop-blur-md sm:self-end">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1} of ${SLIDES.length}: ${slide.label}`}
              aria-current={i === active ? 'true' : undefined}
              className="inline-flex size-6 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={`h-1.5 rounded-full bg-white transition-all duration-300 ${
                  i === active ? 'w-6' : 'w-1.5 opacity-60'
                }`}
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="ml-1 inline-flex min-h-11 items-center rounded-full px-3 text-xs font-semibold text-white hover:bg-white/15"
          >
            {playing ? 'Pause photos' : 'Play photos'}
          </button>
        </div>
      </Container>
    </section>
  )
}
