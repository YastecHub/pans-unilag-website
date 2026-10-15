import { describe, expect, it } from 'vitest'
import { AnnouncementModel } from '../src/modules/announcements/infrastructure/announcement.model.js'
import { DocumentModel } from '../src/modules/documents/infrastructure/document.model.js'
import { OpportunityModel } from '../src/modules/opportunities/infrastructure/opportunity.model.js'
import { PublicationModel } from '../src/modules/publications/infrastructure/publication.model.js'
import { ResourceModel } from '../src/modules/resources/infrastructure/resource.model.js'

/** Paths that fail validation, or [] when the document is valid. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const invalidPaths = (Model: any, fields: object) =>
  Object.keys(new Model(fields).validateSync()?.errors ?? {}).sort()

describe('content model rules', () => {
  it('announcement: expiresAt must come after publishAt; links must be https', () => {
    const base = { title: 'Notice', body: 'Text', publishAt: new Date('2026-10-16') }
    expect(invalidPaths(AnnouncementModel, base)).toEqual([])
    expect(invalidPaths(AnnouncementModel, { ...base, expiresAt: new Date('2026-10-15') })).toEqual(
      ['expiresAt'],
    )
    expect(invalidPaths(AnnouncementModel, { ...base, link: 'http://example.com' })).toEqual([
      'link',
    ])
  })

  it('opportunity: applyUrl is required unless the listing is a placeholder', () => {
    const base = { slug: 'nafdac-internship', title: 'Internship', type: 'internship' }
    expect(invalidPaths(OpportunityModel, base)).toEqual(['applyUrl'])
    expect(invalidPaths(OpportunityModel, { ...base, applyUrl: 'https://example.com' })).toEqual([])
    expect(
      invalidPaths(OpportunityModel, {
        ...base,
        isPlaceholder: true,
        placeholderNote: 'Link to come',
      }),
    ).toEqual([])
    expect(
      invalidPaths(OpportunityModel, { ...base, type: 'lottery', applyUrl: 'https://x.org' }),
    ).toEqual(['type'])
  })

  it('publication: needs a file or a link unless it is a placeholder', () => {
    const base = { slug: 'recipharm-2026', title: 'Recipharm 2026', series: 'recipharm' }
    expect(invalidPaths(PublicationModel, base)).toEqual(['fileUrl'])
    expect(invalidPaths(PublicationModel, { ...base, fileUrl: 'https://x.org/r.pdf' })).toEqual([])
    expect(invalidPaths(PublicationModel, { ...base, link: 'https://pans.substack.com' })).toEqual(
      [],
    )
  })

  it('document: fileUrl is required unless a placeholder; slug + version is unique', () => {
    const base = {
      slug: 'constitution',
      title: 'Constitution',
      version: '2026',
      approvedOn: new Date(),
    }
    expect(invalidPaths(DocumentModel, base)).toEqual(['fileUrl'])
    expect(invalidPaths(DocumentModel, { ...base, fileUrl: 'https://x.org/c.pdf' })).toEqual([])
    expect(
      DocumentModel.schema
        .indexes()
        .some(
          ([fields, options]) => options?.unique && Object.keys(fields).join() === 'slug,version',
        ),
    ).toBe(true)
  })

  it('resource: url and verifiedBy are required unless a placeholder', () => {
    const base = { title: 'Notes', level: '200L', semester: 'first' }
    expect(invalidPaths(ResourceModel, base)).toEqual(['url', 'verifiedBy'])
    expect(
      invalidPaths(ResourceModel, {
        ...base,
        url: 'https://x.org',
        verifiedBy: 'Academics Committee',
      }),
    ).toEqual([])
    expect(invalidPaths(ResourceModel, { ...base, semester: 'third' })).toContain('semester')
  })
})
