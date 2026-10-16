import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, apiFetch } from './http.ts'
import { createQueryClient } from './queryClient.ts'

function respond(status: number, body?: unknown, headers: Record<string, string> = {}) {
  const fetchMock = vi.fn(
    async () =>
      new Response(
        body === undefined ? null : typeof body === 'string' ? body : JSON.stringify(body),
        {
          status,
          headers: { 'Content-Type': 'application/json', ...headers },
        },
      ),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('apiFetch', () => {
  it('returns parsed JSON and sends cookies', async () => {
    const fetchMock = respond(200, { status: 'ok' })

    await expect(api.get('/api/health')).resolves.toEqual({ status: 'ok' })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/health')
    expect(init.credentials).toBe('include')
    expect(init.method).toBe('GET')
    // Revalidated every time, so dashboard edits show on the next load (not after 5 minutes).
    expect(init.cache).toBe('no-cache')
  })

  it('prefixes VITE_API_URL without doubling slashes', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.pans.example/')
    const fetchMock = respond(200, {})

    await api.get('/api/events')
    expect(fetchMock.mock.calls[0]?.[0 as never]).toBe('https://api.pans.example/api/events')
  })

  it('sends a JSON body on POST', async () => {
    const fetchMock = respond(201, { id: '1' })

    await api.post('/api/feedback', { category: 'suggestion', message: 'Hello' })
    const init = fetchMock.mock.calls[0]?.[1 as never] as RequestInit
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"category":"suggestion","message":"Hello"}')
  })

  it('returns undefined for 204 No Content', async () => {
    respond(204)
    await expect(api.delete('/api/admin/events/1')).resolves.toBeUndefined()
  })

  it('turns the API error format into an ApiError', async () => {
    respond(400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: [{ path: 'message', message: 'Required' }],
        requestId: 'req-123',
      },
    })

    const error = await apiFetch('/api/feedback').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      details: [{ path: 'message', message: 'Required' }],
      requestId: 'req-123',
    })
  })

  it('handles errors that are not in the API format, keeping the request id header', async () => {
    respond(502, '<html>Bad gateway</html>', {
      'Content-Type': 'text/html',
      'X-Request-Id': 'proxy-9',
    })

    const error = (await apiFetch('/api/events').catch((e: unknown) => e)) as ApiError
    expect(error.code).toBe('UNKNOWN')
    expect(error.status).toBe(502)
    expect(error.requestId).toBe('proxy-9')
    expect(error.message).toBe('Something went wrong. Please try again.')
  })

  it('reports a network failure as NETWORK_ERROR', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    )

    const error = (await apiFetch('/api/events').catch((e: unknown) => e)) as ApiError
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.status).toBe(0)
    expect(error.message).toMatch(/couldn’t reach the server/)
  })

  it('lets an aborted request stay an AbortError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new DOMException('Aborted', 'AbortError'))),
    )

    const error = await apiFetch('/api/events').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(DOMException)
  })
})

describe('query client', () => {
  const retry = createQueryClient().getDefaultOptions().queries?.retry as (
    count: number,
    error: unknown,
  ) => boolean

  it('does not retry errors the user caused (4xx)', () => {
    expect(retry(0, new ApiError(404, 'NOT_FOUND', 'Not found'))).toBe(false)
  })

  it('retries network and server errors twice', () => {
    const error = new ApiError(0, 'NETWORK_ERROR', 'offline')
    expect(retry(0, error)).toBe(true)
    expect(retry(1, error)).toBe(true)
    expect(retry(2, error)).toBe(false)
  })
})
