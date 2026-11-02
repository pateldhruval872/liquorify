import { type APIRequestContext, expect } from '@playwright/test'
import { FIXTURE_PROMO_SKU } from '../../dashboard/e2e/helpers'
import type { Caller } from './one-store'

/**
 * Two customers of the store for step P7's shopper account checks, added to
 * the browser-test data through the Store and Admin APIs only. The owner has
 * two addresses, an order placed through the Admin API, two cards saved
 * through the test gateway's card setup and a gift card; the other customer
 * has an address and a card of their own. Every name and address line carries
 * the run's stamp, so no run reads another's records, and a refused answer can
 * be searched for the owner's.
 *
 * Tokens and the gift card's code are kept in memory only.
 */

export const PASSWORD = 'p7-customer-password-123'

type Json = Record<string, unknown>

export async function json(
  api: APIRequestContext,
  caller: Caller,
  method: string,
  path: string,
  data?: Json,
) {
  const res = await api.fetch(path, { method, headers: caller.headers, data })
  const body = res.status() === 204 ? {} : ((await res.json()) as Json)
  expect(
    res.ok(),
    `${method} ${path}: ${res.status()} ${(body.error as Json)?.message ?? ''}`,
  ).toBeTruthy()
  return body
}

/** The store's own publishable key, which a storefront sends with every Store API request. */
export async function publishableKey(api: APIRequestContext, admin: Caller) {
  const keys = (await json(api, admin, 'GET', '/api/v3/admin/api_keys?limit=100')).data as Json[]
  const key = keys.find((item) => item.name === 'Default' && item.key_type === 'publishable')
  expect(key, "the store's publishable key").toBeTruthy()
  return String(key?.plaintext_token)
}

async function register(api: APIRequestContext, key: string, name: string, run: number) {
  const email = `p7-${name}-${run}@example.com`
  const last = `${name[0].toUpperCase()}${name.slice(1)}${run}`
  const res = await api.post('/api/v3/store/customers', {
    headers: { 'X-Spree-API-Key': key },
    data: {
      email,
      password: PASSWORD,
      password_confirmation: PASSWORD,
      first_name: 'P7',
      last_name: last,
    },
  })
  expect(res.status(), `registering ${name}`).toBe(201)
  const body = (await res.json()) as { token: string; user: { id: string } }
  const caller: Caller = {
    name,
    headers: { 'X-Spree-API-Key': key, Authorization: `Bearer ${body.token}` },
  }
  return { caller, id: body.user.id, email, last }
}

export const address = (line: string, last: string) => ({
  first_name: 'P7',
  last_name: last,
  address1: line,
  city: 'Los Angeles',
  country_code: 'US',
  state_code: 'CA',
  postal_code: '90001',
  phone: '5555555555',
})

/** A saved card, through the test gateway's card setup as a customer's browser would. */
async function saveCard(api: APIRequestContext, customer: Caller, gatewayId: string) {
  const me = '/api/v3/store/customers/me'
  const cards = async () =>
    ((await json(api, customer, 'GET', `${me}/credit_cards`)).data as Json[]).map((card) =>
      String(card.id),
    )
  const before = await cards()
  const session = await json(api, customer, 'POST', `${me}/payment_setup_sessions`, {
    payment_method_id: gatewayId,
  })
  await json(api, customer, 'PATCH', `${me}/payment_setup_sessions/${session.id}/complete`, {})
  const added = (await cards()).filter((id) => !before.includes(id))
  expect(added.length, 'the card setup saved one card').toBe(1)
  return added[0]
}

/** A placed order for the customer, through the Admin API, as Spree's dashboard tests place theirs. */
async function placeOrder(
  api: APIRequestContext,
  admin: Caller,
  email: string,
  shipTo: ReturnType<typeof address>,
) {
  const call = (method: string, path: string, data?: Json) =>
    json(api, admin, method, `/api/v3/admin/${path}`, data)
  const customers = await call('GET', `customers?q[email_eq]=${encodeURIComponent(email)}`)
  const customer = (customers.data as Json[])[0]
  const variant = ((await call('GET', `variants?q[sku_eq]=${FIXTURE_PROMO_SKU}`)).data as Json[])[0]
  const order = await call('POST', 'orders', {
    customer_id: customer.id,
    items: [{ variant_id: variant.id, quantity: 1 }],
    shipping_address: shipTo,
    billing_address: shipTo,
  })
  await call('POST', `customers/${customer.id}/store_credits`, {
    amount: order.total,
    currency: order.currency,
    memo: `P7 payment for ${order.number}`,
  })
  await call('POST', `orders/${order.id}/store_credits`)
  await call('PATCH', `orders/${order.id}/complete`)
  return { id: String(order.id), number: String(order.number), customerId: String(customer.id) }
}

export async function addShoppers(
  api: APIRequestContext,
  admin: Caller,
  key: string,
  gatewayId: string,
  run: number,
) {
  const me = '/api/v3/store/customers/me'
  const owner = await register(api, key, 'owner', run)
  const other = await register(api, key, 'other', run)
  const lines = {
    kept: `${run} Owner Street`,
    spare: `${run} Spare Street`,
    order: `${run} Order Street`,
    other: `${run} Other Street`,
  }
  const kept = String(
    (await json(api, owner.caller, 'POST', `${me}/addresses`, address(lines.kept, owner.last))).id,
  )
  const spare = String(
    (await json(api, owner.caller, 'POST', `${me}/addresses`, address(lines.spare, owner.last))).id,
  )
  await json(api, other.caller, 'POST', `${me}/addresses`, address(lines.other, other.last))
  const order = await placeOrder(api, admin, owner.email, address(lines.order, owner.last))
  const keptCard = await saveCard(api, owner.caller, gatewayId)
  const spareCard = await saveCard(api, owner.caller, gatewayId)
  await saveCard(api, other.caller, gatewayId)
  const giftCard = await json(api, admin, 'POST', '/api/v3/admin/gift_cards', {
    amount: '25.00',
    currency: 'USD',
    customer_id: order.customerId,
  })
  const gift = { id: String(giftCard.id), code: String(giftCard.code) }
  expect(gift.code.length, 'the gift card has a code to look for').toBeGreaterThan(3)
  return {
    owner,
    other,
    lines,
    addresses: { kept, spare },
    order,
    cards: { keptCard, spareCard },
    gift,
  }
}
