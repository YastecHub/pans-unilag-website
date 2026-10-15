import mongoose from 'mongoose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CommitteeModel } from '../src/modules/committees/infrastructure/committee.model.js'
import { mongoCommitteeReader } from '../src/modules/committees/infrastructure/committee.repository.js'
import { ExecutiveModel } from '../src/modules/executives/infrastructure/executive.model.js'
import { mongoExecutiveReader } from '../src/modules/executives/infrastructure/executive.repository.js'

/** Runs only when MONGODB_URI_TEST points at a throwaway database (see seed.integration.test.ts). */
const uri = process.env.MONGODB_URI_TEST
const session = '1999/2000' // a session no real data uses

describe.skipIf(!uri)('leadership readers against a real MongoDB', () => {
  const cleanUp = async () => {
    await ExecutiveModel.deleteMany({ session })
    await CommitteeModel.deleteMany({ session })
  }

  beforeAll(async () => {
    await mongoose.connect(uri!)
    await cleanUp()
    await ExecutiveModel.create([
      { session, office: 'Vice President', order: 2, name: 'B' },
      { session, office: 'President', order: 1, name: 'A' },
    ])
    await CommitteeModel.create({
      slug: 'integration-test-committee',
      name: 'Integration Test Committee',
      shortName: 'ITC',
      session,
      order: 1,
      description: 'Text',
    })
  })

  afterAll(async () => {
    await cleanUp()
    await mongoose.disconnect()
  })

  it('lists a session in order with defaults filled in', async () => {
    expect(await mongoExecutiveReader.sessions()).toContain(session)
    const executives = await mongoExecutiveReader.listBySession(session)
    expect(executives.map((e) => e.office)).toEqual(['President', 'Vice President'])
    expect(executives[0]).toMatchObject({ bio: '', photo: '', isPlaceholder: false })
    expect(executives[0]).not.toHaveProperty('_id')
  })

  it('finds a committee by slug', async () => {
    expect(await mongoCommitteeReader.findBySlug('integration-test-committee')).toMatchObject({
      shortName: 'ITC',
      officers: [],
    })
    expect(await mongoCommitteeReader.findBySlug('no-such-committee')).toBeNull()
  })
})
