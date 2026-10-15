import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Container } from './Container.tsx'

export type Crumb = { label: string; to?: string }

type Props = {
  title: string
  /** Trail above the title; Home is added automatically. The last item is the current page. */
  breadcrumbs?: Crumb[]
  /** One or two lines under the title. */
  intro?: ReactNode
  /** A short label above the title, e.g. "Committee · 2026/27". */
  eyebrow?: string
}

/** The pale band at the top of every inner page: breadcrumb, title (the page's only h1) and intro. */
export function PageHeader({ title, breadcrumbs = [], intro, eyebrow }: Props) {
  const trail: Crumb[] = [{ label: 'Home', to: '/' }, ...breadcrumbs, { label: title }]
  return (
    <div className="bg-surface-alt">
      <Container className="flex flex-col gap-3 py-10">
        <nav aria-label="Breadcrumb" className="text-small text-text-muted">
          <ol className="flex flex-wrap gap-1">
            {trail.map((crumb, i) => {
              const last = i === trail.length - 1
              return (
                <li key={`${crumb.label}-${i}`} className="flex gap-1">
                  {last || !crumb.to ? (
                    <span aria-current={last ? 'page' : undefined}>{crumb.label}</span>
                  ) : (
                    <Link to={crumb.to}>{crumb.label}</Link>
                  )}
                  {!last && <span aria-hidden>/</span>}
                </li>
              )
            })}
          </ol>
        </nav>
        {eyebrow && (
          <p className="font-heading text-small font-medium tracking-[0.08em] text-text-brand uppercase">
            {eyebrow}
          </p>
        )}
        <h1>{title}</h1>
        {intro && <div className="max-w-[40rem] text-text-muted">{intro}</div>}
      </Container>
    </div>
  )
}
