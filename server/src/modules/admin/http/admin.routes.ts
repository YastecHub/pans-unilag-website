import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../../../lib/httpError.js'
import { validate } from '../../../middleware/validate.js'
import { FEEDBACK_STATUSES } from '../../submissions/infrastructure/feedback.model.js'
import {
  ADMIN_RESOURCES,
  type AdminCollection,
  type AdminResourceName,
  withPlaceholderRule,
} from '../application/adminResources.js'
import { placeholderGroups, type PlaceholderSource } from '../application/placeholders.js'
import type { FeedbackStatus, SubmissionAdminStore } from '../application/submissionsAdmin.js'

export const pageQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})
export const feedbackQuerySchema = pageQuerySchema.extend({
  status: z.enum(FEEDBACK_STATUSES).optional(),
})
export const idParamsSchema = z.strictObject({ id: z.string().min(1).max(64) })
export const feedbackStatusSchema = z.strictObject({ status: z.enum(FEEDBACK_STATUSES) })

type PageQuery = z.infer<typeof pageQuerySchema>

export type AdminDeps = {
  collections: Record<AdminResourceName, AdminCollection>
  placeholders: PlaceholderSource[]
  submissions: SubmissionAdminStore
}

/**
 * Everything under /api/admin. Mounted behind requireAdmin in app.ts, so every route needs a
 * signed-in admin (401 otherwise). Documented in admin.openapi.ts.
 */
export function adminRouter({ collections, placeholders, submissions }: AdminDeps): Router {
  const router = Router()
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  router.get('/placeholders', async (_req, res) => {
    res.json(await placeholderGroups(placeholders))
  })

  router.get(
    '/submissions/feedback',
    validate({ query: feedbackQuerySchema }),
    async (req, res) => {
      const query = req.query as unknown as PageQuery & { status?: FeedbackStatus }
      res.json(await submissions.listFeedback(query))
    },
  )

  router.patch(
    '/submissions/feedback/:id',
    validate({ params: idParamsSchema, body: feedbackStatusSchema }),
    async (req, res) => {
      const { status } = req.body as { status: FeedbackStatus }
      const updated = await submissions.setFeedbackStatus(req.params.id as string, status)
      if (!updated) throw HttpError.notFound('Feedback not found')
      res.json(updated)
    },
  )

  router.get('/submissions/alumni', validate({ query: pageQuerySchema }), async (req, res) => {
    res.json(await submissions.listAlumni(req.query as unknown as PageQuery))
  })

  router.delete(
    '/submissions/alumni/:id',
    validate({ params: idParamsSchema }),
    async (req, res) => {
      if (!(await submissions.removeAlumnus(req.params.id as string)))
        throw HttpError.notFound('Alumni entry not found')
      res.status(204).end()
    },
  )

  for (const resource of ADMIN_RESOURCES) {
    const collection = collections[resource.name]
    const notFound = () => HttpError.notFound(`${resource.label} not found`)
    const path = `/${resource.name}`

    router.get(path, validate({ query: pageQuerySchema }), async (req, res) => {
      const { page, pageSize } = req.query as unknown as PageQuery
      res.json(await collection.list(page, pageSize))
    })

    router.post(path, validate({ body: resource.create }), async (req, res) => {
      res.status(201).json(await collection.create(withPlaceholderRule(req.body)))
    })

    router.get(`${path}/:id`, validate({ params: idParamsSchema }), async (req, res) => {
      const record = await collection.get(req.params.id as string)
      if (!record) throw notFound()
      res.json(record)
    })

    router.patch(
      `${path}/:id`,
      validate({ params: idParamsSchema, body: resource.update }),
      async (req, res) => {
        const record = await collection.update(
          req.params.id as string,
          withPlaceholderRule(req.body),
        )
        if (!record) throw notFound()
        res.json(record)
      },
    )

    router.delete(`${path}/:id`, validate({ params: idParamsSchema }), async (req, res) => {
      if (!(await collection.remove(req.params.id as string))) throw notFound()
      res.status(204).end()
    })
  }

  return router
}
