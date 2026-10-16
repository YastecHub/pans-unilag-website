import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useMe, useSignOut } from '../api.ts'

const NAV = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/events', label: 'Events', end: false },
  { to: '/admin/announcements', label: 'Announcements', end: false },
  { to: '/admin/opportunities', label: 'Opportunities', end: false },
  { to: '/admin/placeholders', label: 'Placeholders', end: false },
  { to: '/admin/feedback', label: 'Feedback', end: false },
  { to: '/admin/alumni', label: 'Alumni', end: false },
]

/** Header (who's signed in, sign out), section links, then the page. Separate from the public site. */
export function AdminLayout() {
  const me = useMe()
  const signOut = useSignOut()
  const navigate = useNavigate()
  const admin = me.data

  const onSignOut = () =>
    signOut.mutate(undefined, {
      // Even if the request fails (offline), leave the dashboard; the cookie expires anyway.
      onSettled: () => navigate('/admin/sign-in?signedOut=1', { replace: true }),
    })

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <a
        href="#main"
        className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-md bg-accent px-4 py-3 font-heading font-medium text-on-accent no-underline focus:translate-y-0"
      >
        Skip to main content
      </a>
      <header className="bg-navy text-on-primary [--color-focus:var(--color-accent)]">
        <div className="mx-auto flex min-h-14 w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-8">
          <p className="font-heading text-[17px] font-semibold">PANS UNILAG Admin</p>
          <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
            {admin && (
              <span>
                Signed in as <strong>{admin.name}</strong>{' '}
                <span className="opacity-80">({admin.role})</span>
              </span>
            )}
            <Link to="/" className="text-on-primary">
              View the website
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              disabled={signOut.isPending}
              className="min-h-10 rounded-lg border-2 border-on-primary px-3 font-heading font-medium"
            >
              {signOut.isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
        <nav aria-label="Admin" className="border-t border-white/15">
          <ul className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-2 sm:px-6">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `block border-b-4 px-3 py-3 font-heading text-small font-medium whitespace-nowrap text-on-primary no-underline ${
                      isActive ? 'border-accent' : 'border-transparent hover:border-white/40'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8"
      >
        <Outlet />
      </main>
    </div>
  )
}
