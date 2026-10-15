import type { AdminView } from '../modules/auth/application/adminView.js'

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAdmin for signed-in admins. */
      admin?: AdminView
    }
  }
}

export {}
