/**
 * Light/dark theme. The choice is saved per browser; "system" follows the device setting.
 * index.html runs the same logic inline before the first paint so the page never flashes
 * the wrong theme. Keep THEME_STORAGE_KEY in sync with that script (theme.test.ts checks it).
 */
export type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'system'

export const THEME_STORAGE_KEY = 'pans-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'
const CHANGE_EVENT = 'pans:theme-change'

function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
}

export function getThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Storage can be blocked (private mode, strict settings): fall back to the system setting.
  }
  return 'system'
}

export function resolveTheme(
  preference: ThemePreference,
  prefersDark = systemPrefersDark(),
): Theme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light'
  return preference
}

/** Applies a theme to <html> and updates the mobile browser bar colour from the tokens. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  const barColour = getComputedStyle(root).getPropertyValue('--color-browser-bar').trim()
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta && barColour) meta.content = barColour
}

/** Saves the visitor's choice ("system" clears it) and applies it immediately. */
export function setThemePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Not saved, but still applied for this visit.
  }
  applyTheme(resolveTheme(preference))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/**
 * Calls `onChange` when the saved choice changes, in this tab or another one.
 * Used by useThemePreference so every theme control on the page stays in sync.
 */
export function subscribeToThemePreference(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/**
 * Re-applies the theme when the device setting changes and the visitor chose "system".
 * Returns a function that stops listening (use it in a React effect cleanup).
 */
export function watchSystemTheme(): () => void {
  if (typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia(DARK_QUERY)
  const onChange = () => {
    if (getThemePreference() === 'system') applyTheme(resolveTheme('system', query.matches))
  }
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
