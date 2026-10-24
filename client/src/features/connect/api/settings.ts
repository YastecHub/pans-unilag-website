import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/http.ts'
import { SITE } from '../../../lib/site.ts'

/** GET /api/settings: the contact details admins can change. */
export type Settings = {
  postalAddress: string
  location: string
  /** The official role email; empty until supplied. Never a personal address. */
  contactEmail: string
  socialLinks: { platform: string; url: string }[]
}

/** The settings, or the site's built-in copy while loading or if the API fails. */
export function useContactSettings(): Settings & { loaded: boolean } {
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: ({ signal }) => api.get<Settings>('/api/settings', signal),
    staleTime: 10 * 60_000,
  })
  if (query.data) return { ...query.data, loaded: true }
  return {
    postalAddress: SITE.postalAddress.join(', '),
    location: SITE.location,
    contactEmail: SITE.email,
    socialLinks: [...SITE.socialLinks],
    loaded: false,
  }
}
