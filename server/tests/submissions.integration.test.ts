import mongoose from 'mongoose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AlumnusModel } from '../src/modules/submissions/infrastructure/alumnus.model.js'
import { FeedbackModel } from '../src/modules/submissions/infrastructure/feedback.model.js'
import { mongoSubmissionStore } from '../src/modules/submissions/infrastructure/submission.store.js'

/** Runs only when MONGODB_URI_TEST points at a throwaway database (see seed.integration.test.ts). */
const uri = process.env.MONGODB_URI_TEST
const email = 'integration-test@example.com'
const marker = 'Integration test feedback message'

describe.skipIf(!uri)('submission store against a real MongoDB', () => {
  const cleanUp = async () => {
    await AlumnusModel.deleteMany({ email })
    await FeedbackModel.deleteMany({ message: marker })
  }

  beforeAll(async () => {
    await mongoose.connect(uri!)
    await AlumnusModel.syncIndexes()
    await cleanUp()
  })

  afterAll(async () => {
    await cleanUp()
    await mongoose.disconnect()
  })

  it('saves feedback as new', async () => {
    await mongoSubmissionStore.saveFeedback({ category: 'other', message: marker })
    expect(await FeedbackModel.findOne({ message: marker }).lean()).toMatchObject({ status: 'new' })
  })

  it('updates an alumni entry when the same email signs up again', async () => {
    const base = { name: 'Test', graduationYear: 2020, interests: [], consentAt: new Date() }
    await mongoSubmissionStore.saveAlumnus({
      ...base,
      email: email.toUpperCase(),
      phone: '08012345678',
    })
    await mongoSubmissionStore.saveAlumnus({ ...base, email, graduationYear: 2021 })

    const entries = await AlumnusModel.find({ email }).lean()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ graduationYear: 2021 })
    expect(entries[0]).not.toHaveProperty('phone')
  })
})
