import type { ThemePreference } from '../../lib/theme.ts'
import { useThemePreference } from '../../lib/useThemePreference.ts'
import { MonitorIcon, MoonIcon, SunIcon } from './icons.tsx'

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}

const LABEL: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
}

/** Header button that cycles System → Light → Dark. The choice is remembered on this device. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [preference, setPreference] = useThemePreference()
  const Icon = preference === 'dark' ? MoonIcon : preference === 'light' ? SunIcon : MonitorIcon

  return (
    <button
      type="button"
      onClick={() => setPreference(NEXT[preference])}
      aria-label={`Theme: ${LABEL[preference]}. Switch to ${LABEL[NEXT[preference]]}`}
      title={`Theme: ${LABEL[preference]}`}
      className={`size-11 items-center justify-center rounded-lg text-text hover:bg-surface-alt ${className}`}
    >
      <Icon />
    </button>
  )
}

/** The same choice as three radio buttons, for the mobile menu. */
export function ThemeChoice() {
  const [preference, setPreference] = useThemePreference()

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-small text-text-muted">Theme</legend>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(LABEL) as ThemePreference[]).map((option) => (
          <label
            key={option}
            className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg font-medium ${
              preference === option
                ? 'border-2 border-primary-border bg-surface-alt'
                : 'border border-border-strong'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={option}
              checked={preference === option}
              onChange={() => setPreference(option)}
              className="accent-primary"
            />
            {LABEL[option]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
