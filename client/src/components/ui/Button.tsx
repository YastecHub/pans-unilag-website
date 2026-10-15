import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonStyles.ts'

type Look = { variant?: ButtonVariant; size?: ButtonSize }

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Look & {
    /** Shows a spinner, disables the button and tells screen readers it is busy. */
    loading?: boolean
  }

/** A real <button>. Defaults to type="button" so it never submits a form by accident. */
export function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

/** A link (React Router) that looks like a button. Use it for navigation, Button for actions. */
export function ButtonLink({ variant, size, className, ...rest }: LinkProps & Look) {
  return <Link className={buttonClasses({ variant, size, className })} {...rest} />
}

/** A link to another website that looks like a button, e.g. "Register". */
export function ButtonAnchor({
  variant,
  size,
  className,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & Look & { children: ReactNode }) {
  return (
    <a className={buttonClasses({ variant, size, className })} {...rest}>
      {children}
    </a>
  )
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin motion-reduce:animate-none"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
