import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/http.ts'
import type { AdminRole } from './api.ts'

/** Roles the Accounts page can give. Developer accounts are made with the create-admin command. */
export type ManagedRole = 'admin' | 'editor'

export type Account = {
  id: string
  name: string
  email: string
  role: AdminRole
  lastLoginAt: string | null
  createdAt: string | null
}

/** A new or reset password: returned once by the API, shown once on the page. */
export type WithPassword = { account: Account; password: string }

const KEY = ['admin', 'accounts'] as const
const BASE = '/api/admin/accounts'

export function useAccounts(enabled = true) {
  return useQuery({
    queryKey: KEY,
    enabled,
    queryFn: ({ signal }) => api.get<{ accounts: Account[] }>(BASE, signal).then((r) => r.accounts),
  })
}

function useAccountMutation<I, O>(fn: (input: I) => Promise<O>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
  })
}

export const useCreateAccount = () =>
  useAccountMutation((input: { name: string; email: string; role: ManagedRole }) =>
    api.post<WithPassword>(BASE, input),
  )

export const useSetAccountRole = () =>
  useAccountMutation(({ id, role }: { id: string; role: ManagedRole }) =>
    api.patch<{ account: Account }>(`${BASE}/${encodeURIComponent(id)}`, { role }),
  )

export const useResetAccountPassword = () =>
  useAccountMutation((id: string) =>
    api.post<WithPassword>(`${BASE}/${encodeURIComponent(id)}/reset-password`),
  )

export const useRemoveAccount = () =>
  useAccountMutation((id: string) => api.delete(`${BASE}/${encodeURIComponent(id)}`))
