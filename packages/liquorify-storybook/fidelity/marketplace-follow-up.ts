import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, type Page, request, test } from '@playwright/test'
import type { Json } from './orders'
import { admin } from './staff'

/**
 * The marketplace follow-up's browser checks (work item `fb-19-batch-marketplace.md`
 * §11): the operator's 14 behaviours of G-105 (`marketplace-operator.spec.ts`) and
 * the seller panel's 16 of G-114 (`marketplace-seller.spec.ts`).
 *
 * Every record a check needs is made here, by the run, through the Admin, Seller
 * and Store APIs, named with the run's stamp: sellers invited by the operator and
 * accepted by their member, taken through onboarding and approved, their products
 * submitted and approved, and guest purchases. Nothing is written to the database
 * directly, and nothing a check reads was left by another run.
 *
 * With `MARKETPLACE_SABOTAGE=1` every check is marked as expected to fail, and
 * each changes what the application does or what the server serves before it
 * looks (see `sabotage`). Its assertions stay exactly as they are.
 */

export const API = process.env.MARKETPLACE_API_URL ?? 'http://localhost:3010'
export const SELLER_PANEL = process.env.MARKETPLACE_SELLER_URL ?? 'http://localhost:5175'
export const PASSWORD = 'fidelity-seller-123'
export const SABOTAGE = process.env.MARKETPLACE_SABOTAGE === '1'
export const run = process.env.MARKETPLACE_RUN ?? Date.now().toString(36)
const revision = process.env.FIDELITY_REVISION ?? null
const logo = new URL('./marketplace-logo.png', import.meta.url).pathname

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

let counter = 0
/** A name no other record of this run or any other run has. */
export const unique = (label: string) => `${label} ${run}-${++counter}`
export const emailFor = (label: string) =>
  `${label.toLowerCase().replace(/[^a-z0-9]+/g, '.')}.${run}.${++counter}@example.com`

export type Headers = Record<string, string>

export class Api {
  constructor(
    readonly context: APIRequestContext,
    private adminHeaders: Headers,
  ) {}

  static async open() {
    const context = await request.newContext({ baseURL: API })
    const { headers } = await admin(context)
    return new Api(context, headers)
  }

  /**
   * Sends as `as`, or as the admin. The admin's session is short-lived and a
   * run outlasts it, so a refused admin request signs in again once.
   */
  private async request(
    method: 'get' | 'post' | 'patch' | 'delete',
    path: string,
    data?: object,
    as?: Headers,
  ) {
    const sendOnce = () =>
      this.context[method](`/api/v3/${path}`, { headers: as ?? this.adminHeaders, data })
    const res = await sendOnce()
    if (as || res.status() !== 401) return res
    this.adminHeaders = (await admin(this.context)).headers
    return sendOnce()
  }

  async send(
    method: 'get' | 'post' | 'patch' | 'delete',
    path: string,
    data?: object,
    as?: Headers,
  ) {
    const res = await this.request(method, path, data, as)
    const text = await res.text()
    expect(res.ok(), `${method.toUpperCase()} ${path}: ${res.status()} ${text}`).toBeTruthy()
    return (text ? JSON.parse(text) : {}) as Json
  }

  /** Like `send`, but keeps a refusal instead of failing on it. */
  async answer(
    method: 'get' | 'post' | 'patch' | 'delete',
    path: string,
    data?: object,
    as?: Headers,
  ) {
    const res = await this.request(method, path, data, as)
    const text = await res.text()
    let body: unknown = text
    try {
      body = text ? JSON.parse(text) : {}
    } catch {
      /* kept as text */
    }
    return { status: res.status(), body: body as Json }
  }

  admin(method: 'get' | 'post' | 'patch' | 'delete', path: string, data?: object) {
    return this.send(method, `admin/${path}`, data)
  }

  rows = async (path: string, as?: Headers) =>
    ((await this.send('get', path, undefined, as)).data ?? []) as Json[]

  async sellerSignIn(email: string, sellerId: string): Promise<Headers> {
    const { token } = await this.send(
      'post',
      'seller/auth/login',
      { email, password: PASSWORD },
      {},
    )
    return { Authorization: `Bearer ${token}`, 'X-Spree-Seller-Id': sellerId }
  }

  async upload(as: Headers, name = 'logo.png') {
    const res = await this.context.post('/api/v3/seller/files', {
      headers: as,
      multipart: {
        filename: name,
        content_type: 'image/png',
        file: { name, mimeType: 'image/png', buffer: readFileSync(logo) },
      },
    })
    expect(res.ok(), `upload: ${res.status()} ${await res.text()}`).toBeTruthy()
    return ((await res.json()) as Json).signed_id as string
  }

  async dispose() {
    await this.context.dispose()
  }
}

export interface Seller {
  id: string
  name: string
  email: string
  headers: Headers
  location: string
  profile: string
}

/**
 * A seller in the supported lifecycle: created and invited by the operator,
 * the invitation accepted by its first member, who then works the checklist
 * through the Seller API up to `until`.
 */
export async function seller(
  api: Api,
  label: string,
  until: 'invited' | 'onboarding' | 'met' | 'ready_for_review' | 'approved' = 'approved',
  options: { member?: string; terms?: boolean } = {},
): Promise<Seller> {
  const { member, terms = true } = options
  const name = unique(label)
  const email = member ?? emailFor(label)
  const created = await api.admin('post', 'sellers', { name, contact_email: email })
  const id = created.id as string
  await api.admin('post', `sellers/${id}/invite`, { email })
  const base = { id, name, email, headers: {}, location: '', profile: '' }
  if (until === 'invited') return base
  const [invitation] = await api.rows(`admin/sellers/${id}/invitations`)
  const link = await api.admin('get', `sellers/${id}/invitations/${invitation.id}/acceptance_link`)
  const token = new URL(link.acceptance_url as string).searchParams.get('token')
  const accepted = await api.send(
    'post',
    `seller/auth/invitations/${invitation.id}/accept?token=${token}`,
    { password: PASSWORD, password_confirmation: PASSWORD, first_name: 'Ola', last_name: label },
    {},
  )
  const headers = { Authorization: `Bearer ${accepted.token}`, 'X-Spree-Seller-Id': id }
  const [general] = (await api.rows('seller/delivery_profiles', headers)).filter(
    (each) => each.name === 'General',
  )
  const result = { ...base, headers, profile: general?.id as string }
  if (until === 'onboarding') return result

  const signed = await api.upload(headers)
  await api.send(
    'patch',
    'seller/profile',
    {
      ...(terms && { accept_terms: true }),
      about: `${label}: small-batch spirits.`,
      logo_signed_id: signed,
      billing_address: { ...shopperAddress, company: name, address1: '2 Wharf Road' },
    },
    headers,
  )
  const location = await api.send(
    'post',
    'seller/stock_locations',
    {
      name: `${name} warehouse`,
      default: true,
      returns_enabled: true,
      address1: '2 Wharf Road',
      city: 'Portland',
      zipcode: '97205',
      phone: '5035550100',
      country_code: 'US',
      state_code: 'OR',
    },
    headers,
  )
  result.location = location.id as string
  await api.send(
    'post',
    'seller/package_types',
    {
      name: 'Six-bottle case',
      kind: 'box',
      length: 12,
      width: 8,
      height: 14,
      weight: 2,
      default: true,
    },
    headers,
  )
  await api.send(
    'post',
    'seller/delivery_methods',
    {
      name: `${name} courier`,
      delivery_profile_id: result.profile,
      storefront_visible: true,
      calculator: { type: 'flat_rate', preferences: { amount: '6.50' } },
    },
    headers,
  )
  await product(api, result, 'Starter bottle', { submit: false })
  if (until === 'met') return result
  await api.send('post', 'seller/onboarding/submit_for_review', {}, headers)
  if (until === 'ready_for_review') return result
  const approved = await api.admin('patch', `sellers/${id}/approve`, {})
  expect(approved.status).toBe('approved')
  return result
}

/**
 * A seller's product with stock at its own location. `submit` sends it for
 * review; `approve` has the operator approve it and list it on the store's
 * online channel, which approving alone does not do (SD-61).
 */
export async function product(
  api: Api,
  owner: Seller,
  label: string,
  options: { submit?: boolean; approve?: boolean; price?: string } = {},
) {
  const { submit = true, approve = false, price = '32.00' } = options
  const name = `${owner.name} ${label}`
  const created = await api.send(
    'post',
    'seller/products',
    {
      name,
      delivery_profile_id: owner.profile,
      prices: [{ currency: 'USD', amount: price }],
    },
    owner.headers,
  )
  const variant = created.default_variant_id as string
  if (owner.location) {
    await api.send(
      'patch',
      `seller/products/${created.id}`,
      {
        variants: [
          { id: variant, stock_levels: [{ stock_location_id: owner.location, count_on_hand: 50 }] },
        ],
      },
      owner.headers,
    )
  }
  if (submit) await api.send('patch', `seller/products/${created.id}/submit`, {}, owner.headers)
  if (approve) {
    await api.admin('patch', `products/${created.id}/approve`, {})
    const [online] = (await api.rows('admin/channels')).filter((each) => each.code === 'online')
    await api.admin('post', 'products/bulk_add_to_channels', {
      ids: [created.id],
      channel_ids: [online.id],
    })
  }
  return { id: created.id as string, variant, name }
}

let publishable: string | undefined
let cheque: string | undefined

/** The storefront's headers: the store's publishable key, as a shopper's browser sends it. */
export async function shopper(api: Api): Promise<Headers> {
  if (!publishable) {
    const keys = await api.rows('admin/api_keys?limit=100')
    const key = keys.find(
      (each) => each.key_type === 'publishable' && !each.channel_id && !each.revoked_at,
    )
    publishable = (await api.admin('get', `api_keys/${key?.id}`)).plaintext_token as string
  }
  return { 'X-Spree-API-Key': publishable }
}

/** A guest's purchase through the Store API, paid by cheque. */
export async function purchase(api: Api, variants: string[], email = emailFor('guest')) {
  const shopperHeaders = await shopper(api)
  if (!cheque) {
    const methods = await api.rows('admin/payment_methods?limit=100')
    cheque = (methods.find((each) => each.type === 'check' && each.active)?.id ??
      (
        await api.admin('post', 'payment_methods', {
          name: 'Cheque',
          type: 'check',
          active: true,
          storefront_visible: true,
        })
      ).id) as string
  }
  const cart = await api.send('post', 'store/carts', {}, shopperHeaders)
  const inCart = { ...shopperHeaders, 'X-Spree-Token': cart.token as string }
  for (const variant of variants)
    await api.send(
      'post',
      `store/carts/${cart.id}/items`,
      { variant_id: variant, quantity: 1 },
      inCart,
    )
  await api.send(
    'patch',
    `store/carts/${cart.id}`,
    { email, shipping_address: shopperAddress, billing_address: shopperAddress },
    inCart,
  )
  await api.send('post', `store/carts/${cart.id}/payments`, { payment_method_id: cheque }, inCart)
  const placed = await api.send('post', `store/carts/${cart.id}/complete`, {}, inCart)
  const orders = ((placed.orders as Json[] | undefined) ?? [placed]).map(
    (each) => each.id as string,
  )
  return { placed, orders, email }
}

/** The order of `owner` among a purchase's orders. */
export async function orderOf(api: Api, orders: string[], owner: Seller) {
  for (const id of orders) {
    const order = await api.admin('get', `orders/${id}`)
    if (order.seller_id === owner.id) return order
  }
  throw new Error(`no order of ${owner.name} in ${orders.join(', ')}`)
}

/** What each check saw and read, written beside its captures. */
export class Record {
  private readonly entries: { step: string; status?: number; body: unknown }[] = []
  readonly folder: string

  constructor(
    readonly area: string,
    readonly check: string,
  ) {
    this.folder = new URL(
      `./results/marketplace-follow-up/${area}/${check}/`,
      import.meta.url,
    ).pathname
    mkdirSync(this.folder, { recursive: true })
  }

  /** Adds a step and writes the record at once, so a check that fails later keeps what it read. */
  note(step: string, body: unknown, status?: number) {
    this.entries.push({ step, status, body: redact(body) })
    this.save()
  }

  async shot(page: Page, step: string) {
    await page.screenshot({ path: `${this.folder}${step}.png`, fullPage: true })
  }

  save() {
    writeFileSync(
      `${this.folder}record.json`,
      JSON.stringify(
        { revision, run, sabotage: SABOTAGE, check: this.check, entries: this.entries },
        null,
        2,
      ),
    )
  }
}

function redact(body: unknown): unknown {
  if (Array.isArray(body)) return body.map(redact)
  if (body && typeof body === 'object') {
    return Object.fromEntries(
      Object.entries(body).map(([key, value]) =>
        /token|secret|password|signed_id/i.test(key) ? [key, '[masked]'] : [key, redact(value)],
      ),
    )
  }
  if (typeof body === 'string')
    return body.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, '<site>')
  return body
}

/**
 * The deliberate failure for one check: with `MARKETPLACE_SABOTAGE=1`, marks
 * the check as expected to fail and runs `alter`, which changes what the
 * application does or what the server serves. Without it, does nothing.
 */
export async function sabotage(page: Page, alter: (page: Page) => Promise<void>) {
  if (!SABOTAGE) return
  test.fail(true, 'deliberate failure: the application or the served state is altered')
  await alter(page)
}

/** Answers matching requests with an empty success, so the server never sees them. */
export const standIn =
  (pattern: RegExp, method = 'PATCH', body: object = {}) =>
  async (page: Page) => {
    await page.route(
      (url) => pattern.test(url.pathname),
      async (route) => {
        if (route.request().method() !== method) return route.fallback()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(body),
        })
      },
    )
  }

/** Rewrites what the server answers to matching reads. */
export const altered = (pattern: RegExp, change: (body: Json) => Json) => async (page: Page) => {
  await page.route(
    (url) => pattern.test(url.pathname),
    async (route) => {
      if (route.request().method() !== 'GET') return route.fallback()
      const response = await route.fetch()
      const json = (await response.json()) as Json
      await route.fulfill({ response, json: change(json) })
    },
  )
}

/** Blocks and lists every request that would leave this machine. */
export async function blockOutside(page: Page): Promise<string[]> {
  const outside: string[] = []
  await page.context().route(
    (url) =>
      !['data:', 'blob:', 'about:'].includes(url.protocol) &&
      !['localhost', '127.0.0.1'].includes(url.hostname),
    (route) => {
      outside.push(route.request().url())
      return route.abort()
    },
  )
  return outside
}

export const dialog = (page: Page) =>
  page.getByRole('alertdialog').or(page.getByRole('dialog')).first()

export const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()

/** Signs in through the dashboard's sign-in form, as the browser tests' admin. */
export async function adminSignIn(page: Page, email = 'admin@example.com', password = 'spree123') {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await expect(page).toHaveURL(/\/store_[^/]+/, { timeout: 20_000 })
  return new URL(page.url()).pathname.split('/')[1]
}

/** Signs in through the seller panel's sign-in form. */
export async function sellerPanelSignIn(page: Page, email: string, password = PASSWORD) {
  await page.goto(`${SELLER_PANEL}/login`)
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
}
