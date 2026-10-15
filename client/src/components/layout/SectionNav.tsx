import { NavLink } from 'react-router'
import type { NavSection } from '../../app/siteMap.ts'

/** "In this section" links beside a page, e.g. the four About pages. */
export function SectionNav({ section }: { section: NavSection }) {
  return (
    <nav aria-label={`${section.label} pages`} className="flex flex-col gap-2">
      <p className="font-heading text-small font-medium tracking-[0.08em] text-text-muted uppercase">
        {section.label}
      </p>
      <ul className="flex flex-col gap-1 border-l-2 border-border">
        {section.children?.map((child) => (
          <li key={child.to}>
            <NavLink
              to={child.to}
              end
              className={({ isActive }) =>
                `-ml-0.5 block border-l-2 py-1.5 pl-4 no-underline ${
                  isActive
                    ? 'border-primary-border font-medium text-text-brand'
                    : 'border-transparent text-text hover:border-border-strong'
                }`
              }
            >
              {child.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
