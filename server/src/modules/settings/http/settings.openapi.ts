import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import { errors, placeholderShape } from '../../../docs/schemas.js'
import { SOCIAL_PLATFORMS } from '../infrastructure/settings.model.js'

export const settingsSchema = z
  .object({
    postalAddress: z.string(),
    location: z.string(),
    contactEmail: z.string().meta({ description: 'Official role email; empty until supplied' }),
    socialLinks: z.array(z.object({ platform: z.enum(SOCIAL_PLATFORMS), url: z.string() })),
    quickLinks: z.array(z.object({ label: z.string(), url: z.string() })),
    homeBanner: z
      .object({ text: z.string(), url: z.string() })
      .nullable()
      .meta({ description: 'Site-wide notice; null when there is none' }),
    ...placeholderShape,
  })
  .meta({
    id: 'Settings',
    example: {
      postalAddress:
        "c/o The Dean's Office, Faculty of Pharmacy, College of Medicine Campus, University of Lagos, P.M.B. 12003, Lagos",
      location:
        'Faculty of Pharmacy, Lagos University Teaching Hospital, off Ishaga Road, Idi-Araba, Lagos',
      contactEmail: '',
      socialLinks: [{ platform: 'Instagram', url: 'https://www.instagram.com/pans_unilag/' }],
      quickLinks: [],
      homeBanner: null,
      isPlaceholder: true,
      placeholderNote: 'Official email address needed (a role email, never a personal one)',
    },
  })

export const settingsPaths: ZodOpenApiPathsObject = {
  '/api/settings': {
    get: {
      tags: ['Site'],
      operationId: 'getSettings',
      summary: 'Site settings',
      description:
        'Contact details, social links, quick links and the site banner. Cached for 5 minutes.',
      responses: {
        '200': {
          description: 'The site settings',
          content: { 'application/json': { schema: settingsSchema } },
        },
        ...errors.notFound,
        ...errors.internal,
      },
    },
  },
}
