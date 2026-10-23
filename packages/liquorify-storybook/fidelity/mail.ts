import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect } from '@playwright/test'

/**
 * Reads the mail Spree's browser-test server writes when the stack starts with
 * `LIQUORIFY_MAIL_DIR` (stack.spec.ts). Rails' file delivery appends each
 * message to one file per recipient, so a message is found by counting the
 * messages already there before the step that sends it.
 */
export const MAIL_DIR = process.env.LIQUORIFY_MAIL_DIR ?? ''

export interface Mail {
  subject: string
  html: string
}

// A quoted-printable body wraps long lines with a trailing `=` and escapes
// `=` itself, which is inside every link's query string.
function decodeQuotedPrintable(body: string) {
  const latin1 = body
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
  return Buffer.from(latin1, 'latin1').toString('utf8')
}

function parse(message: string): Mail {
  const subject = message.match(/^Subject: (.*)$/m)?.[1]?.trim() ?? ''
  const htmlPart = message
    .split(/^--[^\r\n]+$/m)
    .find((part) => /^Content-Type: text\/html/im.test(part))
  const [headers = '', ...rest] = (htmlPart ?? message).split(/\r?\n\r?\n/)
  const body = rest.join('\n\n')
  const html = /^Content-Transfer-Encoding: quoted-printable/im.test(headers)
    ? decodeQuotedPrintable(body)
    : body
  return { subject, html }
}

export function mailTo(recipient: string): Mail[] {
  const file = join(MAIL_DIR, recipient)
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8')
    .split(/\r?\n(?=Date: )/)
    .filter((message) => message.trim())
    .map(parse)
}

/** Waits for the next message to `recipient` after the `already` it held. */
export async function nextMail(recipient: string, already: number): Promise<Mail> {
  await expect.poll(() => mailTo(recipient).length, { timeout: 30_000 }).toBeGreaterThan(already)
  return mailTo(recipient)[already]
}

/** The first link in a message whose address matches `pattern`. */
export function linkIn(mail: Mail, pattern: RegExp): URL {
  const href = [...mail.html.matchAll(/href="([^"]+)"/g)]
    .map((match) => match[1].replaceAll('&amp;', '&'))
    .find((value) => pattern.test(value))
  if (!href) throw new Error(`No link matching ${pattern} in "${mail.subject}"`)
  return new URL(href)
}
