import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { buildOpenApiDocument } from '../src/docs/openapi.js'
import { testApp } from './helpers.js'

describe('OpenAPI document', () => {
  const document = buildOpenApiDocument()

  it('documents the health endpoint with its response schema', () => {
    const operation = document.paths?.['/api/health']?.get

    expect(document.openapi).toBe('3.1.0')
    expect(operation?.operationId).toBe('getHealth')
    expect(JSON.stringify(operation?.responses?.['200'])).toMatch(
      /#\/components\/schemas\/HealthResponse/,
    )
  })

  it('registers the shared error schema as a component', () => {
    const errorSchema = document.components?.schemas?.ErrorResponse

    expect(errorSchema).toBeDefined()
    expect(JSON.stringify(errorSchema)).toMatch(/VALIDATION_ERROR/)
  })
})

describe('/api/docs', () => {
  it('serves the OpenAPI JSON', async () => {
    const res = await request(testApp({ docsEnabled: true })).get('/api/docs/openapi.json')

    expect(res.status).toBe(200)
    expect(res.body.info.title).toBe('PANS UNILAG API')
    expect(Object.keys(res.body.paths)).toContain('/api/health')
  })

  it('serves Swagger UI', async () => {
    const res = await request(testApp({ docsEnabled: true })).get('/api/docs/')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/html/)
    expect(res.text).toMatch(/swagger-ui/)
  })

  it('is not served when docs are disabled', async () => {
    const res = await request(testApp({ docsEnabled: false })).get('/api/docs/openapi.json')

    expect(res.status).toBe(404)
  })
})
