import { createHmac, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { createPlacedOrder, login } from '../../dashboard/e2e/helpers'
import { LOCAL_ADDRESS, markLocalAddresses, paintOut } from './developers'

/**
 * The storefront's webhook receiver, for P2's criterion 5.5 (the webhook part
 * of G-16). Spree's browser-test server delivers real order events to the
 * storefront, started on this machine with the endpoint's secret, and the
 * storefront writes each email it sends to its emails folder, as it does when
 * no email provider is configured. A delivery signed with another secret, or
 * not signed, is refused and writes nothing.
 *
 * Before running it: start the screens with
 * `SPREE_WEBHOOKS_ALLOWED_INTERNAL_HOSTS=localhost`, give the server the
 * storefront's endpoint with `storefront-endpoint.mjs`, which writes the
 * endpoint's secret to a private file, and start the storefront on port 3001
 * with `SPREE_WEBHOOK_SECRET` read from that file and no `RESEND_API_KEY`.
 * Run this with `STOREFRONT_EMAILS_DIR` naming the storefront's `.next/emails`.
 *
 * The orders are placed through the Admin API for the browser-test data's
 * promotion customer, as Spree's own dashboard tests place theirs.
 */

const API = process.env.P2_API_URL ?? 'http://localhost:3010'
const STOREFRONT = process.env.STOREFRONT_URL ?? 'http://localhost:3001'
const EMAILS = process.env.STOREFRONT_EMAILS_DIR ?? ''
const endpointUrl = 'http://localhost:3001/api/webhooks/spree'
const results = new URL('./results/p2/', import.meta.url).pathname
const run = Date.now()

type Json = Record<string, unknown>

const emails = () => (existsSync(EMAILS) ? readdirSync(EMAILS) : [])

async function emailFor(number: string, kind: string, before: string[]) {
  const wanted = (name: string) =>
    !before.includes(name) && name.includes(kind) && name.includes(number.toLowerCase())
  await expect.poll(() => emails().some(wanted), { timeout: 60_000 }).toBe(true)
  const name = emails().find(wanted) as string
  const html = readFileSync(join(EMAILS, name), 'utf8')
  return {
    path: join(EMAILS, name),
    file: name.replace(/-\d+\.html$/, '-<time>.html'),
    namesTheOrder: html.includes(number),
  }
}

test('the storefront accepts signed order events and writes each email', async ({ page }) => {
  test.skip(!EMAILS, "Run with STOREFRONT_EMAILS_DIR naming the storefront's emails folder")
  mkdirSync(results, { recursive: true })
  const session = await login(page)
  const admin = async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${session.accessToken}`)
    headers.set('X-Spree-Store-Id', session.store_id)
    if (init.body) headers.set('Content-Type', 'application/json')
    const res = await fetch(`${API}/api/v3/admin/${path}`, { ...init, headers })
    return { status: res.status, body: (await res.json()) as Json }
  }
  const endpoints = await admin('webhook_endpoints?limit=100')
  const endpoint = (endpoints.body.data as Json[]).find((item) => item.url === endpointUrl)
  expect(endpoint, 'Create the endpoint with storefront-endpoint.mjs first').toBeTruthy()
  const endpointId = String(endpoint?.id)

  const before = emails()
  const shipped = await createPlacedOrder(page, session.accessToken, {
    quantity: 1,
    firstName: 'P2',
    lastName: `Shipped ${run}`,
  })
  const canceled = await createPlacedOrder(page, session.accessToken, {
    quantity: 1,
    ship: false,
    firstName: 'P2',
    lastName: `Canceled ${run}`,
  })
  const cancel = await admin(`orders/${canceled.id}/cancel`, { method: 'PATCH', body: '{}' })
  expect(cancel.status).toBe(200)

  const found = {
    orderPlaced: await emailFor(shipped.number, 'order-confirmation', before),
    orderFulfilled: await emailFor(shipped.number, 'shipment-notification', before),
    orderCanceled: await emailFor(canceled.number, 'order-canceled', before),
  }
  const written: Record<string, { file: string; namesTheOrder: boolean }> = {}
  for (const [event, email] of Object.entries(found)) {
    await page.goto(`file://${email.path}`)
    await markLocalAddresses(page)
    writeFileSync(
      `${results}storefront-email-${event}.png`,
      await page.screenshot({ fullPage: true, style: paintOut(LOCAL_ADDRESS) }),
    )
    written[event] = { file: email.file, namesTheOrder: email.namesTheOrder }
  }

  // What Spree recorded for each delivery to the storefront.
  const recorded: Record<string, unknown> = {}
  for (const [event, order] of [
    ['order.placed', shipped],
    ['order.fulfilled', shipped],
    ['order.placed', canceled],
    ['order.canceled', canceled],
  ] as const) {
    const listed = await admin(
      `webhook_endpoints/${endpointId}/deliveries?limit=100&q[event_name_eq]=${event}`,
    )
    const matches = []
    for (const item of listed.body.data as Json[]) {
      const delivery = (await admin(`webhook_endpoints/${endpointId}/deliveries/${item.id}`)).body
      const payload = delivery.payload as { data?: { number?: string } } | undefined
      if (payload?.data?.number === order.number) matches.push(delivery)
    }
    recorded[`${event} for order ${order === shipped ? 'shipped' : 'canceled'}`] = matches.map(
      (delivery) => ({
        success: delivery.success,
        response_code: delivery.response_code,
        response_body: delivery.response_body,
      }),
    )
  }

  // Deliveries the storefront must refuse.
  const body = JSON.stringify({
    id: randomBytes(8).toString('hex'),
    name: 'order.placed',
    data: {},
  })
  const timestamp = String(Math.floor(Date.now() / 1000))
  const forged = createHmac('sha256', randomBytes(32).toString('hex'))
    .update(`${timestamp}.${body}`)
    .digest('hex')
  const beforeRefusals = emails()
  const post = (headers: Record<string, string>) =>
    fetch(`${STOREFRONT}/api/webhooks/spree`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
    })
  const wrong = await post({
    'X-Spree-Webhook-Signature': forged,
    'X-Spree-Webhook-Timestamp': timestamp,
    'X-Spree-Webhook-Event': 'order.placed',
  })
  const unsigned = await post({ 'X-Spree-Webhook-Event': 'order.placed' })
  const refusals = {
    wrongSignature: { status: wrong.status, body: await wrong.json() },
    noSignature: { status: unsigned.status, body: await unsigned.json() },
    emailsWritten: emails().filter((name) => !beforeRefusals.includes(name)).length,
  }

  const summary = {
    check: "P2 criterion 5.5: the storefront's webhook receiver (G-16, webhook part)",
    revision: process.env.FIDELITY_REVISION ?? null,
    storefrontRevision: process.env.STOREFRONT_REVISION ?? null,
    endpoint: {
      url: "The storefront's receiver, on this machine",
      subscriptions: endpoint?.subscriptions,
    },
    written,
    recorded,
    refusals,
  }
  writeFileSync(`${results}storefront-webhooks.json`, `${JSON.stringify(summary, null, 2)}\n`)

  for (const email of Object.values(written)) expect(email.namesTheOrder).toBe(true)
  for (const deliveries of Object.values(recorded) as { success: boolean }[][]) {
    expect(deliveries.length).toBeGreaterThan(0)
    for (const delivery of deliveries) expect(delivery.success).toBe(true)
  }
  expect(refusals.wrongSignature.status).toBe(401)
  expect(refusals.noSignature.status).toBe(401)
  expect(refusals.emailsWritten).toBe(0)
})
