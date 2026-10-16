import { type FormEvent, useState } from 'react'
import { Link } from 'react-router'
import { navSection } from '../../../app/siteMap.ts'
import { Button } from '../../../components/ui/Button.tsx'
import { InnerPageLayout } from '../../pages/components/InnerPageLayout.tsx'
import {
  checkFeedback,
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
  MESSAGE_MAX,
  sendErrorMessage,
  serverFieldErrors,
  useSendFeedback,
} from '../api/submissions.ts'
import {
  ErrorSummary,
  FieldError,
  Honeypot,
  SuccessPanel,
  TextField,
} from '../components/FormParts.tsx'
import { describedBy } from '../components/formFields.ts'

const LABELS = { category: 'What it’s about', message: 'Your message', contactEmail: 'Your email' }

/**
 * /connect/feedback: suggestions, complaints and welfare issues. Anonymous unless the student
 * chooses to leave an email. The Secretary General reads it; welfare issues go to the Welfare
 * Secretary (Art. 8).
 */
export function FeedbackPage() {
  const [category, setCategory] = useState<FeedbackCategory | ''>('')
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [contactEmail, setContactEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [attempt, setAttempt] = useState(0)
  const send = useSendFeedback()

  const reset = () => {
    setCategory('')
    setMessage('')
    setAnonymous(true)
    setContactEmail('')
    setErrors({})
    send.reset()
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setAttempt((n) => n + 1)
    const found = checkFeedback({ category, message, anonymous, contactEmail })
    setErrors(found)
    if (Object.keys(found).length > 0 || !category) return
    send.mutate(
      {
        category,
        message: message.trim(),
        ...(anonymous ? {} : { contactEmail: contactEmail.trim() }),
        ...(website ? { website } : {}),
      },
      { onError: (error) => setErrors(serverFieldErrors(error)) },
    )
  }

  const sendError =
    send.isError && Object.keys(serverFieldErrors(send.error)).length === 0
      ? sendErrorMessage(send.error)
      : undefined

  return (
    <InnerPageLayout
      title="Feedback & suggestions"
      section={navSection('Connect')}
      intro="Tell us what’s working, what isn’t, and what you need. You can stay anonymous."
    >
      <div className="flex flex-col gap-2 rounded-xl bg-surface-alt p-4 text-small">
        <p>
          <strong>Who reads it:</strong> the Secretary General, who makes sure the officers
          concerned respond. Welfare issues are passed to the Welfare Secretary.
        </p>
        <p>
          Only signed-in PANS admins can read messages, and they are deleted after 12 months. See
          the <Link to="/connect/privacy">privacy notice</Link>.
        </p>
      </div>

      {send.isSuccess ? (
        <SuccessPanel
          title="Thank you, your message was sent"
          onAgain={reset}
          againLabel="Send another message"
        >
          <p>
            {anonymous
              ? 'You sent it anonymously, so we can’t reply to you directly.'
              : 'We may reply to the email address you gave.'}{' '}
            {category === 'welfare' && 'It will reach the Welfare Secretary.'}
          </p>
        </SuccessPanel>
      ) : (
        <form noValidate onSubmit={onSubmit} className="relative flex flex-col gap-6">
          <ErrorSummary errors={errors} labels={LABELS} message={sendError} attempt={attempt} />

          <fieldset
            id="category"
            tabIndex={-1}
            aria-invalid={errors.category ? true : undefined}
            aria-describedby={describedBy('category', undefined, errors.category)}
            className="flex flex-col gap-2"
          >
            <legend className="mb-1 font-medium">{LABELS.category}</legend>
            {FEEDBACK_CATEGORIES.map((c) => (
              <label key={c.value} className="flex min-h-10 items-center gap-3">
                <input
                  type="radio"
                  name="category"
                  value={c.value}
                  checked={category === c.value}
                  onChange={() => setCategory(c.value)}
                  className="size-5 accent-primary"
                />
                {c.label}
              </label>
            ))}
            {category === 'welfare' && (
              <p className="text-small text-text-muted">This will reach the Welfare Secretary.</p>
            )}
            <FieldError id="category" error={errors.category} />
          </fieldset>

          <TextField
            id="message"
            label={LABELS.message}
            value={message}
            onChange={setMessage}
            multiline
            maxLength={MESSAGE_MAX}
            error={errors.message}
            hint={`At least 10 characters. ${MESSAGE_MAX - message.length} characters left.`}
          />

          <div className="flex flex-col gap-3">
            <label className="flex min-h-10 items-center gap-3">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="size-5 accent-primary"
              />
              Send anonymously
            </label>
            {!anonymous && (
              <TextField
                id="contactEmail"
                label={LABELS.contactEmail}
                type="email"
                autoComplete="email"
                value={contactEmail}
                onChange={setContactEmail}
                error={errors.contactEmail}
                hint="So the Secretary General can reply. Only used for this message."
              />
            )}
          </div>

          <Honeypot value={website} onChange={setWebsite} />

          <div>
            <Button type="submit" loading={send.isPending}>
              Send message
            </Button>
          </div>
        </form>
      )}
    </InnerPageLayout>
  )
}
