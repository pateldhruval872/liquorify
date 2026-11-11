import { mkdirSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, type Page, request, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import {
  type Marketplace,
  publishableKey,
  SELLER_PASSWORD,
  seedMarketplace,
  sellerHeaders,
  shopper,
  shopperAddress,
  shopperEmail,
} from './marketplace'
import type { Headers, Json } from './orders'
import { admin, seed } from './staff'

/**
 * Batch 13's §2.4: each decision and setting of the operator's seller screens
 * is made or saved through its dashboard screen as the admin, then seen, or
 * not, where it takes effect: the seller's and product's status on the Admin
 * API, what the Seller API answers that seller's people, what the Store API
 * shows a shopper, and the commission and ledger on orders placed after the
 * change. Run after `screens-batch-13.spec.ts` and `compare-batch-13.spec.ts`
 * on the same stack, because these checks move the sellers those captures
 * show. Each capture is saved to `results/marketplace-checks/<check>/<step>.png`
 * with `answers.json` beside it, holding what each API answered.
 *
 * The seller emails switch is not checked here: the browser-test server does
 * not load the emails gem that sends them (work item §2.7), so it is checked on
 * that gem's own test app by `marketplace-mail.spec.ts`.
 *
 * Writes stay on the browser-test server's database. Settings are put back as
 * they were found.
 */

const results = new URL('./results/marketplace-checks/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

let market: Marketplace
let storeId: string
let api: APIRequestContext
let headers: Headers
let shopperKey: string

test.use({ viewport: { width: 1280, height: 960 }, actionTimeout: 15_000 })
test.describe.configure({ mode: 'serial' })
test.setTimeout(180_000)

/** Every answer a check read, in the order it read them. */
class Answers {
  private readonly entries: { step: string; status: number; body: unknown }[] = []
  constructor(private readonly check: string) {}

  async read(
    step: string,
    method: 'get' | 'post' | 'patch',
    path: string,
    data?: object,
    as = headers,
  ) {
    const res = await api[method](`/api/v3/${path}`, { headers: as, data })
    const text = await res.text()
    const body = text ? (JSON.parse(text) as Json) : ({} as Json)
    this.entries.push({ step, status: res.status(), body: redact(body) })
    return { status: res.status(), body }
  }

  note(step: string, body: unknown) {
    this.entries.push({ step, status: 0, body })
  }

  save() {
    writeFileSync(
      `${folder(this.check)}answers.json`,
      JSON.stringify({ revision, check: this.check, answers: this.entries }, null, 2),
    )
  }
}

/** Tokens never reach a record. */
function redact(body: unknown): unknown {
  if (Array.isArray(body)) return body.map(redact)
  if (body && typeof body === 'object') {
    return Object.fromEntries(
      Object.entries(body).map(([key, value]) =>
        /token|secret|password/i.test(key) ? [key, '[masked]'] : [key, redact(value)],
      ),
    )
  }
  return body
}

const folder = (check: string) => {
  const path = `${results}${check}/`
  mkdirSync(path, { recursive: true })
  return path
}

const shot = (page: Page, check: string, step: string) =>
  page.screenshot({ path: `${folder(check)}${step}.png`, fullPage: true })

const open = async (page: Page, path: string) => {
  await page.goto(`/${storeId}${path}`)
  await page.waitForLoadState('networkidle')
}

const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()
const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).first()

const sellerPage = async (page: Page, id: string, name: string) => {
  await open(page, `/sellers/${id}`)
  await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 20_000 })
  await expect(card(page, /^onboarding$/i)).toBeVisible({ timeout: 20_000 })
}

const statusBadge = (page: Page, label: RegExp) =>
  expect(page.getByText(label).first()).toBeVisible({ timeout: 20_000 })

const confirmIn = async (page: Page, label: RegExp) => {
  await expect(dialog(page)).toBeVisible()
  await dialog(page).getByRole('button', { name: label }).click()
  await expect(dialog(page)).toBeHidden({ timeout: 20_000 })
}

const fromMenu = async (page: Page, item: RegExp) => {
  await page.getByRole('button', { name: /more actions/i }).click()
  await page.getByRole('menuitem', { name: item }).click()
}

const requirementRow = (page: Page, name: string) =>
  card(page, /^onboarding$/i)
    .getByText(name, { exact: true })
    .locator('xpath=ancestor::*[.//button][1]')

const sellerPeople = (email: string, sellerId: string) =>
  sellerHeaders(api, email, sellerId).catch((error: Error) => ({ refused: error.message }))

/** Signs a seller's person in and reads what the Seller API answers them. */
async function asSeller(answers: Answers, step: string, email: string, sellerId: string) {
  const res = await api.post('/api/v3/seller/auth/login', {
    data: { email, password: SELLER_PASSWORD },
  })
  const body = (await res.json()) as Json
  answers.note(`${step}: sign in`, { status: res.status(), sellers: body.sellers ?? body.error })
  if (!res.ok()) return null
  const as = { Authorization: `Bearer ${body.token}`, 'X-Spree-Seller-Id': sellerId }
  await answers.read(`${step}: profile`, 'get', 'seller/profile', undefined, as)
  await answers.read(`${step}: onboarding`, 'get', 'seller/onboarding', undefined, as)
  return as
}

const storeSeller = (answers: Answers, step: string, id: string) =>
  answers.read(step, 'get', `store/sellers/${id}`, undefined, { 'X-Spree-API-Key': shopperKey })

const saveSettings = async (page: Page, change: (page: Page) => Promise<void>) => {
  await open(page, '/settings/marketplace')
  await expect(page.getByRole('heading', { name: 'Marketplace' }).first()).toBeVisible({
    timeout: 20_000,
  })
  await change(page)
  await page.getByRole('button', { name: /^save/i }).click()
  await expect(page.getByText(/settings updated|saved/i).first()).toBeVisible({ timeout: 20_000 })
}

const toggle = (label: string, on: boolean) => async (page: Page) => {
  const control = page.getByRole('switch', { name: label })
  if ((await control.getAttribute('aria-checked')) !== String(on)) await control.click()
}

test.beforeAll(async ({ baseURL }) => {
  const seeded = await seed(baseURL as string)
  storeId = seeded.storeId
  market = await seedMarketplace(baseURL as string)
  api = await request.newContext({ baseURL })
  ;({ headers } = await admin(api))
  shopperKey = await publishableKey(api, headers)
})

test.afterAll(async () => {
  await api?.dispose()
})

test('accepting, sending back and waiving a requirement', async ({ page }) => {
  const check = 'requirements'
  const answers = new Answers(check)
  const stonecrop = market.sellers.onboarding
  const maya = 'maya.okafor@stonecrop.example.com'
  await login(page)

  await answers.read('before', 'get', `admin/sellers/${stonecrop}/onboarding`)
  await sellerPage(page, stonecrop, 'Stonecrop Cellars')
  await shot(page, check, '1-before')

  // A re-run finds it already sent back by the first run.
  const sendBack = requirementRow(page, 'Marketplace background check').getByRole('button', {
    name: /^send back$/i,
  })
  if (await sendBack.isVisible()) {
    await sendBack.click()
    await confirmIn(page, /^send back$/i)
  }
  await expect(requirementRow(page, 'Marketplace background check')).toContainText(/sent back/i)
  await shot(page, check, '2-sent-back')
  await answers.read('after sending back', 'get', `admin/sellers/${stonecrop}/onboarding`)
  const as = await asSeller(answers, 'seller after sending back', maya, stonecrop)

  // The seller sends the check again, as the panel's onboarding page does.
  const review = (
    await answers.read('requirements', 'get', `admin/sellers/${stonecrop}/onboarding`)
  ).body.requirements as Json[]
  const background = review.find((each) => each.name === 'Marketplace background check') as Json
  await answers.read(
    'seller submits again',
    'post',
    `seller/requirements/${background.id}/submissions`,
    { note: 'Premises licence PL-0419 now uploaded.' },
    as ?? {},
  )

  await sellerPage(page, stonecrop, 'Stonecrop Cellars')
  await requirementRow(page, 'Marketplace background check')
    .getByRole('button', { name: /^accept$/i })
    .click()
  await expect(requirementRow(page, 'Marketplace background check')).toContainText(/done/i, {
    timeout: 20_000,
  })
  await shot(page, check, '3-accepted')
  await answers.read('after accepting', 'get', `admin/sellers/${stonecrop}/onboarding`)

  await requirementRow(page, 'Accept terms').getByRole('button').last().click()
  await page.getByRole('menuitem', { name: /waive for this seller/i }).click()
  await confirmIn(page, /waive for this seller/i)
  await expect(requirementRow(page, 'Accept terms')).toContainText(/waived/i, { timeout: 20_000 })
  await shot(page, check, '4-waived')
  await answers.read('after waiving', 'get', `admin/sellers/${stonecrop}/onboarding`)
  await asSeller(answers, 'seller after waiving', maya, stonecrop)

  // What the approve button now does: outstanding requirements still ask for the override.
  await page.getByRole('button', { name: /^approve$/i }).click()
  await expect(dialog(page)).toBeVisible()
  await shot(page, check, '5-approve-still-overrides')
  await dialog(page)
    .getByRole('button', { name: /cancel/i })
    .click()
  answers.save()
})

test('approving, suspending and reinstating a seller, and sending one back', async ({ page }) => {
  const check = 'seller-lifecycle'
  const answers = new Answers(check)
  const juniper = market.sellers.ready
  const theo = 'theo.lindqvist@juniper-row.example.com'
  await login(page)

  await answers.read('settings', 'get', 'admin/store')
  await sellerPage(page, juniper, 'Juniper Row Distillers')
  await fromMenu(page, /send back to onboarding/i)
  await confirmIn(page, /send back to onboarding/i)
  await statusBadge(page, /^onboarding$/i)
  await shot(page, check, '1-sent-back-to-onboarding')
  await answers.read('after sending back', 'get', `admin/sellers/${juniper}`)

  // The seller submits again, as the panel's onboarding page does, with automatic approval off.
  const theoHeaders = await asSeller(answers, 'seller while onboarding', theo, juniper)
  await answers.read(
    'seller submits for review',
    'post',
    'seller/onboarding/submit_for_review',
    {},
    theoHeaders ?? {},
  )
  await answers.read('after submitting, automatic approval off', 'get', `admin/sellers/${juniper}`)

  await sellerPage(page, juniper, 'Juniper Row Distillers')
  await statusBadge(page, /ready for review/i)
  await shot(page, check, '2-ready-for-review')
  await page.getByRole('button', { name: /^approve$/i }).click()
  await statusBadge(page, /^approved$/i)
  await shot(page, check, '3-approved')
  await answers.read('after approving', 'get', `admin/sellers/${juniper}`)
  await asSeller(answers, 'seller after approval', theo, juniper)
  await storeSeller(answers, 'shopper after approval', juniper)

  await fromMenu(page, /^suspend$/i)
  await confirmIn(page, /^suspend$/i)
  await statusBadge(page, /^suspended$/i)
  await shot(page, check, '4-suspended')
  await answers.read('after suspending', 'get', `admin/sellers/${juniper}`)
  const suspended = await asSeller(answers, 'seller after suspension', theo, juniper)
  await answers.read(
    'suspended seller writes its profile',
    'patch',
    'seller/profile',
    { about: 'Small-batch gin from Leith.' },
    suspended ?? {},
  )
  await answers.read(
    'suspended seller lists products',
    'get',
    'seller/products',
    undefined,
    suspended ?? {},
  )
  await storeSeller(answers, 'shopper after suspension', juniper)

  // Copperline's product, suspended since the seed: what a shopper sees of it.
  const product = market.products.suspended
  const shopperHeaders = { 'X-Spree-API-Key': shopperKey }
  await answers.read(
    'shopper reads suspended seller product',
    'get',
    `store/products/${product}`,
    undefined,
    shopperHeaders,
  )
  const cart = await answers.read('shopper opens a cart', 'post', 'store/carts', {}, shopperHeaders)
  const variant = (await answers.read('product', 'get', `admin/products/${product}`)).body
    .default_variant_id as string
  await answers.read(
    'shopper adds the suspended seller product',
    'post',
    `store/carts/${cart.body.id}/items`,
    { variant_id: variant, quantity: 1 },
    { ...shopperHeaders, 'X-Spree-Token': cart.body.token as string },
  )

  await sellerPage(page, juniper, 'Juniper Row Distillers')
  await page.getByRole('button', { name: /^reinstate$/i }).click()
  // SD-69, fixed: the server does not re-measure requirements when it lifts a
  // suspension, so reinstating asks for no override.
  await statusBadge(page, /^approved$/i)
  await expect(dialog(page), 'no override warning on reinstating').toHaveCount(0)
  await shot(page, check, '6-reinstated')
  await answers.read('after reinstating', 'get', `admin/sellers/${juniper}`)
  await asSeller(answers, 'seller after reinstatement', theo, juniper)
  await answers.read(
    'profile put back',
    'patch',
    'seller/profile',
    { about: '' },
    (await sellerPeople(theo, juniper)) as Headers,
  )

  // Rejecting: a seller not yet admitted, and refused for one already trading.
  const fennel = market.sellers.pending
  await sellerPage(page, fennel, 'Fennel & Oak Provisions')
  await fromMenu(page, /^reject$/i)
  await confirmIn(page, /^reject$/i)
  await statusBadge(page, /^rejected$/i)
  await shot(page, check, '7-rejected')
  await answers.read('after rejecting', 'get', `admin/sellers/${fennel}`)
  await answers.read(
    'rejecting an approved seller',
    'patch',
    `admin/sellers/${market.sellers.approved}/reject`,
    {},
  )
  await open(page, '/sellers')
  await shot(page, check, '8-list')
  answers.save()
})

test('approving with requirements outstanding', async ({ page }) => {
  const check = 'approve-override'
  const answers = new Answers(check)
  // Fennel & Oak, rejected by the check before, with its whole checklist outstanding.
  const fennel = market.sellers.pending
  await login(page)

  await answers.read('onboarding', 'get', `admin/sellers/${fennel}/onboarding`)
  await answers.read('without the override', 'patch', `admin/sellers/${fennel}/approve`, {})
  await sellerPage(page, fennel, 'Fennel & Oak Provisions')
  await page.getByRole('button', { name: /^approve$/i }).click()
  await expect(dialog(page)).toBeVisible()
  await shot(page, check, '1-override-confirm')
  await dialog(page).getByRole('button').last().click()
  await statusBadge(page, /^approved$/i)
  await shot(page, check, '2-approved')
  await answers.read('after the override', 'get', `admin/sellers/${fennel}`)
  await storeSeller(answers, 'shopper after the override', fennel)
  answers.save()
})

test("a suspended seller's product at checkout", async ({ page }) => {
  const check = 'suspended-seller-checkout'
  const answers = new Answers(check)
  const copperline = market.sellers.suspended
  const product = market.products.suspended
  const sam = 'sam.reyes@copperline.example.com'
  const shopperHeaders = { 'X-Spree-API-Key': shopperKey }
  await login(page)

  await answers.read('seller', 'get', `admin/sellers/${copperline}`)
  await answers.read(
    'shopper reads the product',
    'get',
    `store/products/${product}`,
    undefined,
    shopperHeaders,
  )
  await storeSeller(answers, 'shopper reads the seller', copperline)
  // The suspended seller's own delivery, written through the Seller API while
  // suspended, so the checkout below is not stopped for want of one.
  const sellerHeaders_ = await asSeller(answers, 'suspended seller', sam, copperline)
  const existing = await answers.read(
    'its delivery methods',
    'get',
    'seller/delivery_methods',
    undefined,
    sellerHeaders_ ?? {},
  )
  if (!(existing.body.data as Json[]).some((each) => each.name === 'Copperline van')) {
    const profiles = await answers.read(
      'delivery profiles',
      'get',
      'admin/delivery_profiles?limit=100',
    )
    const general = (profiles.body.data as Json[]).find((each) => each.name === 'General') as Json
    await answers.read(
      'suspended seller adds a delivery method',
      'post',
      'seller/delivery_methods',
      {
        name: 'Copperline van',
        delivery_profile_id: general.id,
        storefront_visible: true,
        calculator: { type: 'flat_rate', preferences: { amount: '4.00' } },
      },
      sellerHeaders_ ?? {},
    )
  }
  // SD-60, fixed: the product read says it cannot be bought, and the cart
  // and checkout now agree. Each step is asserted as well as recorded.
  const publishable = await publishableKey(api, headers)
  const asShopper = { 'X-Spree-API-Key': publishable }
  const variant = (await answers.read('the product', 'get', `admin/products/${product}`)).body
    .default_variant_id as string
  const ordersBefore = await answers.read(
    'orders of the suspended seller before',
    'get',
    `admin/orders?q[seller_id_eq]=${copperline}&limit=100`,
  )
  const chequeId = async () => {
    const methods = (
      await answers.read('payment methods', 'get', 'admin/payment_methods?limit=100')
    ).body.data as Json[]
    const cheque = methods.find((each) => each.type === 'check' && each.active)
    expect(cheque, 'an active cheque payment method').toBeTruthy()
    return (cheque as Json).id as string
  }
  const newCart = async (step: string) => {
    const cart = (await answers.read(step, 'post', 'store/carts', {}, asShopper)).body
    return {
      id: cart.id as string,
      as: { ...asShopper, 'X-Spree-Token': cart.token as string },
    }
  }
  const fillIn = async (cart: { id: string; as: Headers }) => {
    await answers.read(
      'shopper gives an address',
      'patch',
      `store/carts/${cart.id}`,
      { email: shopperEmail, shipping_address: shopperAddress, billing_address: shopperAddress },
      cart.as,
    )
    await answers.read(
      'shopper pays by cheque',
      'post',
      `store/carts/${cart.id}/payments`,
      { payment_method_id: await chequeId() },
      cart.as,
    )
  }

  // Refused at add-to-cart while the seller is suspended.
  const first = await newCart('shopper opens a cart')
  const refusedAdd = await answers.read(
    'shopper adds the suspended seller product',
    'post',
    `store/carts/${first.id}/items`,
    { variant_id: variant, quantity: 1 },
    first.as,
  )
  expect(refusedAdd.status, 'the add is refused').toBe(422)
  expect(JSON.stringify(refusedAdd.body)).toContain('is not available from its seller right now')
  const firstCart = await answers.read(
    'the cart after',
    'get',
    `store/carts/${first.id}`,
    undefined,
    first.as,
  )
  expect(firstCart.body.item_count ?? 0, 'nothing went in the cart').toBe(0)

  // The control: reinstated, the same product goes in the cart. Suspended
  // again before the shopper pays, checkout is refused.
  const reinstated = await answers.read(
    'operator reinstates',
    'patch',
    `admin/sellers/${copperline}/approve`,
    {},
  )
  expect(reinstated.status).toBe(200)
  const second = await newCart('shopper opens a second cart')
  const added = await answers.read(
    'shopper adds the product while the seller is approved',
    'post',
    `store/carts/${second.id}/items`,
    { variant_id: variant, quantity: 1 },
    second.as,
  )
  expect(added.status, 'the add succeeds for an approved seller').toBe(201)
  await fillIn(second)
  const suspended = await answers.read(
    'operator suspends again',
    'patch',
    `admin/sellers/${copperline}/suspend`,
    {
      reason: 'Licence under review',
    },
  )
  expect(suspended.status).toBe(200)
  const refusedCheckout = await answers.read(
    'shopper completes the checkout',
    'post',
    `store/carts/${second.id}/complete`,
    {},
    second.as,
  )
  expect(refusedCheckout.status, 'checkout is refused').toBe(422)
  expect(JSON.stringify(refusedCheckout.body)).toContain('seller_unavailable')
  const ordersAfter = await answers.read(
    'orders of the suspended seller after',
    'get',
    `admin/orders?q[seller_id_eq]=${copperline}&limit=100`,
  )
  expect(
    (ordersAfter.body.data as Json[]).length,
    'no order was placed for the suspended seller',
  ).toBe((ordersBefore.body.data as Json[]).length)

  await open(page, `/sellers/${copperline}`)
  await expect(page.getByText(/suspended/i).first()).toBeVisible({ timeout: 20_000 })
  await shot(page, check, '1-seller')
  answers.save()
})

test('automatic approval of sellers', async ({ page }) => {
  const check = 'auto-approve-sellers'
  const answers = new Answers(check)
  const stonecrop = market.sellers.onboarding
  const maya = 'maya.okafor@stonecrop.example.com'
  await login(page)

  // What is left of Stonecrop's checklist is waived, so only the switch decides.
  const onboarding = await answers.read(
    'onboarding',
    'get',
    `admin/sellers/${stonecrop}/onboarding`,
  )
  for (const requirement of onboarding.body.requirements as Json[]) {
    if (!requirement.blocking) continue
    await answers.read(
      `waive ${requirement.name}`,
      'post',
      `admin/sellers/${stonecrop}/requirement_submissions`,
      { requirement_id: requirement.id, review_note: 'Waived for the batch 13 check.' },
    )
  }

  await saveSettings(page, toggle('Approve sellers automatically', true))
  await shot(page, check, '1-switch-on')
  await answers.read('settings', 'get', 'admin/store')

  const as = await asSeller(answers, 'seller before submitting', maya, stonecrop)
  await answers.read(
    'seller submits for review',
    'post',
    'seller/onboarding/submit_for_review',
    {},
    as ?? {},
  )
  await answers.read('after submitting, automatic approval on', 'get', `admin/sellers/${stonecrop}`)
  await sellerPage(page, stonecrop, 'Stonecrop Cellars')
  await shot(page, check, '2-seller-after')

  await saveSettings(page, toggle('Approve sellers automatically', false))
  await answers.read('settings put back', 'get', 'admin/store')
  answers.save()
})

test("approving and sending back a seller's product, and publishing them automatically", async ({
  page,
}) => {
  const check = 'products'
  const answers = new Answers(check)
  const ines = 'ines.carvalho@harbour-cask.example.com'
  const harbour = market.sellers.approved
  const shopperHeaders = { 'X-Spree-API-Key': shopperKey }
  await login(page)

  // SD-61, fixed: approval puts the product on sale, as the confirmation
  // says, so the shopper finds it afterwards and not before.
  const proposed = market.products.proposed
  const beforeApproval = await answers.read(
    'shopper before approval',
    'get',
    `store/products/${proposed}`,
    undefined,
    shopperHeaders,
  )
  expect(beforeApproval.status, 'not on sale while awaiting review').toBe(404)
  await open(page, `/products/${proposed}`)
  await page.getByRole('button', { name: /^approve$/i }).click()
  await confirmIn(page, /^approve$/i)
  await expect(page.getByText('Product approved').first()).toBeVisible({ timeout: 20_000 })
  await shot(page, check, '1-approved')
  await answers.read('after approving', 'get', `admin/products/${proposed}`)
  const afterApproval = await answers.read(
    'shopper after approval',
    'get',
    `store/products/${proposed}`,
    undefined,
    shopperHeaders,
  )
  expect(afterApproval.status, 'on sale once approved').toBe(200)

  const seller = (await sellerPeople(ines, harbour)) as Headers
  const created = await answers.read(
    'seller creates a product',
    'post',
    'seller/products',
    { name: 'Harbour Cask Cask-Strength Miniatures', prices: [{ amount: '29.00' }] },
    seller,
  )
  const sentBack = created.body.id as string
  await answers.read('seller submits it', 'patch', `seller/products/${sentBack}/submit`, {}, seller)
  await open(page, `/products/${sentBack}`)
  await page.getByRole('button', { name: /^send back$/i }).click()
  await page.getByLabel('Reason').fill('Add the bottle size of each miniature.')
  await shot(page, check, '2-reason')
  await page
    .getByRole('button', { name: /^send back$/i })
    .last()
    .click()
  await expect(page.getByText('Sent back to the seller').first()).toBeVisible({ timeout: 20_000 })
  await shot(page, check, '3-sent-back')
  await answers.read('after sending back', 'get', `admin/products/${sentBack}`)
  await answers.read(
    'seller reads it',
    'get',
    `seller/products/${sentBack}?expand=submission`,
    undefined,
    seller,
  )
  const sentBackRead = await answers.read(
    'shopper reads it',
    'get',
    `store/products/${sentBack}`,
    undefined,
    shopperHeaders,
  )
  expect(sentBackRead.status, 'a product sent back is not on sale').toBe(404)
  await open(page, `/products?q[seller_id_eq]=${harbour}`)
  await shot(page, check, '4-list-by-seller')

  for (const on of [true, false]) {
    await saveSettings(page, toggle('Publish seller products automatically', on))
    const made = await answers.read(
      `seller creates a product, automatic publishing ${on ? 'on' : 'off'}`,
      'post',
      'seller/products',
      { name: `Harbour Cask Tasting Set ${on ? 'A' : 'B'}`, prices: [{ amount: '45.00' }] },
      seller,
    )
    await answers.read(
      `seller submits it, automatic publishing ${on ? 'on' : 'off'}`,
      'patch',
      `seller/products/${made.body.id}/submit`,
      {},
      seller,
    )
    await answers.read(
      `status, automatic publishing ${on ? 'on' : 'off'}`,
      'get',
      `admin/products/${made.body.id}`,
    )
    const shopperRead = await answers.read(
      `shopper reads it, automatic publishing ${on ? 'on' : 'off'}`,
      'get',
      `store/products/${made.body.id}`,
      undefined,
      shopperHeaders,
    )
    expect(shopperRead.status, `on sale only when published automatically (${on})`).toBe(
      on ? 200 : 404,
    )
  }
  await answers.read('settings put back', 'get', 'admin/store')
  answers.save()
})

test('an approved seller product once the operator adds it to a sales channel', async () => {
  const check = 'products-on-a-channel'
  const answers = new Answers(check)
  const approved = market.products.proposed
  const shopperHeaders = { 'X-Spree-API-Key': shopperKey }
  const withChannels = await answers.read(
    'approved product with its channels',
    'get',
    `admin/products/${approved}?expand=channels`,
  )
  const channels = await answers.read('channels', 'get', 'admin/channels?limit=100')
  const online = (channels.body.data as Json[]).find((each) => each.default) as Json
  // Since SD-61's fix, approval has already put it on the default channel;
  // adding it again changes nothing and the shopper still finds it.
  expect(
    ((withChannels.body.channels ?? []) as Json[]).map((each) => each.id),
    'approval put it on the default channel',
  ).toContain(online.id)
  await answers.read(
    'operator adds it to the default channel',
    'post',
    'admin/products/bulk_add_to_channels',
    {
      ids: [approved],
      channel_ids: [online.id],
    },
  )
  const read = await answers.read(
    'shopper reads it',
    'get',
    `store/products/${approved}`,
    undefined,
    shopperHeaders,
  )
  expect(read.status).toBe(200)
  answers.save()
})

test('the payout minimum, the commission tax and a commission rate', async ({ page }) => {
  const check = 'commission-and-payout-settings'
  const answers = new Answers(check)
  await login(page)

  const before = await answers.read('settings before', 'get', 'admin/store')
  await saveSettings(page, async (screen) => {
    await screen.getByLabel('Minimum payout').fill('25')
    await screen.getByLabel(/tax on commission/i).fill('10')
  })
  await page.reload()
  await page.waitForLoadState('networkidle')
  await shot(page, check, '1-saved-and-reloaded')
  await answers.read('settings after', 'get', 'admin/store')

  // An order placed after the save, with one product from each seller.
  const checkout = await shopper(api, headers)
  const group = await checkout([market.products.active, market.products.second])
  const orders = (group.orders as Json[]).map((order) => order.id)
  answers.note('order group placed after the save', { number: group.number, orders })
  await answers.read('commission rates', 'get', 'admin/commission_rates?limit=100')
  for (const order of orders) {
    await answers.read(`order ${order}`, 'get', `admin/orders/${order}?expand=items`)
    await answers.read(
      `commission lines on ${order}`,
      'get',
      `admin/commission_lines?q[order_id_eq]=${order}`,
    )
    await open(page, `/orders/${order}`)
    await expect(card(page, /^commission$/i)).toBeVisible({ timeout: 20_000 })
    await card(page, /^commission$/i).scrollIntoViewIfNeeded()
    await shot(page, check, `2-order-${order}`)
  }
  await answers.read(
    'commission lines on the earlier fulfilled order',
    'get',
    `admin/commission_lines?q[order_id_eq]=${market.fulfilledOrder}`,
  )

  await saveSettings(page, async (screen) => {
    await screen
      .getByLabel('Minimum payout')
      .fill(String(before.body.default_minimum_payout_amount))
    await screen.getByLabel(/tax on commission/i).fill('20')
  })
  await answers.read('settings put back', 'get', 'admin/store')
  answers.save()
})

test('marking a payout paid', async ({ page }) => {
  const check = 'mark-paid'
  const answers = new Answers(check)
  const harbour = market.sellers.approved
  const pending = market.payouts.find(([, status]) => status === 'pending')?.[0] as string
  await login(page)

  await answers.read('balance before', 'get', `admin/sellers/${harbour}/balances`)
  await answers.read('payout before', 'get', `admin/seller_payouts/${pending}`)
  await answers.read(
    'transfers it covers',
    'get',
    `admin/seller_transfers?q[payout_id_eq]=${pending}`,
  )
  await open(page, `/sellers/payouts/${pending}`)
  // A re-run finds the payout already paid by the first run.
  const markPaid = page.getByRole('button', { name: /mark as paid/i }).first()
  if (await markPaid.isVisible()) {
    await page
      .getByRole('button', { name: /mark as paid/i })
      .first()
      .click()
    await dialog(page).getByRole('textbox').fill('FID-PAY-1310')
    await shot(page, check, '1-dialog')
    await dialog(page)
      .getByRole('button', { name: /mark as paid/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 20_000 })
    await expect(page.getByText('FID-PAY-1310').first()).toBeVisible({ timeout: 20_000 })
    await shot(page, check, '2-paid')
  }
  await answers.read('payout after', 'get', `admin/seller_payouts/${pending}`)
  await answers.read('transfers after', 'get', `admin/seller_transfers?q[payout_id_eq]=${pending}`)
  await answers.read('balance after', 'get', `admin/sellers/${harbour}/balances`)
  await answers.read('completing it again', 'patch', `admin/seller_payouts/${pending}/complete`, {
    reference: 'FID-PAY-AGAIN',
  })
  await sellerPage(page, harbour, 'Harbour Cask Co.')
  await card(page, /^balance$/i).scrollIntoViewIfNeeded()
  await shot(page, check, '3-balance-card')
  answers.save()
})

test('the sellers ranking and the seller payouts report', async ({ page }) => {
  const check = 'ranking-and-report'
  const answers = new Answers(check)
  await login(page)

  const queries: unknown[] = []
  page.on('request', (sent) => {
    if (sent.url().includes('/reporting/') && sent.method() === 'POST')
      queries.push({ url: new URL(sent.url()).pathname, body: sent.postDataJSON() })
  })
  page.on('response', async (got) => {
    if (got.url().includes('/reporting/') && got.request().method() === 'POST')
      queries.push({ answer: await got.json().catch(() => null) })
  })
  await open(page, '')
  const tab = page.getByRole('tab', { name: 'Sellers' })
  await tab.scrollIntoViewIfNeeded()
  await tab.click()
  await page.waitForLoadState('networkidle')
  await shot(page, check, '1-ranking')

  for (const [key, id] of Object.entries(market.sellers)) {
    await answers.read(`orders of ${key}`, 'get', `admin/orders?q[seller_id_eq]=${id}&limit=100`)
  }
  await answers.read('transfers', 'get', 'admin/seller_transfers?limit=100')
  await answers.read('payouts', 'get', 'admin/seller_payouts?limit=100')

  const reports = await answers.read('reports', 'get', 'admin/reporting/saved_reports?limit=100')
  const report = (reports.body.data as Json[]).find((each) => each.name === 'Seller payouts')
  if (report) {
    await open(page, `/reports/${report.id}`)
    await page.waitForLoadState('networkidle')
    await shot(page, check, '2-report')
  }
  answers.note('reporting requests and answers the dashboard made', queries)
  answers.save()
})
