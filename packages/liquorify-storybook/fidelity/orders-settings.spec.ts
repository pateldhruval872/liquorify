import { mkdirSync, writeFileSync } from 'node:fs'
import {
  type APIRequestContext,
  expect,
  type Locator,
  type Page,
  request,
  test,
} from '@playwright/test'
import { login, rowButton } from '../../dashboard/e2e/helpers'
import {
  call,
  chequeMethods,
  type Headers,
  type Json,
  list,
  orderCustomerEmail,
  skus,
  variantId,
} from './orders'
import { admin } from './staff'

/**
 * Batch 8's §2.5 for part 1: each setting other batches handed to "batch 8,
 * on real orders" is saved through its dashboard screen as the admin, then
 * seen, or not, on an order made for it, with a capture of each side and what
 * the server answered. Start the screens as `compare.spec.ts` describes, with
 * Spree's sample catalog loaded, as `screens-batch-8.spec.ts` needs.
 *
 * Each check puts the store back as it found it: the order number prefix, the
 * store's capture setting, the Europe market's tax setting and the tax rates
 * it added. The reasons, the promotion, the gift card and the store credit it
 * adds stay, named "Fidelity", since Spree keeps what orders used. The order
 * number's draft is deleted; the drafts holding a code, a gift card or store
 * credit stay drafts; the other orders are placed.
 *
 * Captures go to `results/orders-settings/<setting>/<step>.png`, with
 * `answers.json` beside them.
 */

const results = new URL('./results/orders-settings/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const run = Date.now().toString().slice(-5)

type Api = { api: APIRequestContext; headers: Headers; storeId: string }

let context: Api
let customerId: string
let toaster: string
let cheque: string

test.use({ viewport: { width: 1280, height: 960 } })
test.describe.configure({ mode: 'serial' })

const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()

const folder = (setting: string) => {
  const path = `${results}${setting}/`
  mkdirSync(path, { recursive: true })
  return path
}

/** The market's "Prices include tax" switch; its id names Base UI's hidden input. */
const taxInclusive = (page: Page) =>
  page
    .locator('[data-slot="field"]')
    .filter({ hasText: /prices include tax/i })
    .getByRole('switch')

/** Shows a part of the page in the middle of the window and captures the window. */
async function shot(page: Page, setting: string, step: string, target?: Locator) {
  if (target) await target.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${folder(setting)}${step}.png` })
}

const record = (setting: string, answers: object) =>
  writeFileSync(`${folder(setting)}answers.json`, JSON.stringify({ revision, ...answers }, null, 2))

const go = async (page: Page, path: string) => {
  await page.goto(`/${context.storeId}${path}`)
  await page.waitForLoadState('networkidle')
}

const openOrder = async (page: Page, order: Json) => {
  await go(page, `/orders/${order.id}`)
  await expect(page.getByRole('heading', { name: order.number as string })).toBeVisible({
    timeout: 15_000,
  })
}

const api = (method: 'get' | 'post' | 'patch' | 'delete', path: string, data?: object) =>
  call(context.api, context.headers, method, path, data)

const draftFor = (data: object = {}) =>
  api('post', 'orders', {
    customer_id: customerId,
    use_customer_default_address: true,
    items: [{ variant_id: toaster, quantity: 1 }],
    ...data,
  })

/** Pays the order's balance by cheque and completes it, as staff do on DA-ORD-04. */
async function place(order: Json, method = cheque) {
  const current = await api('get', `orders/${order.id}`)
  await api('post', `orders/${order.id}/payments`, {
    payment_method_id: method,
    amount: current.amount_due,
  })
  return api('patch', `orders/${order.id}/complete`, {})
}

const paymentsOf = async (order: Json) =>
  ((await api('get', `orders/${order.id}/payments`)).data as Json[]).map((payment) => ({
    number: payment.number,
    method: payment.payment_method_name ?? payment.payment_method_id,
    status: payment.status,
    amount: payment.amount,
  }))

const storeSettings = async (page: Page) => {
  await go(page, '/settings/store')
  const prefix = page.locator('#store-order-number-prefix')
  await expect(prefix).not.toHaveValue('', { timeout: 15_000 })
  return prefix
}

const saveStore = async (page: Page) => {
  const save = page.getByRole('button', { name: /^save$/i })
  await save.click()
  await expect(save).toBeDisabled({ timeout: 15_000 })
}

test.beforeAll(async ({ baseURL }) => {
  const api = await request.newContext({ baseURL })
  const { creds, headers } = await admin(api)
  context = { api, headers, storeId: creds.store_id }
  const [customer] = await list(
    api,
    headers,
    `customers?q[email_eq]=${encodeURIComponent(orderCustomerEmail)}`,
  )
  customerId = customer.id
  toaster = await variantId(api, headers, skus.toaster)
  cheque = (await chequeMethods(baseURL ?? 'http://localhost:5174', api, headers)).cheque
})

test.afterAll(async () => {
  await context?.api.dispose()
})

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('order number format', async ({ page }) => {
  const prefix = await storeSettings(page)
  const original = await prefix.inputValue()
  await prefix.fill('FID-')
  await saveStore(page)
  await shot(page, 'order-number', '1-prefix-saved', card(page, /^order numbers$/i))

  const order = await draftFor()
  await openOrder(page, order)
  await shot(page, 'order-number', '2-new-order')
  await api('delete', `orders/${order.id}`)

  const restored = await storeSettings(page)
  await restored.fill(original)
  await saveStore(page)
  record('order-number', { prefix: 'FID-', number: order.number, restoredTo: original })
  expect(order.number).toMatch(/^FID-/)
})

test('cancellation reasons', async ({ page }) => {
  const reason = 'Fidelity duplicate order'
  await go(page, '/settings/reasons')
  const reasons = card(page, /^order cancellation reasons$/i)
  await expect(reasons).toBeVisible({ timeout: 15_000 })
  if ((await reasons.getByText(reason, { exact: true }).count()) === 0) {
    await reasons.getByRole('button', { name: /add reason/i }).click()
    await page.locator('#reason-name').fill(reason)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^create$/i })
      .click()
    await expect(reasons.getByText(reason, { exact: true })).toBeVisible({ timeout: 15_000 })
  }
  await shot(page, 'cancellation-reasons', '1-reason-saved', reasons)

  const order = await place(await draftFor())
  await openOrder(page, order)
  await page.getByRole('button', { name: 'More actions' }).click()
  await page.getByRole('menuitem', { name: 'Cancel order' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('combobox', { name: 'Reason' }).click()
  await page.getByRole('option', { name: reason }).click()
  await shot(page, 'cancellation-reasons', '2-reason-chosen')
  await dialog.getByRole('button', { name: 'Cancel order' }).click()
  await expect(dialog).toBeHidden({ timeout: 15_000 })
  const summary = card(page, /^summary$/i)
  await expect(summary.getByText(reason)).toBeVisible({ timeout: 15_000 })
  await shot(page, 'cancellation-reasons', '3-order-canceled', summary)

  const canceled = await api('get', `orders/${order.id}`)
  record('cancellation-reasons', {
    reason,
    order: order.number,
    status: canceled.status,
    cancel_reason_name: canceled.cancel_reason_name,
  })
})

test('a payment captured later', async ({ page }) => {
  await storeSettings(page)
  const radios = page.getByRole('radio')
  const original = await radios.evaluateAll((all) =>
    all.findIndex((radio) => radio.getAttribute('aria-checked') === 'true'),
  )
  await page.getByRole('radio', { name: /^manually/i }).click()
  await saveStore(page)
  await shot(
    page,
    'capture-later',
    '1-store-captures-manually',
    page.getByRole('radio', { name: /^manually/i }),
  )

  const order = await place(await draftFor())
  const before = await paymentsOf(order)
  await openOrder(page, order)
  const payments = card(page, /^payments/i)
  await shot(page, 'capture-later', '2-payment-authorized', payments)
  await payments
    .getByRole('button', { name: /actions/i })
    .first()
    .click()
  await page.getByRole('menuitem', { name: 'Capture' }).click()
  const confirm = page.getByRole('alertdialog').or(page.getByRole('dialog')).first()
  await confirm.getByRole('button', { name: /^capture/i }).click()
  await expect(confirm).toBeHidden({ timeout: 15_000 })
  await expect(payments.getByText(/completed/i).first()).toBeVisible({ timeout: 15_000 })
  await shot(page, 'capture-later', '3-payment-captured', payments)
  const after = await paymentsOf(order)
  const placed = await api('get', `orders/${order.id}`)

  await storeSettings(page)
  if (original >= 0) await page.getByRole('radio').nth(original).click()
  await saveStore(page)
  record('capture-later', {
    order: order.number,
    before,
    after,
    payment_status: placed.payment_status,
  })
})

test('taxes added and included', async ({ page }) => {
  const rates = [
    {
      name: `Fidelity California sales tax ${run}`,
      percent: '7.25',
      country: 'United States',
      state: 'California',
    },
    { name: `Fidelity Germany VAT ${run}`, percent: '19', country: 'Germany' },
  ]
  await go(page, '/settings/taxes/rates')
  for (const rate of rates) {
    await page.getByRole('button', { name: /add tax rate/i }).click()
    await page.locator('#name').fill(rate.name)
    await page.locator('#rate_percent').fill(rate.percent)
    await page.locator('#tax_category_id').click()
    await page.getByRole('option', { name: /^default$/i }).click()
    await page.getByRole('combobox', { name: /^country$/i }).click()
    await page.getByPlaceholder(/^search countries/i).fill(rate.country)
    await page.getByRole('option', { name: rate.country }).first().click()
    if (rate.state) {
      await page.getByRole('combobox', { name: /^state/i }).click()
      await page.keyboard.type(rate.state)
      await page.getByRole('option', { name: rate.state }).first().click()
    }
    await page.getByRole('button', { name: /create tax rate/i }).click()
    await expect(rowButton(page, rate.name)).toBeVisible({ timeout: 15_000 })
  }
  await shot(page, 'taxes', '1-rates-saved')

  await go(page, '/settings/markets')
  await rowButton(page, 'Europe').click()
  const inclusive = taxInclusive(page)
  await expect(inclusive).toBeVisible({ timeout: 15_000 })
  const wasInclusive = (await inclusive.getAttribute('aria-checked')) === 'true'
  if (!wasInclusive) await inclusive.click()
  await shot(page, 'taxes', '2-europe-prices-include-tax', inclusive)
  await page.getByRole('button', { name: /^save$/i }).click()
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 })

  const answers: Record<string, unknown> = { rates: rates.map((rate) => rate.name) }
  try {
    const added = await place(
      await api('post', 'orders', {
        email: 'fidelity-tax-added@example.com',
        items: [{ variant_id: toaster, quantity: 1 }],
        shipping_address: {
          first_name: 'Casey',
          last_name: 'Rivera',
          address1: '500 Mission Street',
          city: 'San Francisco',
          country_code: 'US',
          state_code: 'CA',
          postal_code: '94105',
          phone: '4155550142',
        },
        use_shipping_as_billing: true,
      }),
    )
    const markets = await list(context.api, context.headers, 'markets')
    const europe = markets.find((market) => market.name === 'Europe') as Json
    const included = await place(
      await api('post', 'orders', {
        email: 'fidelity-tax-included@example.com',
        currency: 'EUR',
        market_id: europe.id,
        items: [{ variant_id: toaster, quantity: 1 }],
        shipping_address: {
          first_name: 'Jonas',
          last_name: 'Weber',
          address1: 'Unter den Linden 5',
          city: 'Berlin',
          country_code: 'DE',
          postal_code: '10117',
          phone: '+49305550142',
        },
        use_shipping_as_billing: true,
      }),
    )
    for (const [step, order] of [
      ['3-order-tax-added', added],
      ['4-order-tax-included', included],
    ] as const) {
      await openOrder(page, order)
      await shot(page, 'taxes', `${step}-lines`, card(page, /^taxes$/i))
      await shot(page, 'taxes', `${step}-summary`, card(page, /^summary$/i))
      const placed = await api('get', `orders/${order.id}`)
      answers[step] = {
        order: order.number,
        currency: placed.currency,
        item_total: placed.item_total,
        tax_total: placed.tax_total,
        included_tax_total: placed.included_tax_total,
        additional_tax_total: placed.additional_tax_total,
        total: placed.total,
      }
    }
  } finally {
    await go(page, '/settings/markets')
    await rowButton(page, 'Europe').click()
    const reset = taxInclusive(page)
    await expect(reset).toBeVisible({ timeout: 15_000 })
    if ((await reset.getAttribute('aria-checked')) === 'true' && !wasInclusive) {
      await reset.click()
      await page.getByRole('button', { name: /^save$/i }).click()
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 })
    }
    for (const rate of await list(context.api, context.headers, 'tax_rates')) {
      if (rates.some((made) => made.name === rate.name)) await api('delete', `tax_rates/${rate.id}`)
    }
    record('taxes', answers)
  }
})

test('a promotion with a code', async ({ page }) => {
  const name = `Fidelity free shipping ${run}`
  const code = `FIDSHIP${run}`
  await go(page, '/promotions')
  await page.getByRole('button', { name: /new promotion/i }).click()
  await expect(page.getByRole('heading', { name: /^new promotion$/i })).toBeVisible({
    timeout: 15_000,
  })
  await page.locator('#name').fill(name)
  await page.locator('#code').fill(code)
  await page.getByRole('button', { name: /^add action$/i }).click()
  await page.getByRole('button', { name: /^free shipping\b/i }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^(save|add)$/i })
    .click()
  await page.getByRole('button', { name: /^create promotion$/i }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 15_000 })
  await shot(page, 'promotion-code', '1-promotion-saved')

  const order = await draftFor()
  await openOrder(page, order)
  const sidebar = card(page, /^discounts & credit$/i)
  await sidebar.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await sidebar.getByRole('button', { name: 'Apply' }).first().click()
  await page.locator('#coupon-code').fill(code)
  await page.getByRole('dialog').getByRole('button', { name: 'Apply' }).click()
  await expect(sidebar.getByText(new RegExp(code, 'i'))).toBeVisible({ timeout: 15_000 })
  await shot(page, 'promotion-code', '2-code-applied', sidebar)
  await shot(page, 'promotion-code', '3-summary', card(page, /^summary$/i))
  const placed = await place(order)
  const after = await api('get', `orders/${placed.id}`)
  record('promotion-code', {
    promotion: name,
    order: order.number,
    coupon_code: after.coupon_code,
    discount_total: after.discount_total,
    delivery_total: after.delivery_total,
    total: after.total,
  })
})

test('a gift card and store credit', async ({ page }) => {
  const code = `FIDELITY-SCREEN-${run}`
  const memo = `Fidelity batch 8 credit ${run}`
  await go(page, '/loyalty/gift-cards')
  await page.getByRole('button', { name: /new gift card/i }).click()
  await page.locator('#code').fill(code)
  await page.locator('#amount').fill('25.00')
  await page.getByRole('button', { name: /create gift card/i }).click()
  await expect(page.getByText(new RegExp(code, 'i')).first()).toBeVisible({ timeout: 15_000 })
  await shot(page, 'gift-card-and-credit', '1-gift-card-saved')

  await go(page, '/loyalty/store-credits')
  await page.getByRole('button', { name: /issue store credit/i }).click()
  const issue = page.getByRole('dialog')
  await issue.getByPlaceholder(/search customers/i).fill(orderCustomerEmail)
  await page
    .getByRole('option', { name: new RegExp(orderCustomerEmail) })
    .first()
    .click()
  await issue.getByLabel(/amount/i).fill('10')
  await issue.getByLabel(/memo/i).fill(memo)
  await issue.getByRole('button', { name: /^issue store credit$/i }).click()
  await expect(page.getByRole('dialog').getByText(memo)).toBeVisible({ timeout: 15_000 })
  await shot(page, 'gift-card-and-credit', '2-store-credit-issued')

  const order = await draftFor({ items: [{ variant_id: toaster, quantity: 2 }] })
  await openOrder(page, order)
  const sidebar = card(page, /^discounts & credit$/i)
  await sidebar.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await sidebar.getByRole('button', { name: 'Apply' }).last().click()
  await page.locator('#gift-card-code').fill(code)
  await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click()
  await expect(sidebar.getByText(new RegExp(code, 'i'))).toBeVisible({ timeout: 15_000 })
  await shot(page, 'gift-card-and-credit', '3-gift-card-applied', sidebar)

  // Spree takes a gift card or store credit on an order, not both, so the
  // credit is chosen here, refused, and then applied to a second draft.
  const payments = card(page, /^payments/i)
  const addCredit = async (amount?: string) => {
    await payments.evaluate((element) => element.scrollIntoView({ block: 'center' }))
    await payments.getByRole('button', { name: /^add$/i }).click()
    const add = page.getByRole('dialog')
    await add.locator('#pay-method').click()
    await page.getByRole('option', { name: /store credit/i }).click()
    if (amount) await add.getByLabel(/^amount$/i).fill(amount)
    await add.getByRole('button', { name: /^add$/i }).click()
    return add
  }
  const refused = await addCredit()
  await page.waitForTimeout(2000)
  await expect(refused).toBeVisible()
  await shot(page, 'gift-card-and-credit', '4-store-credit-refused')
  const answer = await context.api.post(`/api/v3/admin/orders/${order.id}/store_credits`, {
    headers: context.headers,
    data: { amount: '10.00' },
  })
  const refusal = { status: answer.status(), body: await answer.json() }
  await refused.getByRole('button', { name: /^cancel$/i }).click()
  const withCard = await api('get', `orders/${order.id}`)

  const second = await draftFor({ items: [{ variant_id: toaster, quantity: 1 }] })
  await openOrder(page, second)
  const applied = await addCredit('10.00')
  await expect(applied).toBeHidden({ timeout: 15_000 })
  await shot(page, 'gift-card-and-credit', '5-store-credit-applied', payments)
  await shot(page, 'gift-card-and-credit', '6-summary', card(page, /^summary$/i))
  const withCredit = await api('get', `orders/${second.id}`)
  record('gift-card-and-credit', {
    code,
    giftCardOrder: {
      order: order.number,
      gift_card_total: withCard.gift_card_total,
      amount_due: withCard.amount_due,
      total: withCard.total,
      payments: await paymentsOf(order),
      storeCreditRefused: refusal,
    },
    storeCreditOrder: {
      order: second.number,
      store_credit_total: withCredit.store_credit_total,
      amount_due: withCredit.amount_due,
      total: withCredit.total,
      payments: await paymentsOf(second),
    },
  })
})
