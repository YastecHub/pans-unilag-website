import { Link } from 'react-router'
import badgeUrl from '../../../assets/pans-badge.png'
import { Container } from '../../../components/layout/Container.tsx'
import { SITE } from '../../../lib/site.ts'
import { usePageTitle } from '../../../lib/usePageTitle.ts'

/** Temporary home page: the hero only. The full home page is built in issue #25. */
export function HomePage() {
  usePageTitle()
  return (
    <section aria-labelledby="hero-title" className="bg-primary text-on-primary">
      <Container className="flex flex-wrap items-center gap-12 py-16 lg:py-24">
        <div className="flex min-w-0 flex-[1_1_32rem] flex-col gap-5">
          <p className="font-heading text-sm font-medium tracking-[0.12em] uppercase">
            {SITE.shortName} · Faculty of Pharmacy
          </p>
          <h1 id="hero-title">{SITE.name}</h1>
          <p className="font-heading text-h3 font-medium text-accent">{SITE.motto}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/about"
              className="inline-flex min-h-12 items-center rounded-lg bg-accent px-6 font-heading font-medium text-on-accent no-underline"
            >
              About PANS
            </Link>
            <Link
              to="/events"
              className="inline-flex min-h-12 items-center rounded-lg border-2 border-white px-6 font-heading font-medium text-white no-underline"
            >
              See events
            </Link>
          </div>
        </div>
        <div className="hidden size-72 shrink-0 items-center justify-center rounded-full bg-surface-alt md:flex">
          <img src={badgeUrl} alt="" width={200} height={200} className="size-50" />
        </div>
      </Container>
    </section>
  )
}
