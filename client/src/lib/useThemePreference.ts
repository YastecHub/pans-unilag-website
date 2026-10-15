import { useSyncExternalStore } from 'react'
import {
  getThemePreference,
  setThemePreference,
  subscribeToThemePreference,
  type ThemePreference,
} from './theme.ts'

/** The visitor's theme choice ("system", "light" or "dark") and a function to change it. */
export function useThemePreference(): [ThemePreference, (preference: ThemePreference) => void] {
  const preference = useSyncExternalStore(
    subscribeToThemePreference,
    getThemePreference,
    () => 'system' as const,
  )
  return [preference, setThemePreference]
}
