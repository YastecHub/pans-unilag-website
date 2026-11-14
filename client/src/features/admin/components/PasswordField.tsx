import { type ReactNode, useState } from 'react'
import { EyeIcon, EyeOffIcon } from '../../../components/ui/icons.tsx'
import { FieldError, FieldHint } from '../../connect/components/FormParts.tsx'
import { describedBy } from '../../connect/components/formFields.ts'

type Props = {
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: ReactNode
  /** "current-password" when signing in, "new-password" when choosing one. */
  autoComplete: 'current-password' | 'new-password'
}

/** A password box with an eye button that shows or hides what was typed. */
export function PasswordField({ value, onChange, error, hint, autoComplete }: Props) {
  const [shown, setShown] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="password" className="font-medium">
        Password
      </label>
      <FieldHint id="password">{hint}</FieldHint>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={shown ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy('password', hint, error)}
          className="min-h-12 w-full rounded-lg border-2 border-border-strong bg-surface pr-13 pl-3 text-base text-text aria-[invalid=true]:border-danger"
        />
        {/* A toggle: the name stays "Show password" and aria-pressed says whether it's on. */}
        <button
          type="button"
          onClick={() => setShown(!shown)}
          aria-pressed={shown}
          aria-controls="password"
          aria-label="Show password"
          title={shown ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-lg text-text-muted hover:text-text"
        >
          {shown ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      <FieldError id="password" error={error} />
    </div>
  )
}
