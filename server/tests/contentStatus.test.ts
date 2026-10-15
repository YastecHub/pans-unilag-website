import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { fileStatus, formatReport, labelFor } from '../src/seed/contentStatus.js'

const seed = (file: string) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../seed/${file}`, import.meta.url)), 'utf8'))

describe('content status report', () => {
  it('names each document by office, position, title and slug, then name', () => {
    expect(labelFor({ office: 'Vice President', name: 'Name to be announced' }, 0)).toBe(
      'Vice President',
    )
    expect(labelFor({ position: 'Chief Whip' }, 0)).toBe('Chief Whip')
    expect(labelFor({ title: 'Trade Fair', slug: 'health-week-2026-day-2' }, 0)).toBe(
      'Trade Fair (health-week-2026-day-2)',
    )
    expect(labelFor({ slug: 'media', name: 'Media Committee' }, 0)).toBe('Media Committee')
    expect(labelFor({}, 2)).toBe('item 3')
  })

  it('groups placeholders by note and skips finished items', () => {
    const status = fileStatus('x.json', [
      { name: 'A', isPlaceholder: true, placeholderNote: 'Bio needed' },
      { name: 'B', isPlaceholder: false },
      { name: 'C', isPlaceholder: true, placeholderNote: 'Bio needed' },
      { name: 'D', isPlaceholder: true },
    ])
    expect(status).toEqual({
      file: 'x.json',
      total: 4,
      missing: [
        { note: 'Bio needed', items: ['A', 'C'] },
        { note: 'No note given', items: ['D'] },
      ],
    })
  })

  it('prints one checkbox per note and marks complete files', () => {
    const report = formatReport([
      fileStatus('senate.json', seed('senate.json')),
      fileStatus('grading.json', seed('grading.json')),
    ])
    expect(report).toContain('4 of 5 seeded items are placeholders')
    expect(report).toContain('### senate.json: 4 of 4 placeholders')
    expect(report).toMatch(
      /- \[ \] The 2026\/27 Senate election has not been held yet \(4\): Senate President, /,
    )
    expect(report).toContain('### grading.json: complete')
  })
})
