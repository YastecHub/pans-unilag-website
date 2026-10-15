import { describe, expect, it } from 'vitest'
import { EnvError, loadEnv } from '../src/config/env.js'

const valid = { MONGODB_URI: 'mongodb://localhost:27017/pans' }

describe('loadEnv', () => {
  it('applies defaults', () => {
    const env = loadEnv(valid)

    expect(env.NODE_ENV).toBe('development')
    expect(env.PORT).toBe(4000)
    expect(env.CLIENT_ORIGIN).toEqual(['http://localhost:5173'])
  })

  it('stops with a readable message when MONGODB_URI is missing', () => {
    expect(() => loadEnv({})).toThrow(EnvError)
    expect(() => loadEnv({})).toThrow(/MONGODB_URI is required/)
  })

  it('rejects a connection string that is not MongoDB', () => {
    expect(() => loadEnv({ MONGODB_URI: 'postgres://db' })).toThrow(
      /mongodb:\/\/ or mongodb\+srv:\/\//,
    )
  })

  it('splits CLIENT_ORIGIN on commas', () => {
    const env = loadEnv({ ...valid, CLIENT_ORIGIN: 'https://pans.example, http://localhost:5173' })

    expect(env.CLIENT_ORIGIN).toEqual(['https://pans.example', 'http://localhost:5173'])
  })

  it('rejects an invalid PORT', () => {
    expect(() => loadEnv({ ...valid, PORT: 'abc' })).toThrow(/PORT/)
  })
})
