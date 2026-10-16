import { vi } from 'vitest'

const ADA = { id: 'a1', name: 'Ada Okafor', email: 'ada@pans.test', role: 'admin' }

export type Call = { method: string; path: string; body: unknown }
type Reply = { status?: number; json?: unknown }
type Handler = (call: Call) => Reply | undefined

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

/**
 * A fake API for the dashboard that knows the HTTP method (the shared mockApi doesn't). Every
 * request is recorded; `handle` answers it, falling back to a signed-in session.
 */
export function fakeApi(handle: Handler) {
  const calls: Call[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost')
    const body =
      init?.body instanceof FormData
        ? Object.fromEntries(init.body.entries())
        : init?.body
          ? JSON.parse(String(init.body))
          : undefined
    const call = { method: init?.method ?? 'GET', path: url.pathname + url.search, body }
    calls.push(call)
    const reply = handle(call)
    if (reply) return json(reply.status ?? 200, reply.json)
    if (url.pathname === '/api/auth/me') return json(200, { admin: ADA })
    if (url.pathname === '/api/committees')
      return json(200, {
        session: '2026/2027',
        sessions: ['2026/2027'],
        committees: [{ slug: 'ppht', name: 'Public Health Team', shortName: 'PPHT' }],
      })
    return json(404, { error: { code: 'NOT_FOUND', message: 'Not found', requestId: 'r' } })
  })
  vi.stubGlobal('fetch', fetchMock)
  return calls
}

export const sent = (calls: Call[], method: string, prefix: string) =>
  calls.filter((c) => c.method === method && c.path.startsWith(prefix))

export const validation = (details: { path: string; message: string }[]) => ({
  status: 400,
  json: {
    error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details, requestId: 'r' },
  },
})
