import mongoose from 'mongoose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PageModel } from '../src/modules/pages/infrastructure/page.model.js'
import { mongoPageReader } from '../src/modules/pages/infrastructure/page.repository.js'

/** Runs only when MONGODB_URI_TEST points at a throwaway database (see seed.integration.test.ts). */
const uri = process.env.MONGODB_URI_TEST
const slug = 'integration-test-page'

describe.skipIf(!uri)('mongoPageReader against a real MongoDB', () => {
  beforeAll(async () => {
    await mongoose.connect(uri!)
    await PageModel.deleteOne({ slug })
    await PageModel.create({
      slug,
      title: 'Integration test',
      order: 99,
      sections: [{ heading: 'One', bodyMarkdown: 'Text', articleRefs: ['Art. 19'] }],
    })
  })

  afterAll(async () => {
    await PageModel.deleteOne({ slug })
    await mongoose.disconnect()
  })

  it('reads a page as its public view', async () => {
    const page = await mongoPageReader.findBySlug(slug)

    expect(page).toMatchObject({
      slug,
      isPlaceholder: false,
      sections: [{ heading: 'One', bodyMarkdown: 'Text', articleRefs: ['Art. 19'] }],
    })
    expect(page).not.toHaveProperty('_id')
    expect(page?.updatedAt).toMatch(/Z$/)
  })

  it('returns null for an unknown slug', async () => {
    expect(await mongoPageReader.findBySlug('no-such-page')).toBeNull()
  })
})
