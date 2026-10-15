import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors } from '../../../docs/schemas.js'
import { ADMIN_ROLES } from '../application/adminView.js'

export const loginBodySchema = z.strictObject({
  email: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
    z.email().max(254),
  ),
  password: z.string().min(1).max(200),
})

const adminSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(ADMIN_ROLES),
  })
  .meta({ id: 'Admin' })

const adminResponse = {
  content: { 'application/json': { schema: z.object({ admin: adminSchema }) } },
}

const cookieNote =
  'The session is a JWT in the `pans_admin_session` cookie (httpOnly, SameSite=Lax, Secure in production, path /api), valid for 8 hours.'

export const authPaths: ZodOpenApiPathsObject = {
  '/api/auth/login': {
    post: {
      tags: ['Admin auth'],
      operationId: 'login',
      summary: 'Sign in',
      description: `${cookieNote} Wrong email and wrong password give the same 401. Rate-limited to 10 attempts per 15 minutes per IP.`,
      requestBody: {
        content: {
          'application/json': {
            schema: loginBodySchema.meta({
              id: 'LoginInput',
              example: { email: 'secretary@example.com', password: '••••••••' },
            }),
          },
        },
      },
      responses: {
        '200': { description: 'Signed in; sets the session cookie', ...adminResponse },
        ...errors.badRequest,
        ...errors.unauthorized,
        ...errors.rateLimited,
        ...errors.internal,
      },
    },
  },
  '/api/auth/logout': {
    post: {
      tags: ['Admin auth'],
      operationId: 'logout',
      summary: 'Sign out',
      description: 'Clears the session cookie. Always succeeds.',
      responses: { '204': { description: 'Signed out' } },
    },
  },
  '/api/auth/me': {
    get: {
      tags: ['Admin auth'],
      operationId: 'getCurrentAdmin',
      summary: 'Who is signed in',
      description:
        'The dashboard calls this on load to decide between the sign-in screen and the dashboard.',
      responses: {
        '200': { description: 'The signed-in admin', ...adminResponse },
        ...errors.unauthorized,
        ...errors.internal,
      },
    },
  },
}
