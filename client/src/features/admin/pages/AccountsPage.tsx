import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { formatDate } from '../../../lib/dates.ts'
import { ApiError } from '../../../lib/http.ts'
import { usePageTitle } from '../../../lib/usePageTitle.ts'
import {
  type Account,
  type ManagedRole,
  useAccounts,
  useCreateAccount,
  useRemoveAccount,
  useResetAccountPassword,
  useSetAccountRole,
  type WithPassword,
} from '../accounts.ts'
import { useIsDeveloper, useMe } from '../api.ts'
import { AdminQuery } from '../components/AdminQuery.tsx'
import { control } from '../editors/fields.tsx'
import { Select, TextInput } from '../editors/inputs.tsx'
import type { Form } from '../editors/types.ts'

const ROLE_LABELS: Record<Account['role'], string> = {
  developer: 'Developer',
  admin: 'Admin',
  editor: 'Editor',
}
const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin: everything except this page' },
  { value: 'editor', label: 'Editor: content only' },
]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback

/**
 * /admin/accounts: who can sign in to the dashboard. Developer role only; the API enforces it too.
 * New and reset passwords are shown once, then gone.
 */
export function AccountsPage() {
  usePageTitle('Accounts · Admin')
  const isDeveloper = useIsDeveloper()
  if (!isDeveloper)
    return (
      <>
        <h1 className="text-h2">Accounts</h1>
        <p className="max-w-2xl">
          Only the developer (the web lead) can add or remove dashboard accounts. Ask them if
          someone needs access or has forgotten their password.
        </p>
        <p>
          <Link to="/admin">Back to the overview</Link>
        </p>
      </>
    )
  return <Accounts />
}

function Accounts() {
  const query = useAccounts()
  const [revealed, setRevealed] = useState<(WithPassword & { action: string }) | null>(null)
  const [notice, setNotice] = useState('')

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-h2">Accounts</h1>
        <p className="max-w-3xl text-text-muted">
          Everyone who can sign in to the dashboard. <strong>Admins</strong> can do everything
          except this page, including reading feedback and alumni sign-ups; <strong>editors</strong>{' '}
          manage content only. Developer accounts are managed with the <code>create-admin</code>{' '}
          command. Keep at least two admins.
        </p>
      </div>

      <p role="status" className="font-medium">
        {notice}
      </p>

      {revealed && <NewPassword {...revealed} onDone={() => setRevealed(null)} />}

      <AdminQuery query={query} label="accounts">
        {(accounts) => (
          <AccountList
            accounts={accounts}
            onNotice={setNotice}
            onPassword={(reset) => setRevealed({ ...reset, action: 'reset' })}
          />
        )}
      </AdminQuery>

      <NewAccount
        onCreated={(created) => {
          setNotice('')
          setRevealed({ ...created, action: 'created' })
        }}
      />
    </>
  )
}

/** The one time a password is shown. Focus moves here so it isn't missed. */
function NewPassword({
  account,
  password,
  action,
  onDone,
}: WithPassword & { action: string; onDone: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => ref.current?.focus(), [password])

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby="new-password-title"
      className="flex max-w-3xl flex-col gap-3 rounded-xl border-2 border-primary-border p-4 outline-none"
    >
      <h2 id="new-password-title" className="text-[1.25rem]">
        {action === 'created' ? 'Account created' : 'New password'} for {account.name}
      </h2>
      <p>
        Sign-in email: <strong>{account.email}</strong>
      </p>
      <p className="flex flex-wrap items-center gap-3">
        <span>Password:</span>
        <code className="rounded-md bg-surface-alt px-3 py-2 font-mono text-[1.0625rem] break-all">
          {password}
        </code>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            void navigator.clipboard
              ?.writeText(password)
              .then(() => setCopied(true))
              .catch(() => undefined)
          }
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </p>
      <p className="text-small">
        <strong>It’s shown only this once.</strong> Give it to {account.name} privately (not in a
        group chat) and ask them to keep it in a password manager.
        {action === 'reset' &&
          ' Their old password has stopped working and they’ve been signed out.'}
      </p>
      <div>
        <Button variant="ghost" onClick={onDone}>
          Done, hide it
        </Button>
      </div>
    </section>
  )
}

function AccountList({
  accounts,
  onNotice,
  onPassword,
}: {
  accounts: Account[]
  onNotice: (message: string) => void
  onPassword: (reset: WithPassword) => void
}) {
  const me = useMe().data
  const setRole = useSetAccountRole()
  const reset = useResetAccountPassword()
  const remove = useRemoveAccount()
  const [confirm, setConfirm] = useState<{ id: string; action: 'reset' | 'remove' } | null>(null)
  const pending = setRole.isPending || reset.isPending || remove.isPending
  const failed = setRole.error ?? reset.error ?? remove.error

  return (
    <>
      {failed && (
        <p role="alert" className="font-medium text-danger">
          {errorMessage(failed, 'That didn’t work. Please try again.')}
        </p>
      )}
      {/* Focusable, so keyboard users can scroll it sideways on a phone. */}
      <div
        role="region"
        aria-label="Accounts table"
        tabIndex={0}
        className="overflow-x-auto rounded-xl border border-border"
      >
        <table className="w-full min-w-[46rem] border-collapse text-left text-small">
          <caption className="sr-only">Dashboard accounts</caption>
          <thead className="bg-surface-alt">
            <tr>
              {['Name', 'Email', 'Role', 'Last signed in', 'Actions'].map((h) => (
                <th key={h} scope="col" className="p-3 font-heading font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const asking = confirm?.id === a.id ? confirm.action : null
              return (
                <tr key={a.id} className="border-t border-border align-top">
                  <th scope="row" className="p-3 font-medium">
                    {a.name}
                    {a.id === me?.id && <span className="text-text-muted"> (you)</span>}
                  </th>
                  <td className="p-3 break-all">{a.email}</td>
                  <td className="p-3">
                    {a.role === 'developer' ? (
                      ROLE_LABELS.developer
                    ) : (
                      <select
                        aria-label={`Role for ${a.name}`}
                        className={control}
                        value={a.role}
                        disabled={pending}
                        onChange={(e) => {
                          const role = e.target.value as ManagedRole
                          setRole.mutate(
                            { id: a.id, role },
                            {
                              onSuccess: () =>
                                onNotice(`${a.name} is now an ${ROLE_LABELS[role].toLowerCase()}.`),
                            },
                          )
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                      </select>
                    )}
                  </td>
                  <td className="p-3">
                    {a.lastLoginAt ? (
                      <time dateTime={a.lastLoginAt}>{formatDate(a.lastLoginAt)}</time>
                    ) : (
                      'Never'
                    )}
                  </td>
                  <td className="p-3">
                    {a.role === 'developer' ? (
                      <span className="text-text-muted">
                        Use <code>create-admin</code>
                      </span>
                    ) : asking ? (
                      <div
                        role="group"
                        aria-label={
                          asking === 'remove' ? `Remove ${a.name}` : `New password for ${a.name}`
                        }
                        className="flex flex-col gap-2"
                      >
                        <p>
                          {asking === 'remove'
                            ? `Remove ${a.name}? They’re signed out at once and can’t sign in again.`
                            : `Give ${a.name} a new password? Their current one stops working and they’re signed out.`}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={asking === 'remove' ? 'danger' : 'secondary'}
                            loading={pending}
                            onClick={() =>
                              asking === 'remove'
                                ? remove.mutate(a.id, {
                                    onSuccess: () => {
                                      setConfirm(null)
                                      onNotice(`Removed ${a.name}.`)
                                    },
                                  })
                                : reset.mutate(a.id, {
                                    onSuccess: (result) => {
                                      setConfirm(null)
                                      onPassword(result)
                                    },
                                  })
                            }
                          >
                            {asking === 'remove' ? 'Yes, remove' : 'Yes, new password'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={pending}
                          aria-label={`New password for ${a.name}`}
                          onClick={() => setConfirm({ id: a.id, action: 'reset' })}
                        >
                          New password
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          aria-label={`Remove ${a.name}`}
                          onClick={() => setConfirm({ id: a.id, action: 'remove' })}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

const EMPTY: Form = { name: '', email: '', role: 'editor' }

function NewAccount({ onCreated }: { onCreated: (created: WithPassword) => void }) {
  const create = useCreateAccount()
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (changes: Form) => setForm((f) => ({ ...f, ...changes }))
  const props = { form, set, errors, isNew: true }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const name = String(form.name).trim()
    const email = String(form.email).trim().toLowerCase()
    const found: Record<string, string> = {}
    if (!name) found.name = 'Add their name.'
    if (!EMAIL.test(email)) found.email = 'Add an email address like name@example.com.'
    setErrors(found)
    if (Object.keys(found).length > 0) {
      document.getElementById(Object.keys(found)[0]!)?.focus()
      return
    }
    create.mutate(
      { name, email, role: form.role as ManagedRole },
      {
        onSuccess: (created) => {
          setForm(EMPTY)
          onCreated(created)
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === 'CONFLICT') {
            setErrors({ email: error.message })
            document.getElementById('email')?.focus()
          }
        },
      },
    )
  }

  return (
    <section aria-labelledby="new-account-title" className="flex max-w-3xl flex-col gap-4">
      <h2 id="new-account-title" className="text-[1.25rem]">
        Add someone
      </h2>
      <p className="text-small text-text-muted">
        Use their office email (e.g. the Secretary General’s role address) where there is one. A
        password is made for them and shown once.
      </p>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <TextInput {...props} id="name" label="Full name" maxLength={120} autoComplete="off" />
        <TextInput
          {...props}
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          maxLength={254}
        />
        <Select {...props} id="role" label="Role" options={ROLE_OPTIONS} />
        {create.isError &&
          !(create.error instanceof ApiError && create.error.code === 'CONFLICT') && (
            <p role="alert" className="font-medium text-danger">
              {errorMessage(create.error, 'The account couldn’t be created. Please try again.')}
            </p>
          )}
        <div>
          <Button type="submit" loading={create.isPending}>
            Create account
          </Button>
        </div>
      </form>
    </section>
  )
}
