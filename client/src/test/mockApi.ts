import { vi } from 'vitest'

type Handler = unknown | ((url: URL) => Response)

/**
 * Stubs fetch for API calls: `routes` maps a path ("/api/events") to the JSON to return, or to a
 * function returning a Response (for errors). Query strings are ignored when matching unless the key
 * includes one. Unmatched paths answer 404 in the API's error format. Restore with vi.unstubAllGlobals().
 */
export function mockApi(routes: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost')
    const handler = routes[url.pathname + url.search] ?? routes[url.pathname]
    if (handler === undefined) return jsonResponse(404, apiError('NOT_FOUND', 'Not found'))
    return typeof handler === 'function'
      ? (handler as (u: URL) => Response)(url)
      : jsonResponse(200, handler)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'test-request-id' },
  })
}

export function apiError(code: string, message: string) {
  return { error: { code, message, requestId: 'test-request-id' } }
}
