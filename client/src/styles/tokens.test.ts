import { describe, expect, it } from 'vitest'
import tokensCss from './tokens.css?raw'

type Tokens = Record<string, string>

function block(selectorPattern: RegExp): string {
  const match = tokensCss.match(selectorPattern)
  if (!match?.[1]) throw new Error(`Block not found: ${selectorPattern}`)
  return match[1]
}

function parseVars(css: string): Tokens {
  const tokens: Tokens = {}
  for (const [, name, value] of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    if (name && value) tokens[name] = value.trim()
  }
  return tokens
}

const light = parseVars(block(/@theme static \{([\s\S]*?)\n\}/))
const darkOverrides = parseVars(block(/:root\[data-theme='dark'\] \{([\s\S]*?)\}/))
const darkFallback = parseVars(block(/:root:not\(\[data-theme\]\) \{([\s\S]*?)\}/))
const dark: Tokens = { ...light, ...darkOverrides }

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(tokens: Tokens, foreground: string, background: string): number {
  const fg = tokens[`color-${foreground}`]
  const bg = tokens[`color-${background}`]
  if (!fg || !bg) throw new Error(`Missing token: ${foreground} or ${background}`)
  const [high, low] = [luminance(fg), luminance(bg)].sort((a, b) => b - a) as [number, number]
  return (high + 0.05) / (low + 0.05)
}

// Text needs 4.5:1 (WCAG 1.4.3); focus rings and control borders need 3:1 (WCAG 1.4.11).
const TEXT_PAIRS: [string, string][] = [
  ['text', 'surface'],
  ['text', 'surface-alt'],
  ['text-muted', 'surface'],
  ['text-muted', 'surface-alt'],
  ['text-brand', 'surface'],
  ['text-brand', 'surface-alt'],
  ['link', 'surface'],
  ['link', 'surface-alt'],
  ['danger', 'surface'],
  ['danger', 'surface-alt'],
  ['on-primary', 'primary'],
  ['on-primary', 'navy'],
  ['on-accent', 'accent'],
]
const NON_TEXT_PAIRS: [string, string][] = [
  ['focus', 'surface'],
  ['focus', 'surface-alt'],
  ['border-strong', 'surface'],
  ['border-strong', 'surface-alt'],
  ['primary-border', 'surface'],
  ['primary-bright', 'surface'],
]

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme contrast', (_mode, tokens) => {
  it.each(TEXT_PAIRS)('%s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrast(tokens, fg, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(NON_TEXT_PAIRS)('%s on %s is at least 3:1', (fg, bg) => {
    expect(contrast(tokens, fg, bg)).toBeGreaterThanOrEqual(3)
  })
})

describe('tokens', () => {
  it('keeps the dark-mode fallback identical to the data-theme block', () => {
    expect(darkFallback).toEqual(darkOverrides)
  })

  it('never uses bright green or yellow as a text colour on light surfaces', () => {
    const textTokens = ['text', 'text-muted', 'text-brand', 'link', 'danger'].map(
      (name) => light[`color-${name}`],
    )
    expect(textTokens).not.toContain(light['color-primary-bright'])
    expect(textTokens).not.toContain(light['color-accent'])
  })

  it('has the brand colours from the guidelines', () => {
    expect(light).toMatchObject({
      'color-primary': '#0e6434',
      'color-primary-bright': '#07913c',
      'color-navy': '#003463',
      'color-surface': '#ffffff',
      'color-surface-alt': '#e1e8db',
      'color-accent': '#ffbd04',
    })
  })
})

describe('type scale', () => {
  // Evaluates clamp(min rem, base rem + slope vw, max rem) in px at a viewport width.
  function sizeAt(name: string, viewport: number): number {
    const value = light[`text-${name}`] ?? ''
    const match = value.match(/clamp\(([\d.]+)rem,\s*([\d.]+)rem \+ ([\d.]+)vw,\s*([\d.]+)rem\)/)
    if (!match) throw new Error(`Not a clamp() size: --text-${name}`)
    const [min, base, slope, max] = match.slice(1).map(Number) as [number, number, number, number]
    const fluid = base * 16 + (slope * viewport) / 100
    return Math.min(Math.max(fluid, min * 16), max * 16)
  }

  it.each([
    ['h1', 36, 60],
    ['h2', 28, 44],
    ['h3', 20, 28],
    ['body', 16, 18],
    ['small', 13, 14],
  ])('%s is %ipx on phones (375 px) and %ipx on desktop (1280 px)', (name, mobile, desktop) => {
    expect(sizeAt(name, 375)).toBeCloseTo(mobile, 0)
    expect(sizeAt(name, 1280)).toBeCloseTo(desktop, 0)
    expect(sizeAt(name, 320)).toBeCloseTo(mobile, 0)
    expect(sizeAt(name, 1920)).toBeCloseTo(desktop, 0)
  })
})
