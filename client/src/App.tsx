import { useState } from 'react'
import { getThemePreference, setThemePreference, type ThemePreference } from './lib/theme.ts'

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

/**
 * Temporary brand preview so reviewers can check tokens, fonts and dark mode.
 * Replaced by the real app shell (routing, header, footer, theme toggle) in issue #6.
 */
export default function App() {
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference)

  const chooseTheme = (value: ThemePreference) => {
    setTheme(value)
    setThemePreference(value)
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-small text-text-muted">Brand preview (temporary)</p>
        <h1>PANS UNILAG</h1>
        <p>Pharmaceutical Association of Nigeria Students, University of Lagos</p>
        <p className="font-heading text-h3 text-text-brand">Service to Humanity</p>
      </header>

      <fieldset className="flex flex-wrap items-center gap-3 border-0 p-0">
        <legend className="mb-2 font-heading font-medium">Theme</legend>
        {THEME_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-border-strong px-3 py-2"
          >
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={theme === option.value}
              onChange={() => chooseTheme(option.value)}
              className="accent-primary"
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <section className="flex flex-col gap-3" aria-labelledby="type-heading">
        <h2 id="type-heading">Type scale</h2>
        <h3>Heading 3 in Poppins</h3>
        <p>
          Body text in Inter. Sizes scale smoothly from phones to desktops. A{' '}
          <a href="#type-heading">link looks like this</a>.
        </p>
        <p className="text-small text-text-muted">Small text for dates and labels.</p>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="ui-heading">
        <h2 id="ui-heading">Buttons and highlights</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-md border-2 border-primary-border bg-primary px-4 py-2 font-heading font-medium text-on-primary"
          >
            Primary
          </button>
          <button
            type="button"
            className="rounded-md bg-navy px-4 py-2 font-heading font-medium text-on-primary"
          >
            Secondary
          </button>
          <span className="self-center rounded-full bg-accent px-3 py-1 text-small font-medium text-on-accent">
            New
          </span>
        </div>
        <div className="rounded-lg border-2 border-dashed border-text-muted bg-surface-alt p-6 text-text-muted">
          Coming soon: placeholder style
        </div>
        <p className="text-danger">Error text looks like this.</p>
      </section>
    </main>
  )
}
