import { Router } from 'express'
import type { Logger } from '../../../lib/logger.js'
import { validate } from '../../../middleware/validate.js'
import type { AccountService, ManagedRole } from '../application/accounts.js'
import { accountBodySchema, accountIdSchema, roleBodySchema } from './accounts.openapi.js'

/**
 * /api/admin/accounts: the developer role's Accounts page. Mounted in app.ts behind requireAdmin
 * and requireRole('developer'). Every change is logged with who made it (never the password).
 */
export function accountsRouter(accounts: AccountService, logger: Logger): Router {
  const router = Router()
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  const log = (action: string, by: string | undefined, account: { id: string; role: string }) =>
    logger.info(`admin account ${action}`, { by, account: account.id, role: account.role })

  router.get('/', async (_req, res) => {
    res.json({ accounts: await accounts.list() })
  })

  router.post('/', validate({ body: accountBodySchema }), async (req, res) => {
    const input = req.body as { name: string; email: string; role: ManagedRole }
    const created = await accounts.create(input)
    log('created', req.admin?.id, created.account)
    res.status(201).json(created)
  })

  router.patch(
    '/:id',
    validate({ params: accountIdSchema, body: roleBodySchema }),
    async (req, res) => {
      const { role } = req.body as { role: ManagedRole }
      const account = await accounts.setRole(req.params.id as string, role)
      log('role changed', req.admin?.id, account)
      res.json({ account })
    },
  )

  router.post('/:id/reset-password', validate({ params: accountIdSchema }), async (req, res) => {
    const reset = await accounts.resetPassword(req.params.id as string)
    log('password reset', req.admin?.id, reset.account)
    res.json(reset)
  })

  router.delete('/:id', validate({ params: accountIdSchema }), async (req, res) => {
    const removed = await accounts.remove(req.params.id as string)
    log('removed', req.admin?.id, removed)
    res.status(204).end()
  })

  return router
}
