import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors } from '../../../docs/schemas.js'
import { DEVELOPER_ACCOUNTS_MESSAGE, MANAGED_ROLES } from '../application/accounts.js'
import { ADMIN_ROLES } from '../application/adminView.js'

export const accountBodySchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  email: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
    z.email().max(254),
  ),
  role: z.enum(MANAGED_ROLES),
})
export const roleBodySchema = z.strictObject({ role: z.enum(MANAGED_ROLES) })
export const accountIdSchema = z.strictObject({ id: z.string().min(1).max(64) })

const accountSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(ADMIN_ROLES),
    lastLoginAt: z.string().nullable(),
    createdAt: z.string().nullable(),
  })
  .meta({ id: 'Account' })

const json = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } })
const withPassword = json(
  z.object({
    account: accountSchema,
    password: z.string().meta({
      description: 'The new password, 24 characters. Returned once and never stored in plain text.',
    }),
  }),
)
const params = { path: accountIdSchema }
const tags = ['Admin accounts']
const note = `Developer role only (403 otherwise). Admin and editor accounts only: ${DEVELOPER_ACCOUNTS_MESSAGE}`

export const accountsPaths: ZodOpenApiPathsObject = {
  '/api/admin/accounts': {
    get: {
      tags,
      operationId: 'listAccounts',
      summary: 'List dashboard accounts',
      description: note,
      responses: {
        '200': {
          description: 'Every account',
          ...json(z.object({ accounts: z.array(accountSchema) })),
        },
        ...errors.unauthorized,
        ...errors.forbidden,
        ...errors.internal,
      },
    },
    post: {
      tags,
      operationId: 'createAccount',
      summary: 'Create an admin or editor',
      description: `${note} The response carries a generated password, shown once.`,
      requestBody: json(accountBodySchema.meta({ id: 'AccountInput' })),
      responses: {
        '201': { description: 'Created', ...withPassword },
        ...errors.badRequest,
        ...errors.unauthorized,
        ...errors.forbidden,
        ...errors.conflict,
        ...errors.internal,
      },
    },
  },
  '/api/admin/accounts/{id}': {
    patch: {
      tags,
      operationId: 'setAccountRole',
      summary: 'Change an account’s role',
      description: note,
      requestParams: params,
      requestBody: json(roleBodySchema),
      responses: {
        '200': { description: 'Updated', ...json(z.object({ account: accountSchema })) },
        ...errors.badRequest,
        ...errors.unauthorized,
        ...errors.forbidden,
        ...errors.notFound,
        ...errors.internal,
      },
    },
    delete: {
      tags,
      operationId: 'removeAccount',
      summary: 'Remove an account',
      description: `${note} The person is signed out at once.`,
      requestParams: params,
      responses: {
        '204': { description: 'Removed' },
        ...errors.unauthorized,
        ...errors.forbidden,
        ...errors.notFound,
        ...errors.internal,
      },
    },
  },
  '/api/admin/accounts/{id}/reset-password': {
    post: {
      tags,
      operationId: 'resetAccountPassword',
      summary: 'Give an account a new password',
      description: `${note} Signs the person out everywhere; the new password is shown once.`,
      requestParams: params,
      responses: {
        '200': { description: 'New password', ...withPassword },
        ...errors.unauthorized,
        ...errors.forbidden,
        ...errors.notFound,
        ...errors.internal,
      },
    },
  },
}
