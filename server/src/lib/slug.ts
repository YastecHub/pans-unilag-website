import { z } from 'zod'

/** Lower-case words joined by hyphens, e.g. "who-we-are". Same rule as the models' slug fields. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** `:slug` route params; malformed slugs get a 400 before the database is read. */
export function slugParamsSchema(example: string) {
  return z.strictObject({
    slug: z
      .string()
      .max(80)
      .regex(SLUG_PATTERN, `Use lower-case words joined by hyphens, e.g. "${example}"`)
      .meta({ description: 'Slug', example }),
  })
}
