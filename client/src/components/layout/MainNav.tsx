import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import { NavLink, useLocation } from 'react-router'
import { isInSection, MAIN_NAV } from '../../app/siteMap.ts'
import { ChevronDownIcon } from '../ui/icons.tsx'

const itemClass =
  'inline-flex min-h-11 items-center gap-1 rounded-lg px-2 font-heading text-[15px] font-medium whitespace-nowrap no-underline hover:bg-surface-alt'

/**
 * Desktop navigation: 8 items, sections open a dropdown (disclosure pattern).
 * Keyboard: Tab moves between items, Enter/Space opens, Escape closes and returns focus.
 * Clicking outside or tabbing away also closes it.
 */
export function MainNav({ className = '' }: { className?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const { pathname } = useLocation()

  useEffect(() => {
    if (openIndex === null) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenIndex(null)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [openIndex])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && openIndex !== null) {
      buttonRefs.current[openIndex]?.focus()
      setOpenIndex(null)
    }
  }

  const onBlur = (event: FocusEvent) => {
    if (!navRef.current?.contains(event.relatedTarget as Node | null)) setOpenIndex(null)
  }

  return (
    <nav ref={navRef} aria-label="Main" className={className} onKeyDown={onKeyDown} onBlur={onBlur}>
      <ul className="flex items-center">
        {MAIN_NAV.map((section, index) => {
          const active = isInSection(section, pathname)
          const activeClass = active
            ? 'text-text-brand shadow-[inset_0_-3px_0_var(--color-text-brand)]'
            : 'text-text'

          if (!section.children) {
            return (
              <li key={section.label}>
                <NavLink to={section.to} className={`${itemClass} ${activeClass}`}>
                  {section.label}
                </NavLink>
              </li>
            )
          }

          const open = openIndex === index
          const menuId = `nav-menu-${index}`
          return (
            <li key={section.label} className="relative">
              <button
                type="button"
                ref={(element) => {
                  buttonRefs.current[index] = element
                }}
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpenIndex(open ? null : index)}
                className={`${itemClass} ${activeClass}`}
              >
                {section.label}
                <ChevronDownIcon
                  className={`size-3 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </button>
              {open && (
                <ul
                  id={menuId}
                  className="absolute top-full left-0 z-50 mt-2 flex min-w-64 flex-col rounded-xl border border-border bg-surface p-2 shadow-lg"
                >
                  {section.children.map((child) => (
                    <li key={child.to}>
                      <NavLink
                        to={child.to}
                        end
                        onClick={() => setOpenIndex(null)}
                        className={({ isActive }) =>
                          `flex min-h-11 flex-col justify-center rounded-lg px-3 py-2 no-underline hover:bg-surface-alt ${
                            isActive ? 'bg-surface-alt text-text-brand' : 'text-text'
                          }`
                        }
                      >
                        <span className="font-medium">{child.label}</span>
                        <span className="text-small text-text-muted">{child.description}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
