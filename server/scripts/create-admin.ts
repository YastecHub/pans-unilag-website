/**
 * Manages dashboard admins. There is no public sign-up: admins are created here by the web lead.
 *
 *   npm run create-admin -w server -- --email secretary@example.com --name "Ada Okafor" [--role admin|editor]
 *   npm run create-admin -w server -- --email secretary@example.com --reset-password
 *   npm run create-admin -w server -- --email secretary@example.com --remove
 *
 * A new or reset password is generated (24 random characters) and printed ONCE: pass it to the
 * admin privately (not in a group chat) and ask them to keep it in a password manager.
 * Resetting a password or removing an admin signs them out everywhere.
 * (In PowerShell write the -- as '--'.)
 */
import { existsSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { EnvError, loadEnv } from '../src/config/env.js'
import { ADMIN_ROLES, type AdminRole } from '../src/modules/auth/application/adminView.js'
import { generatePassword, hashPassword } from '../src/modules/auth/application/passwords.js'
import { AdminModel } from '../src/modules/auth/infrastructure/admin.model.js'

const USAGE = `Usage:
  npm run create-admin -w server -- --email <email> --name "<full name>" [--role admin|editor]
  npm run create-admin -w server -- --email <email> --reset-password
  npm run create-admin -w server -- --email <email> --remove
(In PowerShell write the -- as '--'.)`

function fail(message: string): never {
  console.error(`\n${message}\n`)
  process.exit(1)
}

function printPassword(email: string, password: string) {
  console.log(`\nPassword for ${email} (shown once, share it privately):\n\n    ${password}\n`)
}

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      name: { type: 'string' },
      role: { type: 'string', default: 'editor' },
      'reset-password': { type: 'boolean', default: false },
      remove: { type: 'boolean', default: false },
    },
  })
  const email = values.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(USAGE)
  const role = values.role as AdminRole
  if (!ADMIN_ROLES.includes(role)) fail(`--role must be one of: ${ADMIN_ROLES.join(', ')}`)

  if (existsSync('.env')) process.loadEnvFile('.env')
  await connectDb(loadEnv().MONGODB_URI)
  try {
    if (values.remove) {
      const { deletedCount } = await AdminModel.deleteOne({ email })
      console.log(deletedCount ? `Removed ${email}.` : `No admin with ${email}.`)
      return
    }

    const password = generatePassword()
    const passwordHash = await hashPassword(password)

    if (values['reset-password']) {
      const result = await AdminModel.updateOne(
        { email },
        { $set: { passwordHash }, $inc: { tokenVersion: 1 } },
      )
      if (result.matchedCount === 0) fail(`No admin with ${email}.`)
      printPassword(email, password)
      return
    }

    if (!values.name?.trim()) fail(USAGE)
    if (await AdminModel.exists({ email }))
      fail(`${email} is already an admin. Use --reset-password to give them a new password.`)
    await AdminModel.create({ email, name: values.name.trim(), role, passwordHash })
    console.log(`\nCreated ${role} ${values.name.trim()} <${email}>.`)
    printPassword(email, password)
  } finally {
    await disconnectDb()
  }
}

main().catch((error: unknown) => {
  if (error instanceof EnvError) fail(error.message)
  console.error(error)
  process.exit(1)
})
