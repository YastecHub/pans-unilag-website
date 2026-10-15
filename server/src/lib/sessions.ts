import { z } from 'zod'

/** "2026/2027": the second year must follow the first. */
export function isSession(value: string): boolean {
  const match = /^(\d{4})\/(\d{4})$/.exec(value)
  return !!match && Number(match[2]) === Number(match[1]) + 1
}

export const sessionQuerySchema = z.strictObject({
  session: z.string().refine(isSession, 'session must look like "2026/2027"').optional().meta({
    description: 'Academic session; defaults to the newest one with data',
    example: '2026/2027',
  }),
})

/** Lists that change by academic session (Executive Council, Senate, committees). */
export type SessionReader<T> = {
  /** Every session that has data, in any order. */
  sessions(): Promise<string[]>
  /** The items for one session, in display order. */
  listBySession(session: string): Promise<T[]>
}

export type SessionList<T> = {
  /** The session shown; null when there is no data at all. */
  session: string | null
  /** Sessions with data, newest first, for a session picker. */
  sessions: string[]
  items: T[]
}

/**
 * The current session is the newest one with data, so seeding the next Exco switches the site over
 * without a code change. An unknown requested session returns an empty list (the page shows its empty state).
 */
export async function listForSession<T>(
  reader: SessionReader<T>,
  requested?: string,
): Promise<SessionList<T>> {
  const sessions = [...new Set(await reader.sessions())].sort().reverse()
  const session = requested ?? sessions[0] ?? null
  const items = session ? await reader.listBySession(session) : []
  return { session, sessions, items }
}
