import { describe, expect, it } from 'vitest'
import html from '../../index.html?raw'
import vercelJson from '../../../vercel.json?raw'

type HeaderRule = { source: string; headers: { key: string; value: string }[] }
const rules = (JSON.parse(vercelJson) as { headers: HeaderRule[] }).headers
const site = rules.find((r) => r.source === '/(.*)')!.headers
const header = (key: string) => site.find((h) => h.key === key)?.value ?? ''
const csp = Object.fromEntries(
  header('Content-Security-Policy')
    .split(';')
    .map((part) => part.trim().split(/\s+/))
    .map(([name, ...values]) => [name, values]),
)

async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
}

describe('security headers (vercel.json)', () => {
  it('allows only our own scripts, plus the inline theme script by its exact hash', async () => {
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]!)
    expect(inline).toHaveLength(1)
    // If this fails after editing the theme script in index.html, put the new hash in vercel.json.
    expect(csp['script-src']).toEqual(["'self'", `'sha256-${await sha256(inline[0]!)}'`])
  })

  it('locks everything else down', () => {
    expect(csp['default-src']).toEqual(["'self'"])
    expect(csp['object-src']).toEqual(["'none'"])
    expect(csp['frame-ancestors']).toEqual(["'none'"])
    expect(csp['base-uri']).toEqual(["'self'"])
    expect(csp['form-action']).toEqual(["'self'"])
    // Photos come from Cloudinary; dashboard uploads go straight to its API.
    expect(csp['img-src']).toContain('https://res.cloudinary.com')
    expect(csp['connect-src']).toEqual(["'self'", 'https://api.cloudinary.com'])
    expect(header('X-Frame-Options')).toBe('DENY')
    expect(header('X-Content-Type-Options')).toBe('nosniff')
    expect(header('Strict-Transport-Security')).toMatch(/max-age=\d{8,}/)
    expect(header('Permissions-Policy')).toContain('camera=()')
  })
})
