import mongoose, { Schema } from 'mongoose'
import { describe, expect, it } from 'vitest'
import { contentPlugin } from '../src/lib/contentPlugin.js'

const schema = new Schema({ title: { type: String, required: true } })
schema.plugin(contentPlugin)
const Thing = mongoose.models.PluginThing ?? mongoose.model('PluginThing', schema)

describe('contentPlugin', () => {
  it('adds placeholder fields with safe defaults and timestamps', () => {
    const doc = new Thing({ title: 'Committees' })
    expect(doc.get('isPlaceholder')).toBe(false)
    expect(doc.get('placeholderNote')).toBe('')
    expect(schema.get('timestamps')).toBe(true)
    expect(schema.path('isPlaceholder').options.index).toBe(true)
  })

  it('requires a note saying what is missing when the item is a placeholder', async () => {
    const error = await new Thing({ title: 'Vice President', isPlaceholder: true })
      .validate()
      .catch((e: unknown) => e)
    expect(String(error)).toMatch(/placeholderNote is required when isPlaceholder is true/)

    await expect(
      new Thing({
        title: 'Vice President',
        isPlaceholder: true,
        placeholderNote: 'Name to be announced',
      }).validate(),
    ).resolves.toBeUndefined()
  })

  it('rejects unknown fields instead of dropping them (catches typos in seed files)', () => {
    expect(() => new Thing({ title: 'x', titel: 'typo' })).toThrow(/titel/)
  })

  it('serialises with id instead of _id and without __v', () => {
    const json = new Thing({ title: 'Senate' }).toJSON() as Record<string, unknown>
    expect(json.id).toEqual(expect.any(String))
    expect(json).not.toHaveProperty('_id')
    expect(json).not.toHaveProperty('__v')
  })
})
