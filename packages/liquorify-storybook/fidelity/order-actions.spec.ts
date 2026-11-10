import { readFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import {
  addRecordFilter,
  getCredentials,
  login,
  narrowQuickFilter,
} from '../../dashboard/e2e/helpers'
import { chequeMethods } from './orders'
import {
  answeredEmpty,
  blockOutside,
  confirmation,
  expectFailureWhenSabotaged,
  openIn,
  recorder,
  reload,
  type Seed,
  type Steps,
  sabotage,
  sabotaged,
  seeded,
  stamp,
  toast,
  withBody,
} from './p9'

/**
 * The platform batch's step P11, part 2, G-90: the order actions batch 8's
 * part 1 captured but no browser test drives, as browser tests (actions 2.1 to
 * 2.21 of the work item). Each drives the dashboard as the browser tests'
 * admin and asserts what the screen shows and, after a reload, what was kept.
 *
 * Every test first adds its own records through the Admin API, named with the
 * run's stamp: a product stocked everywhere and backorderable, a customer with
 * default addresses, and the orders it opens, paid with Spree's cheque methods
 * so no provider is called. With `P11_SABOTAGE=1` each test is expected to
 * fail, and the browser undoes the change the test then looks for.
 *
 * Known defects and held behaviours fail where they stand, with the checks
 * before them recorded: SD-34 where a test adds up the Summary card's rows,
 * part 1's B10 (2.9), B13 (2.17) and B14 (2.20), and SD-32 (2.21).
 */

const { snap, save } = recorder('orders', 'p11')

const named = (name: string) => `P11 ${name} ${stamp}`
const skuOf = (name: string) => `P11-${name.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${stamp}`
const emailOf = (name: string) =>
  `p11-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${stamp}@example.com`

let storeId = ''

test.beforeAll(() => {
  storeId = getCredentials().store_id
})

test.beforeEach(async ({ page }) => {
  test.setTimeout(180_000)
  await login(page)
})

// --- Records each test starts from -----------------------------------------

interface Product {
  name: string
  sku: string
  productId: string
  variantId: string
}

interface Order {
  id: string
  number: string
}

const address = {
  first_name: 'River',
  last_name: 'Okafor',
  address1: '214 Larkspur Lane',
  city: 'Portland',
  country_code: 'US',
  state_code: 'OR',
  postal_code: '97205',
  phone: '5035550142',
}

/** A product of one variant at this price, stocked at every location and backorderable. */
async function product(seed: Seed, label: string, price = '20.00'): Promise<Product> {
  const name = named(label)
  const sku = skuOf(label)
  const created = await seed.post<{ id: string; default_variant_id: string }>('products', {
    name,
    status: 'active',
    prices: [{ amount: price, currency: 'USD' }],
  })
  await seed.patch(`products/${created.id}/variants/${created.default_variant_id}`, { sku })
  const { data } = await seed.get<{ data: { id: string }[] }>('stock_locations?limit=100')
  await seed.post('stock_levels/bulk_upsert', {
    stock_levels: data.map((location) => ({
      variant_id: created.default_variant_id,
      stock_location_id: location.id,
      count_on_hand: 50,
      backorderable: true,
    })),
  })
  return { name, sku, productId: created.id, variantId: created.default_variant_id }
}

/** A customer with one address, their default for billing and shipping. */
async function customer(seed: Seed, label: string) {
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

interface Shop {
  customer: { id: string; email: string }
  product: Product
  methods: { cheque: string; later: string }
}

/** A customer and a product, with the cheque methods, for a test's orders. */
async function shop(seed: Seed, label: string, baseURL: string): Promise<Shop> {
  return {
    customer: await customer(seed, label),
    product: await product(seed, label),
    methods: await chequeMethods(baseURL, seed.api, seed.headers),
  }
}

async function draft(seed: Seed, at: Shop, quantity = 1, data: object = {}) {
  return seed.post<Order>('orders', {
    customer_id: at.customer.id,
    use_customer_default_address: true,
    items: [{ variant_id: at.product.variantId, quantity }],
    ...data,
  })
}

/** Pays the order's balance by this cheque method and places it. */
async function placed(
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

const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog'))

/** A card on the order page, found by its title. */
const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()

const moreActions = (page: Page) => page.getByRole('button', { name: 'More actions' })

async function openOrder(page: Page, order: Order) {
  await openIn(page, storeId, `/orders/${order.id}`)
  await expect(page.getByRole('heading', { name: order.number })).toBeVisible({
    timeout: 15_000,
  })
}

/** The text of a row of a card, found by its label, such as the Summary card's Total. */
async function rowValue(scope: Locator, label: string) {
  const row = scope
    .locator('div, tr, dl > *')
    .filter({ has: scope.page().getByText(label, { exact: true }) })
    .last()
  await expect(row).toBeVisible({ timeout: 15_000 })
  return ((await row.innerText()).replace(label, '').match(/-?\$[\d,]+\.\d{2}/) ?? [''])[0]
}

const money = (text: string) => Number(text.replace(/[$,]/g, ''))

/** The Summary card's money rows, by their labels, as numbers. */
async function summary(page: Page) {
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
const addsUp = (rows: Record<string, number>) =>
  Math.abs(
    (rows.Subtotal ?? 0) +
      (rows.Shipping ?? 0) +
      (rows.Promotions ?? 0) +
      (rows.Adjustments ?? 0) +
      (rows['Tax (additional)'] ?? 0) -
      (rows.Total ?? 0),
  ) < 0.005

/** The order's total from the Admin API, for a check of what the screen shows. */
const totalOf = async (baseURL: string | undefined, order: Order) =>
  seeded(baseURL, async (seed) =>
    money(String((await seed.get<{ total: string }>(`orders/${order.id}`)).total)),
  )

// --- 2.1 and 2.2: completing a draft and canceling an order ----------------

test.describe('drafts and cancellation (P11, G-90)', () => {
  test('2.1 completing a draft from its page', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/orders\/[^/]+\/complete$/, answeredEmpty)
    const order = await seeded(baseURL, async (seed) => {
      const at = await shop(seed, 'Complete draft', baseURL as string)
      const made = await draft(seed, at)
      const current = await seed.get<{ amount_due: string }>(`orders/${made.id}`)
      await seed.post(`orders/${made.id}/payments`, {
        payment_method_id: at.methods.cheque,
        amount: current.amount_due,
      })
      return made
    })

    await openOrder(page, order)
    await page.getByRole('button', { name: 'Complete Order' }).click()
    await expect(page.getByText('Complete this draft order now?')).toBeVisible()
    await confirmation(page).getByRole('button', { name: 'Complete Order' }).click()
    await expect(toast(page, 'Order completed')).toBeVisible({ timeout: 15_000 })

    await reload(page)
    const placedNumber = (await page.getByRole('heading', { level: 1 }).first().innerText()).trim()
    const completed = await page
      .getByText(/^Completed/)
      .first()
      .isVisible()
    const completeOffered = await page.getByRole('button', { name: 'Complete Order' }).isVisible()
    await snap(page, 'draft-completed')

    await openIn(page, storeId, `/orders/drafts?search=${encodeURIComponent(order.number)}`)
    const inDrafts = await page.getByRole('row').filter({ hasText: order.number }).count()
    await openIn(page, storeId, `/orders?search=${encodeURIComponent(order.number)}`)
    const inOrders = page.getByRole('row').filter({ hasText: order.number })
    await expect(inOrders.or(page.getByText(/no orders/i).first())).toBeVisible({ timeout: 15_000 })
    const listed = await inOrders.count()
    const steps: Steps = [
      {
        step: 'completed the draft from its page and reloaded it',
        number: placedNumber,
        completedShown: completed,
        completeStillOffered: completeOffered,
      },
      { step: 'searched the drafts and the orders for its number', inDrafts, inOrders: listed },
    ]
    await save(page, 'draft-completed', steps, outside)
    expect(completed, 'the order shows when it was completed').toBe(true)
    expect(completeOffered).toBe(false)
    expect(placedNumber).toBe(order.number)
    expect(inDrafts, 'the order is no longer a draft').toBe(0)
    expect(listed, 'the order is in the orders list').toBe(1)
  })

  test('2.2 canceling a placed order with a reason, a note, a refund and the email choice', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    const reason = named('Cancel reason')
    const note = `Asked by phone to stop it, ${stamp}.`
    await sabotage(
      page,
      'PATCH',
      /\/orders\/[^/]+\/cancel$/,
      withBody((body) => ({ ...body, cancel_note: undefined, refund_payments: false })),
    )
    const order = await seeded(baseURL, async (seed) => {
      await seed.post('order_cancellation_reasons', { name: reason })
      return placed(seed, await shop(seed, 'Cancel order', baseURL as string))
    })

    await openOrder(page, order)
    await moreActions(page).click()
    await page.getByRole('menuitem', { name: 'Cancel order' }).click()
    const open = dialog(page)
    await open.getByRole('combobox', { name: 'Reason' }).click()
    await page.getByRole('option', { name: reason }).click()
    await open.getByLabel('Note').fill(note)
    const refund = open.getByRole('checkbox', { name: /refund the customer/i })
    if (!(await refund.isChecked())) await refund.click()
    const email = open.getByRole('checkbox', { name: /email the customer/i })
    if (await email.isChecked()) await email.click()
    const emailChoice = await email.isChecked()
    await open.getByRole('button', { name: /^cancel order$/i }).click()
    await expect(toast(page, 'Order canceled')).toBeVisible({ timeout: 15_000 })

    await reload(page)
    const summaryCard = card(page, /^summary$/i)
    await expect(summaryCard).toBeVisible({ timeout: 15_000 })
    const summaryText = await summaryCard.innerText()
    const payments = card(page, /^payments/i)
    await expect(payments).toBeVisible()
    const paymentsText = await payments.innerText()
    await snap(page, 'order-canceled')
    const steps: Steps = [
      {
        step: 'canceled the order with a reason, a note, a refund and no email, then reloaded it',
        emailChosen: emailChoice,
        canceledShown: /canceled at/i.test(summaryText),
        reasonShown: summaryText.includes(reason),
        noteShown: summaryText.includes(note),
        payments: paymentsText.replace(/\s+/g, ' ').slice(0, 400),
      },
    ]
    await save(page, 'order-canceled', steps, outside)
    expect(summaryText).toMatch(/canceled at/i)
    expect(summaryText).toContain(reason)
    expect(summaryText, 'the cancellation note is kept').toContain(note)
    expect(paymentsText, 'the refund is recorded against the payment').toMatch(/refund|void/i)
    expect(emailChoice).toBe(false)
  })
})

// --- 2.3 to 2.5: payments --------------------------------------------------

test.describe('payments (P11, G-90)', () => {
  test('2.4 capturing an authorized payment, and voiding another', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/payments\/[^/]+\/(capture|void)$/, answeredEmpty)
    // Two orders, each with one payment to collect later: Spree keeps one
    // checkout payment for each method on an order.
    const [toCapture, toVoid] = await seeded(baseURL, async (seed) => {
      const at = await shop(seed, 'Capture and void', baseURL as string)
      return [
        await placed(seed, at, { method: 'later' }),
        await placed(seed, at, { method: 'later' }),
      ]
    })
    const paymentRow = (page: Page) =>
      card(page, /^payments/i)
        .getByRole('row')
        .nth(1)
    const act = async (order: Order, action: 'Capture' | 'Void') => {
      await openOrder(page, order)
      const payments = card(page, /^payments/i)
      const before = (await paymentRow(page).innerText()).replace(/\s+/g, ' ')
      await payments
        .getByRole('button', { name: /actions/i })
        .first()
        .click()
      await page.getByRole('menuitem', { name: action }).click()
      await confirmation(page).getByRole('button', { name: action }).click()
      await page.waitForLoadState('networkidle')
      await reload(page)
      await expect(paymentRow(page)).toBeVisible({ timeout: 15_000 })
      return {
        before,
        after: (await paymentRow(page).innerText()).replace(/\s+/g, ' '),
        paymentStatus: (
          (await page.locator('[data-slot="status-badge"]').first().textContent()) ?? ''
        ).trim(),
      }
    }
    const captured = await act(toCapture, 'Capture')
    await snap(page, 'payment-captured')
    const voided = await act(toVoid, 'Void')
    await snap(page, 'payment-voided')
    const steps: Steps = [
      { step: "captured the first order's authorized payment, then reloaded", ...captured },
      { step: "voided the second order's authorized payment, then reloaded", ...voided },
    ]
    await save(page, 'payment-captured-and-voided', steps, outside)
    expect(captured.before).toMatch(/pending|authorized/i)
    expect(captured.after, 'the captured payment shows completed').toMatch(/completed/i)
    expect(captured.paymentStatus, "the order's payment status follows the capture").toMatch(
      /^paid$/i,
    )
    expect(voided.after, 'the voided payment shows void').toMatch(/void/i)
  })

  test('2.5 adding a payment, and choosing a method that needs a saved card', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'POST', /\/orders\/[^/]+\/payments$/, answeredEmpty)
    const { order, guest } = await seeded(baseURL, async (seed) => {
      const at = await shop(seed, 'Add payment', baseURL as string)
      const made = await seed.patch<Order>(`orders/${(await draft(seed, at)).id}/complete`, {
        notify_customer: false,
        payment_pending: true,
      })
      const guestOrder = await seed.post<Order>('orders', {
        email: emailOf('Guest payment'),
        shipping_address: address,
        billing_address: address,
        items: [{ variant_id: at.product.variantId, quantity: 1 }],
      })
      return { order: made, guest: guestOrder }
    })

    await openOrder(page, order)
    const payments = card(page, /^payments/i)
    await payments.getByRole('button', { name: /^add$/i }).click()
    let open = dialog(page)
    await open.getByRole('combobox', { name: /payment method/i }).click()
    await page
      .getByRole('option', { name: /^p9 cheque$|cheque$/i })
      .first()
      .click()
    await open.getByLabel('Amount').fill('7.50')
    await open.getByRole('button', { name: /^add$/i }).click()
    await expect(open).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const listed = await payments.getByRole('row').filter({ hasText: '$7.50' }).count()
    await snap(page, 'payment-added')

    // A method that needs a saved card: the customer has none.
    await payments.getByRole('button', { name: /^add$/i }).click()
    open = dialog(page)
    await open.getByRole('combobox', { name: /payment method/i }).click()
    await page.getByRole('option', { name: /test gateway/i }).click()
    const noCards = await open
      .getByText('Customer has no saved cards for this payment method.')
      .isVisible()
    const addEnabledNoCard = await open.getByRole('button', { name: /^add$/i }).isEnabled()
    await snap(page, 'payment-no-saved-card')
    await open.getByRole('button', { name: 'Cancel' }).click()

    // The same method on an order with no customer.
    await openOrder(page, guest)
    await card(page, /^payments/i)
      .getByRole('button', { name: /^add$/i })
      .click()
    open = dialog(page)
    await open.getByRole('combobox', { name: /payment method/i }).click()
    await page.getByRole('option', { name: /test gateway/i }).click()
    const needsCustomer = await open
      .getByText(
        'This payment method requires a saved source. Assign a customer to the order first.',
      )
      .isVisible()
    const addEnabledNoCustomer = await open.getByRole('button', { name: /^add$/i }).isEnabled()
    await snap(page, 'payment-no-customer')
    const steps: Steps = [
      { step: 'added a cheque payment of $7.50 and reloaded', paymentsOf750: listed },
      {
        step: 'chose the test gateway for a customer with no saved card',
        saysNoSavedCards: noCards,
        addEnabled: addEnabledNoCard,
      },
      {
        step: 'chose the test gateway on an order with no customer',
        saysAssignACustomer: needsCustomer,
        addEnabled: addEnabledNoCustomer,
      },
    ]
    await save(page, 'payment-added', steps, outside)
    expect(listed, 'the new payment is listed with its amount').toBe(1)
    expect(noCards).toBe(true)
    expect(addEnabledNoCard).toBe(false)
    expect(needsCustomer).toBe(true)
    expect(addEnabledNoCustomer).toBe(false)
  })
})

// --- 2.6 to 2.8: discounts, fees and codes ---------------------------------

test.describe('discounts, fees and codes (P11, G-90)', () => {
  test('2.6 adding a manual discount by amount and by percent, then deleting one', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'POST', /\/orders\/[^/]+\/discounts$/, answeredEmpty)
    const order = await seeded(baseURL, async (seed) =>
      draft(seed, await shop(seed, 'Manual discounts', baseURL as string), 2),
    )

    await openOrder(page, order)
    const before = await totalOf(baseURL, order)
    const discounts = card(page, /^discounts$/i)
    const add = async (label: string, value: string, percent: boolean) => {
      await discounts.getByRole('button', { name: /add discount/i }).click()
      const open = dialog(page)
      await open.getByLabel(/^label$/i).fill(label)
      await open.getByLabel(/^value$/i).fill(value)
      if (percent) {
        await open
          .getByRole('group')
          .filter({ has: page.getByText('Type', { exact: true }) })
          .getByRole('combobox')
          .click()
        await page.getByRole('option', { name: 'Percent' }).click()
      }
      await open.getByRole('button', { name: /^add discount$/i }).click()
      await expect(open).toBeHidden({ timeout: 15_000 })
    }
    await add('P11 goodwill', '5', false)
    await add('P11 trial', '10', true)

    await reload(page)
    const listedBoth = (await discounts.innerText()).replace(/\s+/g, ' ')
    const totalWithBoth = money(await rowValue(card(page, /^summary$/i), 'Total'))
    const rowsWithBoth = await summary(page)
    await snap(page, 'discounts-added')
    // Checked here as well, so a run where it did not happen stops at this check.
    expect(listedBoth).toContain('P11 goodwill')
    expect(totalWithBoth).toBeLessThan(before - 5)

    await discounts
      .getByRole('row')
      .filter({ hasText: 'P11 goodwill' })
      .getByRole('button', { name: 'Actions' })
      .click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await confirmation(page).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('row').filter({ hasText: 'P11 goodwill' })).toBeHidden({
      timeout: 15_000,
    })
    await reload(page)
    const listedAfter = (await discounts.innerText()).replace(/\s+/g, ' ')
    const totalAfter = money(await rowValue(card(page, /^summary$/i), 'Total'))
    const rowsAfter = await summary(page)
    await snap(page, 'discount-deleted')
    // Ten percent of two items at $20.00, after the $5.00 discount or not, is about $4.00.
    const steps: Steps = [
      { step: 'read the draft before any discount', total: before },
      {
        step: 'added $5.00 off and 10% off, then reloaded',
        discounts: listedBoth,
        total: totalWithBoth,
        summaryRows: rowsWithBoth,
        rowsAddUp: addsUp(rowsWithBoth),
      },
      {
        step: 'deleted the $5.00 discount, then reloaded',
        discounts: listedAfter,
        total: totalAfter,
        summaryRows: rowsAfter,
        rowsAddUp: addsUp(rowsAfter),
      },
    ]
    await save(page, 'discounts-added', steps, outside)
    expect(listedBoth).toContain('P11 goodwill')
    expect(listedBoth).toContain('P11 trial')
    expect(totalWithBoth, 'the total falls by both discounts').toBeLessThan(before - 5)
    expect(listedAfter).not.toContain('P11 goodwill')
    expect(totalAfter, 'deleting one restores its $5.00').toBeCloseTo(totalWithBoth + 5, 1)
    // SD-34: the rows above the total count the discounts twice.
    expect(addsUp(rowsAfter), "the Summary card's rows add up to its total").toBe(true)
  })

  test('2.7 adding a fee, then deleting it', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'POST', /\/orders\/[^/]+\/fees$/, answeredEmpty)
    const order = await seeded(baseURL, async (seed) =>
      draft(seed, await shop(seed, 'Fee', baseURL as string)),
    )

    await openOrder(page, order)
    const before = money(await rowValue(card(page, /^summary$/i), 'Total'))
    const fees = card(page, /^fees$/i)
    await fees.getByRole('button', { name: /add fee/i }).click()
    const open = dialog(page)
    await open.getByLabel(/^label$/i).fill('P11 gift wrap')
    await open.getByLabel(/^amount$/i).fill('4.50')
    await open.getByRole('button', { name: /^add fee$/i }).click()
    await expect(open).toBeHidden({ timeout: 15_000 })

    await reload(page)
    const listed = (await fees.innerText()).replace(/\s+/g, ' ')
    const withFee = money(await rowValue(card(page, /^summary$/i), 'Total'))
    const rowsWithFee = await summary(page)
    await snap(page, 'fee-added')
    // Checked here as well, so a run where it did not happen stops at this check.
    expect(listed).toContain('P11 gift wrap')

    await fees.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await confirmation(page).getByRole('button', { name: 'Delete' }).click()
    await expect(fees.getByText('No fees on this order yet.')).toBeVisible({ timeout: 15_000 })
    await reload(page)
    const after = money(await rowValue(card(page, /^summary$/i), 'Total'))
    const rowsAfter = await summary(page)
    await snap(page, 'fee-deleted')
    const steps: Steps = [
      { step: 'read the draft before the fee', total: before },
      {
        step: 'added a $4.50 fee, then reloaded',
        fees: listed,
        total: withFee,
        summaryRows: rowsWithFee,
        rowsAddUp: addsUp(rowsWithFee),
      },
      {
        step: 'deleted the fee, then reloaded',
        total: after,
        summaryRows: rowsAfter,
        rowsAddUp: addsUp(rowsAfter),
      },
    ]
    await save(page, 'fee-added', steps, outside)
    expect(listed).toContain('P11 gift wrap')
    expect(withFee, 'the total rises by the fee').toBeCloseTo(before + 4.5, 2)
    expect(after, 'deleting it restores the total').toBeCloseTo(before, 2)
    expect(addsUp(rowsWithFee), "the Summary card's rows add up to its total").toBe(true)
  })

  test('2.8 applying a discount code, removing it, and entering a code that is refused', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    const code = `p11off${stamp}`
    await sabotage(page, 'POST', /\/orders\/[^/]+\/discount_codes$/, answeredEmpty)
    const order = await seeded(baseURL, async (seed) => {
      await seed.post('promotions', {
        name: named('Code promotion'),
        kind: 'coupon_code',
        code,
        starts_at: new Date(Date.now() - 86_400_000).toISOString(),
        actions: [
          {
            type: 'create_adjustment',
            calculator: { type: 'flat_rate', preferences: { amount: '6.00' } },
          },
        ],
      })
      return draft(seed, await shop(seed, 'Discount code', baseURL as string), 2)
    })

    await openOrder(page, order)
    const before = money(await rowValue(card(page, /^summary$/i), 'Total'))
    const sidebar = card(page, /^discounts & credit$/i)
    await sidebar.getByRole('button', { name: 'Apply' }).first().click()
    let open = dialog(page)
    await open.getByLabel('Code').fill(code)
    await open.getByRole('button', { name: 'Apply' }).click()
    await expect(open).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const applied = (await sidebar.innerText()).replace(/\s+/g, ' ')
    const withCode = money(await rowValue(card(page, /^summary$/i), 'Total'))
    const rowsWithCode = await summary(page)
    await snap(page, 'discount-code-applied')
    // Checked here as well, so a run where it did not happen stops at this check.
    expect(applied.toLowerCase()).toContain(code.toLowerCase())

    await sidebar.getByRole('button', { name: 'Remove' }).first().click()
    await confirmation(page).getByRole('button', { name: 'Remove' }).click()
    await expect(sidebar.getByText(code, { exact: false })).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const afterRemove = money(await rowValue(card(page, /^summary$/i), 'Total'))

    await sidebar.getByRole('button', { name: 'Apply' }).first().click()
    open = dialog(page)
    await open.getByLabel('Code').fill(`nope${stamp}`)
    await open.getByRole('button', { name: 'Apply' }).click()
    await open
      .getByText(/doesn't exist|does not exist|not found|invalid|not valid/i)
      .waitFor({ timeout: 15_000 })
      .catch(() => undefined)
    const refusal = (await open.innerText()).replace(/\s+/g, ' ')
    await snap(page, 'discount-code-refused')
    await open.getByRole('button', { name: 'Cancel' }).click()
    await reload(page)
    const afterRefused = money(await rowValue(card(page, /^summary$/i), 'Total'))
    const steps: Steps = [
      { step: 'read the draft before the code', total: before },
      {
        step: 'applied the code, then reloaded',
        sidebar: applied,
        total: withCode,
        summaryRows: rowsWithCode,
        rowsAddUp: addsUp(rowsWithCode),
      },
      { step: 'removed the code, then reloaded', total: afterRemove },
      { step: 'entered a code nobody has', dialog: refusal, totalAfterReload: afterRefused },
    ]
    await save(page, 'discount-code', steps, outside)
    expect(applied.toLowerCase()).toContain(code.toLowerCase())
    expect(withCode, 'the code takes its $6.00 off').toBeCloseTo(before - 6, 2)
    expect(afterRemove, 'removing it restores the total').toBeCloseTo(before, 2)
    expect(refusal, "a refused code shows Spree's reason").toMatch(
      /doesn't exist|does not exist|not found|invalid|not valid/i,
    )
    expect(afterRefused).toBeCloseTo(before, 2)
    expect(addsUp(rowsWithCode), "the Summary card's rows add up to its total").toBe(true)
  })
})

// --- 2.11 to 2.13 and 2.15: notes, addresses, the purchase order, the header --

test.describe('the order page (P11, G-90)', () => {
  test('2.11 editing the special instructions and the internal note', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/orders\/[^/]+$/, answeredEmpty)
    const order = await seeded(baseURL, async (seed) =>
      placed(seed, await shop(seed, 'Notes', baseURL as string), {
        data: { customer_note: 'Leave it at the door.', internal_note: 'First order.' },
      }),
    )
    const instructions = `Ring twice, ${stamp}.`
    const internal = `Called back on Tuesday, ${stamp}.`

    await openOrder(page, order)
    for (const [title, text] of [
      [/^special instructions$/i, instructions],
      [/^internal note$/i, internal],
    ] as const) {
      const notes = card(page, title)
      await notes.getByRole('button', { name: 'Edit' }).click()
      await notes.getByRole('textbox').fill(text)
      await notes.getByRole('button', { name: 'Save' }).click()
      await expect(notes.getByRole('textbox')).toBeHidden({ timeout: 15_000 })
    }
    await reload(page)
    const shownInstructions = (await card(page, /^special instructions$/i).innerText()).trim()
    const shownInternal = (await card(page, /^internal note$/i).innerText()).trim()
    await snap(page, 'notes-edited')
    const steps: Steps = [
      {
        step: 'edited both notes and reloaded',
        specialInstructions: shownInstructions,
        internalNote: shownInternal,
      },
    ]
    await save(page, 'notes-edited', steps, outside)
    expect(shownInstructions).toContain(instructions)
    expect(shownInternal).toContain(internal)
  })

  test('2.13 editing the purchase order number and document on a placed order', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/orders\/[^/]+$/, answeredEmpty)
    const order = await seeded(baseURL, async (seed) =>
      placed(seed, await shop(seed, 'Purchase order', baseURL as string), {
        data: { po_number: `P11-PO-OLD-${stamp}` },
      }),
    )
    const number = `P11-PO-${stamp}`

    await openOrder(page, order)
    const purchase = card(page, /^purchase order$/i)
    await purchase.getByRole('button', { name: 'Edit' }).click()
    await purchase.getByLabel('PO number').fill(number)
    await purchase.locator('input[type="file"]').setInputFiles({
      name: `p11-purchase-order-${stamp}.pdf`,
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'),
    })
    await expect(purchase.getByRole('button', { name: 'Save' })).toBeEnabled({ timeout: 30_000 })
    await purchase.getByRole('button', { name: 'Save' }).click()
    await expect(purchase.getByLabel('PO number')).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const shown = (await purchase.innerText()).replace(/\s+/g, ' ')
    await snap(page, 'purchase-order-edited')
    const steps: Steps = [
      { step: 'set the PO number and attached a document, then reloaded', card: shown },
    ]
    await save(page, 'purchase-order-edited', steps, outside)
    expect(shown).toContain(number)
    expect(shown, 'the document is attached').toContain(`p11-purchase-order-${stamp}.pdf`)
  })

  test("2.15 the header's Resend Confirmation and Preview Order", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'POST', /\/orders\/[^/]+\/resend_confirmation$/, (route) =>
      route.fulfill({ status: 422, json: { error: { code: 'sabotaged', message: 'Sabotaged' } } }),
    )
    const order = await seeded(baseURL, async (seed) =>
      placed(seed, await shop(seed, 'Resend', baseURL as string)),
    )

    await openOrder(page, order)
    await moreActions(page).click()
    await page.getByRole('menuitem', { name: 'Resend Confirmation' }).click()
    const sent = await toast(page, 'Confirmation sent')
      .waitFor({ timeout: 15_000 })
      .then(() => true)
      .catch(() => false)
    await snap(page, 'confirmation-resent')

    await moreActions(page).click()
    const popup = page.waitForEvent('popup', { timeout: 10_000 }).catch(() => null)
    const before = page.url()
    await page.getByRole('menuitem', { name: 'Preview Order' }).click()
    const opened = await popup
    await page.waitForTimeout(1_000)
    const previewUrl = opened ? opened.url() : page.url() === before ? null : page.url()
    await snap(page, 'preview-order')
    const steps: Steps = [
      { step: 'chose Resend Confirmation', confirmationSent: sent },
      {
        step: 'chose Preview Order',
        openedPage: previewUrl ? new URL(previewUrl).pathname : null,
      },
    ]
    await save(page, 'header-actions', steps, outside)
    expect(sent, 'the resend is accepted and the screen says so').toBe(true)
    expect(previewUrl, 'Preview opens the order as the customer sees it').not.toBeNull()
  })
})

// --- 2.9 and 2.10: gift cards and store credit ------------------------------

/** The store's store credit payment method, added if it has none. */
async function storeCreditMethod(seed: Seed) {
  const { data } = await seed.get<{ data: { id: string; type: string }[] }>(
    'payment_methods?limit=100',
  )
  const existing = data.find((method) => method.type === 'store_credit')
  if (existing) return existing.id
  return (
    await seed.post<{ id: string }>('payment_methods', {
      name: 'Store credit',
      type: 'store_credit',
      active: true,
      storefront_visible: true,
    })
  ).id
}

test.describe('gift cards and store credit (P11, G-90)', () => {
  test('2.9 applying a gift card, removing it, and entering a card that is refused', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    const code = `p11-gift-${stamp}`
    await sabotage(page, 'POST', /\/orders\/[^/]+\/gift_cards$/, answeredEmpty)
    const order = await seeded(baseURL, async (seed) => {
      await seed.post('gift_cards', { code, amount: '15.00', currency: 'USD' })
      return draft(seed, await shop(seed, 'Gift card', baseURL as string), 2)
    })
    const balance = async () => {
      await openIn(page, storeId, `/loyalty/gift-cards?search=${encodeURIComponent(code)}`)
      const row = page.getByRole('row').filter({ hasText: new RegExp(code, 'i') })
      await expect(row).toBeVisible({ timeout: 15_000 })
      return (await row.innerText()).replace(/\s+/g, ' ')
    }
    const due = async () => (await summary(page))['Outstanding balance']

    const cardBefore = await balance()
    await openOrder(page, order)
    const dueBefore = await due()
    const sidebar = card(page, /^discounts & credit$/i)
    await sidebar.getByRole('button', { name: 'Apply' }).last().click()
    let open = dialog(page)
    await open.getByLabel('Code').fill(code)
    await open.getByRole('button', { name: /^add$/i }).click()
    await expect(open).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const sidebarApplied = (await sidebar.innerText()).replace(/\s+/g, ' ')
    const dueApplied = await due()
    await snap(page, 'gift-card-applied')
    // Checked here as well, so a run where it did not happen stops at this check.
    expect(dueApplied).toBeCloseTo(dueBefore - 15, 2)
    const cardApplied = await balance()

    await openOrder(page, order)
    await sidebar.getByRole('button', { name: 'Remove' }).last().click()
    await confirmation(page).getByRole('button', { name: 'Remove' }).click()
    await expect(sidebar.getByText(/none applied/i).last()).toBeVisible({ timeout: 15_000 })
    await reload(page)
    const dueRemoved = await due()
    const cardRemoved = await balance()

    await openOrder(page, order)
    await sidebar.getByRole('button', { name: 'Apply' }).last().click()
    open = dialog(page)
    await open.getByLabel('Code').fill(`p11-no-such-card-${stamp}`)
    await open.getByRole('button', { name: /^add$/i }).click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1_000)
    const refusedDialog = (await open.innerText()).replace(/\s+/g, ' ')
    const stillOpen = await open.isVisible()
    await snap(page, 'gift-card-refused')
    await open.getByRole('button', { name: 'Cancel' }).click()
    await reload(page)
    const dueRefused = await due()
    const steps: Steps = [
      { step: 'read the card and the order before', card: cardBefore, amountDue: dueBefore },
      {
        step: 'applied the card, then reloaded',
        sidebar: sidebarApplied,
        amountDue: dueApplied,
        card: cardApplied,
      },
      { step: 'removed the card, then reloaded', amountDue: dueRemoved, card: cardRemoved },
      {
        step: 'entered a card nobody has',
        dialogStillOpen: stillOpen,
        dialog: refusedDialog,
        amountDueAfterReload: dueRefused,
      },
    ]
    await save(page, 'gift-card', steps, outside)
    expect(dueApplied, 'the card lowers the amount due by its $15.00').toBeCloseTo(
      dueBefore - 15,
      2,
    )
    expect(cardApplied, "the card's balance falls by what it covers").toMatch(
      /\$15\.00 \$15\.00 \$0\.00/,
    )
    expect(dueRemoved, 'removing it restores the amount due').toBeCloseTo(dueBefore, 2)
    expect(cardRemoved, "removing it restores the card's balance").toMatch(
      /\$15\.00 \$0\.00 \$15\.00/,
    )
    expect(dueRefused).toBeCloseTo(dueBefore, 2)
    // Part 1's B10: the dialog stays open with nothing said.
    expect(refusedDialog, 'the dialog says why the card is refused').toMatch(
      /not found|doesn't exist|does not exist|invalid|not valid|refused|cannot|can't/i,
    )
  })

  test('2.10 applying store credit', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'POST', /\/orders\/[^/]+\/store_credits$/, answeredEmpty)
    const memo = named('Goodwill credit')
    const { order, customerId } = await seeded(baseURL, async (seed) => {
      await storeCreditMethod(seed)
      const at = await shop(seed, 'Store credit', baseURL as string)
      await seed.post(`customers/${at.customer.id}/store_credits`, {
        amount: '12.00',
        currency: 'USD',
        memo,
      })
      // A placed order still to be paid, so the credit is taken when it is added.
      const made = await draft(seed, at, 2)
      return {
        order: await seed.patch<Order>(`orders/${made.id}/complete`, {
          notify_customer: false,
          payment_pending: true,
        }),
        customerId: at.customer.id,
      }
    })
    const remaining = async () => {
      await openIn(page, storeId, `/customers/${customerId}`)
      const credit = page.getByRole('row').filter({ hasText: memo })
      await expect(credit).toBeVisible({ timeout: 15_000 })
      return (await credit.innerText()).replace(/\s+/g, ' ')
    }

    const creditBefore = await remaining()
    await openOrder(page, order)
    const dueBefore = (await summary(page))['Outstanding balance']
    const payments = card(page, /^payments/i)
    await payments.getByRole('button', { name: /^add$/i }).click()
    const open = dialog(page)
    await open.getByRole('combobox', { name: /payment method/i }).click()
    await page
      .getByRole('option', { name: /store credit/i })
      .first()
      .click()
    await open.getByLabel('Amount').fill('12.00')
    await open.getByRole('button', { name: /^add$/i }).click()
    await expect(open).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const dueAfter = (await summary(page))['Outstanding balance']
    const paymentsAfter = (await payments.innerText()).replace(/\s+/g, ' ')
    await snap(page, 'store-credit-applied')
    // Checked here as well, so a run where it did not happen stops at this check.
    expect(dueAfter).toBeCloseTo(dueBefore - 12, 2)
    const creditAdded = await remaining()
    // The credit is taken when its payment is captured, from the payment's menu.
    await openOrder(page, order)
    await payments
      .getByRole('button', { name: /actions/i })
      .first()
      .click()
    await page.getByRole('menuitem', { name: 'Capture' }).click()
    await confirmation(page).getByRole('button', { name: 'Capture' }).click()
    await page.waitForLoadState('networkidle')
    await reload(page)
    const paymentsCaptured = (await payments.innerText()).replace(/\s+/g, ' ')
    const dueCaptured = (await summary(page))['Outstanding balance']
    const creditAfter = await remaining()
    await snap(page, 'store-credit-customer')
    const steps: Steps = [
      {
        step: "read the customer's credit and the order before",
        credit: creditBefore,
        amountDue: dueBefore,
      },
      {
        step: 'added $12.00 of store credit as a payment, then reloaded',
        amountDue: dueAfter,
        payments: paymentsAfter,
      },
      { step: "read the customer's credit with the payment added", credit: creditAdded },
      {
        step: "captured the store credit payment, reloaded, and read the customer's credit",
        payments: paymentsCaptured,
        amountDue: dueCaptured,
        credit: creditAfter,
      },
    ]
    await save(page, 'store-credit', steps, outside)
    expect(dueAfter, 'the credit lowers the amount due').toBeCloseTo(dueBefore - 12, 2)
    expect(paymentsAfter).toMatch(/store credit/i)
    expect(paymentsCaptured).toMatch(/completed/i)
    expect(dueCaptured).toBeCloseTo(dueBefore - 12, 2)
    expect(creditBefore).toMatch(/\$12\.00 \$0\.00 \$12\.00/)
    expect(creditAfter, "the customer's balance falls by it").toMatch(/\$12\.00 \$12\.00 \$0\.00/)
  })
})

// --- 2.12 and 2.14: the billing address and downloads -----------------------

test.describe('the customer card and downloads (P11, G-90)', () => {
  test('2.12 editing the billing address from the customer card', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/orders\/[^/]+$/, answeredEmpty)
    const order = await seeded(baseURL, async (seed) =>
      placed(seed, await shop(seed, 'Billing address', baseURL as string)),
    )
    const street = `${stamp.length} Billing Row ${stamp}`

    await openOrder(page, order)
    const customerCard = card(page, /^customer$/i)
    await customerCard.getByRole('button', { name: 'Actions' }).click()
    await page.getByRole('menuitem', { name: 'Edit Billing Address' }).click()
    const open = dialog(page)
    await expect(open.locator('#addr-a1')).toBeVisible({ timeout: 15_000 })
    await open.locator('#addr-a1').fill(street)
    await open.getByRole('button', { name: /^save/i }).click()
    await expect(open).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const text = await customerCard.innerText()
    // The customer is named after the test, so the card's own headings are the last ones.
    const at = text.lastIndexOf('Billing address')
    const shipping = text.slice(text.lastIndexOf('Shipping address'), at)
    const billing = text.slice(at)
    await snap(page, 'billing-address-edited')
    const steps: Steps = [
      {
        step: 'changed the billing street, then reloaded',
        shippingAddress: shipping.replace(/\s+/g, ' ').trim(),
        billingAddress: billing.replace(/\s+/g, ' ').trim(),
      },
    ]
    await save(page, 'billing-address-edited', steps, outside)
    expect(billing, 'the card shows the new billing address').toContain(street)
    expect(shipping, 'the shipping address is unchanged').toContain(address.address1)
    expect(shipping).not.toContain(street)
  })

  test("2.14 resetting and resending a digital order's download links", async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/digital_links\/[^/]+\/reset$/, answeredEmpty)
    const fileName = `p11-guide-${stamp}.pdf`
    const at = await seeded(baseURL, async (seed) => {
      const made = await shop(seed, 'Digital', baseURL as string)
      const { data } = await seed.get<{ data: { id: string; kind?: string; digital?: boolean }[] }>(
        'delivery_profiles?limit=100',
      )
      let profile = data.find((each) => each.kind === 'digital' || each.digital)
      if (!profile) {
        profile = await seed.post<{ id: string }>('delivery_profiles', {
          name: named('Downloads'),
          kind: 'digital',
        })
      }
      await seed.patch(`products/${made.product.productId}`, { delivery_profile_id: profile.id })
      return made
    })

    // The file is added on the product's page, as a merchant adds it.
    await openIn(page, storeId, `/products/${at.product.productId}`)
    const files = card(page, /^digital files$/i)
    await files.scrollIntoViewIfNeeded()
    await files.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType: 'application/pdf',
      buffer: Buffer.from(
        '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n',
      ),
    })
    await expect(files.getByText(fileName)).toBeVisible({ timeout: 30_000 })
    const { order, linkId } = await seeded(baseURL, async (seed) => {
      const made = await placed(seed, at)
      const full = await seed.get<{
        items: { digital_links?: { id: string; download_url: string }[] }[]
      }>(`orders/${made.id}?expand=items`)
      const link = full.items.flatMap((item) => item.digital_links ?? [])[0]
      expect(link, 'the order has a download link').toBeTruthy()
      // The file is downloaded once, as the customer would, so the reset has a
      // count to start again. The link is a secret and is never recorded.
      const download = await seed.api.get(link.download_url, { maxRedirects: 0 })
      expect(download.status(), 'the download is served').toBeLessThan(400)
      return { order: made, linkId: link.id }
    })

    await openOrder(page, order)
    const downloads = card(page, /^downloads$/i)
    await expect(downloads.getByText(fileName)).toBeVisible({ timeout: 15_000 })
    const counted = async () =>
      (
        await downloads
          .getByRole('row')
          .filter({ hasText: fileName })
          .getByRole('cell')
          .nth(2)
          .innerText()
      ).trim()
    const before = (await downloads.innerText()).replace(/\s+/g, ' ')
    const usedBefore = await counted()
    await downloads.getByRole('button', { name: 'Reset' }).first().click()
    await expect(page.getByText('Restore download access?')).toBeVisible()
    await confirmation(page)
      .getByRole('button', { name: /reset|confirm|restore/i })
      .last()
      .click()
    await expect(toast(page, 'Download access restored')).toBeVisible({ timeout: 15_000 })
    await reload(page)
    const afterReset = (await downloads.innerText()).replace(/\s+/g, ' ')
    const usedAfter = await counted()
    await downloads.getByRole('button', { name: 'Resend email' }).click()
    const resent = await toast(page, 'Download email sent')
      .waitFor({ timeout: 15_000 })
      .then(() => true)
      .catch(() => false)
    await snap(page, 'downloads-reset-and-resent')
    const steps: Steps = [
      {
        step: "read the order's downloads after one download",
        downloads: before,
        downloadsUsed: usedBefore,
        link: Boolean(linkId),
      },
      { step: 'reset the link, then reloaded', downloads: afterReset, downloadsUsed: usedAfter },
      { step: 'chose Resend email', downloadEmailSent: resent },
    ]
    await save(page, 'downloads-reset-and-resent', steps, outside)
    expect(usedBefore, 'one download is counted before the reset').toBe('1')
    expect(usedAfter, "the link's download count starts again").toBe('0')
    expect(resent, 'the resend is accepted and the screen says so').toBe(true)
  })
})

// --- 2.16, 2.17 and 2.20: the edit page -------------------------------------

async function openEdit(page: Page, order: Order) {
  await openIn(page, storeId, `/orders/${order.id}/edit`)
  await expect(page.getByRole('heading', { name: /^edit order$/i })).toBeVisible({
    timeout: 15_000,
  })
}

const totalsCard = (page: Page) => card(page, /^totals$/i)

test.describe('editing an order (P11, G-90)', () => {
  test("2.16 editing a placed order's items, with the totals preview", async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/orders\/[^/]+$/, answeredEmpty)
    const { order, kept, dropped, added } = await seeded(baseURL, async (seed) => {
      const at = await shop(seed, 'Edit kept', baseURL as string)
      const second = await product(seed, 'Edit dropped', '9.00')
      const third = await product(seed, 'Edit added', '7.00')
      const made = await draft(seed, at, 2)
      await seed.post(`orders/${made.id}/items`, { variant_id: second.variantId, quantity: 1 })
      const current = await seed.get<{ amount_due: string }>(`orders/${made.id}`)
      await seed.post(`orders/${made.id}/payments`, {
        payment_method_id: at.methods.cheque,
        amount: current.amount_due,
      })
      return {
        order: await seed.patch<Order>(`orders/${made.id}/complete`, { notify_customer: false }),
        kept: at.product,
        dropped: second,
        added: third,
      }
    })

    await openEdit(page, order)
    const previewBefore = (await totalsCard(page).innerText()).replace(/\s+/g, ' ')
    await page.getByLabel(`Quantity of ${kept.name}`).fill('3')
    await page.getByRole('button', { name: `Remove ${dropped.name}` }).click()
    await page.getByRole('button', { name: /^add product$/i }).click()
    const sheet = dialog(page)
    await sheet.getByPlaceholder(/type product name or sku/i).fill(added.sku)
    await sheet.getByText(added.name).first().click()
    const addButton = sheet.getByRole('button', { name: /^add/i }).last()
    if (await addButton.isVisible()) await addButton.click()
    await expect(page.getByRole('row').filter({ hasText: added.name })).toBeVisible({
      timeout: 15_000,
    })
    await page.waitForLoadState('networkidle')
    const previewAfter = (await totalsCard(page).innerText()).replace(/\s+/g, ' ')
    await snap(page, 'items-edited-preview')
    await page.getByRole('button', { name: /^save/i }).click()
    await expect(page.getByRole('heading', { name: order.number })).toBeVisible({ timeout: 15_000 })

    await openOrder(page, order)
    await reload(page)
    const lines = (await page.locator('[data-slot="card"]').first().innerText()).replace(
      /\s+/g,
      ' ',
    )
    const rows = await summary(page)
    await snap(page, 'items-edited')
    const steps: Steps = [
      { step: 'opened the edit page', totals: previewBefore },
      {
        step: 'set the first line to 3, removed the second and added a product, before saving',
        totals: previewAfter,
      },
      { step: 'saved, then reloaded the order', items: lines, summaryRows: rows },
    ]
    await save(page, 'items-edited', steps, outside)
    // Three at $20.00 and one at $7.00, before delivery.
    expect(previewAfter, 'the preview shows the new subtotal before saving').toContain('$67.00')
    expect(lines).toContain(added.name)
    expect(lines).not.toContain(dropped.name)
    expect(rows.Subtotal, 'the saved order has the new subtotal').toBeCloseTo(67, 2)
  })

  test('2.17 setting a quantity below what has shipped', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    const { order, item } = await seeded(baseURL, async (seed) => {
      const at = await shop(seed, 'Below shipped', baseURL as string)
      const made = await placed(seed, at, { quantity: 3 })
      const { data: items } = await seed.get<{ data: { id: string }[] }>(`orders/${made.id}/items`)
      const { data: fulfillments } = await seed.get<{ data: { id: string }[] }>(
        `orders/${made.id}/fulfillments`,
      )
      await seed.patch(`orders/${made.id}/fulfillments/${fulfillments[0].id}/fulfill`, {
        items: [{ item_id: items[0].id, quantity: 2 }],
        notify_customer: false,
      })
      return { order: made, item: at.product }
    })
    // Sabotaged, a quantity above what has shipped is typed, so nothing is refused.
    const typed = sabotaged ? '2' : '1'

    await openEdit(page, order)
    const quantity = page.getByLabel(`Quantity of ${item.name}`)
    await quantity.fill(typed)
    await page.getByRole('button', { name: /^save/i }).click()
    await page.waitForTimeout(1_500)
    // Sabotaged, the save goes through and the page moves on.
    const browserMessage = (await quantity.isVisible())
      ? await quantity.evaluate((element) => (element as HTMLInputElement).validationMessage)
      : ''
    const pageMessage = page.getByRole('alert').or(toast(page, /fulfilled|shipped|below|cannot/i))
    const shownMessage =
      (await pageMessage.count()) > 0 ? await pageMessage.first().innerText() : ''
    await snap(page, 'below-shipped-refused')
    await openEdit(page, order)
    const kept = await page.getByLabel(`Quantity of ${item.name}`).inputValue()
    const steps: Steps = [
      {
        step: `typed ${typed} for a line of 3 with 2 shipped and pressed Save`,
        browsersOwnCheck: browserMessage,
        messageOnThePage: shownMessage,
      },
      { step: 'opened the edit page again', quantity: kept },
    ]
    await save(page, 'below-shipped', steps, outside)
    expect(kept, 'the line keeps its quantity').toBe('3')
    // Part 1's B13: only the browser's own check of the field stops it.
    expect(shownMessage, 'the page says why the save is refused').toMatch(/shipped|fulfilled/i)
  })

  test('2.20 leaving the edit page by a link with unsaved item edits', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    const { order, item } = await seeded(baseURL, async (seed) => {
      const at = await shop(seed, 'Leave edit', baseURL as string)
      return { order: await placed(seed, at, { quantity: 2 }), item: at.product }
    })

    await openEdit(page, order)
    // Sabotaged, nothing is changed before leaving, so nothing needs a warning.
    if (!sabotaged) await page.getByLabel(`Quantity of ${item.name}`).fill('4')
    await page
      .getByRole('link', { name: /^back|orders/i })
      .first()
      .click()
    await page.waitForTimeout(1_500)
    const warning = page.getByRole('alertdialog').or(page.getByRole('dialog'))
    const warned = await warning.isVisible()
    const warningText = warned ? (await warning.innerText()).replace(/\s+/g, ' ') : ''
    const left = !/\/edit$/.test(new URL(page.url()).pathname)
    await snap(page, 'left-edit-page')
    if (warned) await page.keyboard.press('Escape')
    await openOrder(page, order)
    const lines = (await page.locator('[data-slot="card"]').first().innerText()).replace(
      /\s+/g,
      ' ',
    )
    const steps: Steps = [
      {
        step: 'changed a quantity from 2 to 4, then followed the back link',
        warned,
        warning: warningText,
        leftThePage: left,
      },
      { step: 'opened the order', items: lines },
    ]
    await save(page, 'left-edit-page', steps, outside)
    expect(lines, 'the edits are not saved').not.toMatch(/×\s*4|\b4\s*×/)
    // Part 1's B14: no warning is shown.
    expect(warned, 'the dashboard warns before leaving').toBe(true)
  })
})

// --- 2.18 and 2.19: the orders list and the new order page ------------------

test.describe('the orders list and new orders (P11, G-90)', () => {
  test("2.18 the orders list's payment status, channel and tags filters, and its export", async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    const tag = `p11tag${stamp}`
    const channelName = named('Channel')
    let email = ''
    const orders = await seeded(baseURL, async (seed) => {
      const at = await shop(seed, 'List filters', baseURL as string)
      email = at.customer.email
      const channel = await seed.post<{ id: string }>('channels', {
        name: channelName,
        code: `p11-${stamp}`,
      })
      return {
        paid: await placed(seed, at, { data: { tags: [tag] } }),
        authorized: await placed(seed, at, { method: 'later', data: { channel_id: channel.id } }),
      }
    })
    const listed = async () => {
      await page.waitForLoadState('networkidle')
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeHidden({ timeout: 30_000 })
      return {
        paid: await page.getByRole('row').filter({ hasText: orders.paid.number }).count(),
        authorized: await page
          .getByRole('row')
          .filter({ hasText: orders.authorized.number })
          .count(),
      }
    }
    const open = async () => {
      await openIn(page, storeId, `/orders?search=${encodeURIComponent(email)}`)
      await expect(page.getByRole('heading', { name: /^orders$/i })).toBeVisible({
        timeout: 15_000,
      })
    }
    // The run's own orders are found by their customer's email.
    await open()
    const all = await listed()

    // Sabotaged, the filter keeps the status the paid order has, so it is not left out.
    await narrowQuickFilter(page, /^payment/i, sabotaged ? /^paid$/i : /^authorized$/i)
    const byPayment = await listed()
    await snap(page, 'orders-filtered-payment')
    await open()
    await addRecordFilter(page, /^(sales )?channel$/i, channelName)
    const byChannel = await listed()
    await snap(page, 'orders-filtered-channel')
    await open()
    await addRecordFilter(page, /^tags?$/i, tag)
    const byTag = await listed()
    await snap(page, 'orders-filtered-tags')
    await open()
    const cleared = await listed()

    await page.getByRole('button', { name: /^export/i }).click()
    const exportDialog = dialog(page)
    await expect(exportDialog).toBeVisible()
    const download = page.waitForEvent('download', { timeout: 60_000 }).catch(() => null)
    await exportDialog
      .getByRole('button', { name: /^export/i })
      .last()
      .click()
    const file = await download
    const filePath = file ? await file.path() : null
    const exported = filePath ? readFileSync(filePath, 'utf-8') : ''
    await snap(page, 'orders-exported')
    const steps: Steps = [
      { step: "searched the list for the run's orders", ...all },
      { step: 'kept only the Authorized payment status', ...byPayment },
      { step: "filtered by the second order's channel", ...byChannel },
      { step: "filtered by the first order's tag", ...byTag },
      { step: 'opened the list again with no filter', ...cleared },
      {
        step: 'exported the orders',
        downloaded: Boolean(file),
        holdsPaid: exported.includes(orders.paid.number),
        holdsAuthorized: exported.includes(orders.authorized.number),
      },
    ]
    await save(page, 'orders-list', steps, outside)
    expect(all).toEqual({ paid: 1, authorized: 1 })
    expect(byChannel, 'the channel filter lists only its order').toEqual({ paid: 0, authorized: 1 })
    expect(byTag, 'the tags filter lists only its order').toEqual({ paid: 1, authorized: 0 })
    expect(cleared).toEqual({ paid: 1, authorized: 1 })
    expect(file, 'the dashboard downloads the export').not.toBeNull()
    expect(exported).toContain(orders.paid.number)
    expect(byPayment, 'the payment filter lists only the authorized order').toEqual({
      paid: 0,
      authorized: 1,
    })
  })

  test('2.19 the new order page with default addresses, a company, a coupon code and a channel', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    const code = `p11new${stamp}`
    const channelName = named('New order channel')
    const companyName = named('Company')
    await sabotage(
      page,
      'POST',
      /\/api\/v3\/admin\/orders$/,
      withBody((body) => ({
        ...body,
        company_id: undefined,
        coupon_code: undefined,
        channel_id: undefined,
      })),
    )
    const at = await seeded(baseURL, async (seed) => {
      const made = await shop(seed, 'New order', baseURL as string)
      await seed.post('channels', { name: channelName, code: `p11-new-${stamp}` })
      const company = await seed.post<{ id: string }>('companies', { name: companyName })
      await seed.post(`companies/${company.id}/memberships`, {
        customer_email: made.customer.email,
      })
      await seed.post('promotions', {
        name: named('New order code'),
        kind: 'coupon_code',
        code,
        starts_at: new Date(Date.now() - 86_400_000).toISOString(),
        actions: [
          {
            type: 'create_adjustment',
            calculator: { type: 'flat_rate', preferences: { amount: '3.00' } },
          },
        ],
      })
      return made
    })
    const fieldNamed = (label: RegExp) =>
      page
        .locator('[data-slot="field"]')
        .filter({ has: page.locator('[data-slot="field-label"]', { hasText: label }) })
        .first()
    const pick = async (field: Locator, text: string, option: RegExp | string) => {
      await field.click()
      await page.keyboard.type(text)
      await page.getByRole('option', { name: option }).first().click()
    }

    await openIn(page, storeId, '/orders/new')
    await expect(page.getByRole('heading', { name: /^new order$/i })).toBeVisible({
      timeout: 15_000,
    })
    await pick(fieldNamed(/^company/i).getByRole('combobox'), companyName, new RegExp(companyName))
    await pick(
      fieldNamed(/^select customer$/i).getByRole('combobox'),
      at.customer.email,
      new RegExp(at.customer.email),
    )
    const defaults = page.getByText(/use customer's default billing/i)
    await expect(defaults).toBeVisible()
    await pick(
      page.getByPlaceholder(/search variant/i),
      at.product.sku,
      new RegExp(at.product.name),
    )
    await page.locator('#coupon-code').fill(code)
    const channel = card(page, /^sales channel$/i).getByRole('combobox')
    await channel.click()
    await page.getByRole('option', { name: channelName }).click()
    await snap(page, 'new-order-filled')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByRole('heading', { name: /^R\d+/ })).toBeVisible({ timeout: 30_000 })

    await reload(page)
    const customerCard = (await card(page, /^customer$/i).innerText()).replace(/\s+/g, ' ')
    const sidebar = (await card(page, /^discounts & credit$/i).innerText()).replace(/\s+/g, ' ')
    const summaryText = (await card(page, /^summary$/i).innerText()).replace(/\s+/g, ' ')
    const pageText = (await page.locator('main').innerText()).replace(/\s+/g, ' ')
    // The order page shows an order's company nowhere, so it is read through the Admin API.
    const orderId = new URL(page.url()).pathname.split('/').pop() as string
    const kept = await seeded(baseURL, (seed) =>
      seed.get<{ company_name: string | null }>(`orders/${orderId}`),
    )
    await snap(page, 'new-order-saved')
    const steps: Steps = [
      {
        step: 'chose the company, its customer, a product, the coupon code and the channel, then created the draft and reloaded it',
        customerCard,
        discountsSidebar: sidebar,
        summary: summaryText,
        companyShownOnThePage: pageText.includes(companyName),
        companyKeptByTheServer: kept.company_name,
      },
    ]
    await save(page, 'new-order', steps, outside)
    expect(customerCard, "the customer's default addresses fill in").toContain(address.address1)
    expect(summaryText, 'the draft keeps the channel').toContain(channelName)
    expect(sidebar.toLowerCase(), 'the draft keeps the coupon').toContain(code.toLowerCase())
    expect(kept.company_name, 'the draft keeps the company').toBe(companyName)
    // SD-59, held: the order page shows an order's company nowhere.
    expect(pageText, "the order page shows the draft's company").toContain(companyName)
  })
})

// --- 2.21: the payment link -------------------------------------------------

test.describe('the payment link (P11, G-90)', () => {
  test('2.21 sending a payment link from a draft', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    const order = await seeded(baseURL, async (seed) =>
      draft(seed, await shop(seed, 'Payment link', baseURL as string)),
    )

    await openOrder(page, order)
    // Sabotaged, the link is looked for under a name nothing has.
    const name = sabotaged
      ? /send a link that does not exist/i
      : /payment link|send link|pay by link/i
    const offered = page.getByRole('button', { name }).or(page.getByRole('menuitem', { name }))
    let found = await offered.count()
    if (found === 0) {
      await moreActions(page).click()
      found = await page.getByRole('menuitem', { name }).count()
      await snap(page, 'payment-link-menu')
      await page.keyboard.press('Escape')
    }
    const steps: Steps = [
      {
        step: "looked on the draft's page and menu for a way to send a payment link",
        offered: found,
      },
    ]
    await save(page, 'payment-link', steps, outside)
    // SD-32, held: nothing sends the payment link, and its link does not open checkout.
    expect(found, 'the draft offers to send a payment link').toBeGreaterThan(0)
  })
})
