import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fakeApi, sent } from '../../../test/fakeAdminApi.ts'
import { renderRoute } from '../../../test/renderRoute.tsx'

const DEV = { id: 'd1', name: 'Dami Developer', email: 'dev@pans.test', role: 'developer' }
const account = (id: string, name: string, role: string) => ({
  id,
  name,
  email: `${id}@pans.test`,
  role,
  lastLoginAt: id === 'a1' ? '2026-10-16T10:00:00.000Z' : null,
  createdAt: '2026-10-01T10:00:00.000Z',
})
const ACCOUNTS = [
  { ...account('d1', 'Dami Developer', 'developer'), email: DEV.email },
  account('a1', 'Ada Admin', 'admin'),
  account('e1', 'Edu Editor', 'editor'),
]

afterEach(() => vi.unstubAllGlobals())

describe('Accounts page', () => {
  it('is only in the menu and usable for developers', async () => {
    fakeApi(() => undefined) // signed in as an admin
    renderRoute('/admin/accounts')
    expect(await screen.findByText(/Only the developer \(the web lead\)/)).toBeTruthy()
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).queryByRole('link', { name: 'Accounts' })).toBeNull()
  })

  it('lists accounts; developer accounts can’t be changed here', async () => {
    fakeApi((c) =>
      c.path === '/api/auth/me'
        ? { json: { admin: DEV } }
        : c.path === '/api/admin/accounts'
          ? { json: { accounts: ACCOUNTS } }
          : undefined,
    )
    renderRoute('/admin/accounts')
    const table = await screen.findByRole('table', { name: 'Dashboard accounts' })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows.map((r) => within(r).getByRole('rowheader').textContent)).toEqual([
      'Dami Developer (you)',
      'Ada Admin',
      'Edu Editor',
    ])
    expect(within(rows[0]!).queryByRole('button')).toBeNull()
    expect(within(rows[0]!).getByText('create-admin')).toBeTruthy()
    expect(within(rows[2]!).getByText('Never')).toBeTruthy()
    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(within(nav).getByRole('link', { name: 'Accounts' }).getAttribute('aria-current')).toBe(
      'page',
    )
  })

  it('creates an account and shows the password once', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) =>
      c.path === '/api/auth/me'
        ? { json: { admin: DEV } }
        : c.method === 'POST' && c.path === '/api/admin/accounts'
          ? {
              status: 201,
              json: {
                account: account('n1', 'Tolu Secretary', 'admin'),
                password: 'GeneratedPassword-123456',
              },
            }
          : c.path === '/api/admin/accounts'
            ? { json: { accounts: ACCOUNTS } }
            : undefined,
    )
    renderRoute('/admin/accounts')
    await screen.findByRole('table', { name: 'Dashboard accounts' })

    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(screen.getByLabelText('Full name').getAttribute('aria-invalid')).toBe('true')
    expect(sent(calls, 'POST', '/api/admin/accounts')).toHaveLength(0)

    await user.type(screen.getByLabelText('Full name'), 'Tolu Secretary')
    await user.type(screen.getByLabelText('Email'), ' Secretary@PANS.test ')
    await user.selectOptions(screen.getByLabelText('Role'), 'admin')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    const panel = await screen.findByRole('region', { name: /Account created for Tolu Secretary/ })
    expect(document.activeElement).toBe(panel)
    expect(within(panel).getByText('GeneratedPassword-123456')).toBeTruthy()
    expect(sent(calls, 'POST', '/api/admin/accounts')[0]!.body).toEqual({
      name: 'Tolu Secretary',
      email: 'secretary@pans.test',
      role: 'admin',
    })
    expect((screen.getByLabelText('Full name') as HTMLInputElement).value).toBe('')

    await user.click(within(panel).getByRole('button', { name: 'Done, hide it' }))
    expect(screen.queryByText('GeneratedPassword-123456')).toBeNull()
  })

  it('shows a taken email next to the field', async () => {
    const user = userEvent.setup()
    fakeApi((c) =>
      c.path === '/api/auth/me'
        ? { json: { admin: DEV } }
        : c.method === 'POST'
          ? {
              status: 409,
              json: {
                error: {
                  code: 'CONFLICT',
                  message: 'There is already an account with that email.',
                  requestId: 'r',
                },
              },
            }
          : c.path === '/api/admin/accounts'
            ? { json: { accounts: ACCOUNTS } }
            : undefined,
    )
    renderRoute('/admin/accounts')
    await screen.findByRole('table', { name: 'Dashboard accounts' })
    await user.type(screen.getByLabelText('Full name'), 'Ada Again')
    await user.type(screen.getByLabelText('Email'), 'a1@pans.test')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('There is already an account with that email.')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByLabelText('Email'))
  })

  it('asks before a new password or removal, then does it', async () => {
    const user = userEvent.setup()
    const calls = fakeApi((c) =>
      c.path === '/api/auth/me'
        ? { json: { admin: DEV } }
        : c.path === '/api/admin/accounts/a1/reset-password'
          ? { json: { account: ACCOUNTS[1], password: 'FreshPassword-0987654321' } }
          : c.method === 'DELETE'
            ? { status: 204 }
            : c.method === 'PATCH'
              ? { json: { account: { ...ACCOUNTS[2], role: 'admin' } } }
              : c.path === '/api/admin/accounts'
                ? { json: { accounts: ACCOUNTS } }
                : undefined,
    )
    renderRoute('/admin/accounts')
    await screen.findByRole('table', { name: 'Dashboard accounts' })

    await user.click(screen.getByRole('button', { name: 'New password for Ada Admin' }))
    expect(sent(calls, 'POST', '/api/admin/accounts/a1')).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Yes, new password' }))
    const panel = await screen.findByRole('region', { name: /New password for Ada Admin/ })
    expect(within(panel).getByText('FreshPassword-0987654321')).toBeTruthy()
    expect(within(panel).getByText(/signed out/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Remove Edu Editor' }))
    await user.click(screen.getByRole('button', { name: 'Yes, remove' }))
    expect(await screen.findByText('Removed Edu Editor.')).toBeTruthy()
    expect(sent(calls, 'DELETE', '/api/admin/accounts/e1')).toHaveLength(1)

    await user.selectOptions(screen.getByLabelText('Role for Ada Admin'), 'editor')
    expect(await screen.findByText('Ada Admin is now an editor.')).toBeTruthy()
    expect(sent(calls, 'PATCH', '/api/admin/accounts/a1')[0]!.body).toEqual({ role: 'editor' })
  })
})
