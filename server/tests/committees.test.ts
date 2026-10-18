import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CommitteeModel } from '../src/modules/committees/infrastructure/committee.model.js'

type Committee = Record<string, unknown> & {
  slug: string
  officers: { title: string; name: string }[]
}
const committees = JSON.parse(
  readFileSync(new URL('../seed/committees.json', import.meta.url), 'utf8'),
) as Committee[]

describe('seed/committees.json', () => {
  it('has the 11 committees of 2026/27 in the announced order', () => {
    expect(committees.map((c) => c.slug)).toEqual([
      'admap',
      'content',
      'media',
      'design',
      'ppht',
      'sdg',
      'research-club',
      'cpd-cbc',
      'academics',
      'alumni-network',
      'ipsf',
    ])
    expect(committees.map((c) => c.order)).toEqual(committees.map((_, i) => i + 1))
  })

  it('gives every committee two named officers', () => {
    for (const c of committees) {
      expect(c.officers, c.slug).toHaveLength(2)
      expect(c.officers.every((o) => o.title && o.name)).toBe(true)
    }
  })

  it('gives every committee a full description and write-up', () => {
    expect(committees.filter((c) => c.isPlaceholder)).toEqual([])
    expect(committees.every((c) => Boolean(c.description))).toBe(true)
  })

  it('keeps the SDG motto and the constitutional name', () => {
    expect(committees.find((c) => c.slug === 'sdg')?.motto).toBe(
      'From Awareness to Action, From Service to Impact',
    )
    const text = JSON.stringify(committees)
    expect(text).not.toMatch(/Nigerian Students/)
    expect(text).not.toMatch(/\d{7,}|[\w.+-]+@[\w-]+\.\w/)
  })
})

describe('Committee model', () => {
  const base = {
    slug: 'ppht',
    name: 'PANS Public Health Team',
    shortName: 'PPHT',
    session: '2026/2027',
    order: 5,
  }

  it('needs a description unless the committee is a placeholder', async () => {
    await expect(new CommitteeModel(base).validate()).rejects.toThrow(/description is required/)
    await expect(
      new CommitteeModel({
        ...base,
        isPlaceholder: true,
        placeholderNote: 'Write-up needed',
      }).validate(),
    ).resolves.toBeUndefined()
  })

  it('rejects an officer without a name', async () => {
    await expect(
      new CommitteeModel({ ...base, description: 'x', officers: [{ title: 'Lead' }] }).validate(),
    ).rejects.toThrow(/name/)
  })
})
