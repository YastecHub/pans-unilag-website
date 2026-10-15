import { useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import badgeUrl from '../../assets/pans-badge.png'
import { SITE } from '../../lib/site.ts'
import { CloseIcon, MenuIcon, SearchIcon } from '../ui/icons.tsx'
import { ThemeToggle } from '../ui/ThemeToggle.tsx'
import { Container } from './Container.tsx'
import { MainNav } from './MainNav.tsx'
import { MobileNav } from './MobileNav.tsx'

const MOBILE_MENU_ID = 'mobile-menu'

/**
 * Site header. Wide screens (≥ 1280 px, the `nav` breakpoint) show the full navigation;
 * narrower screens show a Menu button that opens MobileNav.
 */
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const closeMenuOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && menuOpen) {
      setMenuOpen(false)
      menuButtonRef.current?.focus()
    }
  }

  return (
    <header className="border-b border-border bg-surface" onKeyDown={closeMenuOnEscape}>
      <Container width="wide" className="flex min-h-[4.5rem] items-center gap-3 py-2">
        <Link
          to="/"
          aria-label={`${SITE.shortName} home`}
          className="flex shrink-0 items-center gap-2.5 text-text no-underline"
        >
          <img src={badgeUrl} alt="" width={44} height={44} className="size-11" />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-lg font-semibold">{SITE.shortName}</span>
            <span className="text-xs text-text-muted">{SITE.motto}</span>
          </span>
        </Link>

        <MainNav className="ml-auto hidden nav:block" />

        <div className="ml-auto flex shrink-0 items-center gap-1 nav:ml-1">
          <Link
            to="/search"
            aria-label="Search"
            className="inline-flex size-11 items-center justify-center rounded-lg text-text hover:bg-surface-alt"
          >
            <SearchIcon />
          </Link>
          <ThemeToggle className="hidden nav:inline-flex" />
          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls={MOBILE_MENU_ID}
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border-strong px-3 font-heading text-[15px] font-medium text-text nav:hidden"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </Container>

      {menuOpen && (
        <div className="nav:hidden">
          <MobileNav id={MOBILE_MENU_ID} onNavigate={() => setMenuOpen(false)} />
        </div>
      )}
    </header>
  )
}
