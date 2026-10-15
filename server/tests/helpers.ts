import { createApp } from '../src/app.js'

export const ALLOWED_ORIGIN = 'http://localhost:5173'

export function testApp(options: { isProduction?: boolean; docsEnabled?: boolean } = {}) {
  return createApp({
    clientOrigins: [ALLOWED_ORIGIN],
    isProduction: options.isProduction ?? false,
    docsEnabled: options.docsEnabled ?? false,
  })
}
