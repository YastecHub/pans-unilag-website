import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Container } from '../../../components/layout/Container.tsx'
import { ArrowRightIcon } from '../../../components/ui/icons.tsx'

type Props = {
  /** Used for the heading id (`<id>-title`) the section is labelled by. */
  id: string
  title: string
  /** One line under the heading. */
  intro?: ReactNode
  /** "See all" link in the section header. */
  link?: { to: string; label: string }
  /** "alt": the pale green-grey band; sections alternate as in the design. */
  tone?: 'plain' | 'alt'
  children: ReactNode
}

/** A home page band: heading, optional intro and "see all" link, then the content. */
export function HomeSection({ id, title, intro, link, tone = 'plain', children }: Props) {
  return (
    <section aria-labelledby={`${id}-title`} className={tone === 'alt' ? 'bg-surface-alt' : ''}>
      <Container className="flex flex-col gap-6 py-12 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="flex flex-col gap-2">
            <h2 id={`${id}-title`}>{title}</h2>
            {intro && <p className="text-text-muted">{intro}</p>}
          </div>
          {link && (
            <Link
              to={link.to}
              className="inline-flex items-center gap-1.5 font-heading font-medium"
            >
              {link.label}
              <ArrowRightIcon />
            </Link>
          )}
        </div>
        {children}
      </Container>
    </section>
  )
}

/** The responsive card grid used by every home section. */
export function CardGrid({
  children,
  min = '18rem',
  as: Tag = 'ul',
}: {
  children: ReactNode
  min?: '16rem' | '18rem'
  as?: 'ul' | 'div'
}) {
  const cols =
    min === '16rem'
      ? 'grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]'
      : 'grid-cols-[repeat(auto-fill,minmax(18rem,1fr))]'
  return <Tag className={`grid gap-4 ${cols}`}>{children}</Tag>
}

/** Card-style link filling its grid cell. */
export const cardLink =
  'flex h-full flex-col gap-2 rounded-xl border border-border bg-surface p-5 text-text no-underline transition-colors hover:border-border-strong'
