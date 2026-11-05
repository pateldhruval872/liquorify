import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

/**
 * Batch 8's §2.7 check: what the running storefront answers for the payment
 * link Spree's `payment_link_email` builds, `<storefront>/checkout/<order
 * token>/payment`, and for the storefront's own checkout address with the
 * same draft order.
 *
 * Start the storefront, built for production at the revision under test with
 * the browser-test server's default publishable key, on port 3001
 * (`STOREFRONT_URL`). Then read a draft order's token and id in Spree's
 * browser-test app, as the mailer reads them, and pass them in
 * `PAYMENT_LINK_TOKEN` and `PAYMENT_LINK_ORDER`:
 *
 *   bin/rails runner 'o = Spree::Order.find_by!(number: "R1004"); puts o.token, o.prefixed_id'
 *
 * The token is a secret for that order, so it is never written out: each
 * answer is saved with `<order token>` and `<order id>` in its place, in
 * `results/payment-link/answers.json`, with a screenshot of each page.
 */

const storefront = process.env.STOREFRONT_URL ?? 'http://localhost:3001'
const token = process.env.PAYMENT_LINK_TOKEN ?? ''
const order = process.env.PAYMENT_LINK_ORDER ?? ''
const results = new URL('./results/payment-link/', import.meta.url).pathname
const revision = process.env.STOREFRONT_REVISION ?? null

const hide = (text: string) =>
  text.replaceAll(token, '<order token>').replaceAll(order, '<order id>')

const addresses = [
  ['1-mailer-link', () => `/checkout/${token}/payment`],
  ['2-checkout-with-token', () => `/us/en/checkout/${token}`],
  ['3-checkout-with-order-id', () => `/us/en/checkout/${order}`],
] as const

test.use({ viewport: { width: 1280, height: 960 } })

test('what the storefront answers for the payment link', async ({ page }) => {
  test.skip(!token || !order, 'Pass PAYMENT_LINK_TOKEN and PAYMENT_LINK_ORDER')
  mkdirSync(results, { recursive: true })
  const answers: Record<string, unknown> = { revision, storefront }

  for (const [step, path] of addresses) {
    const hops: { status: number; url: string }[] = []
    const listen = (response: import('@playwright/test').Response) => {
      if (response.request().resourceType() === 'document')
        hops.push({ status: response.status(), url: hide(response.url()) })
    }
    page.on('response', listen)
    await page.goto(`${storefront}${path()}`)
    await page.waitForLoadState('networkidle')
    page.off('response', listen)
    await page.screenshot({ path: `${results}${step}.png` })
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim()
    answers[step] = {
      requested: hide(path()),
      hops,
      landedOn: hide(page.url()),
      title: await page.title(),
      says: hide(text).slice(0, 400),
    }
  }
  writeFileSync(`${results}answers.json`, JSON.stringify(answers, null, 2))
  expect(Object.keys(answers)).toHaveLength(addresses.length + 2)
})
