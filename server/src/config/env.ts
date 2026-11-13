import { z } from 'zod'

/**
 * Environment variables the API needs, validated once at startup.
 * Add new variables here (and to server/.env.example) when a feature needs them.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z
    .string({ error: 'MONGODB_URI is required (your MongoDB connection string)' })
    .min(1, 'MONGODB_URI is required (your MongoDB connection string)')
    .refine((value) => /^mongodb(\+srv)?:\/\//.test(value), {
      message: 'MONGODB_URI must start with mongodb:// or mongodb+srv://',
    }),
  CLIENT_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  /** Swagger UI at /api/docs. Unset: on outside production, off in production. */
  API_DOCS_ENABLED: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z
      .enum(['true', 'false'], { error: 'API_DOCS_ENABLED must be true or false' })
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
  ),
  /** Signs admin session tokens. Required to start the API (see server.ts); scripts don't need it. */
  JWT_SECRET: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z
      .string()
      .min(32, 'JWT_SECRET must be at least 32 characters (a long random string)')
      .optional(),
  ),
  /** Cloudinary, for signing dashboard uploads (all three, or none: uploads are then switched off). */
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  /**
   * Email to the PANS inbox about each new feedback message and alumni sign-up, sent through
   * Gmail (both, or neither: no emails are sent then). The password is a Google app password.
   */
  GMAIL_USER: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.email('GMAIL_USER must be an email address').optional(),
  ),
  GMAIL_APP_PASSWORD: z.preprocess(
    (value) => (typeof value === 'string' ? value.replace(/\s+/g, '') || undefined : value),
    z
      .string()
      .length(16, 'GMAIL_APP_PASSWORD must be the 16-letter Google app password')
      .optional(),
  ),
  /** Who gets the emails, comma-separated. Empty: GMAIL_USER itself. */
  NOTIFY_EMAIL: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.email('NOTIFY_EMAIL must be email addresses, comma-separated'))),
})

export type Env = z.infer<typeof envSchema>

export class EnvError extends Error {
  constructor(details: string) {
    super(
      `Invalid environment configuration:\n${details}\n\nCheck server/.env against server/.env.example.`,
    )
    this.name = 'EnvError'
  }
}

/** Parses and validates environment variables. Throws EnvError with a readable message. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n')
    throw new EnvError(details)
  }
  return result.data
}
