import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { useCanReadSubmissions, useMe, useSignOut } from '../api.ts'
import { EDITORS } from '../editors/editors.ts'

const under = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`)

/** "Content" covers the content index and every editor. */
const NAV: {
  to: string
  label: string
  current: (pathname: string) => boolean
  /** Personal data: shown to the "admin" role only. */
  adminOnly?: boolean
}[] = [
  { to: '/admin', label: 'Overview', current: (p) => p === '/admin' || p === '/admin/' },
  {
    to: '/admin/content',
    label: 'Content',
    current: (p) => under(p, '/admin/content') || EDITORS.some((e) => under(p, `/admin/${e.name}`)),
  },
  {
    to: '/admin/placeholders',
    label: 'Placeholders',
    current: (p) => under(p, '/admin/placeholders'),
  },
  {
    to: '/admin/feedback',
    label: 'Feedback',
    current: (p) => under(p, '/admin/feedback'),
    adminOnly: true,
  },
  {
    to: '/admin/alumni',
    label: 'Alumni',
    current: (p) => under(p, '/admin/alumni'),
    adminOnly: true,
  },
]

/** Header (who's signed in, sign out), section links, then the page. Separate from the public site. */
export function AdminLayout() {
  const me = useMe()
  const signOut = useSignOut()
  const navigate = useNavigate()
  const admin = me.data
  const { pathname } = useLocation()
  const canReadSubmissions = useCanReadSubmissions()

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
            {NAV.filter((item) => !item.adminOnly || canReadSubmissions).map((item) => {
              const current = item.current(pathname)
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={current ? 'page' : undefined}
                    className={`block border-b-4 px-3 py-3 font-heading text-small font-medium whitespace-nowrap text-on-primary no-underline ${
                      current ? 'border-accent' : 'border-transparent hover:border-white/40'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
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
