import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { SearchForm } from '../../features/search/components/SearchForm.tsx'
import badgeUrl from '../../assets/pans-badge.png'
import { SITE } from '../../lib/site.ts'
import { CloseIcon, MenuIcon, SearchIcon } from '../ui/icons.tsx'
import { ThemeToggle } from '../ui/ThemeToggle.tsx'
import { Container } from './Container.tsx'
import { MainNav } from './MainNav.tsx'
import { MobileNav } from './MobileNav.tsx'

const MOBILE_MENU_ID = 'mobile-menu'
const SEARCH_BAR_ID = 'site-search'

/** True when a key press is going into a text box, so "/" should type a slash, not open search. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/**
 * Site header. Wide screens (≥ 1280 px, the `nav` breakpoint) show the full navigation;
 * narrower screens show a Menu button that opens MobileNav.
 */
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { pathname } = useLocation()

  const openSearch = () => {
    // The results page has its own search box: use it rather than opening a second one.
    const pageBox = document.getElementById('search-page-q')
    if (pathname === '/search' && pageBox) {
      pageBox.focus()
      return
    }
    setMenuOpen(false)
    setSearchOpen(true)
  }
  const closeSearch = () => {
    setSearchOpen(false)
    searchButtonRef.current?.focus()
  }

  // Focus the box as soon as the bar opens.
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  // "/" opens search from anywhere on the page (unless the person is typing in a field).
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
      if (isTyping(event.target)) return
      event.preventDefault()
      openSearch()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    if (searchOpen) closeSearch()
    else if (menuOpen) {
      setMenuOpen(false)
      menuButtonRef.current?.focus()
    }
  }

  return (
    <header className="border-b border-border bg-surface" onKeyDown={closeOnEscape}>
      <Container width="wide" className="flex min-h-[4.5rem] items-center gap-3 py-2">
        {/* Named by its visible text (WCAG 2.5.3, label in name), plus where it goes. */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5 text-text no-underline">
          <img src={badgeUrl} alt="" width={44} height={44} className="size-11" />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-lg font-semibold">{SITE.shortName}</span>{' '}
            <span className="text-xs text-text-muted">{SITE.motto}</span>
            <span className="sr-only"> (home page)</span>
          </span>
        </Link>

        <MainNav className="ml-auto hidden nav:block" />

        <div className="ml-auto flex shrink-0 items-center gap-1 nav:ml-1">
          <button
            ref={searchButtonRef}
            type="button"
            aria-label="Site search"
            aria-expanded={searchOpen}
            aria-controls={SEARCH_BAR_ID}
            aria-keyshortcuts="/"
            onClick={() => (searchOpen ? closeSearch() : openSearch())}
            className="inline-flex size-11 items-center justify-center rounded-lg text-text hover:bg-surface-alt aria-expanded:bg-surface-alt"
          >
            {searchOpen ? <CloseIcon /> : <SearchIcon />}
          </button>
          <ThemeToggle className="hidden nav:inline-flex" />
          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls={MOBILE_MENU_ID}
            onClick={() => {
              setSearchOpen(false)
              setMenuOpen(!menuOpen)
            }}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-border-strong px-3 font-heading text-[15px] font-medium text-text max-[359px]:px-2.5 nav:hidden"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
            {/* On the narrowest phones (320px) the icon alone keeps the header from scrolling sideways. */}
            <span className="max-[359px]:sr-only">{menuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>
      </Container>

      {searchOpen && (
        <div id={SEARCH_BAR_ID} className="border-t border-border bg-surface">
          <Container width="wide" className="py-3">
            <SearchForm
              id="header-search-q"
              inputRef={searchInputRef}
              onSearch={() => setSearchOpen(false)}
            />
          </Container>
        </div>
      )}

      {menuOpen && (
        <div className="nav:hidden">
          <MobileNav id={MOBILE_MENU_ID} onNavigate={() => setMenuOpen(false)} />
        </div>
      )}
    </header>
  )
}
