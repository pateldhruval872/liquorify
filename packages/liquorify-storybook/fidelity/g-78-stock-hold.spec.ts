import { mkdirSync, writeFileSync } from 'node:fs'
import { createServer, request as forwardTo, type Server } from 'node:http'
import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  expect,
  type Locator,
  type Page,
  request,
  test,
} from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { animationsFinished } from './animations'
import { deleteProductsNamed } from './catalog'
import { locationNames } from './inventory'
import { admin } from './staff'

/**
 * G-78's check, as the owner approved it on 2026-11-04 for batch 6: stock held
 * by one shopper's checkout, and a second shopper refused it on the running
 * storefront, at the storefront's two widths, with what the server answered.
 *
 * Before running, start Spree's browser-test server (`E2E_RAILS_PORT`, 3010
 * by default) and the built dashboard on port 5174, as `compare.spec.ts`
 * describes, and the storefront, built for production at the revision under
 * test with that server's default publishable key, on port 3001
 * (`STOREFRONT_URL`), started with `SPREE_API_URL=http://localhost:3012`. That
 * is a proxy this script opens in front of the server, which records the
 * Store API's answer to each cart request the storefront sends. Set
 * `FIDELITY_REVISION` and `STOREFRONT_REVISION` to record both revisions.
 *
 * One fresh product, "Fidelity stoneware teapot", is added through the Admin
 * API on the store's online channel, with a stock level at the shop location
 * only, at 0, so a hold left by an earlier run cannot count. Each width then:
 *   1. the admin sets the shop location's on-hand count to 1 on the inventory
 *      list (DA-INV-01), with the reason Count;
 *   2. a second shopper adds the teapot to their cart;
 *   3. a first shopper adds it and enters checkout as a guest, giving an email
 *      and an address, which is when Spree holds stock for a cart;
 *   4. the inventory list shows the unit reserved;
 *   5. a third shopper opens the teapot's page, and adds it;
 *   6. the second shopper goes to checkout from their cart.
 * Afterwards the first shopper's item is removed through the Store API, which
 * gives the hold back, and the count is set to 0 again. The product is
 * deleted at the end. No order is placed and
 * nothing is paid. The browser-test data offers no delivery method for a
 * physical item, so checkout lists no rate; the hold does not depend on one.
 *
 * Each step is saved as `results/g-78/<width>/<step>.png`, with `answers.json`:
 * the stock level as the Admin API read it after each step, what each page
 * said, and the Store API's answers to the shoppers' cart requests. Keys and
 * cart tokens are never written out.
 */

const storefront = process.env.STOREFRONT_URL ?? 'http://localhost:3001'
const backend = `http://localhost:${process.env.E2E_RAILS_PORT ?? '3010'}`
const proxyPort = 3012
const results = new URL('./results/g-78/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const storefrontRevision = process.env.STOREFRONT_REVISION ?? null
const name = 'Fidelity stoneware teapot'
const sku = 'FID-TEAPOT'
const shopPath = '/us/en'

const widths = {
  desktop: { width: 1280, height: 960 },
  phone: { width: 390, height: 844 },
} as const

const firstShopper = {
  email: 'avery.lin@example.com',
  firstName: 'Avery',
  lastName: 'Lin',
  address: '12 Cedar Lane',
  city: 'Albany',
  state: 'New York',
  zip: '12207',
}
const secondShopper = {
  email: 'noor.haddad@example.com',
  firstName: 'Noor',
  lastName: 'Haddad',
  address: '480 Linden Avenue',
  city: 'Rochester',
  state: 'New York',
  zip: '14620',
}
type Shopper = typeof firstShopper

interface Level {
  count_on_hand: number
  reserved_count: number
  available_count: number
}

/** A cart request the storefront sent, and what the Store API answered. */
interface CartAnswer {
  method: string
  path: string
  status: number
  /** The answer's warnings and items, or its error; nothing else is kept. */
  body: unknown
}

interface Answers {
  revision: string | null
  storefrontRevision: string | null
  width: keyof typeof widths
  product: { name: string; sku: string; slug: string }
  steps: { step: string; level: Level; said?: string; url?: string }[]
  /** The Store API's answer to the product while the first checkout held it. */
  productWhileHeld?: { status: number; in_stock: unknown; purchasable: unknown }
  carts: { first: CartAnswer[]; second: CartAnswer[]; third: CartAnswer[] }
}

const recorded: CartAnswer[] = []

const kept = (body: Record<string, unknown> | null) => {
  if (!body) return null
  if ('error' in body) return { error: body.error }
  return {
    warnings: body.warnings,
    total_quantity: body.total_quantity,
    email: body.email ? '<set>' : null,
    items: Array.isArray(body.items)
      ? body.items.map((item: { name?: string; quantity?: number }) => ({
          name: item.name,
          quantity: item.quantity,
        }))
      : undefined,
  }
}

/** Forwards the storefront's requests to the server, keeping each cart answer. */
function startProxy(): Promise<Server> {
  const target = new URL(backend)
  const server = createServer((incoming, outgoing) => {
    const path = incoming.url ?? ''
    const upstream = forwardTo(
      {
        host: target.hostname,
        port: target.port,
        path,
        method: incoming.method,
        headers: { ...incoming.headers, host: target.host },
      },
      (answer) => {
        const chunks: Buffer[] = []
        answer.on('data', (chunk: Buffer) => chunks.push(chunk))
        answer.on('end', () => {
          const raw = Buffer.concat(chunks)
          if (/^\/api\/v3\/store\/carts(\/|\?|$)/.test(path)) {
            let body: Record<string, unknown> | null = null
            try {
              body = JSON.parse(raw.toString('utf8'))
            } catch {
              body = null
            }
            recorded.push({
              method: incoming.method ?? '',
              path: path.split('?')[0],
              status: answer.statusCode ?? 0,
              body: kept(body),
            })
          }
          outgoing.writeHead(answer.statusCode ?? 502, answer.headers)
          outgoing.end(raw)
        })
      },
    )
    upstream.on('error', () => outgoing.destroy())
    incoming.pipe(upstream)
  })
  return new Promise((resolve) => server.listen(proxyPort, () => resolve(server)))
}

async function adminApi(api: APIRequestContext) {
  const { headers } = await admin(api)
  const path = (rest: string) => `/api/v3/admin/${rest}`
  const ok = async (response: Awaited<ReturnType<APIRequestContext['get']>>, what: string) => {
    expect(response.ok(), `${what}: ${response.status()} ${await response.text()}`).toBeTruthy()
    return response.json()
  }
  return {
    get: async (rest: string) => ok(await api.get(path(rest), { headers }), `GET ${rest}`),
    post: async (rest: string, data: object) =>
      ok(await api.post(path(rest), { headers, data }), `POST ${rest}`),
    patch: async (rest: string, data: object) =>
      ok(await api.patch(path(rest), { headers, data }), `PATCH ${rest}`),
  }
}

let shopLocationId = ''
let onlineChannelId = ''
let publishableKey = ''
let server: Server
let slug = ''

/** The shop location's stock level for the teapot, as the Admin API reads it. */
async function level(api: APIRequestContext): Promise<Level & { id: string }> {
  const client = await adminApi(api)
  const list = (await client.get(
    `stock_levels?q[variant_sku_eq]=${sku}&q[stock_location_id_eq]=${shopLocationId}&limit=5`,
  )) as { data: (Level & { id: string; stock_location_name: string })[] }
  const found = list.data.find((row) => row.stock_location_name === locationNames.shop)
  expect(found, "the teapot's stock level at the shop location").toBeTruthy()
  return found as Level & { id: string }
}

const figures = ({ count_on_hand, reserved_count, available_count }: Level): Level => ({
  count_on_hand,
  reserved_count,
  available_count,
})

/**
 * A fresh teapot on the online channel, at 0 in the shop location only. Its
 * address is new on each run, because the storefront keeps a product page it
 * has shown for ten minutes, and a page kept from an earlier run's teapot would
 * offer that teapot's deleted variant.
 */
async function freshProduct(api: APIRequestContext, baseURL: string) {
  await deleteProductsNamed(baseURL, name)
  const client = await adminApi(api)
  const product = (await client.post('products', {
    name,
    slug: `fidelity-stoneware-teapot-${Date.now().toString(36)}`,
    status: 'active',
    prices: [{ amount: '40.00', currency: 'USD' }],
    product_publications: [{ channel_id: onlineChannelId }],
  })) as { id: string; slug: string; default_variant_id: string }
  await client.patch(`products/${product.id}/variants/${product.default_variant_id}`, { sku })
  await client.post('stock_levels/bulk_upsert', {
    stock_levels: [
      {
        variant_id: product.default_variant_id,
        stock_location_id: shopLocationId,
        count_on_hand: 0,
        backorderable: false,
      },
    ],
  })
  const shown = await api.get(`/api/v3/store/products/${product.slug}`, {
    headers: { 'X-Spree-API-Key': publishableKey },
  })
  expect(shown.status(), 'the Store API shows the teapot on the storefront key').toBe(200)
  return product.slug
}

/** What the page's alerts, toasts and field errors said. */
async function said(page: Page) {
  const texts = (
    await page
      .locator('[role=alert], [role=status], [data-sonner-toast], [aria-invalid=true] ~ p')
      .filter({ visible: true })
      .allInnerTexts()
  )
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  return texts.length
    ? `The page said: ${texts.map((text) => `"${text}"`).join(', ')}.`
    : 'The page showed no alert, status, toast or field error.'
}

async function hydrated(locator: Locator) {
  await expect(locator).toBeVisible({ timeout: 30_000 })
  await expect
    .poll(
      () =>
        locator.evaluate((element) =>
          Object.keys(element).some((key) => key.startsWith('__reactFiber')),
        ),
      { timeout: 30_000 },
    )
    .toBe(true)
}

const cartDrawer = (page: Page) => page.getByRole('dialog', { name: /^cart/i })
const shippingHeading = (page: Page) => page.getByRole('heading', { name: 'Shipping Method' })

/** Adds the teapot from its page; the cart drawer opens and lists it. */
async function addToCart(page: Page, slug: string) {
  await page.goto(`${storefront}${shopPath}/products/${slug}`)
  const button = page.getByRole('button', { name: /add to cart/i })
  await hydrated(button)
  await expect(button).toBeEnabled({ timeout: 10_000 })
  await button.click()
  await expect(cartDrawer(page).getByRole('link', { name }).first()).toBeVisible({
    timeout: 30_000,
  })
}

/** The checkout address in the cart drawer's Checkout link; it ends with the cart's ID. */
async function checkoutLink(page: Page) {
  const href = await cartDrawer(page)
    .getByRole('link', { name: /^checkout$/i })
    .getAttribute('href')
  expect(href, 'the cart drawer has a Checkout link').toBeTruthy()
  return href as string
}

/**
 * A guest's email and shipping address, as the storefront's own checkout
 * captures fill them (`visual/fidelity/checkout-run.ts` in the storefront).
 * Checkout saves them when focus leaves the form.
 */
async function enterCheckout(page: Page, shopper: Shopper) {
  const email = page.getByPlaceholder('Email address')
  await hydrated(email)
  await email.fill(shopper.email)
  await page.getByLabel('Country', { exact: true }).selectOption({ label: 'United States' })
  await page.getByLabel('First name').first().fill(shopper.firstName)
  await page.getByLabel('Last name').first().fill(shopper.lastName)
  await page.getByLabel('Address', { exact: true }).first().fill(shopper.address)
  await page.getByLabel('City').first().fill(shopper.city)
  await page.getByLabel('ZIP / Postal code').first().fill(shopper.zip)
  await page.getByLabel('State / Province').first().selectOption({ label: shopper.state })
  await shippingHeading(page).click()
  await page.waitForLoadState('networkidle')
}

/** The cart token the storefront keeps for a guest, read from its own cookie. */
async function cartToken(context: BrowserContext) {
  const cookie = (await context.cookies(storefront)).find(
    (each) => each.name === '_spree_cart_token',
  )
  expect(cookie, "the storefront's cart cookie").toBeTruthy()
  return cookie?.value as string
}

async function shopperPage(browser: Browser, viewport: (typeof widths)[keyof typeof widths]) {
  const context = await browser.newContext({ viewport, locale: 'en-US', timezoneId: 'UTC' })
  return { context, page: await context.newPage() }
}

test.describe.configure({ mode: 'serial' })
test.setTimeout(10 * 60_000)

test.beforeAll(async ({ baseURL }) => {
  server = await startProxy()
  const context = await request.newContext({ baseURL })
  try {
    const client = await adminApi(context)
    const keys = (await client.get('api_keys?limit=50')) as {
      data: { id: string; key_type: string; channel_id: string | null; revoked_at: string | null }[]
    }
    const keyId = keys.data.find(
      (key) => key.key_type === 'publishable' && !key.channel_id && !key.revoked_at,
    )?.id
    expect(keyId, "the storefront's publishable key").toBeTruthy()
    publishableKey = ((await client.get(`api_keys/${keyId}`)) as { plaintext_token: string })
      .plaintext_token
    const locations = (await client.get('stock_locations?limit=20')) as {
      data: { id: string; name: string }[]
    }
    shopLocationId = locations.data.find((location) => location.name === locationNames.shop)
      ?.id as string
    const channels = (await client.get('channels?limit=20')) as {
      data: { id: string; default: boolean }[]
    }
    onlineChannelId = channels.data.find((channel) => channel.default)?.id as string
    expect(onlineChannelId, "the store's default channel").toBeTruthy()
    slug = await freshProduct(context, baseURL ?? 'http://localhost:5174')
  } finally {
    await context.dispose()
  }
})

test.afterAll(async ({ baseURL }) => {
  await deleteProductsNamed(baseURL ?? 'http://localhost:5174', name)
  await new Promise((resolve) => server.close(resolve))
})

for (const width of Object.keys(widths) as (keyof typeof widths)[]) {
  test(`G-78 at ${width} width`, async ({ page, browser }) => {
    const folder = `${results}${width}/`
    mkdirSync(folder, { recursive: true })
    expect((await level(page.request)).reserved_count, 'no hold left from the last width').toBe(0)
    recorded.length = 0
    const record: Answers = {
      revision,
      storefrontRevision,
      width,
      product: { name, sku, slug },
      steps: [],
      carts: { first: [], second: [], third: [] },
    }
    const note = async (step: string, target: Page, saidText?: string) => {
      await animationsFinished(target)
      await target.screenshot({ path: `${folder}${step}.png` })
      record.steps.push({
        step,
        level: figures(await level(page.request)),
        ...(saidText && { said: saidText }),
        ...(target !== page && { url: new URL(target.url()).pathname }),
      })
    }

    // 1. DA-INV-01: the shop location's count set to 1, with the reason Count.
    const session = await login(page)
    const teapotRow = page
      .getByRole('row')
      .filter({ hasText: sku })
      .filter({ hasText: locationNames.shop })
    const openInventory = async () => {
      await page.goto(`/${session.store_id}/inventory`)
      await expect(page.getByRole('heading', { name: /^inventory$/i })).toBeVisible({
        timeout: 15_000,
      })
      await page.getByPlaceholder(/search sku or product/i).fill(sku)
      await expect(page.getByText(/^1–1 of 1$/)).toBeVisible({ timeout: 15_000 })
      await expect(teapotRow).toBeVisible({ timeout: 15_000 })
    }
    await openInventory()
    const onHand = teapotRow.getByRole('button', { name: /edit on-hand count/i })
    await onHand.click()
    await page.getByLabel(/^amount$/i).fill('1')
    await page.getByLabel(/^reason$/i).click()
    await page.getByRole('option', { name: /^count$/i }).click()
    await page.getByRole('button', { name: /^apply$/i }).click()
    await expect(onHand).toHaveText('1', { timeout: 15_000 })
    await page.mouse.move(700, 95)
    await note('1-dashboard-count-set', page)

    // 2. The second shopper puts the last teapot in their cart first.
    const second = await shopperPage(browser, widths[width])
    await addToCart(second.page, slug)
    const secondCheckout = await checkoutLink(second.page)
    await note('2-second-shopper-cart', second.page)

    // 3. The first shopper adds it and enters checkout, which holds it.
    const first = await shopperPage(browser, widths[width])
    await addToCart(first.page, slug)
    const firstCheckout = await checkoutLink(first.page)
    await first.page.goto(`${storefront}${firstCheckout}`)
    await first.page.waitForLoadState('networkidle')
    await expect(shippingHeading(first.page)).toHaveCount(1, { timeout: 30_000 })
    await enterCheckout(first.page, firstShopper)
    await expect.poll(async () => (await level(page.request)).reserved_count).toBe(1)
    await note('3-first-shopper-checkout', first.page, await said(first.page))

    // 4. DA-INV-01: the unit shows as reserved.
    await openInventory()
    await page.mouse.move(700, 95)
    await note('4-dashboard-reserved', page)

    // 5. A third shopper opens the teapot's page while it is held.
    const held = await page.request.get(`/api/v3/store/products/${slug}`, {
      headers: { 'X-Spree-API-Key': publishableKey },
    })
    const heldBody = (await held.json()) as { in_stock?: unknown; purchasable?: unknown }
    record.productWhileHeld = {
      status: held.status(),
      in_stock: heldBody.in_stock,
      purchasable: heldBody.purchasable,
    }
    const third = await shopperPage(browser, widths[width])
    await third.page.goto(`${storefront}${shopPath}/products/${slug}`)
    await third.page.waitForLoadState('networkidle')
    const addButton = third.page.getByRole('button', { name: /add to cart|out of stock/i })
    const offered = (await addButton.count())
      ? `Its button read "${(await addButton.first().innerText()).trim()}" and was ${
          (await addButton.first().isEnabled()) ? 'enabled' : 'disabled'
        }.`
      : 'It showed no add to cart button.'
    await note('5-third-shopper-product', third.page, offered)
    const fromStep5b = recorded.length
    await addButton.first().click()
    await third.page.waitForLoadState('networkidle')
    await third.page.waitForTimeout(2_000)
    await note('5b-third-shopper-adds', third.page, await said(third.page))
    record.carts.third = recorded.slice(fromStep5b)

    // 6. The second shopper goes to checkout from their cart.
    const fromStep6 = recorded.length
    await second.page.goto(`${storefront}${secondCheckout}`)
    await second.page.waitForLoadState('networkidle')
    await second.page.waitForTimeout(2_000)
    await note('6-second-shopper-checkout', second.page, await said(second.page))
    const taller = await second.page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight,
    )
    if (taller) {
      await second.page.screenshot({
        path: `${folder}6-second-shopper-checkout-full.png`,
        fullPage: true,
      })
    }
    // If checkout still opened with the teapot, the second shopper gives their details too.
    if (await shippingHeading(second.page).count()) {
      await enterCheckout(second.page, secondShopper)
      await second.page.waitForTimeout(2_000)
      await note('6b-second-shopper-details', second.page, await said(second.page))
    }

    const firstCartId = firstCheckout.split('/').pop() as string
    const secondCartId = secondCheckout.split('/').pop() as string
    record.carts.first = recorded.filter((answer) => answer.path.includes(firstCartId))
    record.carts.second = recorded
      .slice(fromStep6)
      .filter((answer) => answer.path.includes(secondCartId))

    // The first shopper's item removed, which gives the hold back.
    const firstToken = await cartToken(first.context)
    const headers = { 'X-Spree-API-Key': publishableKey, 'X-Spree-Token': firstToken }
    const cart = (await (
      await page.request.get(`/api/v3/store/carts/${firstCartId}`, { headers })
    ).json()) as { items?: { id: string }[] }
    for (const item of cart.items ?? []) {
      await page.request.delete(`/api/v3/store/carts/${firstCartId}/items/${item.id}`, { headers })
    }
    await expect.poll(async () => (await level(page.request)).reserved_count).toBe(0)
    record.steps.push({ step: '7-hold-given-back', level: figures(await level(page.request)) })
    const client = await adminApi(page.request)
    await client.patch(`stock_levels/${(await level(page.request)).id}`, { count_on_hand: 0 })

    for (const shopper of [first, second, third]) await shopper.context.close()
    writeFileSync(`${folder}answers.json`, `${JSON.stringify(record, null, 2)}\n`)

    const removal = record.carts.second.find((answer) =>
      JSON.stringify(answer.body).includes('line_item_removed'),
    )
    expect(
      removal,
      "the Store API took the held teapot out of the second shopper's cart",
    ).toBeTruthy()
  })
}
