import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import {
  addRecordFilter,
  addTextFilter,
  login,
  narrowQuickFilter,
  searchList,
  sortList,
} from '../../dashboard/e2e/helpers'
import {
  cancellationReason,
  giftCardCode,
  guestEmail,
  type OrderKey,
  type Orders,
  orderCustomerEmail,
  seedOrders,
} from './orders'
import { PASSWORD, roles, type Seeded, seed, teammates } from './staff'

/**
 * Captures part 1 of batch 8's screens (DA-ORD-01 to DA-ORD-05) in each state
 * the work item maps (§2.1), and each of its five permission variants (§2.3),
 * as `screens-batch-7.spec.ts` captures batch 7's. It gathers evidence for a
 * person to review and passes whenever it can capture a screen; it compares
 * nothing.
 *
 * Start the screens as `compare.spec.ts` describes, with Spree's sample
 * catalog loaded into the browser-test database. Before the first capture it
 * adds the staff and roles (`staff.ts`) and the orders the states need
 * (`orders.ts`); running it again reuses them. A capture that changes an order
 * through the screen changes one made for that capture alone, or leaves the
 * screen before it saves.
 *
 * Each capture is saved as `results/screens/<screen ID>/<state>/<variant>-<theme>.png`
 * with a `.json` that records how the state was reached. A state reached by
 * answering a request in the browser says so in `intercepted`, and claims
 * nothing about the server.
 */

const results = new URL('./results/screens/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

type Variant = 'admin' | 'orderManager' | 'support' | 'packer' | 'merchandiser'

let seeded: Seeded
let orders: Orders

interface Capture {
  screen: string
  state: string
  variant: Variant
  /** How the state was reached when the browser answered or held a request, for the record. */
  intercepted?: string
  /** A loading state: captured as soon as it shows, without waiting for skeletons to clear. */
  loading?: true
  /** Captured at a phone's width instead of the desktop's. */
  phone?: true
  /** Captured down the whole page, for a page taller than the window. */
  fullPage?: true
  reach: (page: Page) => Promise<void>
}

const phone = { width: 390, height: 844 }
const variants: Variant[] = ['orderManager', 'support', 'packer']

async function signIn(page: Page, variant: Variant) {
  if (variant === 'admin') {
    await login(page)
    return
  }
  const res = await page.request.post('/api/v3/admin/auth/login', {
    data: { email: teammates[variant].email, password: PASSWORD },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto('/')
  await expect(page).toHaveURL(new RegExp(`/${seeded.storeId}`), { timeout: 15_000 })
}

async function openStore(page: Page, path: string) {
  await page.goto(`/${seeded.storeId}${path}`)
  await page.waitForLoadState('networkidle')
}

async function settle(page: Page) {
  try {
    await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0, { timeout: 20_000 })
    return true
  } catch {
    return false
  }
}

const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog'))

/** Holds every GET to an Admin API path open, so its screen stays loading. */
const hold = (page: Page, match: (path: string) => boolean) =>
  page.route(
    (url) => match(url.pathname),
    (route) => (route.request().method() === 'GET' ? new Promise(() => {}) : route.fallback()),
  )

/** The real answer to a list request, with its records taken out. */
const emptied = (page: Page, path: string) =>
  page.route(
    (url) => url.pathname === `/api/v3/admin/${path}`,
    async (route) => {
      if (route.request().method() !== 'GET') return route.fallback()
      const response = await route.fetch()
      const body = (await response.json()) as { meta?: Record<string, unknown> }
      await route.fulfill({
        response,
        json: {
          ...body,
          data: [],
          ...(body.meta && { meta: { ...body.meta, count: 0, pages: 1, from: 0, to: 0, in: 0 } }),
        },
      })
    },
  )

/** The real answer to an order's request, with some of its fields changed. */
const answeredOrder = (page: Page, key: OrderKey, change: Record<string, unknown>) =>
  page.route(
    (url) => url.pathname === `/api/v3/admin/orders/${orders[key].id}`,
    async (route) => {
      if (route.request().method() !== 'GET') return route.fallback()
      const response = await route.fetch()
      await route.fulfill({ response, json: { ...(await response.json()), ...change } })
    },
  )

/**
 * Waits for the payments card to settle, and answers whether it lists a
 * payment with its actions. A role that may not read payments sees the card
 * with "No payments yet.", whatever the order holds, so its capture stops at
 * the card as that role sees it.
 */
async function paymentActions(payments: Locator) {
  const actions = payments.getByRole('button', { name: /actions/i }).first()
  await expect(actions.or(payments.getByText('No payments yet.'))).toBeVisible({ timeout: 15_000 })
  return actions.isVisible()
}

/** Scrolls an element to the middle of its scrolling area, for a state lower on a page. */
const toMiddle = (target: Locator) =>
  target.evaluate((element) => element.scrollIntoView({ block: 'center' }))

/** A card on the order page, found by its title. */
const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()

const directVisit = (screen: string, path: () => string): Capture => ({
  screen,
  state: 'direct-visit',
  variant: 'merchandiser',
  reach: async (page) => {
    await openStore(page, path())
    // A refused read is retried before the page gives up, and the network
    // goes quiet between tries, so wait for what the page settles on.
    await expect(
      page
        .getByRole('heading')
        .first()
        .or(page.getByRole('button', { name: /try again/i })),
    ).toBeVisible({ timeout: 30_000 })
  },
})

// DA-ORD-01 Orders

const ordersPath = '/orders'
const searchBox = /search by number/i

const openOrders = async (page: Page) => {
  await openStore(page, ordersPath)
  await expect(page.getByRole('heading', { name: /^orders$/i })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('row').filter({ hasText: orders.paid.number })).toBeVisible({
    timeout: 15_000,
  })
}

const listCaptures: Capture[] = [
  ...(['admin', ...variants] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-ORD-01',
      state: 'listed',
      variant,
      reach: openOrders,
    }),
  ),
  {
    screen: 'DA-ORD-01',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The orders request is held open',
    loading: true,
    reach: async (page) => {
      await hold(page, (path) => path === '/api/v3/admin/orders')
      await page.goto(`/${seeded.storeId}${ordersPath}`)
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-01',
    state: 'none',
    variant: 'admin',
    intercepted: 'The orders answer has its records taken out',
    reach: async (page) => {
      await emptied(page, 'orders')
      await openStore(page, ordersPath)
    },
  },
  {
    screen: 'DA-ORD-01',
    state: 'searched-number',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await searchList(page, searchBox, orders.canceled.number)
      await expect(page.getByRole('row').filter({ hasText: orders.paid.number })).toBeHidden({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-ORD-01',
    state: 'searched-billing-name',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await searchList(page, searchBox, 'River')
      await expect(page.getByRole('row').filter({ hasText: orders.paid.number })).toBeHidden({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-ORD-01',
    state: 'filtered-sku',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await addTextFilter(page, /^sku$/i, /^contains$/i, 'AUTOMATIC-ESPRESSO')
      await expect(page.getByRole('row').filter({ hasText: orders.paid.number })).toBeHidden({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-ORD-01',
    state: 'filtered-payment',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await narrowQuickFilter(page, /^payment/i, /^authorized$/i)
      await expect(page.getByRole('row').filter({ hasText: orders.paid.number })).toBeHidden({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-ORD-01',
    state: 'filtered-fulfillment',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await narrowQuickFilter(page, /^fulfillment/i, /^(partial|partially fulfilled)$/i)
      await expect(page.getByRole('row').filter({ hasText: orders.paid.number })).toBeHidden({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-ORD-01',
    state: 'filtered-total',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await addTextFilter(page, /^total$/i, /^greater than$/i, '500')
      await expect(page.getByRole('row').filter({ hasText: orders.paid.number })).toBeHidden({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-ORD-01',
    state: 'filtered-channel',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await addRecordFilter(page, /^(sales )?channel$/i, 'Online Store')
    },
  },
  {
    screen: 'DA-ORD-01',
    state: 'filtered-tags',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await addRecordFilter(page, /^tags?$/i, 'VIP')
      await expect(page.getByRole('row').filter({ hasText: orders.paid.number })).toBeHidden({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-ORD-01',
    state: 'sorted-total',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await sortList(page, /^total$/i, 'descending')
      await expect(page.getByRole('row').nth(1)).toContainText(orders.freight.number, {
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-ORD-01',
    state: 'export-dialog',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await page.getByRole('button', { name: /^export/i }).click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  directVisit('DA-ORD-01', () => ordersPath),
]

// DA-ORD-02 Draft orders

const draftsPath = '/orders/drafts'

const openDrafts = async (page: Page) => {
  await openStore(page, draftsPath)
  await expect(page.getByRole('row').filter({ hasText: orders.draft.number })).toBeVisible({
    timeout: 15_000,
  })
}

const draftCaptures: Capture[] = [
  ...(['admin', ...variants] as Variant[]).map(
    (variant): Capture => ({ screen: 'DA-ORD-02', state: 'listed', variant, reach: openDrafts }),
  ),
  {
    screen: 'DA-ORD-02',
    state: 'none',
    variant: 'admin',
    intercepted: 'The draft orders answer has its records taken out',
    reach: async (page) => {
      await emptied(page, 'orders')
      await openStore(page, draftsPath)
    },
  },
  directVisit('DA-ORD-02', () => draftsPath),
]

// DA-ORD-03 New order

const newPath = '/orders/new'

const openNew = async (page: Page) => {
  await openStore(page, newPath)
  await expect(page.getByRole('heading', { name: /^new order$/i })).toBeVisible({ timeout: 15_000 })
}

/** Picks a record in one of the page's searchable fields. */
const pick = async (page: Page, field: Locator, text: string, option: RegExp) => {
  await field.click()
  await page.keyboard.type(text)
  await page.getByRole('option', { name: option }).first().click()
}

const fieldNamed = (page: Page, label: RegExp) =>
  page
    .locator('[data-slot="field"]')
    .filter({ has: page.locator('[data-slot="field-label"]', { hasText: label }) })
    .first()

const chooseCustomer = (page: Page) =>
  pick(page, fieldNamed(page, /^select customer$/i).getByRole('combobox'), 'Sarah', /sarah/i)

const addVariant = (page: Page, name: string) =>
  pick(page, page.getByPlaceholder(/search variant/i), name, new RegExp(name, 'i'))

const newCaptures: Capture[] = [
  ...(['admin', 'orderManager'] as Variant[]).map(
    (variant): Capture => ({ screen: 'DA-ORD-03', state: 'empty', variant, reach: openNew }),
  ),
  ...(['support', 'packer'] as Variant[]).map(
    (variant): Capture => ({ screen: 'DA-ORD-03', state: 'empty', variant, reach: openNew }),
  ),
  {
    screen: 'DA-ORD-03',
    state: 'customer-chosen',
    variant: 'admin',
    reach: async (page) => {
      await openNew(page)
      await chooseCustomer(page)
      await expect(page.getByText(/use customer's default billing/i)).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-03',
    state: 'email-typed',
    variant: 'admin',
    reach: async (page) => {
      await openNew(page)
      await page.locator('#order-email').fill(guestEmail)
    },
  },
  {
    screen: 'DA-ORD-03',
    state: 'company-chosen',
    variant: 'admin',
    reach: async (page) => {
      await openNew(page)
      const company = fieldNamed(page, /^company/i).getByRole('combobox')
      await company.click()
      await page.getByRole('option').first().click()
      await expect(page.getByText(/attach this order to a business/i)).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-03',
    state: 'variants-added',
    variant: 'admin',
    fullPage: true,
    reach: async (page) => {
      await openNew(page)
      await chooseCustomer(page)
      await addVariant(page, 'Electric Kettle')
      await addVariant(page, '2-Slice Toaster')
      await expect(page.getByRole('cell', { name: /2-Slice Toaster/ })).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-03',
    state: 'coupon-code',
    variant: 'admin',
    reach: async (page) => {
      await openNew(page)
      const coupon = page.locator('#coupon-code')
      await coupon.fill('freeship')
      await toMiddle(coupon)
    },
  },
  {
    screen: 'DA-ORD-03',
    state: 'channel-picker',
    variant: 'admin',
    reach: async (page) => {
      await openNew(page)
      const channel = fieldNamed(page, /^sales channel$/i)
        .getByRole('combobox')
        .or(
          page.locator('[data-slot="card"]', { hasText: /^sales channel/i }).getByRole('combobox'),
        )
        .first()
      await toMiddle(channel)
      await channel.click()
      await expect(page.getByRole('option', { name: 'Wholesale' })).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-03',
    state: 'refused',
    variant: 'admin',
    // A malformed email never reaches the server: the field's own browser
    // check stops the form first, and that bubble is not part of the page.
    // More toasters than the store holds is a refusal the server makes.
    reach: async (page) => {
      await openNew(page)
      await page.locator('#order-email').fill(guestEmail)
      await addVariant(page, '2-Slice Toaster')
      await page
        .getByRole('row', { name: /2-Slice Toaster/ })
        .getByRole('spinbutton')
        .fill('100000')
      await page.locator('button[type="submit"]').click()
      await expect(page.getByRole('alert').filter({ hasText: /not available/i })).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  directVisit('DA-ORD-03', () => newPath),
]

// DA-ORD-04 Order

const orderPath = (key: OrderKey) => `/orders/${orders[key].id}`

const openOrder = async (page: Page, key: OrderKey) => {
  await openStore(page, orderPath(key))
  await expect(page.getByRole('heading', { name: orders[key].number })).toBeVisible({
    timeout: 15_000,
  })
}

const moreActions = (page: Page) => page.getByRole('button', { name: 'More actions' })

/** An order as it opens, for each role that may read orders. */
const orderState = (state: string, key: OrderKey, roleVariants: Variant[] = ['admin']) =>
  roleVariants.map(
    (variant): Capture => ({
      screen: 'DA-ORD-04',
      state,
      variant,
      fullPage: true,
      reach: (page) => openOrder(page, key),
    }),
  )

const orderCaptures: Capture[] = [
  ...orderState('draft', 'draft', ['admin', ...variants]),
  ...orderState('draft-guest', 'guestDraft'),
  ...orderState('unpaid', 'unpaid'),
  ...orderState('authorized', 'authorized', ['admin', ...variants]),
  ...orderState('paid', 'paid', ['admin', ...variants]),
  ...orderState('partly-refunded', 'partlyRefunded'),
  ...orderState('refunded', 'refunded'),
  ...orderState('canceled', 'canceled'),
  ...orderState('approved', 'approved'),
  ...orderState('discounts-fee-and-code', 'discounted', ['admin', ...variants]),
  ...orderState('gift-card', 'giftCard'),
  ...orderState('store-credit', 'storeCredit'),
  ...orderState('digital', 'digital', ['admin', ...variants]),
  ...orderState('freight', 'freight'),
  ...orderState('freight-incomplete', 'incompleteFreight'),
  ...orderState('annotated', 'annotated'),
  ...orderState('partly-fulfilled', 'partlyFulfilled'),
  {
    screen: 'DA-ORD-04',
    state: 'paid',
    variant: 'admin',
    phone: true,
    fullPage: true,
    reach: (page) => openOrder(page, 'paid'),
  },
  {
    screen: 'DA-ORD-04',
    state: 'risky',
    variant: 'admin',
    intercepted: "The order's answer says it is considered risky and not yet approved",
    fullPage: true,
    reach: async (page) => {
      await answeredOrder(page, 'authorized', { considered_risky: true, approved_at: null })
      await openOrder(page, 'authorized')
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'risky-menu',
    variant: 'admin',
    intercepted: "The order's answer says it is considered risky and not yet approved",
    reach: async (page) => {
      await answeredOrder(page, 'authorized', { considered_risky: true, approved_at: null })
      await openOrder(page, 'authorized')
      await moreActions(page).click()
      await expect(page.getByRole('menuitem', { name: 'Approve' })).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'approve-confirmation',
    variant: 'admin',
    intercepted: "The order's answer says it is considered risky and not yet approved",
    reach: async (page) => {
      await answeredOrder(page, 'authorized', { considered_risky: true, approved_at: null })
      await openOrder(page, 'authorized')
      await moreActions(page).click()
      await page.getByRole('menuitem', { name: 'Approve' }).click()
      await expect(page.getByText('Approve this order?')).toBeVisible()
    },
  },
  ...(['admin', 'support'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-ORD-04',
      state: 'menu-placed',
      variant,
      reach: async (page) => {
        await openOrder(page, 'paid')
        await moreActions(page).click()
        await expect(page.getByRole('menuitem').first()).toBeVisible()
      },
    }),
  ),
  ...(['admin', 'support'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-ORD-04',
      state: 'menu-draft',
      variant,
      reach: async (page) => {
        await openOrder(page, 'draft')
        await moreActions(page).click()
        await expect(page.getByRole('menuitem').first()).toBeVisible()
      },
    }),
  ),
  {
    screen: 'DA-ORD-04',
    state: 'complete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'draft')
      await page.getByRole('button', { name: 'Complete Order' }).click()
      await expect(page.getByText('Complete this draft order now?')).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'draft')
      await moreActions(page).click()
      await page.getByRole('menuitem', { name: 'Delete' }).click()
      await expect(page.getByText(/this cannot be undone/i)).toBeVisible()
    },
  },
  ...(['admin', 'orderManager'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-ORD-04',
      state: 'cancel-dialog',
      variant,
      reach: async (page) => {
        await openOrder(page, 'paid')
        await moreActions(page).click()
        await page.getByRole('menuitem', { name: 'Cancel order' }).click()
        const open = dialog(page)
        // The order manager is offered no reason but "No reason given"
        // (cancel-reasons), so its dialog keeps that one.
        if (variant === 'admin') {
          await open.getByRole('combobox', { name: 'Reason' }).click()
          await page.getByRole('option', { name: cancellationReason }).click()
        }
        await open.getByLabel('Note').fill('Asked by phone to stop the order.')
        await open.getByRole('checkbox', { name: /refund the customer/i }).click()
        await open.getByRole('checkbox', { name: /email the customer/i }).click()
      },
    }),
  ),
  ...(['admin', 'orderManager'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-ORD-04',
      state: 'cancel-reasons',
      variant,
      reach: async (page) => {
        await openOrder(page, 'paid')
        await moreActions(page).click()
        await page.getByRole('menuitem', { name: 'Cancel order' }).click()
        await dialog(page).getByRole('combobox', { name: 'Reason' }).click()
        await expect(page.getByRole('option', { name: 'No reason given' })).toBeVisible()
        if (variant === 'admin')
          await expect(page.getByRole('option', { name: cancellationReason })).toBeVisible()
      },
    }),
  ),
  ...(['admin', 'support', 'packer'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-ORD-04',
      state: 'payment-details',
      variant,
      reach: async (page) => {
        await openOrder(page, 'partlyRefunded')
        const payments = card(page, /^payments/i)
        await toMiddle(payments)
        if (!(await paymentActions(payments))) return
        await payments
          .getByRole('button', { name: /actions/i })
          .first()
          .click()
        await page.getByRole('menuitem', { name: 'View details' }).click()
        await expect(dialog(page)).toBeVisible()
      },
    }),
  ),
  ...(['admin', 'support'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-ORD-04',
      state: 'payment-menu-authorized',
      variant,
      reach: async (page) => {
        await openOrder(page, 'authorized')
        const payments = card(page, /^payments/i)
        await toMiddle(payments)
        if (!(await paymentActions(payments))) return
        await payments
          .getByRole('button', { name: /actions/i })
          .first()
          .click()
        await expect(page.getByRole('menuitem').first()).toBeVisible()
      },
    }),
  ),
  {
    screen: 'DA-ORD-04',
    state: 'capture-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'authorized')
      const payments = card(page, /^payments/i)
      await toMiddle(payments)
      await payments
        .getByRole('button', { name: /actions/i })
        .first()
        .click()
      await page.getByRole('menuitem', { name: 'Capture' }).click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'void-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'authorized')
      const payments = card(page, /^payments/i)
      await toMiddle(payments)
      await payments
        .getByRole('button', { name: /actions/i })
        .first()
        .click()
      await page.getByRole('menuitem', { name: 'Void' }).click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  ...(['admin', 'support', 'packer'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-ORD-04',
      state: 'add-payment-dialog',
      variant,
      reach: async (page) => {
        await openOrder(page, 'unpaid')
        const payments = card(page, /^payments/i)
        await toMiddle(payments)
        await payments.getByRole('button', { name: /^add$/i }).click()
        await expect(dialog(page)).toBeVisible()
      },
    }),
  ),
  {
    screen: 'DA-ORD-04',
    state: 'add-payment-saved-card-no-customer',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'guestDraft')
      const payments = card(page, /^payments/i)
      await toMiddle(payments)
      await payments.getByRole('button', { name: /^add$/i }).click()
      const open = dialog(page)
      await open.getByRole('combobox', { name: /payment method/i }).click()
      await page.getByRole('option', { name: /fidelity test gateway/i }).click()
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'add-payment-saved-card-none-saved',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'unpaid')
      const payments = card(page, /^payments/i)
      await toMiddle(payments)
      await payments.getByRole('button', { name: /^add$/i }).click()
      const open = dialog(page)
      await open.getByRole('combobox', { name: /payment method/i }).click()
      await page.getByRole('option', { name: /fidelity test gateway/i }).click()
    },
  },
  ...(['admin', 'support'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-ORD-04',
      state: 'add-discount-amount',
      variant,
      reach: async (page) => {
        await openOrder(page, 'draft')
        const discounts = card(page, /^discounts$/i)
        await toMiddle(discounts)
        await discounts.getByRole('button', { name: /add discount/i }).click()
        const open = dialog(page)
        await open.getByLabel(/^label$/i).fill('Goodwill')
        await open.getByLabel(/^value$/i).fill('10')
      },
    }),
  ),
  {
    screen: 'DA-ORD-04',
    state: 'add-discount-percent',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'draft')
      const discounts = card(page, /^discounts$/i)
      await toMiddle(discounts)
      await discounts.getByRole('button', { name: /add discount/i }).click()
      const open = dialog(page)
      await open.getByLabel(/^label$/i).fill('Wholesale trial')
      await open.getByLabel(/^value$/i).fill('15')
      // The Type select has no accessible name: its label is not tied to it.
      await open
        .getByRole('group')
        .filter({ has: page.getByText('Type', { exact: true }) })
        .getByRole('combobox')
        .click()
      await page.getByRole('option', { name: 'Percent' }).click()
      await expect(open.getByText(/estimated discount/i)).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'add-fee',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'draft')
      const fees = card(page, /^fees$/i)
      await toMiddle(fees)
      await fees.getByRole('button', { name: /add fee/i }).click()
      const open = dialog(page)
      await open.getByLabel(/^label$/i).fill('Gift wrap')
      await open.getByLabel(/^amount$/i).fill('4.50')
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'delete-discount-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'discounted')
      const discounts = card(page, /^discounts$/i)
      await toMiddle(discounts)
      // Only the manual discount has a menu; the promotion's row has none.
      await discounts.getByRole('button', { name: 'Actions' }).first().click()
      await page.getByRole('menuitem', { name: /delete|remove/i }).click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'discount-code-dialog',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'draft')
      const sidebar = card(page, /discount|gift card/i)
      await toMiddle(sidebar)
      await page.getByRole('button', { name: 'Apply' }).first().click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'discount-code-refused',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'draft')
      await page.getByRole('button', { name: 'Apply' }).first().click()
      const open = dialog(page)
      await open.getByLabel('Code').fill('NOPE10')
      await open.getByRole('button', { name: 'Apply' }).click()
      await expect(open.getByText(/doesn't exist|not found|invalid/i)).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'gift-card-dialog',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'draft')
      await page.getByRole('button', { name: 'Apply' }).last().click()
      const open = dialog(page)
      await open.getByLabel('Code').fill(giftCardCode)
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'gift-card-refused',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'draft')
      await page.getByRole('button', { name: 'Apply' }).last().click()
      const open = dialog(page)
      await open.getByLabel('Code').fill('FIDELITY-NO-SUCH-CARD')
      await open.getByRole('button', { name: /^add$/i }).click()
      await page.waitForLoadState('networkidle')
    },
  },
  ...(['admin', 'support'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-ORD-04',
      state: 'customer-menu',
      variant,
      reach: async (page) => {
        await openOrder(page, 'paid')
        const customer = card(page, /^customer$/i)
        await customer.getByRole('button', { name: 'Actions' }).click()
        await expect(page.getByRole('menuitem').first()).toBeVisible()
      },
    }),
  ),
  {
    screen: 'DA-ORD-04',
    state: 'edit-shipping-address',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'paid')
      await card(page, /^customer$/i)
        .getByRole('button', { name: 'Actions' })
        .click()
      await page.getByRole('menuitem', { name: 'Edit Shipping Address' }).click()
      await expect(dialog(page)).toBeVisible()
      // The country shows its placeholder until the country list arrives.
      await expect(dialog(page).getByText('Select a country')).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'customer-email-only',
    variant: 'admin',
    reach: (page) => openOrder(page, 'guestDraft'),
  },
  {
    screen: 'DA-ORD-04',
    state: 'customer-neither',
    variant: 'admin',
    intercepted: "The order's answer has no customer, email or addresses",
    reach: async (page) => {
      await answeredOrder(page, 'guestDraft', {
        email: null,
        customer: null,
        customer_id: null,
        shipping_address: null,
        billing_address: null,
      })
      await openOrder(page, 'guestDraft')
    },
  },
  ...(
    [
      ['tags', /^tags$/i],
      ['special-instructions', /^special instructions$/i],
      ['internal-note', /^internal note$/i],
    ] as const
  ).flatMap(([name, title]) =>
    (['admin', 'support'] as Variant[]).map(
      (variant): Capture => ({
        screen: 'DA-ORD-04',
        state: `${name}-editing`,
        variant,
        reach: async (page) => {
          await openOrder(page, 'annotated')
          const notes = card(page, title)
          await toMiddle(notes)
          const edit = notes.getByRole('button', { name: 'Edit' })
          if (await edit.isVisible()) await edit.click()
        },
      }),
    ),
  ),
  {
    screen: 'DA-ORD-04',
    state: 'purchase-order-editing',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'freight')
      const purchase = card(page, /^purchase order$/i)
      await toMiddle(purchase)
      await purchase.getByRole('button', { name: 'Edit' }).click()
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'downloads-reset-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'digital')
      const downloads = card(page, /download/i)
      await toMiddle(downloads)
      await downloads.getByRole('button', { name: 'Reset' }).first().click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The order request is held open',
    loading: true,
    reach: async (page) => {
      await hold(page, (path) => path === `/api/v3/admin/orders/${orders.paid.id}`)
      await page.goto(`/${seeded.storeId}${orderPath('paid')}`)
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'failed-to-load',
    variant: 'admin',
    intercepted: 'The order request is answered with a server error',
    reach: async (page) => {
      await page.route(
        (url) => url.pathname === `/api/v3/admin/orders/${orders.paid.id}`,
        (route) =>
          route.request().method() === 'GET'
            ? route.fulfill({ status: 500, json: { error: { code: 'internal', message: 'Boom' } } })
            : route.fallback(),
      )
      await page.goto(`/${seeded.storeId}${orderPath('paid')}`)
      await page.waitForLoadState('networkidle')
    },
  },
  directVisit('DA-ORD-04', () => orderPath('paid')),
]

// DA-ORD-05 Edit order items

const editPath = (key: OrderKey) => `/orders/${orders[key].id}/edit`

const openEdit = async (page: Page, key: OrderKey) => {
  await openStore(page, editPath(key))
  await expect(page.getByRole('heading', { name: /^edit order$/i })).toBeVisible({
    timeout: 15_000,
  })
}

const editCaptures: Capture[] = [
  ...(['admin', ...variants] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-ORD-05',
      state: 'listed',
      variant,
      reach: (page) => openEdit(page, 'paid'),
    }),
  ),
  {
    screen: 'DA-ORD-05',
    state: 'changed-not-saved',
    variant: 'admin',
    reach: async (page) => {
      await openEdit(page, 'paid')
      const quantity = page.getByLabel(/^quantity of electric kettle/i)
      await quantity.fill('3')
      await page.getByRole('button', { name: /^remove 2-slice toaster/i }).click()
      await expect(page.getByText('Removing')).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-05',
    state: 'add-product-dialog',
    variant: 'admin',
    reach: async (page) => {
      await openEdit(page, 'paid')
      await page.getByRole('button', { name: /^add product$/i }).click()
      const sheet = dialog(page)
      await sheet.getByPlaceholder(/type product name or sku/i).fill('Toaster')
      await expect(sheet.getByText(/4-Slice Toaster/).first()).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-ORD-05',
    state: 'draft-prices',
    variant: 'admin',
    reach: (page) => openEdit(page, 'draft'),
  },
  {
    screen: 'DA-ORD-05',
    state: 'draft-negotiated-price-reset',
    variant: 'admin',
    reach: async (page) => {
      await openEdit(page, 'draft')
      await page.getByRole('button', { name: /^reset 2-slice toaster to catalog price/i }).click()
      await expect(page.getByText('Reverting to catalog price')).toBeVisible()
    },
  },
  {
    screen: 'DA-ORD-05',
    state: 'below-fulfilled-save',
    variant: 'admin',
    reach: async (page) => {
      await openEdit(page, 'partlyFulfilled')
      await page.getByLabel(/^quantity of electric kettle/i).fill('1')
      await page.getByRole('button', { name: /^save/i }).click()
    },
  },
  {
    screen: 'DA-ORD-05',
    state: 'below-fulfilled-shortcut',
    variant: 'admin',
    reach: async (page) => {
      await openEdit(page, 'partlyFulfilled')
      const quantity = page.getByLabel(/^quantity of electric kettle/i)
      await quantity.fill('1')
      await quantity.press('ControlOrMeta+Enter')
    },
  },
  {
    screen: 'DA-ORD-05',
    state: 'fully-fulfilled',
    variant: 'admin',
    reach: (page) => openStore(page, editPath('fulfilled')),
  },
  {
    screen: 'DA-ORD-05',
    state: 'unsaved-changes',
    variant: 'admin',
    reach: async (page) => {
      await openEdit(page, 'paid')
      await page.getByLabel(/^quantity of electric kettle/i).fill('2')
      await page
        .getByRole('link', { name: /^back|orders/i })
        .first()
        .click()
    },
  },
  directVisit('DA-ORD-05', () => editPath('paid')),
]

test.beforeAll(async ({ baseURL: configured }) => {
  const baseURL = configured ?? 'http://localhost:5174'
  seeded = await seed(baseURL)
  orders = await seedOrders(baseURL)
  writeFileSync(
    new URL('./results/orders-batch-8-numbers.json', import.meta.url).pathname,
    JSON.stringify(
      Object.fromEntries(Object.entries(orders).map(([key, order]) => [key, order.number])),
      null,
      2,
    ),
  )
})

test.use({ viewport: { width: 1280, height: 960 } })

async function blockOutside(page: Page): Promise<string[]> {
  const outside: string[] = []
  await page.context().route(
    (url) =>
      !['data:', 'blob:'].includes(url.protocol) &&
      !['localhost', '127.0.0.1'].includes(url.hostname),
    (route) => {
      outside.push(route.request().url())
      return route.abort()
    },
  )
  return outside
}

/**
 * Spree's browser-test server gives its files an address on port 3000, where
 * nothing runs; the pictures are fetched from the test server's own port so
 * they draw.
 */
const filesFrom = new URL(process.env.FIDELITY_API_URL ?? 'http://localhost:3010').origin

async function serveFiles(page: Page) {
  await page.context().route('http://localhost:3000/rails/active_storage/**', async (route) => {
    const url = route.request().url().replace('http://localhost:3000', filesFrom)
    await route.fulfill({ response: await route.fetch({ url }) })
  })
}

async function save(
  page: Page,
  item: Capture,
  theme: 'light' | 'dark',
  settled: boolean | null,
  outside: string[],
) {
  const folder = `${results}${item.screen}/${item.state}/`
  const name = `${item.variant}${item.phone ? '-phone' : ''}-${theme}`
  mkdirSync(folder, { recursive: true })
  const window = page.viewportSize()
  if (item.fullPage && window) {
    // The page scrolls inside the shell, not the document, so a full-page
    // screenshot would stop at the window: the window grows to the page instead.
    const hidden = await page.evaluate(() =>
      Math.max(
        0,
        ...[...document.querySelectorAll('*')]
          .filter((element) => /(auto|scroll)/.test(getComputedStyle(element).overflowY))
          .map((element) => element.scrollHeight - element.clientHeight),
      ),
    )
    if (hidden > 0) {
      await page.setViewportSize({ width: window.width, height: window.height + hidden })
      await page.waitForTimeout(300)
    }
  }
  const captured = page.viewportSize()
  await page.screenshot({ path: `${folder}${name}.png`, fullPage: item.fullPage ?? false })
  writeFileSync(
    `${folder}${name}.json`,
    JSON.stringify(
      {
        screen: item.screen,
        state: item.state,
        variant: item.variant,
        role: item.variant === 'admin' ? null : roles[teammates[item.variant].role],
        theme,
        revision,
        path: new URL(page.url()).pathname.replace(seeded.storeId, '<store>'),
        viewport: window,
        fullPage: item.fullPage ?? false,
        capturedHeight: captured?.height ?? null,
        intercepted: item.intercepted ?? null,
        settled,
        outside,
        customer: orderCustomerEmail,
      },
      null,
      2,
    ),
  )
}

for (const theme of ['light', 'dark'] as const) {
  for (const item of [
    ...listCaptures,
    ...draftCaptures,
    ...newCaptures,
    ...orderCaptures,
    ...editCaptures,
  ]) {
    const label = `${item.screen} ${item.state} ${item.variant}${item.phone ? ' phone' : ''} ${theme}`
    test(label, async ({ page }) => {
      if (item.phone) await page.setViewportSize(phone)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      await serveFiles(page)
      await signIn(page, item.variant)
      await item.reach(page)
      const settled = item.loading ? null : await settle(page)
      await page.waitForTimeout(400)
      await save(page, item, theme, settled, outside)
    })
  }
}
