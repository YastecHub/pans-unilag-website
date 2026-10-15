import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import indexHtml from '../../index.html?raw'
import {
  THEME_STORAGE_KEY,
  applyTheme,
  getThemePreference,
  resolveTheme,
  setThemePreference,
} from './theme.ts'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.head.innerHTML = '<meta name="theme-color" content="#0e6434" />'
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('theme', () => {
  it('defaults to the system setting', () => {
    expect(getThemePreference()).toBe('system')
  })

  it('resolves "system" from the device setting', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('saves and applies an explicit choice', () => {
    setThemePreference('dark')

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(getThemePreference()).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('clears the saved choice when switching back to system', () => {
    setThemePreference('dark')
    setThemePreference('system')

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    // jsdom has no matchMedia, so "system" resolves to light.
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('ignores unexpected saved values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple')

    expect(getThemePreference()).toBe('system')
  })

  it('still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(getThemePreference()).toBe('system')
    expect(() => setThemePreference('dark')).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('updates the browser bar colour from the --color-browser-bar token', () => {
    document.documentElement.style.setProperty('--color-browser-bar', '#0b1a12')

    applyTheme('dark')

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    expect(meta?.content).toBe('#0b1a12')
  })

  it('uses the same storage key as the pre-paint script in index.html', () => {
    expect(indexHtml).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`)
    expect(indexHtml).toContain("setAttribute('data-theme', theme)")
  })
})
