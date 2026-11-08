import { mkdirSync, writeFileSync } from 'node:fs'
import {
  type APIRequestContext,
  expect,
  type Locator,
  type Page,
  request,
  test,
} from '@playwright/test'
import { login, rowButton } from '../../dashboard/e2e/helpers'
import { secondLocation, tracking } from './after-sale'
import {
  call,
  chequeMethods,
  type Headers,
  type Json,
  list,
  orderCustomerEmail,
  orderPayments,
  skus,
  variantId,
} from './orders'
import { admin } from './staff'

/**
 * Batch 8's §2.5 for part 2: each setting other batches handed to "batch 8,
 * on real orders" for fulfilment and after the sale is saved through its
 * dashboard screen as the admin, then seen, or not, on an order made for it,
 * with a capture of each side and what the server answered. Start the screens
 * as `compare.spec.ts` describes, with Spree's sample catalog loaded and the
 * orders `after-sale.ts` makes, as `screens-batch-8-part-2.spec.ts` needs.
 *
 * Orders are made and paid by cheque through the Admin API, as staff make them
 * on DA-ORD-03; what each check looks at is done on the order page where the
 * dashboard offers it. Each check puts the store back as it found it: the
 * collected-later cheque method's capture setting, the Standard method's
 * tracking address, the Online Store channel's first routing rule, the
 * default profile's origins, the destination warehouse's returns setting and
 * the tax rate it adds. The return reason it adds stays, named "Fidelity",
 * since Spree keeps what returns used. Its orders stay, shipped or canceled.
 *
 * Captures go to `results/orders-settings-part-2/<setting>/<step>.png`, with
 * `answers.json` beside them.
 */

const results = new URL('./results/orders-settings-part-2/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const run = Date.now().toString().slice(-5)
const expand = 'expand=items,fulfillments,fulfillments.fulfillment_items'

type Api = { api: APIRequestContext; headers: Headers; storeId: string }

let context: Api
let customerId: string
let variants: { kettle: string; toaster: string; espresso: string }
let methods: { cheque: string; later: string }
let locations: { shop: Json; source: Json; destination: Json }
let generalProfile: Json
let deliveryMethods: { standard: Json; pickup: Json }
let onlineStore: Json

test.use({ viewport: { width: 1280, height: 960 }, actionTimeout: 15_000 })
test.describe.configure({ mode: 'serial' })

const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()
const fulfilmentsCard = (page: Page) => card(page, /^Fulfillments/)
const returnsCard = (page: Page) => card(page, /^Returns/)
const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).first()
const field = (scope: Page | Locator, label: string) =>
  scope.locator('[data-slot="field"]').filter({ hasText: label })

const folder = (setting: string) => {
  const path = `${results}${setting}/`
  mkdirSync(path, { recursive: true })
  return path
}

/** Shows a part of the page in the middle of the window and captures the window. */
async function shot(page: Page, setting: string, step: string, target?: Locator) {
  if (target) await target.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${folder(setting)}${step}.png` })
}

const record = (setting: string, answers: object) =>
  writeFileSync(
    `${folder(setting)}answers.json`,
    `${JSON.stringify({ revision, ...answers }, null, 2)}\n`,
  )

const text = async (target: Locator) => (await target.innerText()).replace(/\s+/g, ' ').trim()

const go = async (page: Page, path: string) => {
  await page.goto(`/${context.storeId}${path}`)
  await page.waitForLoadState('networkidle')
}

const openOrder = async (page: Page, order: Json) => {
  await go(page, `/orders/${order.id}`)
  await expect(page.getByRole('heading', { name: order.number as string })).toBeVisible({
    timeout: 15_000,
  })
}

const api = (method: 'get' | 'post' | 'patch' | 'delete', path: string, data?: object) =>
  call(context.api, context.headers, method, path, data)

const reload = (order: Json) => api('get', `orders/${order.id}?${expand}`)

const draftFor = (items: object[], data: object = {}) =>
  api('post', 'orders', {
    customer_id: customerId,
    use_customer_default_address: true,
    items,
    ...data,
  })

const item = (variant: string, quantity = 1) => ({ variant_id: variant, quantity })

/** Pays the order's balance by cheque and completes it, as staff do on DA-ORD-04. */
async function place(order: Json, method = methods.cheque) {
  const current = await api('get', `orders/${order.id}`)
  await api('post', `orders/${order.id}/payments`, {
    payment_method_id: method,
    amount: current.amount_due,
  })
  await api('patch', `orders/${order.id}/complete`, { notify_customer: false })
  return reload(order)
}

const fulfilmentsOf = (order: Json) => order.fulfillments as Json[]

async function fulfil(order: Json) {
  for (const fulfilment of fulfilmentsOf(order))
    await api('patch', `orders/${order.id}/fulfillments/${fulfilment.id}/fulfill`, {
      notify_customer: false,
    })
  return reload(order)
}

const locationName = (id: unknown) =>
  Object.values(locations).find((location) => location.id === id)?.name ?? id

const shipsFrom = (order: Json) =>
  fulfilmentsOf(order).map((fulfilment) => ({
    number: fulfilment.number,
    status: fulfilment.status,
    location: locationName(fulfilment.stock_location_id),
    units: (fulfilment.fulfillment_items as Json[]).map((unit) => ({
      variant: unit.variant_id,
      quantity: unit.quantity,
    })),
    cost: fulfilment.cost,
    unpriced: fulfilment.unpriced,
  }))

const paymentsOf = async (order: Json) =>
  ((await api('get', `orders/${order.id}/payments`)).data as Json[]).map((payment) => ({
    number: payment.number,
    status: payment.status,
    amount: payment.amount,
    captured_amount: payment.captured_amount,
  }))

/** The fulfil form from the order page's first fulfilment, sent with what `fill` adds. */
async function fulfilOnPage(page: Page, fill?: () => Promise<void>) {
  const target = fulfilmentsCard(page)
  await target.getByRole('button', { name: 'Mark as fulfilled' }).first().click()
  const send = page.getByRole('button', { name: 'Fulfill items' })
  await expect(send).toBeVisible()
  await fill?.()
  await send.click()
  await expect(target.getByRole('button', { name: 'Mark as fulfilled' })).toHaveCount(0, {
    timeout: 15_000,
  })
}

const openMethod = async (page: Page, method: Json) => {
  await go(page, `/settings/delivery-profiles/${generalProfile.id}?method=${method.id}`)
  await expect(page.getByRole('dialog').locator('#name')).toHaveValue(method.name as string, {
    timeout: 15_000,
  })
}

/** A SKU's stock at a location, as the inventory list counts it. */
async function levelOf(sku: string, location: Json) {
  const levels = await list(
    context.api,
    context.headers,
    `stock_levels?q[variant_sku_eq]=${encodeURIComponent(sku)}`,
  )
  const level = levels.find((each) => each.stock_location_id === location.id)
  return level
    ? {
        count_on_hand: level.count_on_hand,
        allocated_count: level.allocated_count,
        available_count: level.available_count,
      }
    : null
}

test.beforeAll(async ({ baseURL }) => {
  const api = await request.newContext({ baseURL })
  const { creds, headers } = await admin(api)
  context = { api, headers, storeId: creds.store_id }
  const [customer] = await list(
    api,
    headers,
    `customers?q[email_eq]=${encodeURIComponent(orderCustomerEmail)}`,
  )
  customerId = customer.id
  variants = {
    kettle: await variantId(api, headers, skus.kettle),
    toaster: await variantId(api, headers, skus.toaster),
    espresso: await variantId(api, headers, skus.espresso),
  }
  methods = await chequeMethods(baseURL ?? 'http://localhost:5174', api, headers)
  const stocked = await list(api, headers, 'stock_locations')
  const named = (name: string) => {
    const found = stocked.find((location) => location.name === name)
    expect(found, `the location "${name}"`).toBeTruthy()
    return found as Json
  }
  locations = {
    shop: stocked.find((location) => location.default) as Json,
    source: named(secondLocation),
    destination: named('E2E Destination Warehouse'),
  }
  generalProfile = (await list(api, headers, 'delivery_profiles')).find(
    (profile) => profile.default,
  ) as Json
  const allMethods = await list(api, headers, 'delivery_methods')
  const method = (name: string) => {
    const found = allMethods.find((each) => each.name === name)
    expect(found, `the delivery method "${name}"`).toBeTruthy()
    return found as Json
  }
  deliveryMethods = { standard: method('Standard'), pickup: method('Store Pickup') }
  onlineStore = (await list(api, headers, 'channels')).find(
    (channel) => channel.name === 'Online Store',
  ) as Json
})

test.afterAll(async () => {
  await context?.api.dispose()
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('a method that charges on dispatch', async ({ page }) => {
  const setting = 'charge-on-dispatch'
  const before = await api('get', `payment_methods/${methods.later}`)
  try {
    await go(page, '/settings/payment-methods')
    await rowButton(page, orderPayments.later).click()
    const sheet = page.getByRole('dialog')
    await sheet.locator('#capture_method').click()
    await page.getByRole('option', { name: 'On dispatch' }).click()
    await expect(sheet.locator('#capture_method')).toContainText('On dispatch')
    await shot(page, setting, '1-method-charges-on-dispatch', sheet.locator('#capture_method'))
    await sheet.getByRole('button', { name: /^(save|update payment method)$/i }).click()
    await expect(page.getByText('Payment method updated', { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    })
    const saved = await api('get', `payment_methods/${methods.later}`)

    const order = await place(await draftFor([item(variants.toaster)]), methods.later)
    const placed = await paymentsOf(order)
    await openOrder(page, order)
    const payments = card(page, /^Payments/)
    await shot(page, setting, '2-placed-payment-authorized', payments)

    await fulfilOnPage(page)
    await page.reload()
    await expect(payments).toBeVisible({ timeout: 15_000 })
    await shot(page, setting, '3-fulfilled-payment-captured', payments)
    const shipped = await api('get', `orders/${order.id}`)
    record(setting, {
      method: orderPayments.later,
      capture_method_before: before.capture_method,
      capture_method_saved: saved.capture_method,
      order: order.number,
      payments_when_placed: placed,
      payments_when_fulfilled: await paymentsOf(order),
      payment_status_when_fulfilled: shipped.payment_status,
      fulfilment_status: shipped.fulfillment_status,
    })
  } finally {
    await api('patch', `payment_methods/${methods.later}`, {
      capture_method: before.capture_method ?? 'manual',
    })
  }
})

test("a method's tracking address", async ({ page }) => {
  const setting = 'tracking-address'
  const template = 'https://track.example.com/parcel/:tracking'
  const original = deliveryMethods.standard.tracking_url ?? null
  const answers: Record<string, unknown> = { method: 'Standard', template }
  try {
    await openMethod(page, deliveryMethods.standard)
    const sheet = page.getByRole('dialog')
    await sheet.locator('#tracking_url').fill(template)
    await shot(page, setting, '1-template-saved', sheet.locator('#tracking_url'))
    await sheet.getByRole('button', { name: /^save$/i }).click()
    await expect(sheet).toBeHidden({ timeout: 15_000 })
    answers.saved = (
      await api('get', `delivery_methods/${deliveryMethods.standard.id}`)
    ).tracking_url

    // A number Spree's carriers do not recognise, then one it does.
    for (const [step, number] of [
      ['2-unrecognised-number', tracking.freight],
      ['3-carrier-number', tracking.ups],
    ] as const) {
      const order = await place(await draftFor([item(variants.toaster)]))
      await openOrder(page, order)
      await fulfilOnPage(page, async () => {
        await page.getByRole('textbox', { name: 'Tracking number' }).fill(number)
      })
      const link = fulfilmentsCard(page).getByRole('link', { name: number })
      await expect(link).toBeVisible({ timeout: 15_000 })
      await shot(page, setting, step, fulfilmentsCard(page))
      const shipped = await api(
        'get',
        `orders/${order.id}/fulfillments/${fulfilmentsOf(order)[0].id}?expand=deliveries`,
      )
      answers[step] = {
        order: order.number,
        number,
        link_on_page: await link.getAttribute('href'),
        fulfilment_tracking_url: shipped.tracking_url,
        deliveries: (shipped.deliveries as Json[]).map((delivery) => ({
          carrier: delivery.carrier,
          tracking_url: delivery.tracking_url,
        })),
      }
    }
  } finally {
    await api('patch', `delivery_methods/${deliveryMethods.standard.id}`, {
      tracking_url: original,
    })
    record(setting, answers)
  }
})

test("a method's fulfilment provider", async ({ page }) => {
  const setting = 'fulfilment-provider'
  const answers: Record<string, unknown> = {}
  await openMethod(page, deliveryMethods.standard)
  const provider = field(page.getByRole('dialog'), 'Fulfillment provider').getByRole('combobox')
  await expect(provider).toContainText('Manual')
  await provider.click()
  await expect(page.getByRole('option').first()).toBeVisible()
  answers.offered = await page.getByRole('option').allInnerTexts()
  await shot(page, setting, '1-standard-providers-offered')
  await page.keyboard.press('Escape')

  await openMethod(page, deliveryMethods.pickup)
  const pickup = field(page.getByRole('dialog'), 'Fulfillment provider').getByRole('combobox')
  answers.store_pickup_provider = await text(pickup)
  await shot(page, setting, '2-store-pickup-provider', pickup)

  // A placed order's parcel moved from Standard (Manual) to Store Pickup (Pickup).
  const order = await place(await draftFor([item(variants.toaster)]))
  const fulfilment = fulfilmentsOf(order)[0]
  const read = () =>
    api('get', `orders/${order.id}/fulfillments/${fulfilment.id}?expand=delivery_method`)
  const summary = (each: Json) => ({
    method: (each.delivery_method as Json | undefined)?.name,
    fulfillment_type: each.fulfillment_type,
    provider_generates_labels: each.provider_generates_labels,
    documents: each.documents,
    cost: each.cost,
  })
  answers.order = order.number
  answers.standard = summary(await read())
  await openOrder(page, order)
  await fulfilmentsCard(page).getByRole('button', { name: 'Actions' }).first().click()
  await expect(page.getByRole('menuitem').first()).toBeVisible()
  answers.standard_menu = await page.getByRole('menuitem').allInnerTexts()
  await page.keyboard.press('Escape')
  await shot(page, setting, '3-shipping-by-standard', fulfilmentsCard(page))

  await fulfilmentsCard(page).getByRole('button', { name: 'Actions' }).first().click()
  await page.getByRole('menuitem', { name: /^edit$/i }).click()
  await dialog(page).getByRole('combobox', { name: 'Delivery method' }).click()
  await page.getByRole('option', { name: /Store Pickup/ }).click()
  await dialog(page)
    .getByRole('button', { name: /^save$/i })
    .click()
  await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
  await expect(fulfilmentsCard(page)).toContainText('Store Pickup', { timeout: 15_000 })
  answers.store_pickup = summary(await read())
  await fulfilmentsCard(page).getByRole('button', { name: 'Actions' }).first().click()
  await expect(page.getByRole('menuitem').first()).toBeVisible()
  answers.store_pickup_menu = await page.getByRole('menuitem').allInnerTexts()
  await page.keyboard.press('Escape')
  await shot(page, setting, '4-moved-to-store-pickup', fulfilmentsCard(page))
  await api('patch', `orders/${order.id}/cancel`, {})
  record(setting, answers)
})

test('origin groups, the default profile and routing rules', async ({ page }) => {
  const setting = 'routing'
  const answers: Record<string, unknown> = {}
  const rules = (await list(
    context.api,
    context.headers,
    `channels/${onlineStore.id}/order_routing_rules`,
  )) as Json[]
  answers.rules = rules.map((rule) => ({ type: rule.type, active: rule.active }))
  const [first] = rules
  expect(first?.type, 'the channel routes by preferred location first').toBe('preferred_location')
  const preferSource = { preferred_stock_location_id: locations.source.id }
  try {
    await go(page, `/settings/channels?edit=${onlineStore.id}`)
    const section = page.getByRole('dialog')
    const toggle = section.getByRole('switch', { name: 'Rule active' }).first()
    await expect(toggle).toBeVisible({ timeout: 15_000 })
    await shot(page, setting, '1-online-store-rules', toggle)

    await toggle.click()
    await expect(toggle).not.toBeChecked({ timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    await shot(page, setting, '2-preferred-location-off', toggle)
    const off = await place(await draftFor([item(variants.toaster)], preferSource))
    answers.preferred_location_off = { order: off.number, fulfilments: shipsFrom(off) }

    await toggle.click()
    await expect(toggle).toBeChecked({ timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    const on = await place(await draftFor([item(variants.toaster)], preferSource))
    answers.preferred_location_on = { order: on.number, fulfilments: shipsFrom(on) }
    // The kettle is stocked at the shop alone, so the order splits.
    const split = await place(
      await draftFor([item(variants.kettle), item(variants.toaster)], preferSource),
    )
    answers.split = { order: split.number, fulfilments: shipsFrom(split) }
    for (const [step, order] of [
      ['3-preferred-location-off-order', off],
      ['4-preferred-location-on-order', on],
      ['5-split-order', split],
    ] as const) {
      await openOrder(page, order)
      await shot(page, setting, step, fulfilmentsCard(page))
      await api('patch', `orders/${order.id}/cancel`, {})
    }
  } finally {
    if (first?.active)
      await api('patch', `channels/${onlineStore.id}/order_routing_rules/${first.id}`, {
        active: true,
      })
  }

  // The default profile narrowed to ship only from the second location.
  const profilePath = `/settings/delivery-profiles/${generalProfile.id}`
  const origins = page.locator('[data-slot="card"]').filter({ hasText: 'Ships from' })
  try {
    await go(page, profilePath)
    await expect(origins.getByRole('radio', { name: 'All locations' })).toBeChecked({
      timeout: 15_000,
    })
    await origins.getByRole('radio', { name: 'Selected locations' }).click()
    await origins.getByRole('checkbox', { name: secondLocation, exact: true }).check()
    await origins.getByRole('button', { name: /^save$/i }).click()
    await expect(page.getByText('Shipping profile updated', { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    })
    await shot(page, setting, '6-default-profile-ships-from-one', origins)
    const draft = await draftFor([item(variants.toaster)])
    const current = await api('get', `orders/${draft.id}`)
    const paid = await context.api.post(`/api/v3/admin/orders/${draft.id}/payments`, {
      headers: context.headers,
      data: { payment_method_id: methods.cheque, amount: current.amount_due },
    })
    const completed = await context.api.patch(`/api/v3/admin/orders/${draft.id}/complete`, {
      headers: context.headers,
      data: { notify_customer: false },
    })
    const made = await reload(draft)
    answers.default_profile_narrowed = {
      order: made.number,
      payment_answer: paid.status(),
      complete_answer: completed.status(),
      complete_errors: completed.ok() ? null : await completed.json().catch(() => null),
      status: made.status,
      fulfilments: shipsFrom(made),
    }
    await openOrder(page, made)
    await shot(page, setting, '7-default-profile-order', fulfilmentsCard(page))
    if (completed.ok()) await api('patch', `orders/${made.id}/cancel`, {})
    else await api('delete', `orders/${made.id}`).catch(() => null)
  } finally {
    await go(page, profilePath)
    const all = origins.getByRole('radio', { name: 'All locations' })
    await expect(all).toBeVisible({ timeout: 15_000 })
    if (!(await all.isChecked())) {
      await all.click()
      await origins.getByRole('button', { name: /^save$/i }).click()
      await expect(page.getByText('Shipping profile updated', { exact: true }).first()).toBeVisible(
        { timeout: 15_000 },
      )
    }
    await page.reload()
    await expect(origins.getByRole('radio', { name: 'All locations' })).toBeChecked({
      timeout: 15_000,
    })
    record(setting, answers)
  }
})

test("return reasons and a location's returns setting", async ({ page }) => {
  const setting = 'returns'
  const reason = 'Fidelity wrong size'
  const answers: Record<string, unknown> = { reason }
  const toggle = () => field(page, 'Accept returns here').getByRole('switch')
  try {
    await go(page, '/settings/reasons')
    const reasons = card(page, /^return reasons$/i)
    await expect(reasons).toBeVisible({ timeout: 15_000 })
    if ((await reasons.getByText(reason, { exact: true }).count()) === 0) {
      await reasons.getByRole('button', { name: /add reason/i }).click()
      await page.locator('#reason-name').fill(reason)
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /^create$/i })
        .click()
      await expect(reasons.getByText(reason, { exact: true })).toBeVisible({ timeout: 15_000 })
    }
    await shot(page, setting, '1-reason-saved', reasons)

    await go(page, `/settings/stock-locations?edit=${locations.destination.id}`)
    await expect(toggle()).toBeChecked({ timeout: 15_000 })
    await toggle().click()
    await expect(toggle()).not.toBeChecked()
    await shot(page, setting, '2-destination-refuses-returns', toggle())
    // The sheet's stock levels table has a Save of its own for each row.
    await page
      .getByRole('dialog')
      .locator('button[type="submit"]', { hasText: /^save$/i })
      .click()
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 })
    answers.destination_returns_enabled = (
      await api('get', `stock_locations/${locations.destination.id}`)
    ).returns_enabled

    const order = await fulfil(await place(await draftFor([item(variants.toaster)])))
    const stockBefore = await levelOf(skus.toaster, locations.source)
    await openOrder(page, order)
    await returnsCard(page).getByRole('button', { name: 'New return' }).click()
    await dialog(page).getByRole('combobox', { name: 'Reason' }).click()
    await expect(page.getByRole('option', { name: reason })).toBeVisible()
    answers.reasons_offered = await page.getByRole('option').allInnerTexts()
    await shot(page, setting, '3-reasons-offered')
    await page.getByRole('option', { name: reason }).click()
    await dialog(page).getByRole('combobox', { name: 'Return to' }).click()
    await expect(page.getByRole('option').first()).toBeVisible()
    answers.locations_offered = await page.getByRole('option').allInnerTexts()
    await shot(page, setting, '4-locations-offered')
    await page.getByRole('option', { name: secondLocation, exact: true }).click()
    await dialog(page).getByRole('spinbutton').first().fill('1')
    await dialog(page).getByRole('button', { name: 'New return' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })

    const [opened] = (await api('get', `orders/${order.id}/returns?expand=return_line_items`))
      .data as Json[]
    await api('patch', `orders/${order.id}/returns/${opened.id}/approve`)
    await api('patch', `orders/${order.id}/returns/${opened.id}/receive`)
    const received = await api('get', `orders/${order.id}/returns/${opened.id}`)
    await openOrder(page, order)
    await shot(page, setting, '5-return-received', returnsCard(page))
    answers.order = order.number
    answers.return = {
      number: received.number,
      status: received.status,
      reason: received.reason_name ?? received.reason_id,
      stock_location: locationName(received.stock_location_id),
    }
    answers.toaster_at_second_location = {
      before: stockBefore,
      after: await levelOf(skus.toaster, locations.source),
    }
  } finally {
    await api('patch', `stock_locations/${locations.destination.id}`, { returns_enabled: true })
    record(setting, answers)
  }
})

test('tax on a refund', async ({ page }) => {
  const setting = 'refund-tax'
  const rate = { name: `Fidelity California sales tax ${run}`, percent: '7.25' }
  const answers: Record<string, unknown> = { rate: rate.name }
  try {
    await go(page, '/settings/taxes/rates')
    await page.getByRole('button', { name: /add tax rate/i }).click()
    await page.locator('#name').fill(rate.name)
    await page.locator('#rate_percent').fill(rate.percent)
    await page.locator('#tax_category_id').click()
    await page.getByRole('option', { name: /^default$/i }).click()
    await page.getByRole('combobox', { name: /^country$/i }).click()
    await page.getByPlaceholder(/^search countries/i).fill('United States')
    await page.getByRole('option', { name: 'United States' }).first().click()
    await page.getByRole('combobox', { name: /^state/i }).click()
    await page.keyboard.type('California')
    await page.getByRole('option', { name: 'California' }).first().click()
    await page.getByRole('button', { name: /create tax rate/i }).click()
    await expect(rowButton(page, rate.name)).toBeVisible({ timeout: 15_000 })
    await shot(page, setting, '1-rate-saved', rowButton(page, rate.name))

    const order = await fulfil(
      await place(
        await api('post', 'orders', {
          email: 'fidelity-refund-tax@example.com',
          items: [item(variants.toaster)],
          shipping_address: {
            first_name: 'Casey',
            last_name: 'Rivera',
            address1: '500 Mission Street',
            city: 'San Francisco',
            country_code: 'US',
            state_code: 'CA',
            postal_code: '94105',
            phone: '4155550142',
          },
          use_shipping_as_billing: true,
        }),
      ),
    )
    const unit = fulfilmentsOf(order).flatMap(
      (fulfilment) => fulfilment.fulfillment_items as Json[],
    )[0]
    const opened = await api('post', `orders/${order.id}/returns`, {
      items: [{ fulfillment_item_id: unit.id, quantity: 1 }],
    })
    await api('patch', `orders/${order.id}/returns/${opened.id}/approve`)
    const received = await api('patch', `orders/${order.id}/returns/${opened.id}/receive`)

    await openOrder(page, order)
    await returnsCard(page).getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Refund' }).click()
    await expect(page.getByRole('heading', { name: 'Refund return' })).toBeVisible()
    const note = dialog(page).getByText(/includes .* of tax/)
    await expect(note).toBeVisible()
    answers.dialog_note = await text(note)
    answers.dialog_amount = await dialog(page).locator('#refund-amount').inputValue()
    await shot(page, setting, '2-refund-dialog')
    await dialog(page)
      .getByRole('button', { name: /^refund$/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    await expect(returnsCard(page)).toContainText(/refunded/i, { timeout: 15_000 })
    await shot(page, setting, '3-refunded', returnsCard(page))

    const placed = await api('get', `orders/${order.id}`)
    const refunded = await api('get', `orders/${order.id}/returns/${opened.id}?expand=refunds`)
    answers.order = {
      number: order.number,
      item_total: placed.item_total,
      tax_total: placed.tax_total,
      additional_tax_total: placed.additional_tax_total,
      total: placed.total,
    }
    answers.return = {
      number: refunded.number,
      status: refunded.status,
      refundable_total_when_received: received.refundable_total,
      refund_total: refunded.refund_total,
      refunds: ((refunded.refunds as Json[] | undefined) ?? []).map((refund) => ({
        amount: refund.amount,
      })),
    }
  } finally {
    for (const each of await list(context.api, context.headers, 'tax_rates'))
      if (each.name === rate.name) await api('delete', `tax_rates/${each.id}`)
    record(setting, answers)
  }
})

test('stock moved by orders', async ({ page }) => {
  const setting = 'stock'
  const answers: Record<string, unknown> = { sku: skus.espresso, location: locations.shop.name }
  const level = () => levelOf(skus.espresso, locations.shop)
  // The search also lists the machine's other colours and the semi-automatic one.
  const row = () =>
    page
      .getByRole('row', { name: /^Automatic Espresso Machine Color: Matte Black/ })
      .filter({ hasText: locations.shop.name as string })
  const inventory = async (step: string) => {
    await go(page, '/inventory')
    await page.getByPlaceholder(/search sku or product/i).fill(skus.espresso)
    await expect(row()).toBeVisible({ timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    answers[step] = { listed: await text(row()), counted: await level() }
    await shot(page, setting, `${step}-inventory`, row())
  }

  await inventory('0-before')
  const shipped = await place(await draftFor([item(variants.espresso)]))
  answers.shipped_order = shipped.number
  await inventory('1-placed')
  await fulfil(shipped)
  await inventory('2-shipped')

  const canceled = await place(await draftFor([item(variants.espresso)]))
  answers.canceled_order = canceled.number
  await inventory('3-second-order-placed')
  await api('patch', `orders/${canceled.id}/cancel`, {})
  await inventory('4-canceled-before-shipping')

  const sent = await reload(shipped)
  const unit = fulfilmentsOf(sent).flatMap(
    (fulfilment) => fulfilment.fulfillment_items as Json[],
  )[0]
  const opened = await api('post', `orders/${shipped.id}/returns`, {
    items: [{ fulfillment_item_id: unit.id, quantity: 1 }],
    stock_location_id: locations.shop.id,
  })
  await api('patch', `orders/${shipped.id}/returns/${opened.id}/approve`)
  await api('patch', `orders/${shipped.id}/returns/${opened.id}/receive`)
  await inventory('5-returned')

  await go(page, `/settings/stock-locations?edit=${locations.shop.id}`)
  const history = page.getByRole('dialog').getByText('Stock history', { exact: true }).last()
  await expect(history).toBeVisible({ timeout: 15_000 })
  await page.waitForLoadState('networkidle')
  const historyCard = page
    .getByRole('dialog')
    .locator('[data-slot="card"]')
    .filter({ hasText: 'Stock history' })
    .last()
  answers.history = await text(historyCard)
  await shot(page, setting, '6-shop-history', history)
  record(setting, answers)
})
