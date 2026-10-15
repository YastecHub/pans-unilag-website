import { useEffect, useRef } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { Footer } from '../../components/layout/Footer.tsx'
import { Header } from '../../components/layout/Header.tsx'
import { SkipLink } from '../../components/layout/SkipLink.tsx'

/** Layout for every public page: skip link, header, main content, footer. */
export function PublicLayout() {
  const mainRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const firstRender = useRef(true)

  // After navigating, move focus to the new page so screen readers announce it
  // (not on the first load, where the browser starts at the top anyway).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.focus()
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <Header />
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  )
}
