import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, request, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { tracking } from './after-sale'
import { call, chequeMethods, guestAddress, type Json, list, skus, variantId } from './orders'
import { admin } from './staff'

/**
 * FL-06's last steps on the running storefront (batch 8 part 2, §2.7): an
 * order fulfilled with tracking on the admin dashboard, the storefront's own
 * shipment email (EM-SF-03), and the shopper's order page (SF-ACC-06).
 *
 * Before running, start Spree's browser-test server with
 * `SPREE_WEBHOOKS_ALLOWED_INTERNAL_HOSTS=localhost` and the built dashboard
 * on port 5174, as `compare.spec.ts` describes, with the sample catalog
 * loaded; give the server the storefront's webhook endpoint with
 * `storefront-endpoint.mjs`; and start the storefront, built for production
 * at the revision under test, on port 3001 (`STOREFRONT_URL`) with
 * `storefront-run.mjs start` and that endpoint's secret as
 * `SPREE_WEBHOOK_SECRET`. With no mail service key set, the storefront writes
 * the email it would send to a file in its build folder, named after the
 * order number this script records.
 *
 * A new customer registers through the Store API, as the storefront's sign-up
 * does, and staff place an order of one Electric Kettle for them, paid by
 * cheque, through the Admin API. Staff then fulfil it on the order page with
 * a UPS tracking number, and the customer signs in on the storefront and
 * opens the order. Captures are `results/fl-06/<step>.png`, with
 * `answers.json`. The order is left fulfilled.
 */

const storefront = process.env.STOREFRONT_URL ?? 'http://localhost:3001'
const results = new URL('./results/fl-06/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const password = 'fl-06-customer-password-123'

test.use({ viewport: { width: 1280, height: 960 }, actionTimeout: 15_000 })

test('FL-06: a fulfilled order reaches the shopper with its tracking', async ({
  page,
  baseURL,
}) => {
  mkdirSync(results, { recursive: true })
  const api = await request.newContext({ baseURL })
  const { creds, headers } = await admin(api)
  const methods = await chequeMethods(baseURL as string, api, headers)
  const keys = await list(api, headers, 'api_keys')
  const key = keys.find((each) => each.name === 'Default' && each.key_type === 'publishable')
  expect(key, "the store's publishable key").toBeTruthy()

  const email = `fidelity-fl06-${Date.now()}@example.com`
  const registered = await api.post('/api/v3/store/customers', {
    headers: { 'X-Spree-API-Key': String(key?.plaintext_token) },
    data: {
      email,
      password,
      password_confirmation: password,
      first_name: guestAddress.first_name,
      last_name: guestAddress.last_name,
    },
  })
  expect(registered.status(), 'registering the customer').toBe(201)
  const customer = ((await registered.json()) as { user: Json }).user

  const draft = await call(api, headers, 'post', 'orders', {
    customer_id: customer.id,
    shipping_address: guestAddress,
    billing_address: guestAddress,
    items: [{ variant_id: await variantId(api, headers, skus.kettle), quantity: 1 }],
  })
  const unpaid = await call(api, headers, 'get', `orders/${draft.id}`)
  await call(api, headers, 'post', `orders/${draft.id}/payments`, {
    payment_method_id: methods.cheque,
    amount: unpaid.amount_due,
  })
  await call(api, headers, 'patch', `orders/${draft.id}/complete`, { notify_customer: false })
  const placed = await call(api, headers, 'get', `orders/${draft.id}`)

  await login(page)
  await page.goto(`/${creds.store_id}/orders/${draft.id}`)
  await expect(page.getByRole('heading', { name: placed.number as string })).toBeVisible({
    timeout: 15_000,
  })
  const fulfilments = page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: /^Fulfillments/ }) })
    .first()
  await fulfilments.getByRole('button', { name: 'Mark as fulfilled' }).first().click()
  await page.getByRole('textbox', { name: 'Tracking number' }).fill(tracking.ups)
  await page.getByRole('button', { name: 'Fulfill items' }).click()
  await expect(fulfilments.getByRole('link', { name: tracking.ups })).toBeVisible({
    timeout: 15_000,
  })
  await page.evaluate(() => document.fonts.ready)
  await fulfilments.screenshot({ path: `${results}1-fulfilled-on-the-dashboard.png` })
  const shipped = await call(
    api,
    headers,
    'get',
    `orders/${draft.id}?expand=fulfillments,fulfillments.deliveries`,
  )

  await page.context().clearCookies()
  await page.goto(`${storefront}/us/en/account`)
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page
    .locator('form')
    .getByRole('button', { name: /^sign in$/i })
    .click()
  await expect(page.locator('#email')).toHaveCount(0, { timeout: 15_000 })

  const orderPage = `${storefront}/us/en/account/orders/${draft.id}`
  const views: Json[] = []
  for (const [width, height] of [
    [390, 844],
    [1280, 960],
  ] as const) {
    await page.setViewportSize({ width, height })
    await page.goto(orderPage)
    await expect(page.getByText(placed.number as string).first()).toBeVisible({ timeout: 15_000 })
    const track = page.getByRole('link', { name: /track items/i })
    await expect(track.first()).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: `${results}2-shopper-order-${width}.png`, fullPage: true })
    views.push({
      width,
      track_items_links: await track.evaluateAll((links) =>
        links.map((link) => link.getAttribute('href')),
      ),
      text: (await page.locator('main').last().innerText()).replace(/\s+/g, ' ').trim(),
    })
  }

  writeFileSync(
    `${results}answers.json`,
    `${JSON.stringify(
      {
        revision,
        storefront_revision: process.env.STOREFRONT_REVISION ?? null,
        order: placed.number,
        tracking_number: tracking.ups,
        fulfilments: (shipped.fulfillments as Json[]).map((each) => ({
          status: each.status,
          tracking: each.tracking,
          tracking_url: each.tracking_url,
        })),
        storefront_views: views,
      },
      null,
      2,
    )}\n`,
  )
  await api.dispose()
})
