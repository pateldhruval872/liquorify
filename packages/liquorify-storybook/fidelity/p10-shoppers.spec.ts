import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, request as playwright, test } from '@playwright/test'
import { getCredentials } from '../../dashboard/e2e/helpers'
import { locationNames } from './inventory'
import {
  adminCall,
  adminCaller,
  type Caller,
  type Case,
  type CaseResult,
  carried,
  changeSetting,
  denied,
  type Gap,
  type Json,
  notFound,
  ownOnly,
  type PutBack,
  rows,
  runCases,
  runStorefrontCase,
  type Setting,
  type StorefrontCase,
  type StorefrontProbe,
  send,
} from './one-store'
import { ensurePaymentMethods, paymentNames } from './payments-delivery'
import { address, publishableKey } from './shoppers'
import { seed } from './staff'

/**
 * Step P10's shopper refusals within one store: items 1 and 4 of the platform
 * work item's "P10's checks, recorded before implementation". G-45 and G-50,
 * the shop batch's product and cart requests sent through the storefront's own
 * server code, and G-79, batch 9's cart, checkout and order requests sent
 * through the Store API and then through the storefront's checkout actions.
 * Each is judged by P7's `one-store.ts`.
 *
 * Start Spree's browser-test server freshly, as `stack.spec.ts` says, then
 * build and start the storefront at the revision under test against it with
 * `storefront-run.mjs`, and set `STOREFRONT_DIR` to its checkout so each
 * action's id can be read from its build's manifest. The run adds its own
 * products, delivery methods, codes and shoppers, named with the run's stamp:
 * guest A, with a cart holding an item, an address and a chosen delivery
 * rate; guest B, with a cart of their own; customer C, signed in, with a cart
 * and no saved address; and customer D, signed in, with a saved address and a
 * cart. Each storefront visitor is a cookie jar holding that shopper's cart,
 * and the customers sign in through the storefront's own sign-in action.
 * Settings the run changes are put back. Results go to
 * `results/p10/shoppers.json`, with no page bodies, tokens or codes.
 */

const API = process.env.P10_API_URL ?? 'http://localhost:3010'
const STOREFRONT = process.env.STOREFRONT_URL ?? 'http://localhost:3001'
const DIR = process.env.STOREFRONT_DIR ?? ''
const results = new URL('./results/p10/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const storefrontRevision = process.env.STOREFRONT_REVISION ?? null
const run = Date.now()
const BASE = '/us/en'
const PASSWORD = 'p10-customer-password-123'
const notFoundPage = { page: 200, shows: ['404', 'This page could not be found.'] }

test.use({ baseURL: API })

interface Manifest {
  node: Record<string, { filename?: string; exportedName?: string }>
}

interface Cart {
  id: string
  token: string
  email: string | null
  currency: string
  items: { id: string; quantity: number; variant_id: string }[]
  fulfillments: {
    id: string
    selected_delivery_rate_id: string | null
    delivery_rates: { id: string; name: string }[]
  }[]
}

/** What a cart's read-back compares: never its token or timestamps. */
const view = (sent: { status: number; text: string }) => {
  if (sent.status !== 200) return sent.status
  const cart = JSON.parse(sent.text) as Json & Cart
  return {
    email: cart.email,
    currency: cart.currency,
    items: cart.items.map((item) => [item.id, item.quantity]),
    selected: cart.fulfillments.map((item) => item.selected_delivery_rate_id),
    discounts: ((cart.discounts as Json[]) ?? []).map((item) => item.code ?? item.name),
    shipping: (cart.shipping_address as Json | null)?.address1 ?? null,
    billing: (cart.billing_address as Json | null)?.address1 ?? null,
    steps: cart.completed_steps,
    requirements: cart.requirements,
  }
}

async function json<T = Json>(
  api: APIRequestContext,
  method: string,
  path: string,
  headers: Record<string, string>,
  data?: unknown,
): Promise<T> {
  const res = await api.fetch(path, { method, headers, data })
  const body = res.status() === 204 ? {} : await res.json()
  // Only the status and the message, which never carries a token.
  expect(res.ok(), `${method} ${path}: ${res.status()} ${body?.error?.message ?? ''}`).toBe(true)
  return body as T
}

test('the storefront and the Store API keep each shopper to their own products, carts and orders, within one store', async ({
  request,
}) => {
  test.skip(!DIR, "Run with STOREFRONT_DIR naming the storefront's checkout")
  test.setTimeout(600_000)
  const manifest = JSON.parse(
    readFileSync(`${DIR}/.next/server/server-reference-manifest.json`, 'utf8'),
  ) as Manifest
  const actionId = (file: string, name: string) => {
    const found = Object.entries(manifest.node).find(
      ([, entry]) => entry.filename === `src/lib/data/${file}.ts` && entry.exportedName === name,
    )
    expect(found, `the build carries ${name}`).toBeTruthy()
    return (found as [string, unknown])[0]
  }

  const creds = getCredentials()
  await seed(API)
  await ensurePaymentMethods(API)
  const admin = await adminCaller(
    request,
    'admin',
    creds.admin_email,
    creds.admin_password,
    creds.store_id,
  )
  const call = adminCall(request, admin)
  const key = await publishableKey(request, admin)

  // The settings the run changes. Each is put back, and read again to show it was.
  const online = rows(await call('GET', 'channels?limit=100')).find(
    (channel) => channel.default,
  ) as Json
  expect(online, "the store's default channel").toBeTruthy()
  const cheque = rows(await call('GET', 'payment_methods?limit=100')).find(
    (method) => method.name === paymentNames.cheque,
  ) as Json
  expect(cheque, 'the cheque payment method').toBeTruthy()
  const access: Setting = {
    name: "the default channel's storefront access",
    read: async () => (await call('GET', `channels/${online.id}`)).storefront_access,
    write: (value) => call('PATCH', `channels/${online.id}`, { storefront_access: value }),
  }
  const chequeOffered: Setting = {
    name: 'whether the cheque payment method is active and shown on the storefront',
    read: async () => {
      const method = await call('GET', `payment_methods/${cheque.id}`)
      return { active: method.active, storefront_visible: method.storefront_visible }
    },
    write: (value) => call('PATCH', `payment_methods/${cheque.id}`, value as Json),
  }
  const putBack: PutBack[] = []
  const contexts: Record<string, APIRequestContext> = {}
  // The cheque is the one method that takes a payment without a session.
  const putChequeBack = await changeSetting(chequeOffered, {
    active: true,
    storefront_visible: true,
  })
  try {
    // Two delivery methods for the United States in the store's default
    // profile, which the browser-test data leaves with none.
    const profile = rows(await call('GET', 'delivery_profiles?limit=100')).find(
      (item) => item.default,
    ) as Json
    const zone = await call('POST', 'delivery_zones', {
      name: `P10 United States ${run}`,
      delivery_profile_id: profile.id,
      members: [{ member_type: 'country', country_code: 'US' }],
    })
    for (const [name, amount] of [
      [`P10 standard ${run}`, '5.00'],
      [`P10 express ${run}`, '15.00'],
    ]) {
      await call('POST', 'delivery_methods', {
        name,
        delivery_profile_id: profile.id,
        delivery_zone_id: zone.id,
        calculator: { type: 'flat_rate', preferences: { amounts: { USD: amount, EUR: amount } } },
      })
    }
    const codes = [`P10SAVE${run}`, `P10MORE${run}`]
    for (const code of codes) {
      await call('POST', 'promotions', {
        name: `P10 code ${code}`,
        kind: 'coupon_code',
        code,
        match_policy: 'all',
        actions: [
          {
            type: 'create_adjustment',
            calculator: { type: 'flat_rate', preferences: { amount: '1', currency: 'USD' } },
          },
        ],
      })
    }

    // The run's products, each on the storefront's channel unless a draft,
    // and in stock at the shop location.
    const shop = rows(await call('GET', 'stock_locations?limit=100')).find(
      (item) => item.name === locationNames.shop,
    ) as Json
    const field = async (label: string, visible: boolean) =>
      String(
        (
          await call('POST', 'custom_field_definitions', {
            resource_type: 'product',
            namespace: 'custom',
            key: `p10_${label}_${run}`,
            label: `P10 ${label} ${run}`,
            field_type: 'short_text',
            storefront_visible: visible,
          })
        ).id,
      )
    const shownField = await field('shown', true)
    const hiddenField = await field('hidden', false)
    const term = `p10shop${run}`
    const values = { shown: `P10 shown value ${run}`, hidden: `P10 hidden value ${run}` }
    const product = async (key: string, name: string, amount: string, extra: Json = {}) => {
      const created = await call('POST', 'products', {
        name,
        slug: `p10-${key}-${run}`,
        status: 'active',
        prices: [
          { amount, currency: 'USD' },
          { amount, currency: 'EUR' },
        ],
        product_publications: [{ channel_id: online.id }],
        ...extra,
      })
      await call('POST', 'stock_levels/bulk_upsert', {
        stock_levels: [
          {
            variant_id: created.default_variant_id,
            stock_location_id: shop.id,
            count_on_hand: 100,
          },
        ],
      })
      return {
        id: String(created.id),
        name,
        slug: String(created.slug),
        variant: String(created.default_variant_id),
      }
    }
    const listed = await product('listed', `P10 shop product ${term}`, '21.00', {
      custom_fields: [
        { custom_field_definition_id: shownField, value: values.shown },
        { custom_field_definition_id: hiddenField, value: values.hidden },
      ],
    })
    const draft = await product('draft', `P10 draft product ${term}`, '31.00', {
      status: 'draft',
    })
    const priced = await product('priced', `P10 priced product ${run}`, '27.00')
    const gated = await product('gated', `P10 gated product ${run}`, '28.00')
    const itemA = await product('guest-a', `P10 guest A item ${run}`, '23.00')

    // The shoppers, through the Store API as a storefront makes them.
    const storeHeaders = (extra: Record<string, string> = {}) => ({
      'X-Spree-API-Key': key,
      ...extra,
    })
    const newCart = async (headers: Record<string, string>, variant: string) => {
      const cart = await json<Cart>(request, 'POST', '/api/v3/store/carts', headers)
      const withToken = { ...headers, 'X-Spree-Token': cart.token }
      await json(request, 'POST', `/api/v3/store/carts/${cart.id}/items`, withToken, {
        variant_id: variant,
        quantity: 1,
      })
      return { id: cart.id, token: cart.token, headers: withToken }
    }
    const register = async (name: string) => {
      const email = `p10-${name}-${run}@example.com`
      const last = `${name[0].toUpperCase()}${name.slice(1)}${run}`
      const body = await json<{ token: string }>(
        request,
        'POST',
        '/api/v3/store/customers',
        storeHeaders(),
        {
          email,
          password: PASSWORD,
          password_confirmation: PASSWORD,
          first_name: 'P10',
          last_name: last,
        },
      )
      return { email, last, headers: storeHeaders({ Authorization: `Bearer ${body.token}` }) }
    }

    const a = await newCart(storeHeaders(), itemA.variant)
    const aEmail = `p10-guest-a-${run}@example.com`
    const aLine = `${run} Guest A Street`
    const aAddress = address(aLine, `GuestA${run}`)
    await json(request, 'PATCH', `/api/v3/store/carts/${a.id}`, a.headers, {
      email: aEmail,
      shipping_address: aAddress,
      billing_address: aAddress,
    })
    const readA = async () =>
      (await json<Cart>(request, 'GET', `/api/v3/store/carts/${a.id}`, a.headers)) as Cart
    const rateNamed = (cart: Cart, name: string) =>
      cart.fulfillments[0].delivery_rates.find((rate) => rate.name === name)?.id as string
    let cartA = await readA()
    const fulfillmentA = cartA.fulfillments[0]?.id
    expect(fulfillmentA, "guest A's cart has a delivery to choose").toBeTruthy()
    const standard = () => rateNamed(cartA, `P10 standard ${run}`)
    await json(
      request,
      'PATCH',
      `/api/v3/store/carts/${a.id}/fulfillments/${fulfillmentA}`,
      a.headers,
      {
        selected_delivery_rate_id: standard(),
      },
    )
    const lineA = cartA.items[0].id

    const b = await newCart(storeHeaders(), listed.variant)
    const customerC = await register('customer-c')
    const c = await newCart(customerC.headers, listed.variant)
    const customerD = await register('customer-d')
    const dLine = `${run} Customer D Street`
    const dAddress = String(
      (
        await json(
          request,
          'POST',
          '/api/v3/store/customers/me/addresses',
          customerD.headers,
          address(dLine, customerD.last),
        )
      ).id,
    )
    const d = await newCart(customerD.headers, listed.variant)

    const apiA: Caller = { name: 'guestA', headers: a.headers }
    const apiB: Caller = { name: 'guestB', headers: b.headers }
    const apiC: Caller = { name: 'customerC', headers: customerC.headers }
    const apiD: Caller = { name: 'customerD', headers: customerD.headers }

    // Each visitor is a cookie jar holding that shopper's cart, as a browser
    // that had added it would; the customers then sign in through the
    // storefront's own sign-in action.
    const jar = async (cart?: { id: string; token: string }) =>
      playwright.newContext({
        baseURL: STOREFRONT,
        storageState: {
          cookies: cart
            ? [
                ['_spree_cart_token_id', cart.id],
                ['_spree_cart_token', cart.token],
              ].map(([name, value]) => ({
                name,
                value,
                domain: 'localhost',
                path: '/',
                expires: -1,
                httpOnly: true,
                secure: false,
                sameSite: 'Lax' as const,
              }))
            : [],
          origins: [],
        },
      })
    contexts.guest = await jar()
    contexts.guestA = await jar(a)
    contexts.guestB = await jar(b)
    contexts.customerC = await jar(c)
    contexts.customerD = await jar(d)
    const login = actionId('customer', 'login')
    for (const [name, email] of [
      ['customerC', customerC.email],
      ['customerD', customerD.email],
    ]) {
      const signedIn = await contexts[name].post(`${BASE}/account`, {
        headers: {
          'Next-Action': login,
          'Content-Type': 'text/plain;charset=UTF-8',
          Accept: 'text/x-component',
        },
        data: JSON.stringify([email, PASSWORD]),
        maxRedirects: 0,
      })
      expect(signedIn.status(), `signing ${name} in`).toBe(200)
      expect((await signedIn.text()).includes('"success":true'), `${name} signed in`).toBe(true)
    }

    const checkoutPage = (cartId: string) => `${BASE}/checkout/${cartId}`
    const action = (file: string, name: string, args: unknown[], page = checkoutPage(a.id)) =>
      ({ page, action: { id: actionId(file, name), args } }) satisfies StorefrontProbe
    const stateA = async () =>
      view(await send(request, apiA, { method: 'GET', path: `/api/v3/store/carts/${a.id}` }))
    const ownCart = (id: string, more: Json = {}) => ({
      partly: { success: true, cart: { id, ...more } },
    })
    const refused = { partly: { success: false } }
    const productPage = (slug: string) => ({ page: `${BASE}/products/${slug}` })
    // What Spree's Store API itself answers for the same product, beside a
    // storefront case, so a failing control can be traced to its cause.
    const observations: Json[] = []
    const observeProduct = async (title: string, slug: string, values: string[]) => {
      for (const caller of [{ name: 'guest', headers: storeHeaders() }, apiC]) {
        const sent = await send(request, caller, {
          method: 'GET',
          path: `/api/v3/store/products/${slug}`,
        })
        observations.push({
          title,
          caller: caller.name,
          status: sent.status,
          code: sent.code,
          carriedAll: carried(sent.text, values).length === values.length,
        })
      }
    }

    const api: CaseResult[] = []
    const storefrontResults: Awaited<ReturnType<typeof runStorefrontCase>>[] = []
    const runSf = async (item: StorefrontCase) =>
      storefrontResults.push(await runStorefrontCase(contexts, item))

    // Item 1: the shop batch's requests through the storefront.
    await runSf({
      gap: 'G-45',
      title: '1.2 Search the catalog with the product list action',
      attempts: ['guest', 'customerC'].map((caller) => ({
        caller,
        probe: action('products', 'getProducts', [
          { search: term, fields: ['name', 'slug', 'price', 'thumbnail_url'], limit: 6 },
        ]),
        expected: { partly: { data: [{ name: listed.name }] } },
      })),
      control: {
        caller: 'guest',
        probe: action('products', 'getProducts', [
          { search: term, fields: ['name', 'slug', 'price', 'thumbnail_url'], limit: 6 },
        ]),
        expected: { partly: { data: [{ name: listed.name }] } },
      },
      protectedValues: [draft.name, draft.slug],
      controlCarries: [listed.name],
    })
    await runSf({
      gap: 'G-50',
      title: '1.3 Open a product page with a custom field hidden from the storefront',
      attempts: ['guest', 'customerC'].map((caller) => ({
        caller,
        probe: productPage(listed.slug),
        expected: { page: 200, shows: [listed.name, values.shown] },
      })),
      control: {
        caller: 'guest',
        probe: productPage(listed.slug),
        expected: { page: 200, shows: [listed.name] },
      },
      protectedValues: [values.hidden],
      controlCarries: [values.shown],
    })
    await runSf({
      gap: 'G-45',
      title: "1.1 Open a draft product's page",
      attempts: ['guest', 'customerC'].map((caller) => ({
        caller,
        probe: productPage(draft.slug),
        expected: notFoundPage,
      })),
      control: {
        caller: 'guest',
        probe: productPage(draft.slug),
        expected: { page: 200, shows: [draft.name] },
      },
      protectedValues: [draft.name, '31.00'],
      beforeControl: {
        what: 'the admin made the product active; it was already on the storefront’s channel',
        run: async () => {
          await call('PATCH', `products/${draft.id}`, { status: 'active' })
        },
      },
    })
    const putPricesBack = await changeSetting(access, 'prices_hidden')
    try {
      await runSf({
        gap: 'G-50',
        title: '1.4 Open a product page with prices hidden from guests',
        attempts: [
          {
            caller: 'guest',
            probe: productPage(priced.slug),
            expected: { page: 200, shows: [priced.name] },
          },
        ],
        control: {
          caller: 'customerC',
          probe: productPage(priced.slug),
          expected: { page: 200, shows: [priced.name, '27.00'] },
        },
        protectedValues: ['27.00'],
      })
      await observeProduct(
        "1.4 The Store API's answer for the same product, with the customer's token sent",
        priced.slug,
        [priced.name, '27.00'],
      )
    } finally {
      putBack.push(await putPricesBack())
    }
    const putSignInBack = await changeSetting(access, 'login_required')
    try {
      await runSf({
        gap: 'G-50',
        title: '1.5 Open a product page with sign-in required',
        attempts: [{ caller: 'guest', probe: productPage(gated.slug), expected: notFoundPage }],
        control: {
          caller: 'customerC',
          probe: productPage(gated.slug),
          expected: { page: 200, shows: [gated.name] },
        },
        protectedValues: [gated.name, '28.00'],
      })
      await observeProduct(
        "1.5 The Store API's answer for the same product, with the customer's token sent",
        gated.slug,
        [gated.name],
      )
    } finally {
      putBack.push(await putSignInBack())
    }
    const aValues = [aEmail, aLine, itemA.name, a.token]
    await runSf({
      gap: 'G-45',
      title: "1.6 Read guest A's cart through the cart action",
      attempts: ['guestB', 'customerC'].map((caller) => ({
        caller,
        probe: action('cart', 'getCart', [a.id]),
        expected: { result: null },
      })),
      control: {
        caller: 'guestA',
        probe: action('cart', 'getCart', [a.id]),
        expected: { result: { id: a.id } },
      },
      protectedValues: aValues,
      controlCarries: [aEmail, itemA.name],
    })
    await runSf({
      gap: 'G-45',
      title: "1.7 Switch currency on guest A's cart through the region switch's action",
      attempts: [
        {
          caller: 'guestB',
          probe: action('checkout', 'updateCartMarket', [a.id, { currency: 'EUR', locale: 'en' }]),
          expected: ownCart(b.id),
        },
      ],
      control: {
        caller: 'guestA',
        probe: action('checkout', 'updateCartMarket', [a.id, { currency: 'EUR', locale: 'en' }]),
        expected: ownCart(a.id, { currency: 'EUR' }),
      },
      protectedValues: aValues,
      state: stateA,
    })
    // Both carts back to dollars, with A's standard rate chosen, for item 4.
    for (const cart of [a, b])
      await json(request, 'PATCH', `/api/v3/store/carts/${cart.id}`, cart.headers, {
        currency: 'USD',
      })
    cartA = await readA()
    await json(
      request,
      'PATCH',
      `/api/v3/store/carts/${a.id}/fulfillments/${cartA.fulfillments[0].id}`,
      a.headers,
      { selected_delivery_rate_id: standard() },
    )

    // Item 4: batch 9's requests through the Store API.
    cartA = await readA()
    const cartPath = `/api/v3/store/carts/${a.id}`
    const readBack = (caller: Caller, path = cartPath): Case['state'] => ({
      caller,
      request: { method: 'GET', path },
      pick: (sent) => view({ status: sent.status, text: JSON.stringify(sent.body) }),
    })
    const s1 = denied(null)
    const both = [
      { caller: apiB, expected: s1 },
      { caller: apiC, expected: s1 },
    ]
    const aEmailChanged = `p10-guest-a-${run}-changed@example.com`
    const apiValues = [aEmail, aEmailChanged, aLine, itemA.name, a.token]
    const store = (gap: Gap, title: string, rest: Omit<Case, 'gap' | 'area' | 'title'>): Case => ({
      gap,
      area: 'store api',
      title,
      ...rest,
    })
    api.push(
      ...(await runCases(request, [
        store('G-79', "4.1 Read guest A's cart", {
          request: { method: 'GET', path: cartPath },
          attempts: both,
          control: { caller: apiA, status: 200 },
          protectedValues: apiValues,
          controlCarries: [aEmail, aLine, itemA.name],
        }),
        store('G-79', "4.2 Change guest A's cart's email", {
          request: { method: 'PATCH', path: cartPath, data: { email: aEmailChanged } },
          attempts: both,
          control: { caller: apiA, status: 200 },
          protectedValues: apiValues,
          state: readBack(apiA),
        }),
        store('G-79', "4.3 Add an item to guest A's cart", {
          request: {
            method: 'POST',
            path: `${cartPath}/items`,
            data: { variant_id: listed.variant, quantity: 1 },
          },
          attempts: both,
          control: { caller: apiA, status: 201 },
          protectedValues: apiValues,
          state: readBack(apiA),
        }),
        store('G-79', "4.4 Change the quantity of guest A's item", {
          request: { method: 'PATCH', path: `${cartPath}/items/${lineA}`, data: { quantity: 2 } },
          attempts: both,
          control: { caller: apiA, status: 200 },
          protectedValues: apiValues,
          state: readBack(apiA),
        }),
        store('G-79', "4.5 Change guest A's item on guest B's own cart", {
          request: {
            method: 'PATCH',
            path: `/api/v3/store/carts/${b.id}/items/${lineA}`,
            data: { quantity: 3 },
          },
          // Corrected from record_not_found after the development trial: Spree names
          // a missing line item's code `line_item_not_found` (see the record).
          attempts: [{ caller: apiB, expected: notFound('line_item_not_found') }],
          control: {
            caller: apiA,
            status: 200,
            request: { method: 'PATCH', path: `${cartPath}/items/${lineA}`, data: { quantity: 3 } },
          },
          protectedValues: apiValues,
          state: readBack(apiA),
        }),
        store('G-79', "4.5 Remove guest A's item on guest B's own cart", {
          request: { method: 'DELETE', path: `/api/v3/store/carts/${b.id}/items/${lineA}` },
          // Corrected from record_not_found after the development trial: Spree names
          // a missing line item's code `line_item_not_found` (see the record).
          attempts: [{ caller: apiB, expected: notFound('line_item_not_found') }],
          control: {
            caller: apiA,
            status: 200,
            request: { method: 'PATCH', path: `${cartPath}/items/${lineA}`, data: { quantity: 1 } },
          },
          protectedValues: apiValues,
          state: readBack(apiA),
        }),
      ])),
    )
    // Adding an item rebuilds the cart's deliveries, so 4.6 reads them again.
    cartA = await readA()
    const unchosen = () =>
      cartA.fulfillments[0].delivery_rates.find(
        (rate) => rate.id !== cartA.fulfillments[0].selected_delivery_rate_id,
      )?.id as string
    api.push(
      ...(await runCases(request, [
        store('G-79', "4.6 Choose a delivery rate on guest A's cart", {
          request: {
            method: 'PATCH',
            path: `${cartPath}/fulfillments/${cartA.fulfillments[0].id}`,
            data: { selected_delivery_rate_id: unchosen() },
          },
          attempts: both,
          control: { caller: apiA, status: 200 },
          protectedValues: apiValues,
          state: readBack(apiA),
        }),
        store('G-79', "4.7 Apply a discount code to guest A's cart", {
          request: { method: 'POST', path: `${cartPath}/discount_codes`, data: { code: codes[0] } },
          attempts: both,
          // Corrected from 200 before the trial: `discount_codes#create` answers 201 (see the record).
          control: { caller: apiA, status: 201 },
          protectedValues: apiValues,
          state: readBack(apiA),
        }),
        store('G-79', "4.11 Name customer D's saved address on customer C's cart", {
          request: {
            method: 'PATCH',
            path: `/api/v3/store/carts/${c.id}`,
            data: { shipping_address_id: dAddress, billing_address_id: dAddress },
          },
          attempts: [{ caller: apiC, expected: ownOnly }],
          control: {
            caller: apiD,
            status: 200,
            request: {
              method: 'PATCH',
              path: `/api/v3/store/carts/${d.id}`,
              data: { shipping_address_id: dAddress, billing_address_id: dAddress },
            },
          },
          protectedValues: [dLine, customerD.last],
          controlCarries: [dLine],
          state: {
            ...(readBack(apiC, `/api/v3/store/carts/${c.id}`) as NonNullable<Case['state']>),
            controlLeavesNoTrace:
              "the allowed request changes customer D's own cart, which the read-back of customer C's cart does not show; its answer must carry the address instead",
          },
        }),
      ])),
    )

    // Item 4 through the storefront's checkout actions, before the order is placed.
    const cValues = [dLine, customerD.last]
    const aSfValues = [aEmail, aEmailChanged, aLine, itemA.name, a.token]
    await runSf({
      gap: 'G-79',
      title: "4.12 Read guest A's checkout through the checkout action",
      attempts: ['guestB', 'customerC'].map((caller) => ({
        caller,
        probe: action('checkout', 'getCheckoutOrder', [a.id]),
        expected: { result: null },
      })),
      control: {
        caller: 'guestA',
        probe: action('checkout', 'getCheckoutOrder', [a.id]),
        expected: { result: { id: a.id } },
      },
      protectedValues: aSfValues,
      controlCarries: [aEmailChanged, itemA.name],
    })
    await runSf({
      gap: 'G-79',
      title: "4.13 Open guest A's checkout page",
      attempts: ['guestB', 'customerC'].map((caller) => ({
        caller,
        probe: { page: checkoutPage(a.id) },
        expected: { page: 200, shows: [] },
      })),
      control: {
        caller: 'guestA',
        probe: { page: checkoutPage(a.id) },
        expected: { page: 200, shows: [aEmailChanged] },
      },
      protectedValues: aSfValues,
      controlCarries: [aEmailChanged, aLine, itemA.name],
    })
    const secondLine = `${run} Guest A Second Street`
    await runSf({
      gap: 'G-79',
      title: '4.14 Change the addresses through the checkout action, naming guest A’s cart',
      attempts: [
        {
          caller: 'guestB',
          probe: action('checkout', 'updateOrderAddresses', [
            a.id,
            {
              shipping_address: address(`${run} Guest B Street`, `GuestB${run}`),
              use_shipping: true,
            },
          ]),
          expected: ownCart(b.id),
        },
      ],
      control: {
        caller: 'guestA',
        probe: action('checkout', 'updateOrderAddresses', [
          a.id,
          { shipping_address: address(secondLine, `GuestA${run}`), use_shipping: true },
        ]),
        expected: ownCart(a.id),
      },
      protectedValues: aSfValues,
      state: stateA,
    })
    await runSf({
      gap: 'G-79',
      title: '4.14 Apply a code through the checkout action, naming guest A’s cart',
      attempts: [
        {
          caller: 'guestB',
          probe: action('checkout', 'applyCode', [a.id, codes[1]]),
          expected: ownCart(b.id),
        },
      ],
      control: {
        caller: 'guestA',
        probe: action('checkout', 'applyCode', [a.id, codes[1]]),
        expected: ownCart(a.id),
      },
      protectedValues: aSfValues,
      state: stateA,
    })
    cartA = await readA()
    const otherRate = unchosen()
    const extraLine = cartA.items.find((item) => item.id !== lineA)?.id as string
    await runSf({
      gap: 'G-79',
      title: "4.15 Choose guest A's delivery rate through the checkout action",
      attempts: [
        {
          caller: 'guestB',
          probe: action('checkout', 'selectDeliveryRate', [
            a.id,
            cartA.fulfillments[0].id,
            otherRate,
          ]),
          expected: refused,
        },
      ],
      control: {
        caller: 'guestA',
        probe: action('checkout', 'selectDeliveryRate', [
          a.id,
          cartA.fulfillments[0].id,
          otherRate,
        ]),
        expected: ownCart(a.id),
      },
      protectedValues: aSfValues,
      state: stateA,
    })
    await runSf({
      gap: 'G-79',
      title: "4.15 Change guest A's item through the cart action",
      attempts: [
        {
          caller: 'guestB',
          probe: action('cart', 'updateCartItem', [lineA, 5]),
          expected: refused,
        },
      ],
      control: {
        caller: 'guestA',
        probe: action('cart', 'updateCartItem', [lineA, 2]),
        expected: ownCart(a.id),
      },
      protectedValues: aSfValues,
      state: stateA,
    })
    await runSf({
      gap: 'G-79',
      title: "4.15 Remove guest A's item through the cart action",
      attempts: [
        { caller: 'guestB', probe: action('cart', 'removeCartItem', [lineA]), expected: refused },
      ],
      control: {
        caller: 'guestA',
        probe: action('cart', 'removeCartItem', [extraLine]),
        expected: ownCart(a.id),
      },
      protectedValues: aSfValues,
      state: stateA,
    })
    await runSf({
      gap: 'G-79',
      title: "4.16 Name customer D's address through the checkout action",
      attempts: [
        {
          caller: 'customerC',
          probe: action(
            'checkout',
            'updateOrderAddresses',
            [c.id, { shipping_address_id: dAddress, billing_address_id: dAddress }],
            checkoutPage(c.id),
          ),
          expected: ownCart(c.id),
        },
      ],
      control: {
        caller: 'customerD',
        probe: action(
          'checkout',
          'updateOrderAddresses',
          [d.id, { shipping_address_id: dAddress, billing_address_id: dAddress }],
          checkoutPage(d.id),
        ),
        expected: ownCart(d.id),
      },
      protectedValues: cValues,
    })

    // The payment and the order, then the placed order's reads.
    const payment = cheque.id as string
    api.push(
      ...(await runCases(request, [
        store('G-79', "4.8 Add a payment to guest A's cart", {
          request: {
            method: 'POST',
            path: `${cartPath}/payments`,
            data: { payment_method_id: payment },
          },
          attempts: both,
          control: { caller: apiA, status: 201 },
          protectedValues: apiValues,
          state: readBack(apiA),
        }),
        store('G-79', "4.9 Place guest A's order", {
          request: { method: 'POST', path: `${cartPath}/complete` },
          attempts: both,
          control: { caller: apiA, status: 200 },
          protectedValues: apiValues,
          state: readBack(apiA),
        }),
      ])),
    )
    putBack.push(await putChequeBack())
    const placed = await send(request, apiA, {
      method: 'GET',
      path: `/api/v3/store/orders/${a.id}`,
    })
    const orderNumber = String((JSON.parse(placed.text) as Json).number ?? '')
    expect(orderNumber.length, "guest A's order has a number").toBeGreaterThan(3)
    // The order ships to the address 4.14's allowed change gave it.
    const orderValues = [orderNumber, aEmailChanged, secondLine, itemA.name]
    api.push(
      ...(await runCases(request, [
        store('G-79', "4.10 Read guest A's placed order", {
          request: { method: 'GET', path: `/api/v3/store/orders/${a.id}` },
          attempts: [
            { caller: apiB, expected: notFound('order_not_found') },
            { caller: apiC, expected: notFound('order_not_found') },
          ],
          control: { caller: apiA, status: 200 },
          protectedValues: [...orderValues, aLine],
          controlCarries: orderValues,
        }),
      ])),
    )
    await runSf({
      gap: 'G-79',
      title: "4.17 Read guest A's placed order through the order placed page's action",
      attempts: ['guestB', 'customerC'].map((caller) => ({
        caller,
        probe: action('checkout', 'getCompletedOrder', [a.id], `${BASE}/order-placed/${a.id}`),
        expected: { result: null },
      })),
      control: {
        caller: 'guestA',
        probe: action('checkout', 'getCompletedOrder', [a.id], `${BASE}/order-placed/${a.id}`),
        expected: { result: { number: orderNumber } },
      },
      protectedValues: [...orderValues, aLine],
      controlCarries: orderValues,
    })

    const all = [...storefrontResults, ...api]
    // The rows each gap closes on, as the record's closure table names them,
    // so 1.2 counts for both G-45 and G-50.
    const gapRows: Record<string, string[]> = {
      'G-45': ['1.1', '1.2', '1.6', '1.7'],
      'G-50': ['1.2', '1.3', '1.4', '1.5'],
      'G-79': Array.from({ length: 17 }, (_, index) => `4.${index + 1}`),
    }
    const gaps = Object.fromEntries(
      Object.entries(gapRows).map(([gap, rowsOf]) => {
        const of = all.filter((item) => rowsOf.includes(item.title.split(' ')[0]))
        return [
          gap,
          {
            rows: rowsOf,
            cases: of.length,
            attempts: of.reduce((sum, item) => sum + item.attempts.length, 0),
            passed: of.filter((item) => item.result === 'PASS').length,
            failed: of.filter((item) => item.result === 'FAIL').map((item) => item.title),
          },
        ]
      }),
    )
    mkdirSync(results, { recursive: true })
    writeFileSync(
      `${results}shoppers.json`,
      JSON.stringify(
        {
          revision,
          storefrontRevision,
          run,
          store: 'default',
          gaps,
          storefront: storefrontResults,
          storeApi: api,
          observations,
          putBack,
        },
        null,
        2,
      ),
    )
    expect(
      putBack.filter((item) => !item.restored),
      'every setting the run changed was put back',
    ).toEqual([])
    expect(
      all
        .filter((item) => item.result === 'FAIL')
        .map((item) => ({ title: item.title, failures: item.failures })),
      'every case passed',
    ).toEqual([])
  } finally {
    await putChequeBack()
    for (const context of Object.values(contexts)) await context.dispose()
  }
})
