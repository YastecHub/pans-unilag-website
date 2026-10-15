/**
 * The one way the client talks to the API. Every response is JSON; every failure becomes an ApiError
 * with the same fields the server sends: { error: { code, message, details?, requestId } }.
 *
 * @example const events = await api.get<Event[]>('/api/events?status=upcoming')
 */

/** Error codes from the API (README → Error codes), plus two the client adds itself. */
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'INVALID_JSON'
  | 'INVALID_ID'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  /** The request never reached the server (offline, DNS, CORS). */
  | 'NETWORK_ERROR'
  /** The server answered with something that isn't our error format. */
  | 'UNKNOWN'

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly details?: unknown
  readonly requestId?: string

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    options: { details?: unknown; requestId?: string; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = options.details
    this.requestId = options.requestId
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  /** Sent as JSON. */
  body?: unknown
  signal?: AbortSignal
}

/** VITE_API_URL is empty in development: the Vite proxy forwards /api to the server. */
function baseUrl(): string {
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')
}

const NETWORK_MESSAGE = 'We couldn’t reach the server. Check your connection and try again.'
const GENERIC_MESSAGE = 'Something went wrong. Please try again.'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function readError(response: Response): Promise<ApiError> {
  const headerId = response.headers.get('X-Request-Id') ?? undefined
  const body: unknown = await response.json().catch(() => null)
  const error = isRecord(body) && isRecord(body.error) ? body.error : undefined

  if (error && typeof error.code === 'string' && typeof error.message === 'string') {
    return new ApiError(response.status, error.code as ApiErrorCode, error.message, {
      details: error.details,
      requestId: typeof error.requestId === 'string' ? error.requestId : headerId,
    })
  }
  return new ApiError(response.status, 'UNKNOWN', GENERIC_MESSAGE, { requestId: headerId })
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      // Send the admin session cookie (httpOnly) with every request.
      credentials: 'include',
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError(0, 'NETWORK_ERROR', NETWORK_MESSAGE, { cause })
  }

  if (!response.ok) throw await readError(response)
  if (response.status === 204) return undefined as T

  try {
    return (await response.json()) as T
  } catch (cause) {
    throw new ApiError(response.status, 'UNKNOWN', GENERIC_MESSAGE, {
      requestId: response.headers.get('X-Request-Id') ?? undefined,
      cause,
    })
  }
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => apiFetch<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH', body }),
  delete: <T = void>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}
