import { Link } from 'react-router'
import { Placeholder } from '../../components/ui/Placeholder.tsx'
import { usePageTitle } from '../../lib/usePageTitle.ts'

/**
 * Admin area. Loaded only when someone visits /admin, so public visitors never download it.
 * Sign-in, layout and editors arrive in issues #37–#39.
 */
export function AdminApp() {
  usePageTitle('Admin')
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-navy text-on-primary [--color-focus:var(--color-accent)]">
        <div className="flex min-h-13 items-center px-4 sm:px-8">
          <p className="font-heading text-[17px] font-semibold">PANS UNILAG Admin</p>
        </div>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-12">
        <h1 className="text-h2">Admin</h1>
        <Placeholder note="Admin sign-in and editors are being built (issues #37 to #39)." />
        <p>
          <Link to="/">Back to the website</Link>
        </p>
      </main>
    </div>
  )
}
