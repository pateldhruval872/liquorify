import { mkdirSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, type Page, request, test } from '@playwright/test'
import { linkIn, mailTo, nextMail } from './mail'
import { publishableKey, SELLER_PASSWORD, sellerHeaders, shopper } from './marketplace'
import type { Headers, Json } from './orders'
import { type SellerPanel, seedSellerPanel, suspendedEmail } from './seller-panel'
import { admin } from './staff'

/**
 * Batch 13 part 2's §10.5: each change a seller makes in the seller panel is
 * made there, signed in as that seller's member, then seen, or not, where it
 * takes effect: on the Admin API the operator's dashboard reads, on the Seller
 * API, on the Store API a shopper's storefront reads, and in the mail the
 * browser-test server writes. Run after `screens-batch-13-part-2.spec.ts` and
 * its storefront captures on the same stack, because these checks move the
 * records those captures show. Each capture is saved to
 * `results/seller-panel-checks/<check>/<step>.png` with `answers.json`
 * beside it, holding what each API answered.
 */

const results = new URL('./results/seller-panel-checks/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const PANEL = process.env.FIDELITY_SELLER_URL ?? 'http://localhost:5175'
const SERVER = 'http://localhost:3010'

let panel: SellerPanel
let api: APIRequestContext
let headers: Headers
let shopperKey: string

test.use({ viewport: { width: 1280, height: 960 }, actionTimeout: 15_000 })
test.describe.configure({ mode: 'serial' })
test.setTimeout(180_000)

class Answers {
  private readonly entries: { step: string; status: number; body: unknown }[] = []
  constructor(private readonly check: string) {}

  async read(
    step: string,
    method: 'get' | 'post' | 'patch' | 'delete',
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

function redact(body: unknown): unknown {
  if (Array.isArray(body)) return body.map(redact)
  if (body && typeof body === 'object') {
    return Object.fromEntries(
      Object.entries(body).map(([key, value]) =>
        /token|secret|password|acceptance_url/i.test(key)
          ? [key, '[masked]']
          : [key, redact(value)],
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

const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).first()

/** Signs the browser in to the seller panel as a seller's member and opens a page under that seller. */
async function inPanel(page: Page, email: string, sellerId: string, path = '') {
  const res = await page.request.post(`${PANEL}/api/v3/seller/auth/login`, {
    data: { email, password: SELLER_PASSWORD },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto(`${PANEL}/${sellerId}${path}`)
  await page.waitForLoadState('networkidle')
}

const as = (email: string, sellerId: string) => sellerHeaders(api, email, sellerId)

const rows = (body: Json) => (body.data ?? []) as Json[]

test.beforeAll(async () => {
  test.setTimeout(600_000)
  panel = await seedSellerPanel(SERVER)
  api = await request.newContext({ baseURL: SERVER })
  ;({ headers } = await admin(api))
  shopperKey = await publishableKey(api, headers)
})

test.afterAll(async () => {
  await api?.dispose()
})

test('a product the seller submits for review', async ({ page }) => {
  const answers = new Answers('product-submitted')
  const product = panel.market.products.draft
  await answers.read('operator, before', 'get', `admin/products/${product}`)
  await inPanel(
    page,
    panel.market.users.approved,
    panel.market.sellers.approved,
    `/products/${product}`,
  )
  await page.getByRole('button', { name: 'Submit for review' }).click()
  await expect(page.getByText(/in review/i).first()).toBeVisible({ timeout: 20_000 })
  await shot(page, 'product-submitted', 'panel-after')
  const after = await answers.read('operator, after', 'get', `admin/products/${product}`)
  await answers.read('shopper', 'get', `store/products/${product}`, undefined, {
    'X-Spree-API-Key': shopperKey,
  })
  answers.save()
  expect(after.body.status).toBe('proposed')
})

test("a requirement the seller completes, seen on the operator's onboarding card", async ({
  page,
}) => {
  const answers = new Answers('requirement-completed')
  const seller = panel.market.sellers.onboarding
  await answers.read('operator, before', 'get', `admin/sellers/${seller}/onboarding`)
  await inPanel(page, panel.market.users.onboarding, seller, '/onboarding')
  await page.getByRole('button', { name: 'Accept the terms' }).click()
  const confirm = dialog(page).getByRole('button', { name: /accept/i })
  if (await confirm.isVisible().catch(() => false)) await confirm.click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  await shot(page, 'requirement-completed', 'panel-after')
  await answers.read('operator, after', 'get', `admin/sellers/${seller}/onboarding`)
  answers.save()
})

test('a package type the seller adds, completing its requirement', async ({ page }) => {
  const answers = new Answers('package-type')
  const seller = panel.market.sellers.onboarding
  const member = await as(panel.market.users.onboarding, seller)
  await answers.read('seller onboarding, before', 'get', 'seller/onboarding', undefined, member)
  await inPanel(page, panel.market.users.onboarding, seller, '/settings/package-types')
  const add = async (name: string, fill?: () => Promise<void>) => {
    await page
      .getByRole('button', { name: /add package type/i })
      .first()
      .click()
    await dialog(page).getByLabel('Name').first().fill(name)
    await fill?.()
    await dialog(page).getByRole('button', { name: /^save/i }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 20_000 })
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 })
  }
  // A box with a name alone, then the default box with its sides and weight,
  // which is what Spree's requirement asks for.
  await add('Stonecrop six-bottle carton')
  await answers.read(
    'seller onboarding, a box named only',
    'get',
    'seller/onboarding',
    undefined,
    member,
  )
  await add('Stonecrop measured carton', async () => {
    const sheet = dialog(page)
    await sheet.getByLabel('Length').fill('30')
    await sheet.getByLabel('Width').fill('20')
    await sheet.getByLabel('Height').fill('35')
    await sheet.getByLabel('Empty weight').fill('0.4')
    const units = sheet.getByRole('combobox', { name: 'Unit' })
    await units.nth(0).click()
    await page
      .getByRole('option', { name: /^cm|centimet/i })
      .first()
      .click()
    await units.nth(1).click()
    await page
      .getByRole('option', { name: /^kg|kilogram/i })
      .first()
      .click()
    await sheet.getByRole('switch', { name: /default box/i }).click()
  })
  await shot(page, 'package-type', 'panel-after')
  await answers.read('seller onboarding, after', 'get', 'seller/onboarding', undefined, member)
  await answers.read('operator onboarding, after', 'get', `admin/sellers/${seller}/onboarding`)
  answers.save()
})

test('fulfilling an order, seen by the operator', async ({ page }) => {
  const answers = new Answers('fulfilled')
  const order = panel.orders.new
  await inPanel(
    page,
    panel.market.users.approved,
    panel.market.sellers.approved,
    `/orders/${order}`,
  )
  await page.getByRole('button', { name: 'Mark as fulfilled' }).click()
  await page
    .getByLabel(/tracking number/i)
    .first()
    .fill('1Z999AA10123456791')
  await page.getByRole('button', { name: 'Fulfill items' }).click()
  await expect(page.getByText(/^fulfilled$/i).first()).toBeVisible({ timeout: 20_000 })
  await shot(page, 'fulfilled', 'panel-after')
  await answers.read('operator order', 'get', `admin/orders/${order}`)
  await answers.read('operator fulfillments', 'get', `admin/orders/${order}/fulfillments`)
  await answers.read(
    'operator deliveries on the returned order',
    'get',
    `admin/orders/${panel.orders.returned}/fulfillments`,
  )
  await answers.read(
    'operator transfers for the order',
    'get',
    `admin/seller_transfers?q[order_id_eq]=${order}`,
  )
  answers.save()
})

test('a return and a cancellation, on the balance and the operator transfers', async ({ page }) => {
  const answers = new Answers('reversals')
  const member = await as(panel.market.users.approved, panel.market.sellers.approved)
  // The approved return is received and refunded from its card, as a seller
  // finishes one; the cancellation was recorded by the seed (`seller-panel.ts`).
  await inPanel(
    page,
    panel.market.users.approved,
    panel.market.sellers.approved,
    `/orders/${panel.orders.returned}`,
  )
  const returns = page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: /^returns/i }) })
    .first()
  for (const [item, submit] of [
    [/^receive$/i, /^receive items$/i],
    [/^(refund|complete return)$/i, /^(refund|complete return)$/i],
  ] as const) {
    await returns.getByRole('button', { name: 'Actions' }).click()
    await page.getByRole('menuitem', { name: item }).click()
    await dialog(page).getByRole('button', { name: submit }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 20_000 })
    await page.waitForLoadState('networkidle')
  }
  await shot(page, 'reversals', 'return-refunded')
  for (const [label, order] of [
    ['canceled', panel.orders.canceled],
    ['returned', panel.orders.returned],
  ] as const) {
    await answers.read(
      `${label}: seller transfers`,
      'get',
      `seller/transfers?q[order_id_eq]=${order}`,
      undefined,
      member,
    )
    await answers.read(
      `${label}: operator transfers`,
      'get',
      `admin/seller_transfers?q[order_id_eq]=${order}`,
    )
    await answers.read(`${label}: operator order`, 'get', `admin/orders/${order}`)
  }
  await answers.read('seller balance', 'get', 'seller/balances', undefined, member)
  answers.save()
})

test("the seller's profile and policies where a shopper sees them", async () => {
  const answers = new Answers('profile-on-storefront')
  const shopperHeaders = { 'X-Spree-API-Key': shopperKey }
  await answers.read(
    'store seller',
    'get',
    `store/sellers/${panel.market.sellers.approved}`,
    undefined,
    shopperHeaders,
  )
  await answers.read('store policies', 'get', 'store/policies', undefined, shopperHeaders)
  answers.save()
})

test('a teammate invited and the invitation revoked', async ({ page }) => {
  const answers = new Answers('invitation')
  const invitee = `cooper.${Date.now()}@harbour-cask.example.com`
  const already = mailTo(invitee).length
  await inPanel(page, panel.market.users.approved, panel.market.sellers.approved, '/settings/team')
  await page.getByRole('button', { name: 'Invite member' }).click()
  await dialog(page).getByLabel(/email/i).fill(invitee)
  await dialog(page).getByRole('button', { name: 'Send invitation' }).click()
  await expect(page.getByText(invitee).first()).toBeVisible({ timeout: 20_000 })
  await shot(page, 'invitation', 'invited')

  const member = await as(panel.market.users.approved, panel.market.sellers.approved)
  const invitation = rows(
    (await answers.read('invitations', 'get', 'seller/invitations', undefined, member)).body,
  ).find((each) => each.email === invitee) as Json
  const link = await answers.read(
    'acceptance link',
    'get',
    `seller/invitations/${invitation.id}/acceptance_link`,
    undefined,
    member,
  )
  const acceptance = new URL(link.body.acceptance_url as string)

  const mail = await nextMail(invitee, already).catch(() => null)
  answers.note(
    'EM-S-03 written',
    mail
      ? {
          subject: mail.subject,
          linkMatchesPanel: /accept-invitation/.test(linkIn(mail, /accept-invitation/).pathname),
        }
      : 'no message',
  )

  const row = page.locator('tr', { hasText: invitee })
  await row.getByRole('button').last().click()
  await page.getByRole('menuitem', { name: 'Revoke' }).click()
  await dialog(page).getByRole('button', { name: 'Revoke' }).click()
  await expect(page.getByText('Invitation revoked').first()).toBeVisible({ timeout: 20_000 })
  await shot(page, 'invitation', 'revoked')

  await page.context().clearCookies()
  await page.goto(`${PANEL}${acceptance.pathname}${acceptance.search}`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  await shot(page, 'invitation', 'revoked-link-opened')
  answers.save()
})

test('what a suspended seller can still do', async () => {
  const answers = new Answers('suspended')
  const member = await as(suspendedEmail, panel.market.sellers.suspended)
  await answers.read('profile', 'get', 'seller/profile', undefined, member)
  await answers.read('products', 'get', 'seller/products', undefined, member)
  await answers.read(
    'edit its product',
    'patch',
    `seller/products/${panel.market.products.suspended}`,
    { name: 'Copperline Harbour Porter' },
    member,
  )
  await answers.read(
    'create a product',
    'post',
    'seller/products',
    { name: 'Copperline check porter' },
    member,
  )
  await answers.read(
    'shopper sees its product',
    'get',
    `store/products/${panel.market.products.suspended}`,
    undefined,
    {
      'X-Spree-API-Key': shopperKey,
    },
  )
  answers.save()
})

// SD-72: a parcel the seller splits after the shopper has paid. Splitting is
// done through the Seller API the panel's split dialog calls, and the order's
// money is read before and after, then fulfilling the moved unit is tried.
test('splitting a paid parcel', async () => {
  const answers = new Answers('split-after-payment')
  const checkout = await shopper(api, headers)
  const member = await as(panel.market.users.approved, panel.market.sellers.approved)
  const placed = await checkout([panel.market.products.active, panel.market.products.active])
  const ids = ((placed.orders as Json[] | undefined) ?? [placed]).map((each) => each.id as string)
  const mine = rows(
    (await answers.read('orders', 'get', 'seller/orders?limit=100', undefined, member)).body,
  )
  const order = mine.find((each) => ids.includes(each.id as string))?.id as string
  expect(order, "Harbour Cask's share of the purchase").toBeTruthy()
  await answers.read('order, before', 'get', `seller/orders/${order}`, undefined, member)
  const [parcel] = rows(
    (
      await answers.read(
        'fulfillments, before',
        'get',
        `seller/orders/${order}/fulfillments`,
        undefined,
        member,
      )
    ).body,
  )
  const variant = ((parcel.fulfillment_items as Json[]) ?? [])[0]?.variant_id as string
  await answers.read(
    'split one unit',
    'patch',
    `seller/orders/${order}/fulfillments/${parcel.id}/split`,
    { variant_id: variant, quantity: 1 },
    member,
  )
  await answers.read('order, after', 'get', `seller/orders/${order}`, undefined, member)
  const parcels = rows(
    (
      await answers.read(
        'fulfillments, after',
        'get',
        `seller/orders/${order}/fulfillments`,
        undefined,
        member,
      )
    ).body,
  )
  const moved = parcels.find((each) => each.id !== parcel.id) ?? parcel
  await answers.read(
    'fulfill the moved unit',
    'patch',
    `seller/orders/${order}/fulfillments/${moved.id}/fulfill`,
    {},
    member,
  )
  answers.save()
})
