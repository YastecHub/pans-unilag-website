import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors, placeholderShape } from '../../../docs/schemas.js'

const documentSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    version: z.string(),
    approvedOn: z.iso.datetime(),
    approvedBy: z.string().meta({ description: 'Empty until confirmed' }),
    summary: z.string(),
    fileUrl: z.string().meta({ description: 'The PDF; empty until uploaded' }),
    fileSizeBytes: z.number().int().nullable().meta({ description: 'For "PDF, 7.1 MB" labels' }),
    pageCount: z.number().int().nullable(),
    ...placeholderShape,
  })
  .meta({
    id: 'Document',
    example: {
      slug: 'constitution',
      title: 'Constitution of PANS UNILAG',
      version: '2026',
      approvedOn: '2026-07-08T23:00:00.000Z',
      approvedBy: '',
      summary: 'Reviewed and adopted on 9 July 2026.',
      fileUrl: '',
      fileSizeBytes: 7100000,
      pageCount: 55,
      isPlaceholder: true,
      placeholderNote: 'PDF to be uploaded once the President confirms it may be published as is',
    },
  })

export const documentsResponseSchema = z
  .object({ documents: z.array(documentSchema) })
  .meta({ id: 'DocumentsResponse' })

export const documentsPaths: ZodOpenApiPathsObject = {
  '/api/documents': {
    get: {
      tags: ['Content'],
      operationId: 'listDocuments',
      summary: 'Approved documents',
      description:
        'The latest approved version of each document, such as the constitution. Cached for 5 minutes.',
      responses: {
        '200': {
          description: 'Documents',
          content: { 'application/json': { schema: documentsResponseSchema } },
        },
        ...errors.internal,
      },
    },
  },
}
