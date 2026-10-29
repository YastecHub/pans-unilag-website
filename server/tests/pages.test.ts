import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PageModel } from '../src/modules/pages/infrastructure/page.model.js'

type Section = { heading: string; bodyMarkdown: string; articleRefs: string[] }
type SeedPage = { slug: string; title: string; order: number; sections: Section[] }

const pages = JSON.parse(
  readFileSync(new URL('../seed/pages.json', import.meta.url), 'utf8'),
) as SeedPage[]
const text = JSON.stringify(pages)

describe('seed/pages.json', () => {
  it('has every page the site map needs', () => {
    expect(pages.map((p) => p.slug)).toEqual(
      expect.arrayContaining([
        'who-we-are',
        'membership-and-rights',
        'governance',
        'executive-council',
        'senate',
        'elections',
        'finance-and-accountability',
        'meetings-and-procedures',
        'student-support',
        'constitution',
        'contact',
      ]),
    )
  })

  it('uses the constitutional name, never "Nigerian Students"', () => {
    expect(text).toContain('Pharmaceutical Association of Nigeria Students')
    expect(text).not.toMatch(/Nigerian Students/)
  })

  it('cites an article for every section that comes from the constitution', () => {
    // The Association's own introduction and closing words on the About page aren't from the
    // constitution, so they carry no article reference.
    const ownWords = new Set(['who-we-are: About PANS UNILAG', 'who-we-are: Our commitment'])
    for (const page of pages) {
      for (const section of page.sections) {
        const name = `${page.slug}: ${section.heading}`
        if (ownWords.has(name)) continue
        expect(section.articleRefs.length, name).toBeGreaterThan(0)
      }
    }
  })

  it('has a unique order for each page', () => {
    expect(new Set(pages.map((p) => p.order)).size).toBe(pages.length)
  })

  it('contains no personal phone numbers or email addresses', () => {
    expect(text).not.toMatch(/\+?234\d{7,}|\b0[789][01]\d{8}\b/)
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/)
  })
})

describe('Page model', () => {
  const valid = {
    slug: 'who-we-are',
    title: 'Who we are',
    order: 1,
    sections: [
      { heading: 'Motto', bodyMarkdown: 'Service to Humanity', articleRefs: ['Art. 2 S.B'] },
    ],
  }

  it('accepts a valid page', async () => {
    await expect(new PageModel(valid).validate()).resolves.toBeUndefined()
  })

  it.each([
    ['a slug with spaces', { slug: 'Who We Are' }, /slug must be lower-case/],
    ['no sections', { sections: [] }, /at least one section/],
    [
      'a malformed article reference',
      { sections: [{ ...valid.sections[0], articleRefs: ['Article 2'] }] },
      /articleRefs must look like/,
    ],
  ])('rejects %s', async (_case, change, message) => {
    await expect(new PageModel({ ...valid, ...change }).validate()).rejects.toThrow(message)
  })
})
