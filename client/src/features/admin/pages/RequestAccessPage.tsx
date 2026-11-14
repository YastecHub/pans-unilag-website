import { type FormEvent, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { ApiError } from '../../../lib/http.ts'
import { usePageTitle } from '../../../lib/usePageTitle.ts'
import { ErrorSummary, Honeypot, TextField } from '../../connect/components/FormParts.tsx'
import { PASSWORD_MIN, useRequestAccess } from '../accounts.ts'
import { PasswordField } from '../components/PasswordField.tsx'

const LABELS = { name: 'Full name', email: 'Email', password: 'Password' }

/**
 * /admin/request-access: an executive asks for a dashboard account and chooses their own
 * password. The account can't sign in until the web lead approves it on the Accounts page.
 */
export function RequestAccessPage() {
  usePageTitle('Request access · Admin')
  const request = useRequestAccess()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [attempt, setAttempt] = useState(0)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setAttempt((n) => n + 1)
    const found: Record<string, string> = {}
    if (name.trim().length < 2) found.name = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = 'Enter your email address.'
    if (password.length < PASSWORD_MIN) found.password = `Use at least ${PASSWORD_MIN} characters.`
    setErrors(found)
    if (Object.keys(found).length > 0) return
    request.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      ...(website ? { website } : {}),
    })
  }

  const failure = !request.isError
    ? undefined
    : request.error instanceof ApiError && request.error.code === 'RATE_LIMITED'
      ? 'Too many requests. Please try again in an hour.'
      : 'Your request couldn’t be sent. Please try again.'

  return (
    <div className="flex min-h-dvh flex-col bg-surface-alt">
      <header className="bg-navy text-on-primary [--color-focus:var(--color-accent)]">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center px-4 sm:px-8">
          <p className="font-heading text-[17px] font-semibold">PANS UNILAG Admin</p>
        </div>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
        <h1 className="text-h2">Request access</h1>
        {request.isSuccess ? (
          <div role="status" className="flex flex-col gap-3 rounded-xl bg-surface p-5">
            <h2 className="text-h3">Request sent</h2>
            <p>
              The web lead will review it. Once it’s approved, sign in with the email and password
              you just chose. If you already have an account, just sign in.
            </p>
            <p>
              <Link to="/admin/sign-in">Go to sign in</Link>
            </p>
          </div>
        ) : (
          <>
            <p className="text-text-muted">
              For PANS UNILAG executives and committee members who update the website. You’ll be
              able to sign in after the web lead approves your request.
            </p>
            <form
              noValidate
              onSubmit={onSubmit}
              className="relative flex flex-col gap-5 rounded-xl bg-surface p-5"
            >
              <ErrorSummary errors={errors} labels={LABELS} message={failure} attempt={attempt} />
              <TextField
                id="name"
                label={LABELS.name}
                autoComplete="name"
                maxLength={120}
                value={name}
                onChange={setName}
                error={errors.name}
              />
              <TextField
                id="email"
                label={LABELS.email}
                type="email"
                autoComplete="username"
                hint="Your office email where there is one."
                value={email}
                onChange={setEmail}
                error={errors.email}
              />
              <PasswordField
                value={password}
                onChange={setPassword}
                error={errors.password}
                autoComplete="new-password"
                hint={`At least ${PASSWORD_MIN} characters. Don’t reuse a password from another site.`}
              />
              <Honeypot value={website} onChange={setWebsite} />
              <Button type="submit" loading={request.isPending}>
                Send request
              </Button>
            </form>
          </>
        )}
        <p className="text-small text-text-muted">
          Already approved? <Link to="/admin/sign-in">Sign in</Link>
        </p>
      </main>
    </div>
  )
}
