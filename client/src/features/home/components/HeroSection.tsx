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
  { src: pansFamily, position: '50% 60%' },
  { src: panelSession, position: '50% 35%' },
  { src: lectureHall, position: '50% 55%' },
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
 * - Nothing moves for people whose device asks for reduced motion.
 */
export function HeroSection() {
  const [active, setActive] = useState(0)
  // Nothing moves for people whose device asks for reduced motion.
  const [playing] = useState(() => !prefersReducedMotion())

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
        {/*
          Brand wash. Phones: an even, lighter green so the photo shows through behind the text.
          Larger screens: deepest behind the text (left), lighter where the photo shows (right).
        */}
        <div className="absolute inset-0 bg-primary/50 sm:bg-transparent sm:bg-linear-to-r sm:from-primary/95 sm:via-primary/80 sm:to-navy/55" />
        <div className="absolute inset-x-0 bottom-0 hidden h-1/3 bg-linear-to-t from-navy/60 to-transparent sm:block" />
      </div>

      <Container className="flex flex-col justify-center py-10 sm:min-h-[34rem] sm:py-16 lg:min-h-[38rem] lg:py-24">
        {/*
          Phones: the glass runs edge to edge (the text keeps its full width) with a light blur, so
          the photo stays visible; a soft shadow keeps the text crisp over it.
        */}
        <div className="-mx-4 flex max-w-[44rem] flex-col gap-5 border-y border-white/15 bg-primary/30 px-4 py-8 backdrop-blur-[3px] [text-shadow:0_1px_3px_rgb(0_0_0/0.5)] sm:mx-0 sm:bg-white/10 sm:backdrop-blur-md sm:[text-shadow:none] sm:rounded-3xl sm:border sm:border-white/20 sm:p-10 sm:shadow-2xl">
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
          {/* Phones: two equal buttons on one line (the second with a shorter label). */}
          <div className="grid grid-cols-2 gap-3 pt-2 sm:flex sm:flex-wrap">
            <ButtonLink to="/about" variant="accent" className="justify-center">
              About PANS
            </ButtonLink>
            {/* White outline on green: no shared variant for this, so it is styled here. */}
            <Link
              to="/about/impact"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-white px-4 font-heading font-medium text-white no-underline hover:bg-navy sm:px-6"
            >
              <span className="sm:hidden">Our impact</span>
              <span className="hidden sm:inline">Read our impact reports</span>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
