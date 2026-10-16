import { type FormEvent, useState } from 'react'
import { Link } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { Button } from '../../../components/ui/Button.tsx'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import {
  ALUMNI_INTERESTS,
  type AlumniInterest,
  checkAlumni,
  sendErrorMessage,
  serverFieldErrors,
  useJoinAlumni,
} from '../api/submissions.ts'
import {
  ErrorSummary,
  FieldError,
  Honeypot,
  SuccessPanel,
  TextField,
} from '../components/FormParts.tsx'
import { describedBy } from '../components/formFields.ts'

const LABELS = {
  name: 'Full name',
  graduationYear: 'Year you graduated',
  email: 'Email',
  phone: 'Phone number',
  interests: 'How you’d like to help',
  consent: 'Consent',
}

/** /connect/alumni: join the alumni network, run by the Alumni Network Committee. Consent required. */
export function AlumniPage() {
  const [name, setName] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [interests, setInterests] = useState<AlumniInterest[]>([])
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [attempt, setAttempt] = useState(0)
  const join = useJoinAlumni()

  const toggle = (value: AlumniInterest) =>
    setInterests((list) =>
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    )

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setAttempt((n) => n + 1)
    const found = checkAlumni({ name, graduationYear, email, phone, consent })
    setErrors(found)
    if (Object.keys(found).length > 0) return
    join.mutate(
      {
        name: name.trim(),
        graduationYear: Number(graduationYear),
        email: email.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        // Keep the list's order, whatever order they were ticked in.
        interests: ALUMNI_INTERESTS.map((i) => i.value).filter((v) => interests.includes(v)),
        consent: true,
        ...(website ? { website } : {}),
      },
      { onError: (error) => setErrors(serverFieldErrors(error)) },
    )
  }

  const sendError =
    join.isError && Object.keys(serverFieldErrors(join.error)).length === 0
      ? sendErrorMessage(join.error)
      : undefined

  return (
    <InnerPageLayout
      title="Alumni network"
      section={navSection('Connect')}
      intro="Graduated from the Faculty of Pharmacy? Stay connected with PANS UNILAG and help the students coming after you."
    >
      <div className="flex flex-col gap-2 rounded-xl bg-surface-alt p-4 text-small">
        <p>
          The <Link to="/leadership/committees/alumni-network">Alumni Network Committee</Link> runs
          the network and will get in touch about what you’d like to do.
        </p>
        <p>
          Your details are seen only by the committee and PANS admins, are never published, and are
          kept until you ask to be removed. See the{' '}
          <Link to="/connect/privacy">privacy notice</Link>.
        </p>
      </div>

      {join.isSuccess ? (
        <SuccessPanel
          title="Welcome to the alumni network"
          onAgain={() => {
            setErrors({})
            join.reset()
          }}
          againLabel="Update your details"
        >
          <p>
            Thank you, {name.trim().split(/\s+/)[0]}. The Alumni Network Committee will be in touch.
            Signing up again with the same email updates your details.
          </p>
        </SuccessPanel>
      ) : (
        <form noValidate onSubmit={onSubmit} className="relative flex flex-col gap-6">
          <ErrorSummary errors={errors} labels={LABELS} message={sendError} attempt={attempt} />

          <TextField
            id="name"
            label={LABELS.name}
            value={name}
            onChange={setName}
            autoComplete="name"
            error={errors.name}
          />
          <TextField
            id="graduationYear"
            label={LABELS.graduationYear}
            value={graduationYear}
            onChange={setGraduationYear}
            inputMode="numeric"
            hint="For example, 2019."
            error={errors.graduationYear}
          />
          <TextField
            id="email"
            label={LABELS.email}
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            error={errors.email}
          />
          <TextField
            id="phone"
            label={LABELS.phone}
            type="tel"
            autoComplete="tel"
            optional
            value={phone}
            onChange={setPhone}
            error={errors.phone}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-medium">
              {LABELS.interests} <span className="font-normal text-text-muted">(optional)</span>
            </legend>
            {ALUMNI_INTERESTS.map((i) => (
              <label key={i.value} className="flex min-h-10 items-center gap-3">
                <input
                  type="checkbox"
                  checked={interests.includes(i.value)}
                  onChange={() => toggle(i.value)}
                  className="size-5 accent-primary"
                />
                {i.label}
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-start gap-3">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={describedBy('consent', undefined, errors.consent)}
                className="mt-1 size-5 shrink-0 accent-primary"
              />
              <span>
                I agree that PANS UNILAG’s Alumni Network Committee may keep these details and
                contact me about the alumni network, as described in the privacy notice.
              </span>
            </label>
            <FieldError id="consent" error={errors.consent} />
          </div>

          <Honeypot value={website} onChange={setWebsite} />

          <div>
            <Button type="submit" loading={join.isPending}>
              Join the network
            </Button>
          </div>
        </form>
      )}
    </InnerPageLayout>
  )
}
