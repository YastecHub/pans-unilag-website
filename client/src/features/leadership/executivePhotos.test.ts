import { describe, expect, it } from 'vitest'
import { bundledExecutivePhoto, bundledTeamPhoto } from './executivePhotos.ts'

/** The 14 offices (Art. 6), as in server/src/modules/executives/infrastructure/executive.model.ts. */
const EXECUTIVE_OFFICES = [
  'President',
  'Vice President',
  'Secretary General',
  'Assistant Secretary General',
  'Treasurer',
  'Financial Secretary',
  'Public Relations Officer',
  'Assistant Public Relations Officer',
  'Editor-in-Chief',
  'Social Secretary',
  'Assistant Social Secretary',
  'Sports Secretary',
  'Assistant Sports Secretary',
  'Welfare Secretary',
]

describe('bundled Executive Council photos', () => {
  it('has a portrait for every 2026/2027 office and the group photo', () => {
    for (const office of EXECUTIVE_OFFICES)
      expect(bundledExecutivePhoto('2026/2027', office), office).toMatch(/\.webp$/)
    expect(bundledTeamPhoto('2026/2027')).toMatch(/team.*\.webp$/)
  })

  it('has none for other sessions, so their cards keep the placeholder', () => {
    expect(bundledExecutivePhoto('2027/2028', 'President')).toBeUndefined()
    expect(bundledTeamPhoto('2027/2028')).toBeUndefined()
  })
})
