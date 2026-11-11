import { createHmac } from 'node:crypto'
import { type APIRequestContext, expect, request } from '@playwright/test'
import { type Seed, stamp } from './p9'
import { address, named, type Product, rated } from './p11-orders'

/**
 * What the platform batch's step P4 scripts share: the sandbox APIs, the
 * Store API checkout a shopper's storefront makes, and the run's records.
 *
 * The sandbox keys never reach these scripts or the server. The environment's
 * proxy adds them to every request to `api.stripe.com` and `api.easypost.com`,
 * so each request here carries a placeholder the proxy replaces. Requests
 * leave through the proxy the environment names (`HTTPS_PROXY`), and Node
 * trusts its certificates through `NODE_EXTRA_CA_CERTS`.
 */

export const p4Named = (name: string) => `P4 ${name} ${stamp}`

const PLACEHOLDER_STRIPE_KEY = 'sk_test_placeholder'
export const placeholderStripeKeys = {
  publishable_key: 'pk_test_placeholder',
  secret_key: PLACEHOLDER_STRIPE_KEY,
}

type Json = Record<string, unknown>

async function outside(baseURL: string, authorization: string) {
  return request.newContext({
    baseURL,
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
    extraHTTPHeaders: { Authorization: authorization },
  })
}

/** Stripe's test-mode API. Bodies are form-encoded, as Stripe takes them. */
export async function stripe() {
  const api = await outside(
    'https://api.stripe.com',
    `Basic ${Buffer.from(`${PLACEHOLDER_STRIPE_KEY}:`).toString('base64')}`,
  )
  const call = async <R = Json>(method: string, path: string, form?: Record<string, string>) => {
    const res = await api.fetch(`/v1/${path}`, { method, form })
    const body = (await res.json()) as Json
    expect(res.ok(), `Stripe ${method} ${path}: ${JSON.stringify(body.error ?? body)}`).toBeTruthy()
    expect(body.livemode ?? false, 'Stripe answered in test mode').toBe(false)
    return body as R
  }
  return {
    get: <R = Json>(path: string) => call<R>('GET', path),
    post: <R = Json>(path: string, form: Record<string, string> = {}) =>
      call<R>('POST', path, form),
    delete: <R = Json>(path: string) => call<R>('DELETE', path),
    /** A request whose refusal is the answer: returns Stripe's status and body. */
    raw: async (method: string, path: string, form?: Record<string, string>) => {
      const res = await api.fetch(`/v1/${path}`, { method, form })
      return { status: res.status(), body: (await res.json()) as Json }
    },
    dispose: () => api.dispose(),
  }
}

export type Stripe = Awaited<ReturnType<typeof stripe>>

const PLACEHOLDER_EASYPOST_KEY = 'EZTK_placeholder'
export const placeholderEasyPostKey = PLACEHOLDER_EASYPOST_KEY

/** EasyPost's test-mode API, to read what Spree bought and make test trackers. */
export async function easyPost() {
  const api = await outside(
    'https://api.easypost.com',
    `Basic ${Buffer.from(`${PLACEHOLDER_EASYPOST_KEY}:`).toString('base64')}`,
  )
  const call = async <R = Json>(method: string, path: string, data?: object) => {
    // EasyPost's test mode limits how fast an account may call it; a limited
    // call is retried after a pause rather than failing the check.
    let res = await api.fetch(`/v2/${path}`, { method, data })
    for (let wait = 15_000; res.status() === 429 && wait <= 120_000; wait *= 2) {
      await new Promise((resolve) => setTimeout(resolve, wait))
      res = await api.fetch(`/v2/${path}`, { method, data })
    }
    const body = (await res.json()) as Json
    expect(
      res.ok(),
      `EasyPost ${method} ${path}: ${JSON.stringify(body.error ?? body)}`,
    ).toBeTruthy()
    expect(body.mode ?? 'test', 'EasyPost answered in test mode').toBe('test')
    return body as R
  }
  return {
    get: <R = Json>(path: string) => call<R>('GET', path),
    post: <R = Json>(path: string, data: object) => call<R>('POST', path, data),
    dispose: () => api.dispose(),
  }
}

export type EasyPost = Awaited<ReturnType<typeof easyPost>>

/**
 * Relays an event EasyPost sent, or would send, to the integration's webhook
 * endpoint, signed with the integration's webhook secret as EasyPost signs it.
 * The server is not reachable from EasyPost, so P4 relays; the record labels
 * each relayed event as relayed.
 */
export async function relayEasyPost(
  baseURL: string,
  integrationId: string,
  secret: string,
  event: object,
) {
  const body = JSON.stringify(event)
  const signature = createHmac('sha256', secret.normalize('NFKD')).update(body).digest('hex')
  const api = await request.newContext({ baseURL })
  const res = await api.post(`/api/v3/webhooks/fulfillments/${integrationId}`, {
    data: body,
    headers: {
      'Content-Type': 'application/json',
      'X-Hmac-Signature': `hmac-sha256-hex=${signature}`,
    },
  })
  const status = res.status()
  await api.dispose()
  return status
}

/** Removes the Stripe webhook endpoints Spree registered for this payment method. */
export async function removeWebhookEndpoints(stripeApi: Stripe, paymentMethodId: string) {
  const { data } = await stripeApi.get<{ data: { id: string; url: string }[] }>(
    'webhook_endpoints?limit=100',
  )
  const ours = data.filter((endpoint) => endpoint.url.includes(paymentMethodId))
  for (const endpoint of ours) await stripeApi.delete(`webhook_endpoints/${endpoint.id}`)
  return ours.map((endpoint) => endpoint.url)
}

/** The storefront's publishable key, read as the admin. */
export async function publishableKey(seed: Seed) {
  const keys = await seed.get<{
    data: { id: string; key_type: string; channel_id: string | null; revoked_at: string | null }[]
  }>('api_keys?limit=50')
  const id = keys.data.find(
    (key) => key.key_type === 'publishable' && !key.channel_id && !key.revoked_at,
  )?.id
  expect(id, "the storefront's publishable key").toBeTruthy()
  return (await seed.get<{ plaintext_token: string }>(`api_keys/${id}`)).plaintext_token
}

/** A Stripe payment method on the store, made through the Admin API. */
export async function stripeMethod(seed: Seed, label: string, extra: Json = {}) {
  return seed.post<{ id: string; name: string }>('payment_methods', {
    type: 'stripe',
    name: p4Named(label),
    active: true,
    storefront_visible: true,
    preferences: placeholderStripeKeys,
    ...extra,
  })
}

export interface Cart {
  id: string
  token: string
  total: string
  number: string
}

/**
 * A guest's cart for one unit of the product, with an address and the first
 * delivery rate chosen, through the Store API as the storefront sends it.
 */
export async function cartFor(baseURL: string, key: string, product: Product, email: string) {
  const api = await request.newContext({ baseURL, extraHTTPHeaders: { 'X-Spree-API-Key': key } })
  const call = async <R = Json>(method: string, path: string, token?: string, data?: object) => {
    const res = await api.fetch(`/api/v3/store/${path}`, {
      method,
      data,
      headers: token ? { 'X-Spree-Token': token } : {},
    })
    const text = await res.text()
    return { status: res.status(), body: (text ? JSON.parse(text) : {}) as R & Json }
  }
  const ok = async <R = Json>(method: string, path: string, token?: string, data?: object) => {
    const answer = await call<R>(method, path, token, data)
    expect(answer.status, `${method} ${path}: ${JSON.stringify(answer.body)}`).toBeLessThan(300)
    return answer.body
  }
  const created = await ok<{ id: string; token: string }>('POST', 'carts', undefined, {
    items: [{ variant_id: product.variantId, quantity: 1 }],
  })
  const token = created.token
  await ok('PATCH', `carts/${created.id}`, token, {
    email,
    shipping_address: address,
    use_shipping: true,
  })
  const withRates = await ok<{
    fulfillments: { id: string; delivery_rates: { id: string }[] }[]
  }>('GET', `carts/${created.id}?expand=fulfillments`, token)
  for (const fulfillment of withRates.fulfillments ?? []) {
    expect(fulfillment.delivery_rates.length, 'a delivery rate to choose').toBeGreaterThan(0)
    await ok('PATCH', `carts/${created.id}/fulfillments/${fulfillment.id}`, token, {
      selected_delivery_rate_id: fulfillment.delivery_rates[0].id,
    })
  }
  const current = await ok<{ total: string; number: string }>('GET', `carts/${created.id}`, token)
  return {
    cart: { id: created.id, token, total: current.total, number: current.number } as Cart,
    call,
    ok,
    dispose: () => api.dispose(),
  }
}

/** A product with flat delivery rates for the US, as P11's `rated` makes it. */
export async function ratedProduct(seed: Seed, label: string, baseURL: string) {
  const channels = await seed.get<{ data: { id: string; default: boolean }[] }>('channels?limit=20')
  const online = channels.data.find((channel) => channel.default)
  expect(online, "the store's default channel").toBeTruthy()
  return rated(seed, `P4 ${label}`, baseURL, {
    product_publications: [{ channel_id: online?.id }],
  })
}

export { named }

/** Waits until `read` returns a value, polling every two seconds. */
export async function eventually<T>(read: () => Promise<T | undefined>, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const value = await read()
    if (value !== undefined) return value
    await new Promise((resolve) => setTimeout(resolve, 2_000))
  }
  return undefined
}

export type { APIRequestContext }
