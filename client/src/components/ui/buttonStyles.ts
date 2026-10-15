export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'sm'

const VARIANTS: Record<ButtonVariant, string> = {
  /** Main action: dark green. */
  primary: 'border-2 border-primary-border bg-primary text-on-primary hover:bg-navy',
  /** Second action: navy. */
  secondary: 'border-2 border-navy bg-navy text-on-primary hover:bg-primary',
  /** Call to action on green or navy backgrounds (hero): yellow with dark text. */
  accent: 'border-2 border-accent bg-accent text-on-accent hover:bg-surface-alt',
  /** Quiet action on light backgrounds. */
  outline: 'border-2 border-primary-border bg-transparent text-text-brand hover:bg-surface-alt',
  /** Minimal: icon buttons, "Cancel". */
  ghost: 'border-2 border-transparent bg-transparent text-text hover:bg-surface-alt',
  /** Destructive, e.g. "Delete event". Text only, never a red block. */
  danger: 'border-2 border-transparent bg-transparent text-danger underline hover:bg-surface-alt',
}

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-12 px-6 text-base',
  sm: 'min-h-10 px-4 text-small',
}

/** Classes for anything that should look like a button (a <button> or a link). */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className = '',
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return [
    'inline-flex items-center justify-center gap-2 rounded-lg font-heading font-medium no-underline',
    'transition-colors disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(' ')
}
