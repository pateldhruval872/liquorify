import { expect, type Locator, type Page } from '@playwright/test'
import { getCredentials } from '../../dashboard/e2e/helpers'
import { chequeMethods } from './orders'
import { openIn, type Seed, seeded, stamp } from './p9'

/**
 * The records P11's order and after-sale tests start from, added through the
 * Admin API and named with the run's stamp, and the readers of the order page
 * they share.
 */

export const named = (name: string) => `P11 ${name} ${stamp}`
export const skuOf = (name: string) =>
  `P11-${name.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${stamp}`
export const emailOf = (name: string) =>
  `p11-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${stamp}@example.com`

// --- Records each test starts from -----------------------------------------

export interface Product {
  name: string
  sku: string
  productId: string
  variantId: string
}

export interface Order {
  id: string
  number: string
}

export const address = {
  first_name: 'River',
  last_name: 'Okafor',
  address1: '214 Larkspur Lane',
  city: 'Portland',
  country_code: 'US',
  state_code: 'OR',
  postal_code: '97205',
  phone: '5035550142',
}

/**
 * A product of one variant at this price, backorderable, stocked at every
 * location or only at the one named: SD-71 refuses a replacement for part of a
 * line when the replacement is stocked at more than one location.
 */
export async function product(
  seed: Seed,
  label: string,
  price = '20.00',
  extra: object = {},
  stockedAt?: string,
): Promise<Product> {
  const name = named(label)
  const sku = skuOf(label)
  const created = await seed.post<{ id: string; default_variant_id: string }>('products', {
    name,
    status: 'active',
    prices: [{ amount: price, currency: 'USD' }],
    ...extra,
  })
  await seed.patch(`products/${created.id}/variants/${created.default_variant_id}`, { sku })
  const { data } = await seed.get<{ data: { id: string; name: string }[] }>(
    'stock_locations?limit=100',
  )
  await seed.post('stock_levels/bulk_upsert', {
    stock_levels: data
      .filter((location) => !stockedAt || location.name === stockedAt)
      .map((location) => ({
        variant_id: created.default_variant_id,
        stock_location_id: location.id,
        count_on_hand: 50,
        backorderable: true,
      })),
  })
  return { name, sku, productId: created.id, variantId: created.default_variant_id }
}

/** A customer with one address, their default for billing and shipping. */
export async function customer(seed: Seed, label: string) {
  const email = emailOf(label)
  const created = await seed.post<{ id: string }>('customers', {
    email,
    first_name: 'P11',
    last_name: label,
  })
  await seed.post(`customers/${created.id}/addresses`, {
    ...address,
    is_default_billing: true,
    is_default_shipping: true,
  })
  return { id: created.id, email }
}

export interface Shop {
  customer: { id: string; email: string }
  product: Product
  methods: { cheque: string; later: string }
}

/** A customer and a product, with the cheque methods, for a test's orders. */
export async function shop(seed: Seed, label: string, baseURL: string): Promise<Shop> {
  return {
    customer: await customer(seed, label),
    product: await product(seed, label),
    methods: await chequeMethods(baseURL, seed.api, seed.headers),
  }
}

export async function draft(seed: Seed, at: Shop, quantity = 1, data: object = {}) {
  return seed.post<Order>('orders', {
    customer_id: at.customer.id,
    use_customer_default_address: true,
    items: [{ variant_id: at.product.variantId, quantity }],
    ...data,
  })
}

/** Pays the order's balance by this cheque method and places it. */
export async function placed(
  seed: Seed,
  at: Shop,
  options: { quantity?: number; method?: 'cheque' | 'later'; data?: object } = {},
) {
  const order = await draft(seed, at, options.quantity ?? 1, options.data)
  const current = await seed.get<{ amount_due: string }>(`orders/${order.id}`)
  await seed.post(`orders/${order.id}/payments`, {
    payment_method_id: at.methods[options.method ?? 'cheque'],
    amount: current.amount_due,
  })
  return seed.patch<Order>(`orders/${order.id}/complete`, { notify_customer: false })
}

// --- Reading the screens ---------------------------------------------------

export const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog'))

/** A card on the order page, found by its title. */
export const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()

export const moreActions = (page: Page) => page.getByRole('button', { name: 'More actions' })

export async function openOrder(page: Page, order: Order) {
  await openIn(page, getCredentials().store_id, `/orders/${order.id}`)
  await expect(page.getByRole('heading', { name: order.number })).toBeVisible({
    timeout: 15_000,
  })
}

/** The text of a row of a card, found by its label, such as the Summary card's Total. */
export async function rowValue(scope: Locator, label: string) {
  const row = scope
    .locator('div, tr, dl > *')
    .filter({ has: scope.page().getByText(label, { exact: true }) })
    .last()
  await expect(row).toBeVisible({ timeout: 15_000 })
  return ((await row.innerText()).replace(label, '').match(/-?\$[\d,]+\.\d{2}/) ?? [''])[0]
}

export const money = (text: string) => Number(text.replace(/[$,]/g, ''))

/** The Summary card's money rows, by their labels, as numbers. */
export async function summary(page: Page) {
  const scope = card(page, /^summary$/i)
  await expect(scope).toBeVisible({ timeout: 15_000 })
  const text = await scope.innerText()
  const rows: Record<string, number> = {}
  for (const label of [
    'Subtotal',
    'Shipping',
    'Promotions',
    'Adjustments',
    'Tax (included)',
    'Tax (additional)',
    'Total',
    'Payment total',
    'Outstanding balance',
  ]) {
    const found = text.match(
      new RegExp(`(?:^|\\n)${label.replace(/[()]/g, '\\$&')}\\s*\\n?\\s*(-?\\$[\\d,]+\\.\\d{2})`),
    )
    if (found) rows[label] = money(found[1])
  }
  return rows
}

/**
 * Whether the Summary card's rows above Total add up to it. Tax included in
 * prices is not added. SD-34: the Adjustments row repeats the discounts and
 * added tax, so an order with either does not add up.
 */
export const addsUp = (rows: Record<string, number>) =>
  Math.abs(
    (rows.Subtotal ?? 0) +
      (rows.Shipping ?? 0) +
      (rows.Promotions ?? 0) +
      (rows.Adjustments ?? 0) +
      (rows['Tax (additional)'] ?? 0) -
      (rows.Total ?? 0),
  ) < 0.005

/** The order's total from the Admin API, for a check of what the screen shows. */
export const totalOf = async (baseURL: string | undefined, order: Order) =>
  seeded(baseURL, async (seed) =>
    money(String((await seed.get<{ total: string }>(`orders/${order.id}`)).total)),
  )

export async function openInventory(page: Page, search: string) {
  await openIn(page, getCredentials().store_id, `/inventory?search=${encodeURIComponent(search)}`)
  await expect(page.getByRole('heading', { name: /^inventory$/i })).toBeVisible({
    timeout: 15_000,
  })
}

export const inventoryRow = (page: Page, product: string, location: string) =>
  page.getByRole('row').filter({ hasText: product }).filter({ hasText: location })

/** The on-hand count a row of the inventory list shows. */
export async function onHand(page: Page, product: string, location: string) {
  const cell = inventoryRow(page, product, location).getByRole('button', {
    name: /edit on-hand count/i,
  })
  await expect(cell).toBeVisible({ timeout: 15_000 })
  return Number.parseInt((await cell.innerText()).trim(), 10)
}

/** The two methods a test's own delivery profile quotes, named after the test. */
export const methodsFor = (label: string) => ({
  ground: named(`${label} Ground`),
  express: named(`${label} Express`),
})

/**
 * A customer and a product whose own delivery profile quotes a Ground method
 * at $5.00 and an Express method at $12.00 to the United States, named after
 * the test, with the cheque methods. Spree selects Ground, the cheaper, when an
 * order is drafted.
 */
export async function rated(
  seed: Seed,
  label: string,
  baseURL: string,
  extra: object = {},
  stockedAt?: string,
) {
  const created = await seed.post<{ id: string }>('delivery_profiles', {
    name: named(`${label} profile`),
    kind: 'shipping',
  })
  const profile = await seed.get<{ id: string; origin_groups: { id: string }[] }>(
    `delivery_profiles/${created.id}`,
  )
  const inGroup = {
    delivery_profile_id: profile.id,
    delivery_origin_group_id: profile.origin_groups[0].id,
  }
  const zone = await seed.post<{ id: string }>('delivery_zones', {
    name: named(`${label} zone`),
    ...inGroup,
    members: [{ member_type: 'country', country_code: 'US' }],
  })
  const methodNames = methodsFor(label)
  for (const [name, amount] of [
    [methodNames.ground, '5.00'],
    [methodNames.express, '12.00'],
  ])
    await seed.post('delivery_methods', {
      name,
      ...inGroup,
      delivery_zone_id: zone.id,
      storefront_visible: true,
      calculator: { type: 'flat_rate', preferences: { amounts: { USD: amount } } },
    })
  const item = await product(
    seed,
    label,
    '20.00',
    { delivery_profile_id: profile.id, ...extra },
    stockedAt,
  )
  return {
    profileId: profile.id,
    customer: await customer(seed, label),
    product: item,
    methods: await chequeMethods(baseURL, seed.api, seed.headers),
  } satisfies Shop
}

export interface Fulfilment {
  id: string
  status: string
  items: { item_id: string; variant_id: string; quantity: number }[]
}

export const fulfilmentsOf = async (seed: Seed, order: Order) =>
  (await seed.get<{ data: Fulfilment[] }>(`orders/${order.id}/fulfillments`)).data

/** Ships an order's first fulfilment through the Admin API, without an email. */
export async function shipped(seed: Seed, order: Order, data: object = {}) {
  const [first] = await fulfilmentsOf(seed, order)
  await seed.patch(`orders/${order.id}/fulfillments/${first.id}/fulfill`, {
    notify_customer: false,
    ...data,
  })
  return first
}

/** An order's shipped units, which returns, exchanges and claims name. */
export async function unitsOf(seed: Seed, order: Order) {
  const read = await seed.get<{
    fulfillments: { fulfillment_items: { id: string; line_item_id: string }[] }[]
  }>(`orders/${order.id}?expand=fulfillments,fulfillments.fulfillment_items`)
  return read.fulfillments.flatMap((each) => each.fulfillment_items)
}
