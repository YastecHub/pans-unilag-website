type Level = 'info' | 'warn' | 'error'
type Meta = Record<string, unknown>

export type Logger = Record<Level, (message: string, meta?: Meta) => void>

type Options = {
  /** One JSON object per line (production, for the host's log search) or readable text (development). */
  json: boolean
  /** Where lines go. Defaults to stdout for info and stderr for warn/error. */
  write?: (line: string, level: Level) => void
}

const defaultWrite = (line: string, level: Level) => {
  if (level === 'info') process.stdout.write(`${line}\n`)
  else process.stderr.write(`${line}\n`)
}

/** Errors don't serialise with JSON.stringify, so turn them into plain objects (keeping `cause`). */
function serialise(value: unknown, depth = 0): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...(value.cause !== undefined && depth < 3
        ? { cause: serialise(value.cause, depth + 1) }
        : {}),
    }
  }
  return value
}

/**
 * A small structured logger. Never log secrets, passwords, tokens or personal data
 * (emails, phone numbers, form messages): log ids and counts instead.
 */
export function createLogger({ json, write = defaultWrite }: Options): Logger {
  const log =
    (level: Level) =>
    (message: string, meta: Meta = {}) => {
      const fields = Object.fromEntries(
        Object.entries(meta).map(([key, value]) => [key, serialise(value)]),
      )
      if (json) {
        write(JSON.stringify({ time: new Date().toISOString(), level, message, ...fields }), level)
        return
      }
      const { error, ...rest } = fields
      const extras = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : ''
      const stack =
        error && typeof error === 'object' && 'stack' in error ? `\n${String(error.stack)}` : ''
      write(`${new Date().toISOString()} ${level.toUpperCase()} ${message}${extras}${stack}`, level)
    }

  return { info: log('info'), warn: log('warn'), error: log('error') }
}

/** Discards everything. Useful in tests. */
export const silentLogger: Logger = { info: () => {}, warn: () => {}, error: () => {} }
