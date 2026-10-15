import { describe, expect, it } from 'vitest'
import { AlumnusModel } from '../src/modules/submissions/infrastructure/alumnus.model.js'
import { FeedbackModel } from '../src/modules/submissions/infrastructure/feedback.model.js'

describe('submission models', () => {
  it('deletes feedback 12 months after it arrives (TTL index)', () => {
    const ttl = FeedbackModel.schema
      .indexes()
      .find(([fields]) => Object.keys(fields).join() === 'createdAt')
    expect(ttl?.[1]?.expireAfterSeconds).toBe(365 * 24 * 60 * 60)
    expect(FeedbackModel.collection.collectionName).toBe('feedback')
  })

  it('keeps one alumni entry per email', () => {
    expect(AlumnusModel.schema.path('email').options.unique).toBe(true)
    expect(AlumnusModel.collection.collectionName).toBe('alumni')
  })

  it('rejects fields the forms do not send', () => {
    expect(
      () => new FeedbackModel({ category: 'other', message: 'Hello there', extra: 1 }),
    ).toThrow()
  })
})
