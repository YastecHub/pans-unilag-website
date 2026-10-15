import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors } from '../../../docs/schemas.js'
import {
  FOLDER_EXAMPLES,
  isAllowedFolder,
  MEDIA_ROOT,
  PUBLIC_ID_PATTERN,
} from '../application/mediaFolders.js'

export const signatureBodySchema = z.strictObject({
  folder: z
    .string()
    .max(120)
    .refine(
      isAllowedFolder,
      `folder must be one of the site's folders, e.g. ${FOLDER_EXAMPLES.join(', ')}`,
    )
    .meta({ description: `Relative to ${MEDIA_ROOT}/`, example: 'executives/2026-2027' }),
  publicId: z
    .string()
    .regex(PUBLIC_ID_PATTERN, 'publicId must be lower-case letters, digits, - or _')
    .optional()
    .meta({
      description: 'Name the file (replaces an existing one with that name)',
      example: 'president',
    }),
})

const signedUploadSchema = z
  .object({
    uploadUrl: z.string(),
    cloudName: z.string(),
    apiKey: z.string(),
    params: z.record(z.string(), z.union([z.string(), z.number()])),
    signature: z.string(),
    expiresAt: z.string(),
  })
  .meta({
    id: 'SignedUpload',
    example: {
      uploadUrl: 'https://api.cloudinary.com/v1_1/<cloud>/image/upload',
      cloudName: '<cloud>',
      apiKey: '123456789012345',
      params: {
        allowed_formats: 'jpg,jpeg,png,webp',
        folder: 'pans-unilag/executives/2026-2027',
        timestamp: 1792137600,
        public_id: 'president',
        overwrite: 'true',
        invalidate: 'true',
      },
      signature: 'a1b2c3…',
      expiresAt: '2026-10-16T10:00:00.000Z',
    },
  })

export const mediaPaths: ZodOpenApiPathsObject = {
  '/api/admin/media/signature': {
    post: {
      tags: ['Admin'],
      operationId: 'adminSignUpload',
      summary: 'Sign a direct image upload to Cloudinary',
      description: [
        'The dashboard then POSTs the file straight to `uploadUrl` as multipart form data with `file`, `api_key`, `signature` and every field in `params`.',
        'Only the README folders are allowed; JPG, PNG and WebP only. The signature is valid for one hour. The API secret never leaves the server.',
      ].join(' '),
      requestBody: { content: { 'application/json': { schema: signatureBodySchema } } },
      responses: {
        '200': {
          description: 'Upload parameters and signature',
          content: { 'application/json': { schema: signedUploadSchema } },
        },
        ...errors.badRequest,
        ...errors.unauthorized,
        '503': {
          description: 'Cloudinary is not configured on the server (SERVICE_UNAVAILABLE)',
        },
        ...errors.internal,
      },
    },
  },
}
