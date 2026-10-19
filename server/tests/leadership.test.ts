import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  EXECUTIVE_OFFICES,
  ExecutiveModel,
} from '../src/modules/executives/infrastructure/executive.model.js'
import { PatronModel } from '../src/modules/patrons/infrastructure/patron.model.js'
import {
  SENATE_POSITIONS,
  SenatorModel,
} from '../src/modules/senate/infrastructure/senator.model.js'

type Row = Record<string, unknown>
const load = (file: string) =>
  JSON.parse(readFileSync(new URL(`../seed/${file}`, import.meta.url), 'utf8')) as Row[]
const executives = load('executives.json')
const senate = load('senate.json')
const patrons = load('patrons.json')

describe('leadership seed files', () => {
  it('lists the 14 executive offices in constitutional order', () => {
    expect(executives.map((e) => e.office)).toEqual([...EXECUTIVE_OFFICES])
    expect(executives.map((e) => e.order)).toEqual(EXECUTIVE_OFFICES.map((_, i) => i + 1))
  })

  it('names the 12 provided executives with bios; Treasurer and Financial Secretary remain placeholders', () => {
    expect(executives[0]).toMatchObject({
      office: 'President',
      name: 'Abigail Moejoh',
      isPlaceholder: false,
    })
    const placeholders = executives.filter((e) => e.isPlaceholder === true)
    expect(placeholders.map((e) => e.office)).toEqual(['Treasurer', 'Financial Secretary'])
    expect(placeholders.every((e) => e.name === 'Name to be announced')).toBe(true)
    const active = executives.filter((e) => e.isPlaceholder === false)
    expect(active).toHaveLength(12)
    expect(active.every((e) => typeof e.bio === 'string' && e.bio.length > 0)).toBe(true)
  })

  it('lists only the four principal officers of the Senate, pending election', () => {
    expect(senate.map((s) => s.position)).toEqual([...SENATE_POSITIONS])
    expect(senate.every((s) => s.name === 'Election pending' && s.isPlaceholder === true)).toBe(
      true,
    )
  })

  it('has the Dean and four other patrons, all to be named', () => {
    expect(patrons).toHaveLength(5)
    expect(patrons.filter((p) => p.isDean)).toHaveLength(1)
    expect(
      patrons.every((p) => p.name === 'Name to be announced' && p.isPlaceholder === true),
    ).toBe(true)
  })

  it('contains no phone numbers or email addresses', () => {
    const text = JSON.stringify([executives, senate, patrons])
    expect(text).not.toMatch(/\d{7,}|[\w.+-]+@[\w-]+\.\w/)
  })
})

describe('leadership models', () => {
  const executive = { session: '2026/2027', office: 'President', order: 1, name: 'Abigail Moejoh' }

  it.each([
    ['an office the constitution does not have', { office: 'Chairman' }, /office/],
    ['a malformed session', { session: '2026/2028' }, /session must look like/],
    ['a bio longer than 200 words', { bio: 'word '.repeat(201) }, /200 words or fewer/],
    [
      'a photo URL instead of a Cloudinary id',
      { photo: 'https://drive.google.com/x' },
      /Cloudinary public id/,
    ],
  ])('rejects %s', async (_case, change, message) => {
    await expect(new ExecutiveModel({ ...executive, ...change }).validate()).rejects.toThrow(
      message,
    )
  })

  it('accepts a complete officer', async () => {
    await expect(
      new ExecutiveModel({
        ...executive,
        level: '500L',
        bio: 'Pharmacy student.',
        photo: 'pans-unilag/executives/2026-2027/president',
      }).validate(),
    ).resolves.toBeUndefined()
  })

  it('rejects a Senate position that is not a principal office', async () => {
    await expect(
      new SenatorModel({
        session: '2026/2027',
        position: 'Senator',
        order: 5,
        name: 'x',
      }).validate(),
    ).rejects.toThrow(/position/)
  })

  it('requires a patron title', async () => {
    await expect(new PatronModel({ order: 1, name: 'x' }).validate()).rejects.toThrow(/title/)
  })
})
