import { useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { isInSection, MAIN_NAV, type NavSection } from '../../app/siteMap.ts'
import { ChevronDownIcon } from '../ui/icons.tsx'
import { ThemeChoice } from '../ui/ThemeToggle.tsx'
import { Container } from './Container.tsx'

type Props = {
  id: string
  /** Called when a link is chosen, so the header can close the menu. */
  onNavigate: () => void
}

const rowClass =
  'flex min-h-13 w-full items-center justify-between border-b border-border font-heading text-[17px] font-medium no-underline'

/** The menu opened by the header's Menu button on phones and tablets. */
export function MobileNav({ id, onNavigate }: Props) {
  return (
    <nav id={id} aria-label="Main menu" className="border-t border-border bg-surface">
      <Container className="flex flex-col gap-6 pt-2 pb-6">
        <ul>
          {MAIN_NAV.map((section) =>
            section.children ? (
              <MobileSection key={section.label} section={section} onNavigate={onNavigate} />
            ) : (
              <li key={section.label}>
                <NavLink
                  to={section.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `${rowClass} ${isActive ? 'text-text-brand' : 'text-text'}`
                  }
                >
                  {section.label}
                </NavLink>
              </li>
            ),
          )}
        </ul>
        <ThemeChoice />
      </Container>
    </nav>
  )
}

function MobileSection({ section, onNavigate }: { section: NavSection; onNavigate: () => void }) {
  const { pathname } = useLocation()
  const active = isInSection(section, pathname)
  // The section holding the current page starts open.
  const [open, setOpen] = useState(active)
  const listId = `mobile-${section.label.toLowerCase()}`

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        className={`${rowClass} ${active ? 'text-text-brand' : 'text-text'}`}
      >
        {section.label}
        <ChevronDownIcon
          className={`size-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul id={listId} className="border-b border-border py-1">
          {section.children?.map((child) => (
            <li key={child.to}>
              <NavLink
                to={child.to}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex min-h-11 items-center pl-4 no-underline ${isActive ? 'font-medium text-text-brand' : 'text-text'}`
                }
              >
                {child.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
