import { createApp, type Readers } from '../src/app.js'
import { seedReaders } from './seedReaders.js'

export const ALLOWED_ORIGIN = 'http://localhost:5173'

/** The app with in-memory readers over the seed files (override any with `readers`). */
export function testApp(
  options: { isProduction?: boolean; docsEnabled?: boolean; readers?: Partial<Readers> } = {},
) {
  return createApp({
    clientOrigins: [ALLOWED_ORIGIN],
    isProduction: options.isProduction ?? false,
    docsEnabled: options.docsEnabled ?? false,
    readers: { ...seedReaders(), ...options.readers },
  })
}
