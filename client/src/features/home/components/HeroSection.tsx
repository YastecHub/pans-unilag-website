import { Link } from 'react-router'
import badgeUrl from '../../../assets/pans-badge.png'
import { Container } from '../../../components/layout/Container.tsx'
import { ButtonLink } from '../../../components/ui/Button.tsx'
import { SITE } from '../../../lib/site.ts'

/** Full name, motto, one-line purpose and the two main ways in (README → Home page sections). */
export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="bg-primary text-on-primary">
      <Container className="flex flex-wrap items-center gap-12 py-16 lg:py-24">
        <div className="flex min-w-0 flex-[1_1_32rem] flex-col gap-5">
          <p className="font-heading text-sm font-medium tracking-[0.12em] uppercase">
            {SITE.shortName} · Faculty of Pharmacy
          </p>
          <h1 id="hero-title">{SITE.name}</h1>
          <p className="font-heading text-h3 font-medium text-accent">{SITE.motto}</p>
          <p className="max-w-[40rem]">{SITE.purpose}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink to="/about" variant="accent">
              About PANS
            </ButtonLink>
            {/* White outline on green: no shared variant for this, so it is styled here. */}
            <Link
              to="/events"
              className="inline-flex min-h-12 items-center rounded-lg border-2 border-white px-6 font-heading font-medium text-white no-underline hover:bg-navy"
            >
              See events
            </Link>
          </div>
        </div>
        <div className="hidden size-72 shrink-0 items-center justify-center rounded-full bg-surface-alt md:flex">
          {/* Shown on first load: not lazy. 200 px PNG keeps the page light. */}
          <img src={badgeUrl} alt="" width={200} height={200} className="size-50" />
        </div>
      </Container>
    </section>
  )
}
