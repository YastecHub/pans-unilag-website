import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { ApiError } from '../../../lib/http.ts'
import { usePageTitle } from '../../../lib/usePageTitle.ts'
import { ErrorSummary, TextField } from '../../connect/components/FormParts.tsx'
import { safeNext, useMe, useSignIn } from '../api.ts'
import { PasswordField } from '../components/PasswordField.tsx'

const LABELS = { email: 'Email', password: 'Password' }

/** /admin/sign-in. New people ask for access on /admin/request-access and wait for approval. */
export function SignInPage() {
  usePageTitle('Sign in · Admin')
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const navigate = useNavigate()
  const me = useMe()
  const signIn = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [attempt, setAttempt] = useState(0)

  // Already signed in (e.g. the bookmark is the sign-in page): go straight in.
  if (me.isSuccess) return <Navigate to={next} replace />

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setAttempt((n) => n + 1)
    const found: Record<string, string> = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = 'Enter your email address.'
    if (!password) found.password = 'Enter your password.'
    setErrors(found)
    if (Object.keys(found).length > 0) return
    signIn.mutate(
      { email: email.trim(), password },
      { onSuccess: () => navigate(next, { replace: true }) },
    )
  }

  const failure = signIn.isError ? signInMessage(signIn.error) : undefined
  const notice = params.get('signedOut')
    ? 'You’ve signed out.'
    : params.get('expired')
      ? 'Your session has ended. Please sign in again.'
      : null

  return (
    <div className="flex min-h-dvh flex-col bg-surface-alt">
      <header className="bg-navy text-on-primary [--color-focus:var(--color-accent)]">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center px-4 sm:px-8">
          <p className="font-heading text-[17px] font-semibold">PANS UNILAG Admin</p>
        </div>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
        <h1 className="text-h2">Sign in</h1>
        {notice && (
          <p role="status" className="rounded-lg bg-surface p-3 text-small">
            {notice}
          </p>
        )}
        <form
          noValidate
          onSubmit={onSubmit}
          className="flex flex-col gap-5 rounded-xl bg-surface p-5"
        >
          <ErrorSummary errors={errors} labels={LABELS} message={failure} attempt={attempt} />
          <TextField
            id="email"
            label={LABELS.email}
            type="email"
            autoComplete="username"
            value={email}
            onChange={setEmail}
            error={errors.email}
          />
          <PasswordField
            value={password}
            onChange={setPassword}
            error={errors.password}
            autoComplete="current-password"
          />
          <Button type="submit" loading={signIn.isPending}>
            Sign in
          </Button>
        </form>
        <p>
          New here? <Link to="/admin/request-access">Request access</Link>
        </p>
        <p className="text-small text-text-muted">
          For PANS UNILAG executives and editors only. Forgotten your password? Ask the web lead to
          reset it. <Link to="/">Back to the website</Link>
        </p>
      </main>
    </div>
  )
}

function signInMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === 'UNAUTHORIZED')
    return 'Email or password is incorrect.'
  if (error instanceof ApiError && error.code === 'RATE_LIMITED')
    return 'Too many attempts. Please wait 15 minutes and try again.'
  if (error instanceof ApiError) return error.message
  return 'Something went wrong. Please try again.'
}
