import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { ApiError } from '../../../lib/http.ts'
import { usePageTitle } from '../../../lib/usePageTitle.ts'
import { ErrorSummary, TextField } from '../../connect/components/FormParts.tsx'
import { safeNext, useMe, useSignIn } from '../api.ts'

const LABELS = { email: 'Email', password: 'Password' }

/** /admin/sign-in. There is no public sign-up: admins are created with the create-admin script. */
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
          <PasswordField value={password} onChange={setPassword} error={errors.password} />
          <Button type="submit" loading={signIn.isPending}>
            Sign in
          </Button>
        </form>
        <p className="text-small text-text-muted">
          For PANS UNILAG executives and editors only. Forgotten your password? Ask another admin to
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

function PasswordField({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  const [shown, setShown] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="password" className="font-medium">
        Password
      </label>
      <div className="flex gap-2">
        <input
          id="password"
          name="password"
          type={shown ? 'text' : 'password'}
          autoComplete="current-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'password-error' : undefined}
          className="min-h-12 min-w-0 flex-1 rounded-lg border-2 border-border-strong bg-surface px-3 text-base text-text aria-[invalid=true]:border-danger"
        />
        <button
          type="button"
          onClick={() => setShown(!shown)}
          aria-pressed={shown}
          aria-controls="password"
          aria-label="Show password"
          className="min-h-12 rounded-lg border-2 border-border px-3 font-heading text-small font-medium"
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && (
        <p id="password-error" className="text-small font-medium text-danger">
          <span aria-hidden>! </span>
          {error}
        </p>
      )}
    </div>
  )
}
