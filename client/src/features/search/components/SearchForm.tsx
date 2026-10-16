import { type FormEvent, type Ref, useState } from 'react'
import { useNavigate } from 'react-router'
import { SearchIcon } from '../../../components/ui/icons.tsx'
import { normaliseQuery, QUERY_MAX } from '../api.ts'

type Props = {
  /** Unique per page: the header's form and the results page's form can both be on screen. */
  id: string
  initialQuery?: string
  inputRef?: Ref<HTMLInputElement>
  /** Called after navigating, e.g. so the header can close its search bar. */
  onSearch?: () => void
  className?: string
}

/** A labelled search box (role="search") that goes to /search?q=… on Enter or the button. */
export function SearchForm({ id, initialQuery = '', inputRef, onSearch, className = '' }: Props) {
  const navigate = useNavigate()
  const [value, setValue] = useState(initialQuery)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const q = normaliseQuery(value)
    if (!q) return
    navigate(`/search?${new URLSearchParams({ q })}`)
    onSearch?.()
  }

  return (
    <form role="search" onSubmit={submit} className={`flex gap-2 ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search the site
      </label>
      <input
        ref={inputRef}
        id={id}
        name="q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={QUERY_MAX}
        placeholder="Search events, committees, opportunities…"
        autoComplete="off"
        enterKeyHint="search"
        className="min-h-12 min-w-0 flex-1 rounded-lg border-2 border-border-strong bg-surface px-3 text-base text-text"
      />
      <button
        type="submit"
        className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-primary-border bg-primary px-4 font-heading font-medium text-on-primary hover:bg-navy"
      >
        <SearchIcon className="size-5" />
        <span className="max-sm:sr-only">Search</span>
      </button>
    </form>
  )
}
