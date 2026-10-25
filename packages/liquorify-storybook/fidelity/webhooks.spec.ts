import { createHmac, timingSafeEqual } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { LOCAL_ADDRESS, markLocalAddresses, paintOut } from './developers'
import { MAIL_DIR, mailTo, nextMail } from './mail'
import { type Received, Receiver } from './receiver'

/**
 * Webhooks, for the platform batch's step P2 (G-29, G-31): an endpoint created
 * on the webhooks screens (DA-SET-28, DA-SET-29) for a local receiver, its test
 * delivery and real events reaching that receiver signed with the secret the
 * screen showed once, and an endpoint whose receiver refuses everything being
 * retried, disabled automatically and reported by email (EM-S-07). The real
 * events include the customer password resets of P2's criterion 3, which show
 * that a reset carries its redirect address only when the address is on an
 * origin added on the allowed origins screen (DA-SET-30).
 *
 * Start the screens with `SPREE_WEBHOOKS_ALLOWED_INTERNAL_HOSTS=localhost`, so
 * Spree may deliver to a receiver on this machine, and with
 * `LIQUORIFY_MAIL_DIR` naming an empty folder that this script also reads (see
 * mail.ts and P2's record).
 *
 * The signing secret, reset tokens and signatures stay in memory. The results
 * keep event names, field names, statuses and whether each signature verified.
 */

const API = process.env.P2_API_URL ?? 'http://localhost:3010'
const results = new URL('./results/p2/', import.meta.url).pathname
const run = Date.now()
// Each run's own path, because a store holds one endpoint per address.
const hookUrl = `http://localhost:4412/hooks/${run}`
const failingUrl = `http://localhost:4413/hooks/${run}`

const receiver = new Receiver(4412)
const failing = new Receiver(4413)
failing.status = 500

const subscribed = ['product.updated', 'customer.password_reset_requested']

test.describe.configure({ mode: 'serial' })
test.beforeAll(async () => {
  await receiver.start()
  await failing.start()
})
test.afterAll(async () => {
  await receiver.stop()
  await failing.stop()
})

type Json = Record<string, unknown>

interface Session {
  store_id: string
  accessToken: string
}

async function adminCall(session: Session, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${session.accessToken}`)
  headers.set('X-Spree-Store-Id', session.store_id)
  if (init.body) headers.set('Content-Type', 'application/json')
  const res = await fetch(`${API}/api/v3/admin/${path}`, { ...init, headers })
  const text = await res.text()
  return { status: res.status, body: (text ? JSON.parse(text) : {}) as Json }
}

async function storeCall(key: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('X-Spree-API-Key', key)
  if (init.body) headers.set('Content-Type', 'application/json')
  const res = await fetch(`${API}/api/v3/store/${path}`, { ...init, headers })
  const text = await res.text()
  return { status: res.status, body: (text ? JSON.parse(text) : {}) as Json }
}

function verifies(item: Received, secret: string) {
  const timestamp = String(item.headers['x-spree-webhook-timestamp'] ?? '')
  const given = Buffer.from(String(item.headers['x-spree-webhook-signature'] ?? ''), 'hex')
  const expected = createHmac('sha256', secret).update(`${timestamp}.${item.body}`).digest()
  return timestamp !== '' && given.length === expected.length && timingSafeEqual(given, expected)
}

const eventOf = (item: Received) => String(item.headers['x-spree-webhook-event'] ?? '')
// Endpoints left by earlier runs deliver to the same receivers, signed with
// their own secrets, so a run reads only what reached its own path.
const ours = (item: Received) => item.path === `/hooks/${run}`
const payloadOf = (item: Received) => JSON.parse(item.body) as Json & { data: Json }

/** What the results keep of a delivery: nothing a receiver could reuse. */
function described(item: Received, secret: string) {
  const payload = payloadOf(item)
  return {
    event: eventOf(item),
    signatureVerifies: verifies(item, secret),
    payloadName: payload.name,
    payloadFields: Object.keys(payload).sort(),
    dataFields: Object.keys(payload.data ?? {}).sort(),
    dataId: typeof payload.data?.id === 'string' ? payload.data.id.replace(/_.*/, '_…') : null,
  }
}

async function createOnScreen(page: Page, storeId: string, name: string, url: string) {
  await page.goto(`/${storeId}/settings/webhooks`)
  await page.getByRole('button', { name: 'New endpoint' }).click()
  const sheet = page.getByRole('dialog')
  await sheet.locator('#webhook-name').fill(name)
  await sheet.locator('#webhook-url').fill(url)
  for (const event of subscribed) {
    await sheet.getByText(event, { exact: true }).click()
  }
  await expect(sheet.getByText(`${subscribed.length} events`)).toBeVisible()
  await sheet.getByRole('button', { name: 'Create', exact: true }).click()
  const reveal = page.getByRole('dialog').filter({ hasText: 'Save your signing secret' })
  await expect(reveal).toBeVisible({ timeout: 15_000 })
  const secret = ((await reveal.locator('code').textContent()) ?? '').trim()
  await markLocalAddresses(page)
  writeFileSync(
    `${results}webhook-secret-shown.png`,
    await page.screenshot({ style: paintOut('[role="dialog"] code') + paintOut(LOCAL_ADDRESS) }),
  )
  await reveal.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 15_000 })
  return secret
}

test('an endpoint created on the screen receives signed deliveries of what it subscribes to', async ({
  page,
}) => {
  mkdirSync(results, { recursive: true })
  const session = await login(page)
  const name = `P2 receiver ${run}`
  const secret = await createOnScreen(page, session.store_id, name, hookUrl)
  expect(secret).toMatch(/^[0-9a-f]{64}$/)

  // The endpoint page's test delivery.
  const testSent = Date.now()
  await page.getByRole('button', { name: 'Send test', exact: true }).click()
  const testDelivery = await receiver.next(
    (item) => ours(item) && eventOf(item) === 'webhook.test',
    30_000,
    testSent,
  )
  await expect(async () => {
    await page.reload()
    await expect(page.getByText('Succeeded').first()).toBeVisible({ timeout: 2_000 })
  }).toPass({ timeout: 30_000 })
  await page.mouse.move(0, 0)
  await markLocalAddresses(page)
  writeFileSync(
    `${results}webhook-test-delivered.png`,
    await page.screenshot({ style: paintOut(LOCAL_ADDRESS) }),
  )

  // A publishable key for the storefront's requests, made through the Admin API.
  const key = await adminCall(session, 'api_keys', {
    method: 'POST',
    body: JSON.stringify({ name: `P2 webhook storefront ${run}`, key_type: 'publishable' }),
  })
  expect(key.status).toBe(201)
  const publishable = String(key.body.plaintext_token)

  // A product changed through the Admin API: published to the store's online
  // channel, which the browser-test data leaves it out of, so the Store API
  // answers for it and the delivery can be compared with that answer.
  const channels = await adminCall(session, 'channels?limit=25')
  const online = (channels.body.data as Json[]).find((item) => item.code === 'online')
  const products = await adminCall(session, 'products?limit=1')
  const productId = String((products.body.data as Json[])[0].id)
  const changed = Date.now()
  const update = await adminCall(session, `products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      product_publications: [{ channel_id: online?.id, published_at: '2026-01-01T00:00:00Z' }],
    }),
  })
  expect(update.status).toBe(200)
  const productDelivery = await receiver.next(
    (item) =>
      ours(item) && eventOf(item) === 'product.updated' && payloadOf(item).data?.id === productId,
    30_000,
    changed,
  )
  const storeProduct = await storeCall(publishable, `products/${productId}`)
  const notInStoreApi = Object.keys(payloadOf(productDelivery).data).filter(
    (field) => !(field in storeProduct.body),
  )

  // An event the endpoint does not subscribe to: a new customer, who then asks
  // for the password resets.
  const email = `p2-reset-${run}@example.com`
  const customer = await adminCall(session, 'customers', {
    method: 'POST',
    body: JSON.stringify({ email, first_name: 'Pat', last_name: 'Reset' }),
  })
  expect(customer.status).toBe(201)

  const origin = `https://p2-${run}.example.test`
  const reset = async (redirect: string) => {
    const since = Date.now()
    const res = await storeCall(publishable, 'password_resets', {
      method: 'POST',
      body: JSON.stringify({ email, redirect_url: redirect }),
    })
    const item = await receiver.next(
      (delivery) =>
        ours(delivery) &&
        eventOf(delivery) === 'customer.password_reset_requested' &&
        payloadOf(delivery).data?.email === email,
      30_000,
      since,
    )
    const data = payloadOf(item).data
    return {
      status: res.status,
      redirectAsked: redirect,
      redirectCarried: (data.redirect_url as string | undefined) ?? null,
      delivery: described(item, secret),
      storeIdMatches: data.store_id === session.store_id,
    }
  }

  const beforeOrigin = await reset(`${origin}/account/reset-password`)

  // The origin, added on the allowed origins screen.
  await page.goto(`/${session.store_id}/settings/allowed-origins`)
  await page.getByRole('button', { name: /add allowed origin/i }).click()
  await page.locator('#origin').fill(origin)
  await page.getByRole('button', { name: /^add origin$/i }).click()
  await expect(page.getByText(origin).first()).toBeVisible({ timeout: 15_000 })
  await page.mouse.move(0, 0)
  await markLocalAddresses(page)
  writeFileSync(
    `${results}allowed-origin-added.png`,
    await page.screenshot({ style: paintOut(LOCAL_ADDRESS) }),
  )

  const onOrigin = await reset(`${origin}/account/reset-password`)
  const elsewhere = await reset('https://elsewhere.example.test/account/reset-password')

  // Whatever else arrived for this endpoint in the meantime.
  await page.waitForTimeout(5_000)
  const unexpected = receiver.received
    .filter((item) => ours(item) && item.at >= testSent)
    .map(eventOf)
    .filter((event) => event !== 'webhook.test' && !subscribed.includes(event))

  const summary = {
    check:
      'P2 criteria 3 and 5.1 to 5.3: an endpoint on DA-SET-28/29, allowed origins on DA-SET-30',
    revision: process.env.FIDELITY_REVISION ?? null,
    endpoint: { name, url: 'A local receiver', subscriptions: subscribed },
    secretShownOnce: { format: '64 hexadecimal characters' },
    testDelivery: described(testDelivery, secret),
    productUpdated: {
      ...described(productDelivery, secret),
      sameProduct: payloadOf(productDelivery).data.id === productId,
      storeApiAnswer: storeProduct.status,
      fieldsNotInTheStoreApisAnswer: notInStoreApi,
    },
    customerCreated: {
      status: customer.status,
      delivered: unexpected.includes('customer.created'),
    },
    passwordResets: {
      origin,
      beforeTheOriginWasAdded: beforeOrigin,
      onTheAddedOrigin: onOrigin,
      onAnotherOrigin: elsewhere,
    },
    eventsDeliveredOutsideTheSubscription: unexpected,
  }
  writeFileSync(`${results}webhooks.json`, `${JSON.stringify(summary, null, 2)}\n`)

  expect(summary.testDelivery.signatureVerifies).toBe(true)
  expect(summary.testDelivery.payloadName).toBe('webhook.test')
  expect(summary.productUpdated.signatureVerifies).toBe(true)
  expect(summary.productUpdated.payloadName).toBe('product.updated')
  expect(summary.productUpdated.sameProduct).toBe(true)
  expect(productId).toMatch(/^prod_/)
  expect(storeProduct.status).toBe(200)
  expect(notInStoreApi).toEqual([])
  for (const item of [beforeOrigin, onOrigin, elsewhere]) {
    expect(item.status).toBe(202)
    expect(item.delivery.signatureVerifies).toBe(true)
    expect(item.storeIdMatches).toBe(true)
  }
  expect(beforeOrigin.redirectCarried).toBeNull()
  expect(onOrigin.redirectCarried).toBe(`${origin}/account/reset-password`)
  expect(elsewhere.redirectCarried).toBeNull()
  expect(unexpected).toEqual([])
})

test('an endpoint whose receiver refuses everything is retried, then disabled and reported', async ({
  page,
}) => {
  test.skip(!MAIL_DIR, 'Run with LIQUORIFY_MAIL_DIR naming the folder the server writes to')
  mkdirSync(results, { recursive: true })
  const session = await login(page)
  const store = await adminCall(session, 'store')
  const recipient = String(store.body.new_order_notifications_email || store.body.mail_from_address)
  const already = mailTo(recipient).length

  const name = `P2 refusing receiver ${run}`
  const created = await adminCall(session, 'webhook_endpoints', {
    method: 'POST',
    body: JSON.stringify({ name, url: failingUrl, subscriptions: ['product.deleted'] }),
  })
  expect(created.status).toBe(201)
  const id = String(created.body.id)
  const sendTest = () => adminCall(session, `webhook_endpoints/${id}/send_test`, { method: 'POST' })

  // The first failed delivery, then the same delivery sent again.
  await sendTest()
  const first = await failing.next((item) => ours(item) && eventOf(item) === 'webhook.test')
  const firstId = payloadOf(first).id
  const retried = await failing.next(
    (item) => ours(item) && item !== first && payloadOf(item).id === firstId,
    30_000,
  )

  // Fourteen more, for fifteen failed deliveries in a row.
  for (let count = 0; count < 14; count += 1) await sendTest()
  let endpoint: Json = {}
  await expect
    .poll(
      async () => {
        endpoint = (await adminCall(session, `webhook_endpoints/${id}`)).body
        return endpoint.disabled_at ?? null
      },
      { timeout: 60_000 },
    )
    .not.toBeNull()

  await page.goto(`/${session.store_id}/settings/webhooks/${id}`)
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 15_000 })
  await expect(
    page.getByText('Automatically disabled after repeated delivery failures').first(),
  ).toBeVisible()
  await page.mouse.move(0, 0)
  await markLocalAddresses(page)
  writeFileSync(
    `${results}webhook-auto-disabled.png`,
    await page.screenshot({ style: paintOut(LOCAL_ADDRESS) }),
  )

  const mail = await nextMail(recipient, already)
  const requests = failing.received.filter((item) => ours(item) && eventOf(item) === 'webhook.test')
  const summary = {
    check: 'P2 criterion 5.4: retries, auto-disable after 15 failures, EM-S-07',
    revision: process.env.FIDELITY_REVISION ?? null,
    endpoint: { name, url: 'A local receiver', receiverAnswers: failing.status },
    firstDeliverySentAgain: {
      secondsBetween: Math.round((retried.at - first.at) / 100) / 10,
      samePayloadId: payloadOf(retried).id === firstId,
    },
    testsSent: 15,
    requestsReceived: requests.length,
    distinctDeliveries: new Set(requests.map((item) => payloadOf(item).id)).size,
    endpointAfter: {
      active: endpoint.active,
      disabled: Boolean(endpoint.disabled_at),
      disabled_reason: endpoint.disabled_reason,
    },
    email: {
      template: 'EM-S-07, webhook_mailer/endpoint_disabled',
      to: 'the store staff address',
      subject: mail.subject,
      namesTheEndpoint: mail.html.includes(name),
    },
  }
  writeFileSync(`${results}webhooks-disabled.json`, `${JSON.stringify(summary, null, 2)}\n`)

  expect(summary.firstDeliverySentAgain.samePayloadId).toBe(true)
  expect(summary.endpointAfter).toEqual({
    active: false,
    disabled: true,
    disabled_reason: 'Automatically disabled after repeated delivery failures',
  })
  expect(mail.subject).toBe(`Webhook endpoint disabled: ${name}`)
  expect(summary.email.namesTheEndpoint).toBe(true)
})
