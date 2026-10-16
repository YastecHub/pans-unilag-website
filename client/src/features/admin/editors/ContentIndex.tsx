import { Link } from 'react-router'
import { usePageTitle } from '../../../lib/usePageTitle.ts'
import { EDITORS } from './editors.ts'
import { CONTENT_GROUPS } from './types.ts'

/** Every kind of content the dashboard edits, grouped as the site's menu groups them. */
export function ContentIndex({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const Heading = `h${headingLevel}` as const
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {CONTENT_GROUPS.map((group) => {
        const items = EDITORS.filter((e) => e.group === group)
        if (items.length === 0) return null
        const id = `content-${group.toLowerCase().replace(/[^a-z]+/g, '-')}`
        return (
          <section key={group} aria-labelledby={id} className="flex flex-col gap-2">
            <Heading id={id} className="text-[1.125rem]">
              {group}
            </Heading>
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
              {items.map((e) => (
                <li key={e.name} className="flex flex-col gap-0.5 p-3">
                  <Link to={`/admin/${e.name}`} className="font-heading font-medium">
                    {e.plural}
                  </Link>
                  <span className="text-small text-text-muted">{e.intro}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

/** /admin/content */
export function ContentPage() {
  usePageTitle('Content · Admin')
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-h2">Content</h1>
        <p className="text-text-muted">
          Everything on the site, by section. Changes show on the site as soon as you save.
        </p>
      </div>
      <ContentIndex />
    </>
  )
}
