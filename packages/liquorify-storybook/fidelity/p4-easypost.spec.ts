import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { getCredentials, login } from '../../dashboard/e2e/helpers'
import { chequeMethods } from './orders'
import {
  cartFor,
  type EasyPost,
  easyPost,
  eventually,
  p4Named,
  placeholderEasyPostKey,
  publishableKey,
  relayEasyPost,
} from './p4'
import { confirmation, reload, revision, type Seed, seeded, stamp } from './p9'
import { type Order, openOrder, type Product, type Shop, unitsOf } from './p11-orders'

/**
 * The platform batch's step P4, part 3: EasyPost on the dashboard (checks
 * 4.11 to 4.17 of the work item), against EasyPost's test mode.
 *
 * The server is the dashboard browser tests' own, started with the provider
 * gems (`stack.spec.ts`, `LIQUORIFY_PROVIDERS=1`). The integration carries a
 * placeholder key; the environment's proxy authenticates each request to
 * EasyPost. Its webhook secret is the run's own, so the script can sign the
 * events it relays: EasyPost cannot reach this server, so tracker updates and
 * refund confirmations are relayed, and the record says so.
 *
 * Every label bought is a test label. Every test asserts the intended result;
 * a known or new defect fails where it stands, with what was seen recorded
 * first.
 *
 * Results go to `results/p4/easypost/`: what each step showed, EasyPost's own
 * record of each shipment, and screenshots. Keys are never written out.
 */

const results = new URL('./results/p4/easypost/', import.meta.url).pathname
const webhookSecret = `p4-${stamp}`
let easyPostApi: EasyPost

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

const origin = {
  address1: '417 Montgomery Street',
  city: 'San Francisco',
  zipcode: '94104',
  state_code: 'CA',
  country_code: 'US',
  phone: '4155550100',
  company: 'P4 Cellars',
}

const destinations = {
  domestic: {
    first_name: 'River',
    last_name: 'Okafor',
    address1: '214 Larkspur Lane',
    city: 'Portland',
    country_code: 'US',
    state_code: 'OR',
    postal_code: '97205',
    phone: '5035550142',
  },
  international: {
    first_name: 'Amara',
    last_name: 'Lindqvist',
    address1: '290 Bremner Blvd',
    city: 'Toronto',
    country_code: 'CA',
    state_code: 'ON',
    postal_code: 'M5V 3L9',
    phone: '4165550199',
  },
}

interface Integration {
  id: string
  type: string
  active: boolean
}

/**
 * The store's EasyPost integration: the one 4.11 connects on the screens, or,
 * if 4.11 did not connect one, one connected through the Admin API with the
 * same placeholder key. Either way it signs with the run's own secret.
 */
async function integration(seed: Seed) {
  const { data } = await seed.get<{ data: Integration[] }>('integrations?limit=100')
  const found = data.find((each) => each.type === 'easy_post')
  if (found) {
    await seed.patch(`integrations/${found.id}`, {
      active: true,
      preferences: { webhook_secret: webhookSecret, customs_signer: 'River Okafor' },
    })
    return found.id
  }
  const created = await seed.post<Integration>('integrations', {
    type: 'easy_post',
    active: true,
    preferences: {
      api_key: placeholderEasyPostKey,
      webhook_secret: webhookSecret,
      customs_signer: 'River Okafor',
    },
  })
  return created.id
}

/**
 * A warehouse with a full address, as EasyPost needs one to quote from, and a
 * delivery profile shipping from it to the United States and Canada.
 */
async function profile(seed: Seed, label: string) {
  const location = await seed.post<{ id: string }>('stock_locations', {
    name: p4Named(`${label} warehouse`),
    active: true,
    ...origin,
  })
  const created = await seed.post<{ id: string }>('delivery_profiles', {
    name: p4Named(`${label} profile`),
    kind: 'shipping',
  })
  const read = await seed.get<{ id: string; origin_groups: { id: string }[] }>(
    `delivery_profiles/${created.id}`,
  )
  const group = read.origin_groups[0].id
  await seed.patch(`delivery_profiles/${created.id}/origin_groups/${group}`, {
    stock_location_ids: [location.id],
  })
  const zone = await seed.post<{ id: string }>('delivery_zones', {
    name: p4Named(`${label} zone`),
    delivery_profile_id: created.id,
    delivery_origin_group_id: group,
    members: [
      { member_type: 'country', country_code: 'US' },
      { member_type: 'country', country_code: 'CA' },
    ],
  })
  return { locationId: location.id, profileId: created.id, groupId: group, zoneId: zone.id }
}

type Profile = Awaited<ReturnType<typeof profile>>

/** A delivery method on EasyPost's live rates and labels, through the Admin API. */
async function easyPostMethod(seed: Seed, label: string, at: Profile) {
  return seed.post<{ id: string; name: string }>('delivery_methods', {
    name: p4Named(`${label} EasyPost`),
    delivery_profile_id: at.profileId,
    delivery_origin_group_id: at.groupId,
    delivery_zone_id: at.zoneId,
    storefront_visible: true,
    rate_provider: 'easy_post',
    fulfillment_provider: 'easy_post',
    stock_location_ids: [at.locationId],
  })
}

/** A bottle with a weight and a box size, stocked only at the profile's warehouse. */
async function bottle(seed: Seed, label: string, at: Profile): Promise<Product> {
  const channels = await seed.get<{ data: { id: string; default: boolean }[] }>('channels?limit=20')
  const online = channels.data.find((channel) => channel.default)
  const name = p4Named(label)
  const sku = `P4-${label.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${stamp}`
  const created = await seed.post<{ id: string; default_variant_id: string }>('products', {
    name,
    status: 'active',
    prices: [{ amount: '30.00', currency: 'USD' }],
    delivery_profile_id: at.profileId,
    product_publications: online ? [{ channel_id: online.id }] : [],
  })
  await seed.patch(`products/${created.id}/variants/${created.default_variant_id}`, {
    sku,
    weight: '1.5',
    weight_unit: 'lb',
    depth: '10',
    width: '8',
    height: '4',
  })
  await seed.post('stock_levels/bulk_upsert', {
    stock_levels: [
      {
        variant_id: created.default_variant_id,
        stock_location_id: at.locationId,
        count_on_hand: 50,
        backorderable: true,
      },
    ],
  })
  return { name, sku, productId: created.id, variantId: created.default_variant_id }
}

/** A customer whose default address is in the United States or Canada. */
async function customer(seed: Seed, label: string, where: keyof typeof destinations) {
  const email = `p4-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${stamp}@example.com`
  const created = await seed.post<{ id: string }>('customers', {
    email,
    first_name: 'P4',
    last_name: label,
  })
  await seed.post(`customers/${created.id}/addresses`, {
    ...destinations[where],
    is_default_billing: true,
    is_default_shipping: true,
  })
  return { id: created.id, email }
}

/**
 * A placed order for one bottle, shipped by EasyPost to the destination, paid
 * by cheque. Spree selects the cheapest rate EasyPost quoted.
 */
async function easyPostOrder(
  baseURL: string,
  label: string,
  where: keyof typeof destinations,
): Promise<{ order: Order; shop: Shop; attempts: number }> {
  return seeded(baseURL, async (seed) => {
    await integration(seed)
    const at = await profile(seed, label)
    await easyPostMethod(seed, label, at)
    const shop = {
      customer: await customer(seed, label, where),
      product: await bottle(seed, label, at),
      methods: await chequeMethods(baseURL, seed.api, seed.headers),
    }
    // EasyPost's test mode limits how fast an account may call it, and Spree
    // drops a method EasyPost could not quote without saying so. The order is
    // drafted until EasyPost quoted it, pausing between tries.
    for (let attempt = 1; ; attempt++) {
      const draft = await seed.post<Order>('orders', {
        customer_id: shop.customer.id,
        use_customer_default_address: true,
        items: [{ variant_id: shop.product.variantId, quantity: 1 }],
      })
      const { data } = await seed.get<{ data: { provider_generates_labels: boolean }[] }>(
        `orders/${draft.id}/fulfillments`,
      )
      if (data.every((each) => each.provider_generates_labels)) {
        const current = await seed.get<{ amount_due: string }>(`orders/${draft.id}`)
        await seed.post(`orders/${draft.id}/payments`, {
          payment_method_id: shop.methods.cheque,
          amount: current.amount_due,
        })
        const order = await seed.patch<Order>(`orders/${draft.id}/complete`, {
          notify_customer: false,
        })
        return { order, shop, attempts: attempt }
      }
      expect(attempt, 'EasyPost quoted the order within three tries').toBeLessThan(3)
      await new Promise((resolve) => setTimeout(resolve, 30_000))
    }
  })
}

interface Label {
  id: string
  status: string
  carrier: string | null
  service: string | null
  tracking_number: string | null
  external_id: string | null
  cost: string
  metadata: { easypost_forms?: { form_type: string; url: string }[] }
}

interface Fulfilment {
  id: string
  status: string
  labels?: Label[]
  documents?: { kind: string; url: string }[]
  deliveries?: { id: string; tracking_number: string; status: string }[]
}

const fulfilments = (baseURL: string, order: Order) =>
  seeded(baseURL, async (seed) => {
    const { data } = await seed.get<{ data: Fulfilment[] }>(`orders/${order.id}/fulfillments`)
    return Promise.all(
      data.map(async (each) => ({
        ...each,
        labels: (
          await seed.get<{ data: Label[] }>(`orders/${order.id}/fulfillments/${each.id}/labels`)
        ).data,
        deliveries: (
          await seed.get<{ data: { id: string; tracking_number: string; status: string }[] }>(
            `orders/${order.id}/fulfillments/${each.id}/deliveries`,
          )
        ).data,
      })),
    )
  })

/** EasyPost's own record of a shipment Spree bought, without its label files. */
async function shipment(id: string | null) {
  const read = await easyPostApi.get<{
    id: string
    mode: string
    is_return: boolean
    refund_status: string | null
    tracking_code: string
    selected_rate: { carrier: string; service: string; rate: string } | null
    customs_info: { customs_certify: boolean } | null
    forms: { form_type: string }[]
    from_address: { city: string; country: string }
    to_address: { city: string; country: string }
  }>(`shipments/${id}`)
  return {
    id: read.id,
    mode: read.mode,
    isReturn: read.is_return,
    refundStatus: read.refund_status,
    trackingCode: read.tracking_code,
    rate: read.selected_rate
      ? {
          carrier: read.selected_rate.carrier,
          service: read.selected_rate.service,
          rate: read.selected_rate.rate,
        }
      : null,
    customsCertified: read.customs_info?.customs_certify ?? null,
    forms: read.forms.map((form) => form.form_type),
    from: `${read.from_address.city}, ${read.from_address.country}`,
    to: `${read.to_address.city}, ${read.to_address.country}`,
  }
}

/** The label row itself, the innermost card content naming the label. */
const labelRow = (page: Page) =>
  page
    .locator('[data-slot="card-content"]')
    .filter({ hasText: /^Shipping label/ })
    .last()

async function confirmIn(page: Page, button: string | RegExp) {
  const asked = confirmation(page)
  await expect(asked).toBeVisible({ timeout: 10_000 })
  const text = (await asked.innerText()).trim()
  return { asked, text, confirm: () => asked.getByRole('button', { name: button }).click() }
}

/** Reloads the order page until the locator shows, as a label's file arrives later. */
async function untilShown(page: Page, locator: Locator, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await locator.isVisible()) return true
    await page.waitForTimeout(3_000)
    await reload(page)
  }
  return locator.isVisible()
}

test.beforeAll(async () => {
  easyPostApi = await easyPost()
})

test.afterAll(async () => {
  await easyPostApi.dispose()
})

test('4.11 connecting EasyPost on the integrations page', async ({ page, baseURL }) => {
  const { store_id: storeId } = getCredentials()
  const before = await seeded(baseURL, async (seed) => {
    const { data } = await seed.get<{ data: Integration[] }>('integrations?limit=100')
    return data.find((each) => each.type === 'easy_post') ?? null
  })
  await login(page)
  await page.goto(`/${storeId}/settings/integrations`)
  const easyPostCard = page.locator('[data-slot="card"]').filter({ hasText: 'EasyPost' }).first()
  await expect(easyPostCard).toBeVisible({ timeout: 15_000 })
  const statusBefore = await easyPostCard.innerText()
  await snap(page, '4.11-integrations-before')
  expect(before, 'EasyPost is not yet connected on a freshly started server').toBeNull()

  await easyPostCard
    .getByRole('button', { name: 'Connect' })
    .or(easyPostCard.getByRole('link', { name: 'Connect' }))
    .click()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()
  await sheet.locator('#preference-api_key').fill(placeholderEasyPostKey)
  await sheet.locator('#preference-webhook_secret').fill(webhookSecret)
  await sheet.locator('#preference-customs_signer').fill('River Okafor')
  const active = sheet.getByRole('switch')
  if (!(await active.isChecked())) await active.click()
  await snap(page, '4.11-connect-sheet')
  await sheet.getByRole('button', { name: 'Connect', exact: true }).click()
  await expect(page.getByText('Integration connected')).toBeVisible({ timeout: 30_000 })
  await expect(easyPostCard).toContainText('Active', { timeout: 15_000 })
  await snap(page, '4.11-integrations-after')

  await easyPostCard
    .getByRole('button', { name: 'Configure' })
    .or(easyPostCard.getByRole('link', { name: 'Configure' }))
    .click()
  await page.getByRole('dialog').getByRole('button', { name: 'Test connection' }).click()
  const tested = page
    .getByRole('dialog')
    .getByText('Connection successful.')
    .or(page.getByRole('dialog').getByText(/failed/i))
  await expect(tested).toBeVisible({ timeout: 30_000 })
  const testAnswer = (await tested.innerText()).trim()
  await snap(page, '4.11-test-connection')

  const after = await seeded(baseURL, async (seed) => {
    const { data } = await seed.get<{ data: Integration[] }>('integrations?limit=100')
    return data.find((each) => each.type === 'easy_post') ?? null
  })
  save('4.11', {
    statusBefore,
    integration: after,
    testAnswer,
    cardAfter: await easyPostCard.innerText(),
  })
  expect(after?.active, 'the integration is saved and active').toBe(true)
  expect(testAnswer).toBe('Connection successful.')
})

test("4.12 a delivery method on EasyPost's live rates quotes a domestic cart", async ({
  page,
  baseURL,
}) => {
  const { store_id: storeId } = getCredentials()
  const at = await seeded(baseURL, async (seed) => {
    await integration(seed)
    return profile(seed, 'Rates')
  })
  const name = p4Named('Rates EasyPost')
  await login(page)
  await page.goto(`/${storeId}/settings/delivery-profiles/${at.profileId}`)
  await page.getByRole('button', { name: 'Add method' }).first().click()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible({ timeout: 15_000 })
  const pick = async (fieldLabel: string, option: RegExp) => {
    const field = sheet.locator('[data-slot="field"]').filter({ hasText: fieldLabel }).first()
    await field.getByRole('combobox').click()
    await page.getByRole('option', { name: option }).click()
  }
  await pick('Fulfillment provider', /easypost/i)
  await pick('Rate provider', /easypost/i)
  await sheet.locator('#name').fill(name)
  await snap(page, '4.12-method-sheet')
  await sheet.getByRole('button', { name: 'Create delivery method' }).click()
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 })
  await snap(page, '4.12-profile-after')

  const quoted = await seeded(baseURL, async (seed) => {
    const { data } = await seed.get<{
      data: { id: string; name: string; rate_provider: string; fulfillment_provider: string }[]
    }>('delivery_methods?limit=100')
    const method = data.find((each) => each.name === name)
    if (method)
      await seed.patch(`delivery_methods/${method.id}`, { stock_location_ids: [at.locationId] })
    const item = await bottle(seed, 'Rates', at)
    const key = await publishableKey(seed)
    const shopper = await cartFor(baseURL as string, key, item, `p4-rates-${stamp}@example.com`)
    const read = await shopper.ok<{
      fulfillments: {
        delivery_rates: { name: string; cost: string; delivery_method_id?: string }[]
      }[]
    }>('GET', `carts/${shopper.cart.id}?expand=fulfillments`, shopper.cart.token)
    await shopper.dispose()
    return { method, rates: read.fulfillments.flatMap((each) => each.delivery_rates) }
  })
  save('4.12', {
    method: quoted.method,
    rates: quoted.rates.map((rate) => ({ name: rate.name, cost: rate.cost })),
  })
  expect(quoted.method?.rate_provider).toBe('easy_post')
  expect(quoted.method?.fulfillment_provider).toBe('easy_post')
  expect(quoted.rates.length, 'EasyPost quoted rates').toBeGreaterThan(0)
  for (const rate of quoted.rates) {
    expect(rate.name, 'each rate names its carrier service').toMatch(/^(USPS|FedEx|UPS|DHL)/)
    expect(Number(rate.cost), `${rate.name} has a price`).toBeGreaterThan(0)
  }
})

/** Holds matching requests for two seconds before sending them on unchanged. */
async function holdBriefly(page: Page, method: string, path: RegExp) {
  await page.route(
    (url) => path.test(url.pathname),
    async (route) => {
      if (route.request().method() === method)
        await new Promise((resolve) => setTimeout(resolve, 2_000))
      await route.fallback()
    },
  )
}

/** Buys the fulfilment's label from the fulfilments card, capturing each state. */
async function buyLabel(page: Page, prefix: string) {
  const buy = page.getByRole('button', { name: 'Buy label' })
  await expect(buy).toBeVisible({ timeout: 15_000 })
  await snap(page, `${prefix}-label-to-buy`)
  await buy.click()
  const asked = await confirmIn(page, 'Buy label')
  await snap(page, `${prefix}-buy-confirmation`)
  // The request is held for two seconds on its way out, so the card's
  // in-between state stays on screen long enough to capture. Nothing it sends
  // or receives is changed.
  await holdBriefly(page, 'POST', /\/fulfillments\/[^/]+\/labels$/)
  await asked.confirm()
  await asked.asked.waitFor({ state: 'hidden', timeout: 1_500 }).catch(() => undefined)
  const buying = page.getByRole('button', { name: 'Saving…' })
  const sawBuying = await buying
    .waitFor({ timeout: 1_500 })
    .then(() => true)
    .catch(() => false)
  if (sawBuying) await snap(page, `${prefix}-buying`)
  await expect(labelRow(page)).toBeVisible({ timeout: 60_000 })
  await snap(page, `${prefix}-label-bought`)
  return { confirmation: asked.text, sawBuying }
}

let domestic: { order: Order; label?: Label } | undefined

test('4.13 buying a label for a domestic fulfilment', async ({ page, baseURL }) => {
  const made = await easyPostOrder(baseURL as string, 'Domestic', 'domestic')
  domestic = { order: made.order }
  await login(page)
  await openOrder(page, made.order)
  const bought = await buyLabel(page, '4.13')
  const row = labelRow(page)
  const rowText = (await row.innerText()).trim()
  const [ful] = await fulfilments(baseURL as string, made.order)
  const label = ful.labels?.find((each) => each.status !== 'refunded')
  domestic.label = label
  const easyPostSide = label ? await shipment(label.external_id) : null
  save('4.13', {
    order: made.order.number,
    confirmation: bought.confirmation,
    sawBuying: bought.sawBuying,
    rowText,
    label: label && {
      status: label.status,
      carrier: label.carrier,
      service: label.service,
      trackingNumber: label.tracking_number,
      cost: label.cost,
      forms: label.metadata.easypost_forms,
    },
    documents: ful.documents,
    easyPost: easyPostSide,
  })
  expect(bought.confirmation).toMatch(/Buy a .+ label for \$[\d.]+\?/)
  expect(label?.status).toBe('purchased')
  expect(label?.tracking_number, "EasyPost's tracking code").toBeTruthy()
  expect(easyPostSide?.mode).toBe('test')
  expect(easyPostSide?.trackingCode).toBe(label?.tracking_number)
  await expect(row.getByRole('button', { name: 'Print label' })).toBeVisible()
  await expect(row.getByRole('button', { name: 'Refund label' })).toBeVisible()
})

test('4.14 buying a label for an international fulfilment with a customs declaration', async ({
  page,
  baseURL,
}) => {
  const made = await easyPostOrder(baseURL as string, 'International', 'international')
  await login(page)
  await openOrder(page, made.order)
  const bought = await buyLabel(page, '4.14')
  const invoice = page.getByRole('link', { name: /commercial invoice/i })
  await expect(invoice).toBeVisible({ timeout: 15_000 })
  await snap(page, '4.14-customs-paperwork')
  const [ful] = await fulfilments(baseURL as string, made.order)
  const label = ful.labels?.find((each) => each.status !== 'refunded')
  const easyPostSide = label ? await shipment(label.external_id) : null
  save('4.14', {
    order: made.order.number,
    confirmation: bought.confirmation,
    label: label && {
      status: label.status,
      carrier: label.carrier,
      service: label.service,
      trackingNumber: label.tracking_number,
      cost: label.cost,
      forms: label.metadata.easypost_forms?.map((form) => form.form_type),
    },
    documents: ful.documents?.map((document) => document.kind),
    easyPost: easyPostSide,
  })
  expect(label?.status).toBe('purchased')
  expect(easyPostSide?.customsCertified, 'the customs declaration is certified').toBe(true)
  expect(ful.documents?.map((document) => document.kind)).toContain('commercial_invoice')
})

test("4.15 refunding 4.13's label", async ({ page, baseURL }) => {
  // A failed test restarts the worker, losing 4.13's label; then 4.15 buys
  // its own through the Admin API, and the record says which it refunded.
  const refunds43 = Boolean(domestic?.label)
  if (!domestic?.label) {
    const made = await easyPostOrder(baseURL as string, 'Refund', 'domestic')
    const [ful] = await fulfilments(baseURL as string, made.order)
    const bought = await seeded(baseURL, (seed) =>
      seed.post<Label>(`orders/${made.order.id}/fulfillments/${ful.id}/labels`, {}),
    )
    domestic = { order: made.order, label: bought }
  }
  const order = domestic.order
  const label = domestic.label as Label
  await login(page)
  await openOrder(page, order)
  const row = labelRow(page)
  await row.getByRole('button', { name: 'Refund label' }).click()
  const asked = await confirmIn(page, 'Refund label')
  await snap(page, '4.15-refund-confirmation')
  await holdBriefly(page, 'PATCH', /\/labels\/[^/]+\/refund$/)
  await asked.confirm()
  await asked.asked.waitFor({ state: 'hidden', timeout: 1_500 }).catch(() => undefined)
  const refunding = row.getByRole('button', { name: /refund/i }).and(page.locator('[disabled]'))
  const sawRefunding = await refunding
    .waitFor({ timeout: 1_500 })
    .then(() => true)
    .catch(() => false)
  if (sawRefunding) await snap(page, '4.15-refunding')
  await expect(row.getByText('Refund requested')).toBeVisible({ timeout: 30_000 })
  await snap(page, '4.15-refund-requested')
  const requested = await shipment(label.external_id)

  // EasyPost confirms a refund later with a `refund.successful` event, which
  // its test mode never sends. The script composes that event in EasyPost's
  // published shape for this shipment and relays it; the record says so.
  const integrationId = await seeded(baseURL, integration)
  const relayed = await relayEasyPost(baseURL as string, integrationId, webhookSecret, {
    object: 'Event',
    mode: 'test',
    description: 'refund.successful',
    result: {
      object: 'Refund',
      mode: 'test',
      shipment_id: label.external_id,
      tracking_code: label.tracking_number,
      status: 'refunded',
      carrier: 'USPS',
    },
  })
  const settled = await eventually(async () => {
    const [ful] = await fulfilments(baseURL as string, order)
    const read = ful.labels?.find((each) => each.id === label.id)
    return read?.status === 'refunded' ? read : undefined
  }, 20_000)
  await reload(page)
  const refundedShown = await row
    .getByText('Refunded')
    .isVisible()
    .catch(() => false)
  await snap(page, '4.15-after-relay')
  const [ful] = await fulfilments(baseURL as string, order)
  save('4.15', {
    order: order.number,
    refunds43,
    confirmation: asked.text,
    sawRefunding,
    easyPostRefundStatus: requested.refundStatus,
    relayed: { event: 'refund.successful', answered: relayed },
    labelAfterRelay: ful.labels?.find((each) => each.id === label.id)?.status,
    refundedShown,
  })
  expect(requested.refundStatus, "EasyPost's test answer").toBe('submitted')
  expect(relayed).toBe(200)
  expect(settled?.status, "EasyPost's refund confirmation settles the label").toBe('refunded')
  expect(refundedShown, 'the label row reads Refunded').toBe(true)
})

/** Buys the return's label from the returns card. */
async function buyReturnLabel(page: Page, prefix: string, returnNumber: string) {
  const returns = page.locator('[data-slot="card"]').filter({ hasText: returnNumber }).last()
  await expect(returns.getByText('No return label yet.')).toBeVisible({ timeout: 15_000 })
  await returns.getByRole('button', { name: 'Buy return label' }).click()
  const asked = await confirmIn(page, 'Buy return label')
  await asked.confirm()
  await expect(returns.getByText('Shipping label')).toBeVisible({ timeout: 60_000 })
  await snap(page, `${prefix}-return-label`)
  return { returns, confirmation: asked.text }
}

for (const where of ['domestic', 'international'] as const) {
  test(`4.16 buying a return label for an accepted return, ${where} (P11's 3.11)`, async ({
    page,
    baseURL,
  }) => {
    const made = await easyPostOrder(baseURL as string, `Return ${where}`, where)
    const opened = await seeded(baseURL, async (seed) => {
      const [first] = (
        await seed.get<{ data: { id: string }[] }>(`orders/${made.order.id}/fulfillments`)
      ).data
      await seed.patch(`orders/${made.order.id}/fulfillments/${first.id}/fulfill`, {
        notify_customer: false,
      })
      const [unit] = await unitsOf(seed, made.order)
      const ret = await seed.post<{ id: string; number: string }>(
        `orders/${made.order.id}/returns`,
        { items: [{ fulfillment_item_id: unit.id, quantity: 1 }] },
      )
      await seed.patch(`orders/${made.order.id}/returns/${ret.id}/approve`)
      return ret
    })
    await login(page)
    await openOrder(page, made.order)
    const bought = await buyReturnLabel(page, `4.16-${where}`, opened.number)
    const read = await seeded(baseURL, (seed) =>
      seed.get<{ data: Label[] }>(`orders/${made.order.id}/returns/${opened.id}/labels`),
    )
    const label = read.data.find((each) => each.status !== 'refunded')
    const easyPostSide = label ? await shipment(label.external_id) : null
    const invoiceShown =
      where === 'international'
        ? await bought.returns
            .getByRole('link', { name: /commercial invoice/i })
            .isVisible()
            .catch(() => false)
        : null
    save(`4.16-${where}`, {
      order: made.order.number,
      return: opened.number,
      confirmation: bought.confirmation,
      label: label && {
        status: label.status,
        carrier: label.carrier,
        service: label.service,
        trackingNumber: label.tracking_number,
        forms: label.metadata.easypost_forms?.map((form) => form.form_type),
      },
      invoiceShown,
      easyPost: easyPostSide,
    })
    expect(label?.status).toBe('purchased')
    expect(easyPostSide?.isReturn, "EasyPost's shipment is marked as a return").toBe(true)
    expect(easyPostSide?.to).toBe('San Francisco, US')
    if (where === 'international') expect(invoiceShown, 'the customs paperwork is shown').toBe(true)
  })
}

/** EasyPost's test trackers and the status `SpreeEasyPost::TrackerEvent` maps each to. */
const testTrackers = [
  ['EZ1000000001', 'pre_transit', 'Label created'],
  ['EZ2000000002', 'in_transit', 'In transit'],
  ['EZ3000000003', 'out_for_delivery', 'Out for delivery'],
  ['EZ5000000005', 'return_to_sender', 'Returning to sender'],
  ['EZ6000000006', 'failure', 'Delivery failed'],
  ['EZ7000000007', 'unknown', 'Status unknown'],
] as const

async function relayTracker(
  baseURL: string,
  integrationId: string,
  code: string,
  addressedTo = code,
) {
  const tracker = await easyPostApi.post<{ status: string; tracking_code: string }>('trackers', {
    tracker: { tracking_code: code, carrier: 'USPS' },
  })
  const answered = await relayEasyPost(baseURL, integrationId, webhookSecret, {
    object: 'Event',
    mode: 'test',
    description: 'tracker.updated',
    result: { ...tracker, tracking_code: addressedTo },
  })
  return { code, addressedTo, easyPostStatus: tracker.status, answered }
}

test("4.17 relaying EasyPost's test trackers to the fulfilments that carry them", async ({
  page,
  baseURL,
}) => {
  const made = await easyPostOrder(baseURL as string, 'Tracking', 'domestic')
  const arrived = await easyPostOrder(baseURL as string, 'Tracking delivered', 'domestic')
  const integrationId = await seeded(baseURL, async (seed) => {
    for (const [order, codes] of [
      [made.order, testTrackers.map(([code]) => code)],
      [arrived.order, []],
    ] as const) {
      const [first] = (
        await seed.get<{ data: { id: string }[] }>(`orders/${order.id}/fulfillments`)
      ).data
      await seed.patch(`orders/${order.id}/fulfillments/${first.id}/fulfill`, {
        notify_customer: false,
      })
      for (const code of codes)
        await seed.post(`orders/${order.id}/fulfillments/${first.id}/deliveries`, {
          tracking_number: code,
          carrier: 'usps',
        })
    }
    return integration(seed)
  })
  const relays = []
  for (const [code] of testTrackers)
    relays.push(await relayTracker(baseURL as string, integrationId, code))
  // Fulfilling buys the parcel's label, whose test tracker EasyPost never
  // moves on. The delivered test tracker's event is relayed for that label's
  // own tracking code, so the parcel has one consignment and it arrives.
  const [labelled] = await fulfilments(baseURL as string, arrived.order)
  const labelCode = labelled.deliveries?.[0]?.tracking_number as string
  relays.push(await relayTracker(baseURL as string, integrationId, 'EZ4000000004', labelCode))

  const [tracked] = await fulfilments(baseURL as string, made.order)
  const [delivered] = await fulfilments(baseURL as string, arrived.order)
  await login(page)
  await openOrder(page, made.order)
  const shownStatuses: Record<string, boolean> = {}
  for (const [, , shown] of testTrackers)
    shownStatuses[shown] = await untilShown(
      page,
      page.getByText(shown, { exact: true }).first(),
      10_000,
    )
  await snap(page, '4.17-every-carrier-status')
  await openOrder(page, arrived.order)
  const deliveredShown = await page.getByText('Delivered', { exact: true }).first().isVisible()
  await snap(page, '4.17-delivered')
  save('4.17', {
    relayed: relays,
    deliveries: tracked.deliveries?.map((each) => ({
      code: each.tracking_number,
      status: each.status,
    })),
    shownStatuses,
    delivered: {
      fulfilment: delivered.status,
      deliveries: delivered.deliveries?.map((each) => ({
        code: each.tracking_number,
        status: each.status,
      })),
      shown: deliveredShown,
    },
  })
  for (const relay of relays) expect(relay.answered, `${relay.code} relayed`).toBe(200)
  for (const [code, status] of testTrackers)
    expect(
      tracked.deliveries?.find((each) => each.tracking_number === code)?.status,
      `${code} maps to ${status}`,
    ).toBe(status)
  for (const [, , shown] of testTrackers)
    expect(shownStatuses[shown], `${shown} is shown`).toBe(true)
  expect(delivered.deliveries?.[0]?.status).toBe('delivered')
  expect(delivered.status, '"delivered" marks the fulfilment delivered').toBe('delivered')
  expect(deliveredShown).toBe(true)
})
