import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, type Page, test } from '@playwright/test'
import type { AdminCredentials } from './staff'

/**
 * What batch 11's verification tests share (the batch 11 verification work
 * item, `liquorify/work-items/fb-19-batch-home-reports-and-emails-verification.md`):
 * the sabotage switch that shows each test fails when it should, the mail
 * folders the two servers write to, and where each test writes what it saw.
 */

/**
 * With `B11_SABOTAGE=1` every test is expected to fail, and each looks at its
 * first key check for something that is not there (work item §7).
 */
export const SABOTAGE = process.env.B11_SABOTAGE === '1'

export function expectedToFail() {
  if (SABOTAGE) test.fail(true, 'B11_SABOTAGE: this test must fail at its first key check')
}

/** The value a key check looks for: the real one, or one that cannot be there. */
export const sabotaged = <T>(value: T, impossible: T): T => (SABOTAGE ? impossible : value)

export const EMAILS_URL = process.env.FIDELITY_EMAILS_URL ?? 'http://localhost:5175'
export const EMAILS_SERVER = process.env.FIDELITY_EMAILS_SERVER ?? 'http://localhost:3040'
export const EMAILS_APP = new URL('./results/tmp/emails-app.json', import.meta.url).pathname
export const RESET = 'spree.customer_mailer.password_reset_email'
export const CONFIRMATION = 'spree.order_mailer.confirm_email'

export const emailsAdmin = () => JSON.parse(readFileSync(EMAILS_APP, 'utf8')) as AdminCredentials

const RESULTS = new URL('./results/b11-verification/', import.meta.url)

/** Writes what a test saw to `results/b11-verification/<name>`. */
export function record(name: string, facts: unknown) {
  mkdirSync(RESULTS, { recursive: true })
  writeFileSync(new URL(name, RESULTS), `${JSON.stringify(facts, null, 2)}\n`)
}

export const shot = (page: Page, name: string, fullPage = false) => {
  mkdirSync(RESULTS, { recursive: true })
  return page.screenshot({ path: new URL(`${name}.png`, RESULTS).pathname, fullPage })
}

/** Blocks every request that would leave the local servers, and lists them. */
export async function blockOutside(page: Page): Promise<string[]> {
  const outside: string[] = []
  await page.context().route(
    (url) =>
      !['data:', 'blob:', 'about:'].includes(url.protocol) &&
      !['localhost', '127.0.0.1'].includes(url.hostname),
    (route) => {
      outside.push(route.request().url())
      return route.abort()
    },
  )
  return outside
}

export interface Sent {
  from: string
  to: string
  subject: string
  html: string
}

function decodeQuotedPrintable(body: string) {
  const latin1 = body
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
  return Buffer.from(latin1, 'latin1').toString('utf8')
}

/**
 * Every message a server wrote to `recipient` in `folder`. Rails' file
 * delivery appends each message to one file per recipient.
 */
export function sentTo(folder: string, recipient: string): Sent[] {
  const file = join(folder, recipient)
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8')
    .split(/\r?\n(?=Date: )/)
    .filter((message) => message.trim())
    .map((message) => {
      const header = (name: string) =>
        message.match(new RegExp(`^${name}: (.*)$`, 'm'))?.[1]?.trim() ?? ''
      // Split on the message's own boundaries: a quoted-printable line of the
      // HTML can itself start with "--" (an Outlook comment wrapped there).
      const boundaries = [...message.matchAll(/boundary="?([^";\r\n]+)"?/gi)].map(
        (match) => match[1],
      )
      const htmlPart = boundaries
        .reduce<string[]>(
          (parts, boundary) => parts.flatMap((part) => part.split(`--${boundary}`)),
          [message],
        )
        .find((part) => /^Content-Type: text\/html/im.test(part.trimStart()))
      const [headers = '', ...rest] = (htmlPart?.replace(/^\s+/, '') ?? message).split(/\r?\n\r?\n/)
      const body = rest.join('\n\n')
      return {
        from: header('From'),
        to: header('To'),
        subject: header('Subject'),
        html: /^Content-Transfer-Encoding: quoted-printable/im.test(headers)
          ? decodeQuotedPrintable(body)
          : body,
      }
    })
}

export async function nextSent(
  folder: string,
  recipient: string,
  already: number,
  timeout = 30_000,
) {
  await expect.poll(() => sentTo(folder, recipient).length, { timeout }).toBeGreaterThan(already)
  return sentTo(folder, recipient)[already]
}

/** A confirmation, which Spree draws as an alert dialog or a dialog over the page. */
export const confirmDialog = (page: Page) =>
  page.getByRole('alertdialog').or(page.getByRole('dialog')).last()
