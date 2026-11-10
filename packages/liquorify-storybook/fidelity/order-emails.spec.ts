import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from '@playwright/test'

/**
 * Captures batch 8's rendered order emails at a phone's width and a desktop's,
 * as batch 9 captured EM-C-01. `EMAILS_DIR` names a folder of `<id>.html`
 * files: Spree's, written by `order-emails.rb`, and the storefront's, copied
 * from its `.next/emails` folder under the email's id. Pictures are addressed
 * to the browser-test server's port 3000, where nothing runs, so they are
 * fetched from the server's own port. A local address a link names, or shows
 * as its text, is drawn as `<site>`, as `order-emails.rb` writes Spree's. Each
 * capture is saved as `results/emails-batch-<n>/<id>-<width>.png`, where
 * `EMAILS_BATCH` gives the batch, 8 unless set: batch 10's customer emails,
 * written by `customer-emails.rb`, are captured the same way.
 */

const folder = process.env.EMAILS_DIR ?? ''
const results = new URL(
  `./results/emails-batch-${process.env.EMAILS_BATCH ?? '8'}/`,
  import.meta.url,
).pathname
const filesFrom = new URL(process.env.FIDELITY_API_URL ?? 'http://localhost:3010').origin
const emails = folder ? readdirSync(folder).filter((name) => name.endsWith('.html')) : []

for (const name of emails) {
  for (const width of [390, 1280]) {
    const id = name.replace(/\.html$/, '')
    test(`${id} at ${width}`, async ({ page }) => {
      mkdirSync(results, { recursive: true })
      await page.setViewportSize({ width, height: 900 })
      await page.route('http://localhost:3000/**', async (route) => {
        const url = route.request().url().replace('http://localhost:3000', filesFrom)
        await route.fulfill({ response: await route.fetch({ url }) }).catch(() => route.abort())
      })
      const html = readFileSync(join(folder, name), 'utf8').replace(
        /(href="|>)(https?:\/\/)?localhost:\d+/g,
        '$1&lt;site&gt;',
      )
      await page.setContent(html, { waitUntil: 'networkidle' })
      await page.screenshot({ path: `${results}${id}-${width}.png`, fullPage: true })
    })
  }
}
