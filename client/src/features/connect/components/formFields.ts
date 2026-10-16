import type { ReactNode } from 'react'

export const inputClass =
  'min-h-12 w-full rounded-lg border-2 border-border-strong bg-surface px-3 text-base text-text aria-[invalid=true]:border-danger'

/** The ids a field's hint and error use, for aria-describedby. */
export const describedBy = (id: string, hint?: ReactNode, error?: string) =>
  [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
