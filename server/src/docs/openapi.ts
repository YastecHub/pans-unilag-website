import { createDocument } from 'zod-openapi'
import { healthPaths } from '../modules/health/http/health.openapi.js'
import { committeesPaths } from '../modules/committees/http/committees.openapi.js'
import { executivesPaths } from '../modules/executives/http/executives.openapi.js'
import { pagesPaths } from '../modules/pages/http/pages.openapi.js'
import { patronsPaths } from '../modules/patrons/http/patrons.openapi.js'
import { senatePaths } from '../modules/senate/http/senate.openapi.js'

/**
 * Builds the OpenAPI 3.1 document from each module's `<feature>.openapi.ts`.
 * When you add a module, export its paths from `modules/<feature>/http/<feature>.openapi.ts`,
 * add a tag below and spread the paths into `paths`.
 */
export function buildOpenApiDocument() {
  return createDocument({
    openapi: '3.1.0',
    info: {
      title: 'PANS UNILAG API',
      version: '0.1.0',
      description: [
        'API for the Pharmaceutical Association of Nigeria Students (PANS), University of Lagos website.',
        '',
        'All responses are JSON. Errors share one shape (`ErrorResponse`): switch on `error.code`, show `error.message`, and quote `error.requestId` (also sent as the `X-Request-Id` header) when reporting a problem.',
      ].join('\n'),
    },
    tags: [
      { name: 'Health', description: 'Service status' },
      { name: 'Pages', description: 'Constitution-derived About pages' },
      {
        name: 'Leadership',
        description: 'Executive Council, Senate, committees and patrons',
      },
    ],
    paths: {
      ...healthPaths,
      ...pagesPaths,
      ...executivesPaths,
      ...senatePaths,
      ...committeesPaths,
      ...patronsPaths,
    },
  })
}
