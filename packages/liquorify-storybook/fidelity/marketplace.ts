import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, request } from '@playwright/test'
import { runRailsBootstrap } from '../../dashboard/e2e/rails'
import type { Headers, Json } from './orders'
import { admin } from './staff'

/**
 * Batch 13's marketplace on the browser-test server (work item §2.7, §7).
 *
 * `marketplace-seed.rb` makes the sellers in each status a workflow reaches,
 * their onboarding, their products and a ledger, through the same workflows
 * Spree's API controllers call. This file then does what a seller, an operator
 * and a shopper would do through the APIs: each selling seller records a
 * delivery method through the Seller API, the operator turns on a commission
 * rate and the commission tax through the Admin API, a shopper buys from two
 * sellers through the Store API, which splits the purchase into an order
 * group, and the operator fulfils one of its orders, which records the
 * seller's earning. Made once; a later run reuses what the state file names.
 */

const state = new URL('./results/marketplace-batch-13.json', import.meta.url).pathname
const seedFile = new URL('./marketplace-seed.rb', import.meta.url).pathname
export const SELLER_PASSWORD = 'fidelity-seller-123'
export const commissionRateName = 'Spirits and wine'
export const flatRateName = 'Saltmarsh flat fee'
export const shopperEmail = 'rowan.ellery@example.com'
export const shopperAddress = {
  first_name: 'Rowan',
  last_name: 'Ellery',
  address1: '14 Quayside Lane',
  city: 'Portland',
  country_code: 'US',
  state_code: 'OR',
  postal_code: '97205',
  phone: '5035550199',
}

export interface Marketplace {
  sellers: Record<
    | 'pending'
    | 'invited'
    | 'onboarding'
    | 'ready'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'second',
    string
  >
  products: Record<
    'proposed' | 'rejected' | 'active' | 'draft' | 'suspended' | 'second' | 'own',
    string
  >
  payouts: [string, string][]
  transfers: [string, string, string | null][]
  users: Record<'approved' | 'ready' | 'onboarding', string>
  commissionRate: string
  orderGroup: { id: string; number: string; orders: string[] }
  fulfilledOrder: string
  /** The store's own order, of its own product alone, placed apart from the group. */
  ownOrder: string
}

export async function send(
  api: APIRequestContext,
  headers: Headers,
  method: 'get' | 'post' | 'patch' | 'delete',
  path: string,
  data?: object,
) {
  const res = await api[method](`/api/v3/${path}`, { headers, data })
  const text = await res.text()
  expect(res.ok(), `${method.toUpperCase()} ${path}: ${res.status()} ${text}`).toBeTruthy()
  return (text ? JSON.parse(text) : {}) as Json
}

const rows = (body: Json) => body.data as Json[]

export async function sellerHeaders(api: APIRequestContext, email: string, sellerId: string) {
  const { token } = await send(api, {}, 'post', 'seller/auth/login', {
    email,
    password: SELLER_PASSWORD,
  })
  return { Authorization: `Bearer ${token}`, 'X-Spree-Seller-Id': sellerId }
}

/**
 * A shopper's checkout through the Store API with the store's publishable key,
 * paid by cheque: one cart holding the products given, which Spree splits into
 * an order group when they come from more than one seller.
 */
export async function shopper(api: APIRequestContext, headers: Headers) {
  const call = (method: 'get' | 'post' | 'patch', path: string, data?: object) =>
    send(api, headers, method, `admin/${path}`, data)
  const publishable = await publishableKey(api, headers)
  const methods = rows(await call('get', 'payment_methods?limit=100'))
  const cheque =
    methods.find((each) => each.type === 'check' && each.active) ??
    (await call('post', 'payment_methods', {
      name: 'Cheque',
      type: 'check',
      active: true,
      storefront_visible: true,
    }))
  return async (products: string[]) => {
    const shopperHeaders = { 'X-Spree-API-Key': publishable }
    const cart = await send(api, shopperHeaders, 'post', 'store/carts', {})
    const inCart = { ...shopperHeaders, 'X-Spree-Token': cart.token as string }
    const store_ = (method: 'get' | 'post' | 'patch', path: string, data?: object) =>
      send(api, inCart, method, `store/carts/${cart.id}${path}`, data)
    for (const product of products) {
      const variant = (await call('get', `products/${product}`)).default_variant_id as string
      await store_('post', '/items', { variant_id: variant, quantity: 1 })
    }
    await store_('patch', '', {
      email: shopperEmail,
      shipping_address: shopperAddress,
      billing_address: shopperAddress,
    })
    const quoted = await store_('get', '?expand=fulfillments')
    expect(quoted.warnings, 'nothing in the cart left undeliverable').toEqual([])
    await store_('post', '/payments', { payment_method_id: cheque.id })
    return store_('post', '/complete', {})
  }
}

/** The store's publishable key, for reading what a shopper sees. */
export async function publishableKey(api: APIRequestContext, headers: Headers) {
  const keys = rows(await send(api, headers, 'get', 'admin/api_keys?limit=100'))
  const key = keys.find(
    (each) => each.key_type === 'publishable' && !each.channel_id && !each.revoked_at,
  ) as Json | undefined
  expect(key, "the store's publishable key").toBeTruthy()
  return (await send(api, headers, 'get', `admin/api_keys/${(key as Json).id}`))
    .plaintext_token as string
}

export async function seedMarketplace(baseURL: string): Promise<Marketplace> {
  if (existsSync(state)) return JSON.parse(readFileSync(state, 'utf-8')) as Marketplace
  const seeded = JSON.parse(
    runRailsBootstrap(readFileSync(seedFile, 'utf-8'), {
      ...process.env,
      RAILS_ENV: 'test',
      DASHBOARD_E2E: '1',
      MARKETPLACE_PASSWORD: SELLER_PASSWORD,
    }),
  ) as Omit<Marketplace, 'commissionRate' | 'orderGroup' | 'fulfilledOrder'> & {
    users: Record<string, string>
  }

  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const call = (method: 'get' | 'post' | 'patch', path: string, data?: object) =>
      send(api, headers, method, `admin/${path}`, data)

    // Each selling seller prices its own delivery, as SP-SET-02 does.
    const [profile] = rows(await call('get', 'delivery_profiles?limit=100')).filter(
      (each) => each.name === 'General',
    )
    expect(profile, "the store's General delivery profile").toBeTruthy()
    const sellingUsers: [string, string, string][] = [
      [seeded.users.approved, seeded.sellers.approved, 'Harbour Cask courier'],
      ['priya.nair@saltmarsh.example.com', seeded.sellers.second, 'Saltmarsh tracked post'],
    ]
    for (const [email, sellerId, name] of sellingUsers) {
      const seller = await sellerHeaders(api, email, sellerId)
      const existing = rows(await send(api, seller, 'get', 'seller/delivery_methods'))
      if (existing.some((each) => each.name === name)) continue
      await send(api, seller, 'post', 'seller/delivery_methods', {
        name,
        delivery_profile_id: profile.id,
        storefront_visible: true,
        calculator: { type: 'flat_rate', preferences: { amount: '6.50' } },
      })
    }

    // The store prices delivery of its own products, as DA-SET-17 does.
    const storeMethods = rows(await call('get', 'delivery_methods?limit=100'))
    if (!storeMethods.some((each) => each.name === 'Liquorify courier')) {
      await call('post', 'delivery_methods', {
        name: 'Liquorify courier',
        delivery_profile_id: profile.id,
        storefront_visible: true,
        calculator: { type: 'flat_rate', preferences: { amount: '5.00' } },
      })
    }

    // The operator's commission, before the purchase it applies to.
    const rates = rows(await call('get', 'commission_rates?limit=100'))
    const rate =
      rates.find((each) => each.name === commissionRateName) ??
      (await call('post', 'commission_rates', {
        name: commissionRateName,
        enabled: true,
        kind: 'percentage',
        value: '12',
        bounds: { USD: { min_amount: '2.00', max_amount: '40.00' } },
        commission_tax_rate: '0.2',
      }))
    // A flat fee for one seller, which takes the second seller's sale first.
    if (!rates.some((each) => each.name === flatRateName)) {
      await call('post', 'commission_rates', {
        name: flatRateName,
        enabled: true,
        kind: 'fixed',
        value: '1.50',
        amounts: { USD: '1.50' },
        commission_tax_rate: '0.2',
        rules: [{ type: 'seller_rule', preferences: { seller_ids: [seeded.sellers.second] } }],
      })
    }
    await call('patch', 'store', { default_commission_tax_rate: '0.2' })

    // A shopper buys the store's own product, then from both sellers, through the Store API.
    const checkout = await shopper(api, headers)
    const own = await checkout([seeded.products.own])
    const group = await checkout([seeded.products.active, seeded.products.second])
    const orders = (group.orders as Json[]).map((order) => order.id)

    // The operator fulfils the first seller's order, which earns its transfer.
    const [harbourOrder] = await Promise.all(orders.map((id) => call('get', `orders/${id}`))).then(
      (list) => list.filter((order) => order.seller_id === seeded.sellers.approved),
    )
    const [fulfilment] = rows(await call('get', `orders/${harbourOrder.id}/fulfillments`))
    await call('patch', `orders/${harbourOrder.id}/fulfillments/${fulfilment.id}/fulfill`, {
      tracking: 'HCC-0098-1123',
      notify_customer: false,
    })

    const marketplace: Marketplace = {
      ...(seeded as unknown as Marketplace),
      commissionRate: rate.id,
      orderGroup: { id: group.id, number: group.number as string, orders },
      fulfilledOrder: harbourOrder.id,
      ownOrder: ((own.orders as Json[] | undefined)?.[0]?.id ?? own.id) as string,
    }
    mkdirSync(new URL('./results/', import.meta.url).pathname, { recursive: true })
    writeFileSync(state, JSON.stringify(marketplace, null, 2))
    return marketplace
  } finally {
    await api.dispose()
  }
}
