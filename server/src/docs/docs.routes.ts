import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import { buildOpenApiDocument } from './openapi.js'

/**
 * Serves the API docs:
 *   /api/docs               Swagger UI
 *   /api/docs/openapi.json  the raw OpenAPI document (for tools and client type generation)
 */
export function docsRouter(): Router {
  const document = buildOpenApiDocument()
  const router = Router()

  router.get('/openapi.json', (_req, res) => {
    res.json(document)
  })
  router.use(
    '/',
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: 'PANS UNILAG API docs',
      swaggerOptions: { displayRequestDuration: true, tryItOutEnabled: true },
    }),
  )

  return router
}
