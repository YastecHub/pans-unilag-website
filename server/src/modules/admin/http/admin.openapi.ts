import { z } from 'zod'
import type { ZodOpenApiOperationObject, ZodOpenApiPathsObject } from 'zod-openapi'
import { errors } from '../../../docs/schemas.js'
import { ADMIN_RESOURCES, type AdminResource } from '../application/adminResources.js'
import {
  feedbackQuerySchema,
  feedbackStatusSchema,
  idParamsSchema,
  pageQuerySchema,
} from './admin.routes.js'

const tags = ['Admin']
const signedIn = { ...errors.unauthorized, ...errors.internal }
const anyRecord = z.record(z.string(), z.unknown()).meta({
  description: 'The stored item: every field, `id`, `createdAt` and `updatedAt`',
})
const page = (items: z.ZodType) =>
  z.object({
    items: z.array(items),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  })
const json = (schema: z.ZodType, description: string) => ({
  description,
  content: { 'application/json': { schema } },
})

const placeholderNote =
  'Saving clears `isPlaceholder` and `placeholderNote` unless the body sends `isPlaceholder: true`.'

function resourcePaths({
  name,
  label,
  create,
  update,
  deletable,
}: AdminResource): ZodOpenApiPathsObject {
  const op = (o: ZodOpenApiOperationObject) => ({ tags, ...o })
  return {
    [`/api/admin/${name}`]: {
      get: op({
        operationId: `adminList_${name}`,
        summary: `List ${name}`,
        description: 'Most recently updated first, placeholders included.',
        requestParams: { query: pageQuerySchema },
        responses: { '200': json(page(anyRecord), 'One page'), ...errors.badRequest, ...signedIn },
      }),
      ...(create && {
        post: op({
          operationId: `adminCreate_${name}`,
          summary: `Create ${label.toLowerCase()}`,
          description: placeholderNote,
          requestBody: { content: { 'application/json': { schema: create } } },
          responses: {
            '201': json(anyRecord, 'Created'),
            ...errors.badRequest,
            ...errors.conflict,
            ...signedIn,
          },
        }),
      }),
    },
    [`/api/admin/${name}/{id}`]: {
      get: op({
        operationId: `adminGet_${name}`,
        summary: `One ${label.toLowerCase()}`,
        requestParams: { path: idParamsSchema },
        responses: { '200': json(anyRecord, 'The item'), ...errors.notFound, ...signedIn },
      }),
      patch: op({
        operationId: `adminUpdate_${name}`,
        summary: `Update ${label.toLowerCase()}`,
        description: `Send only the fields that change; \`null\` clears a date. ${placeholderNote}`,
        requestParams: { path: idParamsSchema },
        requestBody: { content: { 'application/json': { schema: update } } },
        responses: {
          '200': json(anyRecord, 'Updated'),
          ...errors.badRequest,
          ...errors.notFound,
          ...errors.conflict,
          ...signedIn,
        },
      }),
      ...(deletable !== false && {
        delete: op({
          operationId: `adminDelete_${name}`,
          summary: `Delete ${label.toLowerCase()}`,
          requestParams: { path: idParamsSchema },
          responses: { '204': { description: 'Deleted' }, ...errors.notFound, ...signedIn },
        }),
      }),
    },
  }
}

const placeholderGroupsSchema = z.object({
  total: z.number().int(),
  groups: z.array(
    z.object({
      collection: z.string(),
      page: z.string(),
      path: z.string(),
      items: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          note: z.string(),
          updatedAt: z.string().nullable(),
        }),
      ),
    }),
  ),
})

export const adminPaths: ZodOpenApiPathsObject = {
  ...Object.assign({}, ...(ADMIN_RESOURCES as readonly AdminResource[]).map(resourcePaths)),
  '/api/admin/placeholders': {
    get: {
      tags,
      operationId: 'adminPlaceholders',
      summary: 'Placeholders to fill, grouped by page',
      responses: { '200': json(placeholderGroupsSchema, 'The to-do list'), ...signedIn },
    },
  },
  '/api/admin/submissions/feedback': {
    get: {
      tags,
      operationId: 'adminListFeedback',
      summary: 'Feedback, newest first',
      requestParams: { query: feedbackQuerySchema },
      responses: { '200': json(page(anyRecord), 'One page'), ...errors.badRequest, ...signedIn },
    },
  },
  '/api/admin/submissions/feedback/{id}': {
    patch: {
      tags,
      operationId: 'adminSetFeedbackStatus',
      summary: 'Mark feedback as read or resolved',
      requestParams: { path: idParamsSchema },
      requestBody: { content: { 'application/json': { schema: feedbackStatusSchema } } },
      responses: {
        '200': json(anyRecord, 'Updated'),
        ...errors.badRequest,
        ...errors.notFound,
        ...signedIn,
      },
    },
  },
  '/api/admin/submissions/alumni': {
    get: {
      tags,
      operationId: 'adminListAlumni',
      summary: 'Alumni network sign-ups, newest first',
      requestParams: { query: pageQuerySchema },
      responses: { '200': json(page(anyRecord), 'One page'), ...errors.badRequest, ...signedIn },
    },
  },
  '/api/admin/submissions/alumni/{id}': {
    delete: {
      tags,
      operationId: 'adminRemoveAlumnus',
      summary: 'Remove an alumni entry (on request)',
      requestParams: { path: idParamsSchema },
      responses: { '204': { description: 'Removed' }, ...errors.notFound, ...signedIn },
    },
  },
}
