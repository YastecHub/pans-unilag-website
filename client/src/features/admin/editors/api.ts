import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, api } from '../../../lib/http.ts'
import type { Paged } from '../api.ts'

/** A stored item as GET /api/admin/<resource> returns it: every field, `id`, timestamps. */
export type AdminRecord = Record<string, unknown> & {
  id: string
  createdAt?: string
  updatedAt?: string
}

export type ResourceName = 'announcements' | 'events' | 'opportunities'

/** The public queries each resource feeds, refreshed after an edit so the site is current. */
const PUBLIC_KEYS: Record<ResourceName, string[][]> = {
  announcements: [['announcements']],
  events: [['events'], ['event']],
  opportunities: [['opportunities'], ['opportunity']],
}

function useRefresh(name: ResourceName) {
  const client = useQueryClient()
  return () => {
    const keys = [['admin', name], ['admin', 'placeholders'], ['search'], ...PUBLIC_KEYS[name]]
    for (const queryKey of keys) void client.invalidateQueries({ queryKey })
  }
}

export const LIST_PAGE_SIZE = 25

export function useAdminList(name: ResourceName, page: number) {
  return useQuery({
    queryKey: ['admin', name, 'list', page],
    queryFn: ({ signal }) =>
      api.get<Paged<AdminRecord>>(
        `/api/admin/${name}?page=${page}&pageSize=${LIST_PAGE_SIZE}`,
        signal,
      ),
  })
}

export function useAdminItem(name: ResourceName, id: string | undefined) {
  return useQuery({
    queryKey: ['admin', name, 'item', id],
    queryFn: ({ signal }) => api.get<AdminRecord>(`/api/admin/${name}/${id}`, signal),
    enabled: !!id,
  })
}

export function useSaveItem(name: ResourceName, id: string | undefined) {
  const refresh = useRefresh(name)
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      id
        ? api.patch<AdminRecord>(`/api/admin/${name}/${id}`, body)
        : api.post<AdminRecord>(`/api/admin/${name}`, body),
    onSuccess: refresh,
  })
}

export function useDeleteItem(name: ResourceName) {
  const refresh = useRefresh(name)
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/${name}/${id}`),
    onSuccess: refresh,
  })
}

/** "startsAt is required" → "StartsAt is required." Capitalised, with a full stop. */
const sentence = (text: string) => {
  const t = text.trim()
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}${/[.!?]$/.test(t) ? '' : '.'}`
}

/**
 * API problems as API field → message: Zod and model rules (VALIDATION_ERROR details) and a
 * duplicate web address (409 CONFLICT, details.fields).
 */
export function apiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {}
  const errors: Record<string, string> = {}
  if (error.code === 'CONFLICT') {
    const fields = (error.details as { fields?: string[] } | undefined)?.fields ?? []
    for (const f of fields)
      errors[f] =
        f === 'slug' ? 'Another item already uses this web address.' : `Already in use: ${f}.`
  }
  if (error.code === 'VALIDATION_ERROR' && Array.isArray(error.details)) {
    for (const d of error.details as { path?: string; message?: string }[]) {
      const path = (d.path ?? '').split('.')[0]
      if (path && d.message && !errors[path]) errors[path] = sentence(d.message)
    }
  }
  return errors
}

/** Signed direct upload (POST /api/admin/media/signature, then Cloudinary). */
type SignedUpload = {
  uploadUrl: string
  apiKey: string
  params: Record<string, string | number>
  signature: string
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Uploads one photo straight to Cloudinary with a one-time signature from our server (the API
 * secret never reaches the browser). Returns the Cloudinary public id to store, e.g.
 * "pans-unilag/events/freshers-week-2026/abc123".
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!UPLOAD_TYPES.includes(file.type)) throw new Error('Choose a JPG, PNG or WebP photo.')
  if (file.size > MAX_UPLOAD_BYTES)
    throw new Error('That photo is over 10 MB. Please use a smaller one.')

  const signed = await api.post<SignedUpload>('/api/admin/media/signature', { folder })
  const form = new FormData()
  form.append('file', file)
  form.append('api_key', signed.apiKey)
  form.append('signature', signed.signature)
  for (const [key, value] of Object.entries(signed.params)) form.append(key, String(value))

  let response: Response
  try {
    response = await fetch(signed.uploadUrl, { method: 'POST', body: form })
  } catch {
    throw new Error('The upload didn’t go through. Check your connection and try again.')
  }
  const result = (await response.json().catch(() => null)) as {
    public_id?: string
    error?: { message?: string }
  } | null
  if (!response.ok || !result?.public_id)
    throw new Error(
      result?.error?.message ?? 'Cloudinary refused the upload. Please try another photo.',
    )
  return result.public_id
}
