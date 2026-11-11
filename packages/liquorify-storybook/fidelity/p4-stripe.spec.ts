import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, test } from '@playwright/test'
import { getCredentials, login } from '../../dashboard/e2e/helpers'
import { runRailsBootstrap } from '../../dashboard/e2e/rails'
import {
  cartFor,
  eventually,
  p4Named,
  placeholderStripeKeys,
  publishableKey,
  ratedProduct,
  removeWebhookEndpoints,
  type Stripe,
  stripe,
  stripeMethod,
} from './p4'
import { confirmation, reload, revision, type Seed, seeded, stamp } from './p9'
import { card, dialog, openOrder, shipped, unitsOf } from './p11-orders'

/**
 * The platform batch's step P4, part 1: Stripe on the backend and the
 * dashboard (checks 4.1 to 4.5 of the work item), against Stripe's test mode.
 *
 * The server is the dashboard browser tests' own, started with the provider
 * gems (`stack.spec.ts`, `LIQUORIFY_PROVIDERS=1`). Spree's settings carry only
 * placeholder keys; the environment's proxy authenticates each request to
 * Stripe. Each test adds its own records, named with the run's stamp, and
 * every Stripe payment method it adds is deleted at the end, with the webhook
 * endpoints Spree registered for it.
 *
 * Every test asserts the intended result. A known or new defect fails where
 * it stands, with what was seen recorded first.
 *
 * Results go to `results/p4/stripe/`: what each step showed, Stripe's own
 * record of each payment, and screenshots. Keys are never written out.
 */

const results = new URL('./results/p4/stripe/', import.meta.url).pathname
const added: string[] = []
let stripeApi: Stripe

/**
 * Spree installs each provider once per store, so the file shares one Stripe
 * method: the one 4.1 adds on the screens, or, if 4.1 did not save one, one
 * added through the Admin API with the same placeholder keys.
 */
async function stripeOnce(baseURL: string | undefined, extra: Record<string, unknown> = {}) {
  return seeded(baseURL, async (seed) => {
    const { data } = await seed.get<{ data: { id: string; type: string }[] }>(
      'payment_methods?limit=100',
    )
    let method = data.find((each) => each.type === 'stripe')
    if (!method) {
      method = await stripeMethod(seed, 'Stripe')
      added.push(method.id)
    }
    if (Object.keys(extra).length) await seed.patch(`payment_methods/${method.id}`, extra)
    return method
  })
}

function save(name: string, data: object) {
  mkdirSync(results, { recursive: true })
  writeFileSync(
    `${results}${name}.json`,
    `${JSON.stringify({ revision, stamp, ...data }, null, 2)}\n`,
  )
}

async function snap(page: Page, name: string) {
  mkdirSync(results, { recursive: true })
  await page.screenshot({ path: `${results}${name}.png`, fullPage: true })
}

/** Places a guest's order paid by this Stripe test payment method, as checkout does. */
async function checkout(
  baseURL: string,
  methodId: string,
  label: string,
  testPaymentMethod: string,
) {
  return seeded(baseURL, async (seed) => {
    const key = await publishableKey(seed)
    const at = await ratedProduct(seed, label, baseURL)
    const shopper = await cartFor(baseURL, key, at.product, `p4-${stamp}@example.com`)
    const { cart } = shopper
    const session = await shopper.ok<{ id: string; external_id: string }>(
      'POST',
      `carts/${cart.id}/payment_sessions`,
      cart.token,
      { payment_method_id: methodId },
    )
    // What Stripe.js does in the shopper's browser: confirm the intent with
    // the card the shopper entered, here one of Stripe's test payment methods.
    const confirmed = await stripeApi.raw(
      'POST',
      `payment_intents/${session.external_id}/confirm`,
      {
        payment_method: testPaymentMethod,
        return_url: 'https://example.com/p4-return',
      },
    )
    const completed = await shopper.call<{ status: string }>(
      'PATCH',
      `carts/${cart.id}/payment_sessions/${session.id}/complete`,
      cart.token,
      {},
    )
    const placed = await shopper.call<{ id: string; number: string; total: string }>(
      'POST',
      `carts/${cart.id}/complete`,
      cart.token,
      {},
    )
    await shopper.dispose()
    return { cart, session, confirmed, completed, placed, intentId: session.external_id }
  })
}

test.beforeAll(async () => {
  stripeApi = await stripe()
})

test.afterAll(async ({ baseURL }) => {
  const removed: string[] = []
  for (const id of added) removed.push(...(await removeWebhookEndpoints(stripeApi, id)))
  await seeded(baseURL, async (seed) => {
    for (const id of added)
      await seed.api.delete(`/api/v3/admin/payment_methods/${id}`, { headers: seed.headers })
  })
  save('clean-up', { removedWebhookEndpoints: removed.length, paymentMethods: added.length })
  await stripeApi.dispose()
})

test('4.1 adding Stripe in test mode from the integrations page', async ({ page, baseURL }) => {
  test.setTimeout(180_000)
  const { store_id: storeId } = getCredentials()
  await login(page)
  await page.goto(`/${storeId}/settings/integrations`)
  await expect(page.getByRole('heading', { name: /^payments$/i })).toBeVisible({ timeout: 15_000 })
  await snap(page, '4.1-integrations-before')
  await page.getByRole('link', { name: /manage payment methods/i }).click()
  await page.getByRole('button', { name: /add payment method/i }).click()
  await page.locator('#type').click()
  await page.getByRole('option', { name: 'Stripe' }).click()
  const name = p4Named('Stripe 4.1')
  await page.locator('#name').fill(name)
  await page.locator('#preference-publishable_key').fill(placeholderStripeKeys.publishable_key)
  await page.locator('#preference-secret_key').fill(placeholderStripeKeys.secret_key)
  await page.getByRole('button', { name: /create payment method/i }).click()
  await expect(page.getByRole('button', { name })).toBeVisible({ timeout: 30_000 })

  const method = await seeded(baseURL, async (seed) => {
    const { data } = await seed.get<{ data: { id: string; name: string; active: boolean }[] }>(
      'payment_methods?limit=100',
    )
    return data.find((each) => each.name === name)
  })
  expect(method, 'the Stripe method was saved').toBeTruthy()
  added.push(method?.id as string)

  await page.goto(`/${storeId}/settings/integrations`)
  const toggle = page.getByRole('switch', { name: `Turn ${name} on or off` })
  await expect(toggle).toBeVisible({ timeout: 15_000 })
  await snap(page, '4.1-integrations-after')
  const on = await toggle.isChecked()

  // Spree registers Stripe's webhook endpoint in the background after a save.
  const registered = await eventually(async () => {
    const { data } = await stripeApi.get<{ data: { id: string; url: string; status: string }[] }>(
      'webhook_endpoints?limit=100',
    )
    const ours = data.filter((endpoint) => endpoint.url.includes(method?.id as string))
    return ours.length ? ours : undefined
  }, 45_000)
  save('4.1', {
    method: { id: method?.id, active: method?.active, shownOn: on },
    webhookEndpoints:
      registered?.map((endpoint) => ({ url: endpoint.url, status: endpoint.status })) ?? [],
  })
  expect(on, 'Stripe is switched on on the integrations page').toBe(true)
  expect(registered, "Spree registered Stripe's webhook endpoint for the method").toBeTruthy()
})

/**
 * The store's address as Spree's seeds save it, a host with no scheme, and as
 * the test sets it for the control. No Admin API request writes it, so the
 * control sets it in the test app's database, and puts it back afterwards.
 */
function storeUrl(url?: string) {
  const ruby = [
    'require "json"',
    's = Spree::Store.default',
    url ? `s.update_column(:url, ${JSON.stringify(url)})` : '',
    'puts({ url: s.reload.url }.to_json)',
  ].join('; ')
  return (
    JSON.parse(runRailsBootstrap(ruby, { ...process.env, RAILS_ENV: 'test' })) as { url: string }
  ).url
}

test("4.1's control: the same registration for a store whose address has a scheme (SD-97)", async ({
  baseURL,
}) => {
  test.setTimeout(180_000)
  const seeded_url = storeUrl()
  const method = await stripeOnce(baseURL)
  storeUrl(`https://p4-${stamp}.example.com`)
  try {
    // Any save that is not only the registration itself registers again.
    await seeded(baseURL, (seed) =>
      seed.patch(`payment_methods/${method.id}`, { description: `P4 control ${stamp}` }),
    )
    const registered = await eventually(async () => {
      const { data } = await stripeApi.get<{ data: { url: string; status: string }[] }>(
        'webhook_endpoints?limit=100',
      )
      const ours = data.filter((endpoint) => endpoint.url.includes(method.id))
      return ours.length ? ours : undefined
    }, 45_000)
    save('4.1-control', {
      seededStoreUrl: seeded_url,
      storeUrlForControl: `https://p4-${stamp}.example.com`,
      webhookEndpoints:
        registered?.map((endpoint) => ({ url: endpoint.url, status: endpoint.status })) ?? [],
    })
    expect(registered, 'with a scheme, Spree registers the endpoint').toBeTruthy()
  } finally {
    storeUrl(seeded_url)
  }
})

test('4.2 a guest order paid with a Stripe test card', async ({ baseURL }) => {
  test.setTimeout(180_000)
  const method = await stripeOnce(baseURL, { capture_method: 'checkout' })
  const paid = await checkout(baseURL as string, method.id, 'Stripe 4.2', 'pm_card_visa')
  const intent = await stripeApi.get<{
    status: string
    amount: number
    currency: string
    livemode: boolean
  }>(`payment_intents/${paid.intentId}`)
  const order = paid.placed.body
  const payments = await seeded(baseURL, (seed) =>
    seed.get<{ data: { status: string; amount: string; response_code: string }[] }>(
      `orders/${order.id}/payments`,
    ),
  )
  save('4.2', {
    confirm: { status: paid.confirmed.status, intentStatus: paid.confirmed.body.status },
    session: paid.completed.body.status,
    placed: { status: paid.placed.status, number: order.number, total: order.total },
    stripe: {
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
      livemode: intent.livemode,
    },
    spreePayments: payments.data.map((each) => ({ status: each.status, amount: each.amount })),
  })
  expect(paid.placed.status, 'the order is placed').toBeLessThan(300)
  expect(intent.status).toBe('succeeded')
  expect(intent.livemode).toBe(false)
  expect(intent.currency).toBe('usd')
  expect(intent.amount).toBe(Math.round(Number(order.total) * 100))
  expect(payments.data.map((each) => each.status)).toContain('completed')
  expect(payments.data.find((each) => each.status === 'completed')?.response_code).toBe(
    paid.intentId,
  )
})

const textOf = async (scope: ReturnType<Page['locator']>) =>
  (await scope.innerText()).replace(/\s+/g, ' ').trim()

const paymentsCard = (page: Page) => card(page, /^payments/i)

/** The order's payments as the Admin API reads them. */
const paymentsOf = (seed: Seed, orderId: string) =>
  seed.get<{
    data: {
      id: string
      status: string
      amount: string
      response_code: string
      avs_response: string | null
      cvv_response_code: string | null
      avs_risky?: boolean
      cvv_risky?: boolean
    }[]
  }>(`orders/${orderId}/payments`)

async function paymentAction(page: Page, action: 'Capture' | 'Void') {
  await paymentsCard(page)
    .getByRole('button', { name: /actions/i })
    .first()
    .click()
  await page.getByRole('menuitem', { name: action }).click()
  await confirmation(page).getByRole('button', { name: action }).click()
  // The request waits on Stripe; the dialog closes once Spree has answered.
  await expect(confirmation(page)).toBeHidden({ timeout: 30_000 })
  const expected = action === 'Capture' ? /completed/i : /void/i
  let shown = ''
  await expect
    .poll(
      async () => {
        await reload(page)
        shown = await textOf(paymentsCard(page).getByRole('row').nth(1))
        return shown
      },
      { timeout: 45_000, intervals: [2_000] },
    )
    .toMatch(expected)
    .catch(() => undefined)
  return shown
}

test('4.3 capturing, refunding part of and voiding Stripe payments on the order page', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(300_000)
  const method = await stripeOnce(baseURL, { capture_method: 'manual' })
  try {
    const toCapture = await checkout(
      baseURL as string,
      method.id,
      'Stripe 4.3 capture',
      'pm_card_visa',
    )
    const toVoid = await checkout(baseURL as string, method.id, 'Stripe 4.3 void', 'pm_card_visa')
    const authorized = await stripeApi.get<{ status: string }>(
      `payment_intents/${toCapture.intentId}`,
    )
    await login(page)

    const captureOrder = { id: toCapture.placed.body.id, number: toCapture.placed.body.number }
    await openOrder(page, captureOrder)
    const beforeCapture = await textOf(paymentsCard(page).getByRole('row').nth(1))
    const afterCapture = await paymentAction(page, 'Capture')
    await snap(page, '4.3-captured')
    const captured = await stripeApi.get<{
      status: string
      amount_received: number
      latest_charge: string
    }>(`payment_intents/${toCapture.intentId}`)

    // Part of the captured payment goes back through a claim resolved by
    // refund, the order page's way to send part of a payment back.
    const claim = await seeded(baseURL, async (seed) => {
      await shipped(seed, captureOrder)
      const units = await unitsOf(seed, captureOrder)
      const { data } = await seed.get<{ data: { id: string; name: string }[] }>(
        'claim_reasons?limit=100',
      )
      const created = await seed.post<{ id: string; number: string }>(
        `orders/${captureOrder.id}/claims`,
        { items: [{ line_item_id: units[0].line_item_id, quantity: 1 }], reason_id: data[0].id },
      )
      await seed.patch(`orders/${captureOrder.id}/claims/${created.id}/approve`)
      return created
    })
    await reload(page)
    const claims = card(page, /^claims/i)
    await claims
      .locator('[data-slot="card"]')
      .filter({ hasText: claim.number })
      .last()
      .getByRole('button', { name: 'Actions' })
      .click()
    await page.getByRole('menuitem', { name: /^resolve/i }).click()
    await dialog(page).getByRole('combobox', { name: 'How to resolve' }).click()
    await page.getByRole('option', { name: 'Refund', exact: true }).click()
    await dialog(page).getByRole('combobox', { name: 'Refund to' }).click()
    await page.getByRole('option', { name: 'Original payment', exact: true }).click()
    await dialog(page).getByRole('spinbutton').first().fill('10.00')
    await snap(page, '4.3-refund-dialog')
    await dialog(page)
      .getByRole('button', { name: /^resolve/i })
      .last()
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 30_000 })
    await reload(page)
    await snap(page, '4.3-refunded')
    const refunds = await stripeApi.get<{ data: { amount: number; status: string }[] }>(
      `refunds?payment_intent=${toCapture.intentId}`,
    )

    const voidOrder = { id: toVoid.placed.body.id, number: toVoid.placed.body.number }
    await openOrder(page, voidOrder)
    const afterVoid = await paymentAction(page, 'Void')
    await snap(page, '4.3-voided')
    const voided = await stripeApi.get<{ status: string }>(`payment_intents/${toVoid.intentId}`)

    save('4.3', {
      authorizedAtStripe: authorized.status,
      capture: {
        before: beforeCapture,
        after: afterCapture,
        stripe: captured.status,
        received: captured.amount_received,
      },
      refund: {
        claim: claim.number,
        stripe: refunds.data.map((each) => ({ amount: each.amount, status: each.status })),
      },
      void: { after: afterVoid, stripe: voided.status },
    })
    expect(authorized.status, 'manual capture leaves the intent authorized').toBe(
      'requires_capture',
    )
    expect(afterCapture).toMatch(/completed/i)
    expect(captured.status).toBe('succeeded')
    expect(refunds.data.map((each) => each.amount)).toEqual([1000])
    expect(afterVoid).toMatch(/void/i)
    expect(voided.status).toBe('canceled')
  } finally {
    await stripeOnce(baseURL, { capture_method: 'checkout' })
  }
})

test('4.4 a declined Stripe test card places no order', async ({ baseURL }) => {
  test.setTimeout(180_000)
  const method = await stripeOnce(baseURL, { capture_method: 'checkout' })
  const declined = await checkout(
    baseURL as string,
    method.id,
    'Stripe 4.4',
    'pm_card_chargeDeclined',
  )
  const error = (declined.confirmed.body.error ?? {}) as { code?: string; message?: string }
  const orders = await seeded(baseURL, (seed) =>
    seed.get<{ data: { number: string }[] }>(`orders?q[number_eq]=${declined.cart.number}`),
  )
  save('4.4', {
    stripe: { status: declined.confirmed.status, code: error.code, message: error.message },
    session: declined.completed.body.status,
    completion: { status: declined.placed.status, error: declined.placed.body.error },
    ordersWithTheCartNumber: orders.data.length,
  })
  expect(declined.confirmed.status, 'Stripe declines the card').toBe(402)
  expect(error.code).toBe('card_declined')
  expect(declined.completed.body.status, 'the payment session fails').toBe('failed')
  expect(declined.placed.status, 'completing the cart is refused').toBeGreaterThanOrEqual(400)
  expect(orders.data, 'no order is placed').toHaveLength(0)
})

test('4.5 approving an order whose Stripe card failed its checks (P11 action 2.3)', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(300_000)
  const method = await stripeOnce(baseURL, { capture_method: 'checkout' })
  const tried: Record<string, unknown>[] = []
  let risky: { id: string; number: string } | undefined
  for (const testCard of ['pm_card_cvcCheckFail', 'pm_card_avsLine1Fail']) {
    const paid = await checkout(baseURL as string, method.id, `Stripe 4.5 ${testCard}`, testCard)
    const order = paid.placed.body
    const read =
      paid.placed.status < 300
        ? await seeded(baseURL, async (seed) => ({
            order: await seed.get<{ considered_risky: boolean }>(`orders/${order.id}`),
            payments: (await paymentsOf(seed, order.id)).data,
          }))
        : undefined
    tried.push({
      card: testCard,
      stripe: {
        status: paid.confirmed.status,
        intent: paid.confirmed.body.status,
        error: (paid.confirmed.body.error as { code?: string } | undefined)?.code,
      },
      placed: paid.placed.status,
      consideredRisky: read?.order.considered_risky,
      payments: read?.payments.map((each) => ({
        status: each.status,
        avs: each.avs_response,
        cvv: each.cvv_response_code,
      })),
    })
    if (read?.order.considered_risky) {
      risky = { id: order.id, number: order.number }
      break
    }
  }
  if (!risky) {
    save('4.5', { tried, result: 'NOT_RUN: no completed payment was marked risky' })
    expect(
      risky,
      'an order Spree marks risky from a Stripe payment whose checks failed',
    ).toBeTruthy()
    return
  }
  await login(page)
  await openOrder(page, risky)
  const badge = paymentsCard(page).getByText('Failed card checks')
  const warned = await badge.isVisible()
  await page.getByRole('button', { name: 'More actions' }).click()
  const approve = page.getByRole('menuitem', { name: 'Approve' })
  const offered = await approve
    .waitFor({ state: 'visible', timeout: 10_000 })
    .then(() => true)
    .catch(() => false)
  await snap(page, '4.5-risky')
  await approve.click()
  await confirmation(page).getByRole('button', { name: 'Approve' }).click()
  await page.waitForLoadState('networkidle')
  await reload(page)
  await expect(page.getByText('Approved by')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'More actions' }).click()
  // The menu's other items show that it opened before Approve is looked for.
  await expect(page.getByRole('menuitem').first()).toBeVisible({ timeout: 10_000 })
  const stillOffered = await page.getByRole('menuitem', { name: 'Approve' }).isVisible()
  await page.keyboard.press('Escape')
  await snap(page, '4.5-approved')
  const after = await seeded(baseURL, (seed) =>
    seed.get<{ considered_risky: boolean; approved_at: string | null }>(`orders/${risky.id}`),
  )
  save('4.5', {
    tried,
    order: risky.number,
    before: { failedCardChecksBadge: warned, approveOffered: offered },
    after: { approvedAt: !!after.approved_at, approveOffered: stillOffered },
  })
  expect(warned, 'the payments card shows the failed card checks').toBe(true)
  expect(offered, 'Approve is offered for the risky order').toBe(true)
  expect(after.approved_at, 'the order is approved after a reload').toBeTruthy()
  expect(stillOffered, 'Approve is no longer offered').toBe(false)
})
