import { createApp, type Readers } from '../src/app.js'

export const ALLOWED_ORIGIN = 'http://localhost:5173'

export function testApp(
  options: { isProduction?: boolean; docsEnabled?: boolean; readers?: Partial<Readers> } = {},
) {
  return createApp({
    clientOrigins: [ALLOWED_ORIGIN],
    isProduction: options.isProduction ?? false,
    docsEnabled: options.docsEnabled ?? false,
    readers: options.readers,
  })
}
