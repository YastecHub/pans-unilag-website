import nodemailer from 'nodemailer'
import type { SubmissionEmail } from '../application/notifications.js'

export type GmailConfig = {
  /** The Gmail account that sends, e.g. the official PANS address. */
  user: string
  /** A Google "app password" for that account (16 letters), never its normal password. */
  appPassword: string
  /** Who receives the emails. */
  to: string[]
}

/**
 * Sends submission emails through Gmail. The form waits for the email (a serverless function can
 * be frozen once it replies), so slow connections give up after a few seconds rather than keep
 * the visitor waiting.
 */
export function gmailSender({ user, appPassword, to }: GmailConfig) {
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass: appPassword },
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 8_000,
  })
  return async ({ subject, text, replyTo }: SubmissionEmail) => {
    await transport.sendMail({
      from: { name: 'PANS UNILAG website', address: user },
      to,
      subject,
      text,
      ...(replyTo ? { replyTo } : {}),
    })
  }
}
