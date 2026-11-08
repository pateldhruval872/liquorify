import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { login, searchList } from '../../dashboard/e2e/helpers'
import { type AfterSaleKey, type AfterSaleOrders, seedAfterSale, tracking } from './after-sale'
import { orderCustomerEmail } from './orders'
import { PASSWORD, roles, type Seeded, seed, teammates } from './staff'

/**
 * Captures part 2 of batch 8's screens: DA-ORD-04's fulfilment and after-sale
 * states, and DA-ORD-06 to DA-ORD-08, in each state the work item maps
 * (§2.2), and each of its five permission variants (§2.3), as
 * `screens-batch-8.spec.ts` captures part 1's. It gathers evidence for a
 * person to review and passes whenever it can capture a screen; it compares
 * nothing.
 *
 * Start the screens as `compare.spec.ts` describes, with Spree's sample
 * catalog loaded into the browser-test database. Before the first capture it
 * adds the staff and roles (`staff.ts`) and the orders the states need
 * (`after-sale.ts`); running it again reuses them. No capture saves a change:
 * each dialog and confirmation is captured open and left unanswered.
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
let orders: AfterSaleOrders

interface Capture {
  screen: string
  state: string
  variant: Variant
  /** How the state was reached when the browser answered or held a request, for the record. */
  intercepted?: string
  /** Captured at a phone's width instead of the desktop's. */
  phone?: true
  /** Captured down the whole page, for a page taller than the window. */
  fullPage?: true
  /** Reaches the state; a page it answers, such as a window it opened, is the one captured. */
  reach: (page: Page) => Promise<unknown>
}

const phone = { width: 390, height: 844 }
const variants: Variant[] = ['orderManager', 'support', 'packer']
const everyRole: Variant[] = ['admin', ...variants]

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
const answeredOrder = (page: Page, key: AfterSaleKey, change: Record<string, unknown>) =>
  page.route(
    (url) => url.pathname === `/api/v3/admin/orders/${orders[key].id}`,
    async (route) => {
      if (route.request().method() !== 'GET') return route.fallback()
      const response = await route.fetch()
      await route.fulfill({ response, json: { ...(await response.json()), ...change } })
    },
  )

/** Scrolls an element to the top of its scrolling area, for a state lower on a page. */
const toTop = (target: Locator) =>
  target.evaluate((element) => element.scrollIntoView({ block: 'start' }))

/** A card on the order page, found by its title. */
const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()

const fulfilments = (page: Page) => card(page, /^Fulfillments/)
const returnsCard = (page: Page) => card(page, /^Returns/)
const exchangesCard = (page: Page) => card(page, /^Exchanges/)
const claimsCard = (page: Page) => card(page, /^Claims/)

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

// DA-ORD-04 Order, fulfilment

const orderPath = (key: AfterSaleKey) => `/orders/${orders[key].id}`

const openOrder = async (page: Page, key: AfterSaleKey) => {
  await openStore(page, orderPath(key))
  await expect(page.getByRole('heading', { name: orders[key].number })).toBeVisible({
    timeout: 15_000,
  })
}

/** The order page with one of its cards brought to the top of the window. */
const showCard = async (page: Page, key: AfterSaleKey, which: (page: Page) => Locator) => {
  await openOrder(page, key)
  const target = which(page)
  await expect(target).toBeVisible({ timeout: 15_000 })
  await settle(page)
  await toTop(target)
  return target
}

/** The fulfilment's own menu, the first in its card. */
const fulfilmentMenu = async (page: Page, key: AfterSaleKey) => {
  const target = await showCard(page, key, fulfilments)
  await target.getByRole('button', { name: 'Actions' }).first().click()
}

const fulfilmentAction = async (page: Page, key: AfterSaleKey, item: RegExp) => {
  await fulfilmentMenu(page, key)
  await page.getByRole('menuitem', { name: item }).click()
}

/** A consignment's menu, found by its tracking number. */
const deliveryMenu = async (page: Page, key: AfterSaleKey, number: string) => {
  const target = await showCard(page, key, fulfilments)
  await target
    .locator('div.flex-wrap.justify-between')
    .filter({ has: page.getByRole('link', { name: number }) })
    .getByRole('button', { name: 'Actions' })
    .click()
}

/** An order as it shows one of its cards, for each role named. */
const cardState = (
  state: string,
  key: AfterSaleKey,
  which: (page: Page) => Locator,
  roleVariants: Variant[] = ['admin'],
) =>
  roleVariants.map(
    (variant): Capture => ({
      screen: 'DA-ORD-04',
      state,
      variant,
      reach: async (page) => {
        await showCard(page, key, which)
      },
    }),
  )

/** An order down its whole length, for each role named. */
const orderState = (state: string, key: AfterSaleKey, roleVariants: Variant[] = ['admin']) =>
  roleVariants.map(
    (variant): Capture => ({
      screen: 'DA-ORD-04',
      state,
      variant,
      fullPage: true,
      reach: (page) => openOrder(page, key),
    }),
  )

const step = (
  state: string,
  reach: (page: Page) => Promise<unknown>,
  extra: Partial<Capture> = {},
): Capture => ({
  screen: 'DA-ORD-04',
  state,
  variant: 'admin',
  reach: async (page) => {
    await reach(page)
  },
  ...extra,
})

const fulfilmentCaptures: Capture[] = [
  ...cardState('fulfilment-draft-unclaimed', 'unaddressedDraft', fulfilments, ['admin', 'packer']),
  ...cardState('fulfilment-draft', 'draft', fulfilments),
  ...cardState('fulfilment-ready', 'toShip', fulfilments, everyRole),
  step('fulfilment-ready-menu', (page) => fulfilmentMenu(page, 'toShip')),
  step('fulfilment-ready-menu', (page) => fulfilmentMenu(page, 'toShip'), { variant: 'packer' }),
  step('fulfilment-ready-menu', (page) => fulfilmentMenu(page, 'toShip'), { variant: 'support' }),
  {
    screen: 'DA-ORD-04',
    state: 'fulfilment-ready',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await showCard(page, 'toShip', fulfilments)
    },
  },
  step('fulfil-form-all', async (page) => {
    const target = await showCard(page, 'toShip', fulfilments)
    await target.getByRole('button', { name: 'Mark as fulfilled' }).click()
    await expect(page.getByRole('button', { name: 'Fulfill items' })).toBeVisible()
  }),
  step('fulfil-form-some-with-tracking', async (page) => {
    const target = await showCard(page, 'toShip', fulfilments)
    await target.getByRole('button', { name: 'Mark as fulfilled' }).click()
    await page.getByRole('spinbutton', { name: /^quantity to ship of electric kettle/i }).fill('1')
    await page.getByRole('textbox', { name: 'Tracking number' }).fill(tracking.ups)
    await page.getByRole('checkbox', { name: /send shipment notification/i }).click()
  }),
  step('fulfil-form-carriers', async (page) => {
    const target = await showCard(page, 'toShip', fulfilments)
    await target.getByRole('button', { name: 'Mark as fulfilled' }).click()
    await page.getByRole('combobox', { name: 'Shipping carrier' }).click()
    await expect(page.getByRole('option').first()).toBeVisible()
  }),
  step('edit-dialog', (page) => fulfilmentAction(page, 'toShip', /^edit$/i)),
  step('edit-dialog-origins', async (page) => {
    await fulfilmentAction(page, 'toShip', /^edit$/i)
    await dialog(page).getByRole('combobox', { name: 'Ships from' }).click()
    await expect(page.getByRole('option').first()).toBeVisible()
  }),
  step('edit-dialog-methods', async (page) => {
    await fulfilmentAction(page, 'toShip', /^edit$/i)
    await dialog(page).getByRole('combobox', { name: 'Delivery method' }).click()
    await expect(page.getByRole('option').first()).toBeVisible()
  }),
  step('edit-dialog-origin-moved', async (page) => {
    await fulfilmentAction(page, 'toShip', /^edit$/i)
    await dialog(page).getByRole('combobox', { name: 'Ships from' }).click()
    await page.getByRole('option', { name: /E2E Source Warehouse/ }).click()
    await expect(page.getByRole('button', { name: 'Move and re-quote' })).toBeVisible()
  }),
  step('split-dialog', (page) => fulfilmentAction(page, 'toShip', /^split$/i)),
  step('split-would-empty', async (page) => {
    await fulfilmentAction(page, 'toShip', /^split$/i)
    await page.getByRole('spinbutton', { name: 'Quantity to move' }).fill('3')
    await expect(page.getByText(/leave at least one unit behind/i)).toBeVisible()
  }),
  step('cancel-confirmation', async (page) => {
    await fulfilmentAction(page, 'toShip', /^cancel$/i)
    await expect(page.getByText('Cancel this fulfillment?')).toBeVisible()
  }),
  step('upload-label-dialog', (page) => fulfilmentAction(page, 'toShip', /^upload label$/i)),
  // Sent with nothing chosen or typed: what the dialog says about each field.
  step('upload-label-dialog-empty', async (page) => {
    await fulfilmentAction(page, 'toShip', /^upload label$/i)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^upload label$/i })
      .click()
    await expect(
      page
        .getByRole('dialog')
        .getByText(/tracking/i)
        .first(),
    ).toBeVisible()
  }),
  // A tracking number typed but no file chosen.
  step('upload-label-dialog-no-file', async (page) => {
    await fulfilmentAction(page, 'toShip', /^upload label$/i)
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox', { name: /tracking number/i }).fill(tracking.ups)
    await dialog.getByRole('button', { name: /^upload label$/i }).click()
    await expect(dialog.getByText('Label file').nth(1)).toBeVisible()
  }),
  step('add-tracking-dialog', (page) => fulfilmentAction(page, 'toShip', /^add tracking$/i)),
  {
    screen: 'DA-ORD-04',
    state: 'packing-slip',
    variant: 'admin',
    reach: async (page) => {
      await fulfilmentMenu(page, 'toShip')
      const opened = page.waitForEvent('popup')
      await page.getByRole('menuitem', { name: /print packing slip/i }).click()
      const slip = await opened
      await slip.waitForLoadState()
      return slip
    },
  },
  ...cardState('fulfilment-canceled', 'awaiting', fulfilments, ['admin', 'packer']),
  ...cardState('fulfilled-tracked', 'shipped', fulfilments, everyRole),
  step('fulfilled-menu', (page) => fulfilmentMenu(page, 'shipped')),
  step('delivery-menu', (page) => deliveryMenu(page, 'shipped', tracking.ups)),
  step('delivery-menu', (page) => deliveryMenu(page, 'shipped', tracking.ups), {
    variant: 'support',
  }),
  step('delivery-edit-dialog', async (page) => {
    await deliveryMenu(page, 'shipped', tracking.ups)
    await page.getByRole('menuitem', { name: /^edit$/i }).click()
    await expect(page.getByRole('heading', { name: 'Edit tracking' })).toBeVisible()
  }),
  step('delivery-remove-confirmation', async (page) => {
    await deliveryMenu(page, 'shipped', tracking.ups)
    await page.getByRole('menuitem', { name: /^delete$/i }).click()
    await expect(page.getByText(/remove this tracking number\?/i)).toBeVisible()
  }),
  step('add-tracking-after-shipping', async (page) => {
    const target = await showCard(page, 'shipped', fulfilments)
    await target.getByRole('button', { name: 'Add tracking' }).click()
    await page.getByRole('combobox', { name: 'Shipping carrier' }).click()
    await expect(page.getByRole('option').first()).toBeVisible()
  }),
  ...cardState('tracked-three-carriers', 'tracked', fulfilments),
  ...cardState('delivered', 'delivered', fulfilments, ['admin', 'packer']),
  ...cardState('two-locations', 'twoLocations', fulfilments),
  ...cardState('label-uploaded', 'labelled', fulfilments, ['admin', 'packer', 'support']),
  step('label-menu', async (page) => {
    const target = await showCard(page, 'labelled', fulfilments)
    await target
      .locator('[data-slot="card-content"]')
      .filter({ has: page.getByRole('button', { name: 'Print label' }) })
      .last()
      .getByRole('button', { name: 'Actions' })
      .click()
  }),
  step('label-delete-confirmation', async (page) => {
    const target = await showCard(page, 'labelled', fulfilments)
    await target
      .locator('[data-slot="card-content"]')
      .filter({ has: page.getByRole('button', { name: 'Print label' }) })
      .last()
      .getByRole('button', { name: 'Actions' })
      .click()
    await page.getByRole('menuitem', { name: /delete label/i }).click()
    await expect(page.getByText(/delete this label\?/i)).toBeVisible()
  }),
  ...cardState('backordered', 'backordered', fulfilments),
  ...cardState('price-list', 'priced', fulfilments),
  ...cardState('replacement-parcel', 'settled', fulfilments),
]

// DA-ORD-04 Order, after the sale

const afterSaleCaptures: Capture[] = [
  {
    screen: 'DA-ORD-04',
    state: 'nothing-returnable',
    variant: 'admin',
    intercepted: "The order's answer has its fulfilments taken out",
    reach: async (page) => {
      await answeredOrder(page, 'toShip', { fulfillments: [] })
      await showCard(page, 'toShip', returnsCard)
    },
  },
  ...cardState('after-sale-empty', 'returnable', returnsCard, everyRole),
  step('create-return', async (page) => {
    const target = await showCard(page, 'returnable', returnsCard)
    await target.getByRole('button', { name: 'New return' }).click()
    await expect(page.getByRole('heading', { name: 'New return' })).toBeVisible()
  }),
  step('create-return-reasons', async (page) => {
    const target = await showCard(page, 'returnable', returnsCard)
    await target.getByRole('button', { name: 'New return' }).click()
    await dialog(page).getByRole('combobox', { name: 'Reason' }).click()
    await expect(page.getByRole('option').first()).toBeVisible()
  }),
  step('create-return-locations', async (page) => {
    const target = await showCard(page, 'returnable', returnsCard)
    await target.getByRole('button', { name: 'New return' }).click()
    await dialog(page).getByRole('combobox', { name: 'Return to' }).click()
    await expect(page.getByRole('option').first()).toBeVisible()
  }),
  step(
    'create-return',
    async (page) => {
      const target = await showCard(page, 'returnable', returnsCard)
      await target.getByRole('button', { name: 'New return' }).click()
      await expect(page.getByRole('heading', { name: 'New return' })).toBeVisible()
    },
    { variant: 'support' },
  ),
  step('create-exchange', async (page) => {
    const target = await showCard(page, 'returnable', exchangesCard)
    await target.getByRole('button', { name: 'New exchange' }).click()
    const form = dialog(page)
    await form.getByRole('spinbutton').first().fill('1')
    await form.getByRole('combobox').first().click()
    await form.getByRole('combobox').first().fill('4-Slice')
    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 15_000 })
  }),
  step('create-claim', async (page) => {
    const target = await showCard(page, 'returnable', claimsCard)
    await target.getByRole('button', { name: 'New claim' }).click()
    await page.getByRole('spinbutton', { name: /^electric kettle/i }).fill('1')
  }),
  ...orderState('after-sale-requested', 'requested', everyRole),
  step('return-requested-menu', async (page) => {
    const target = await showCard(page, 'requested', returnsCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
  }),
  step(
    'return-requested-menu',
    async (page) => {
      const target = await showCard(page, 'requested', returnsCard)
      await target.getByRole('button', { name: 'Actions' }).first().click()
    },
    { variant: 'packer' },
  ),
  step('return-cancel-confirmation', async (page) => {
    const target = await showCard(page, 'requested', returnsCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: /^cancel$/i }).click()
    await expect(page.getByText(/cancel this return\?/i)).toBeVisible()
  }),
  step('return-label-confirmation', async (page) => {
    const target = await showCard(page, 'requested', returnsCard)
    await target.getByRole('button', { name: 'Buy return label' }).click()
    await expect(page.getByText(/buy a prepaid return label\?/i)).toBeVisible()
  }),
  step('exchange-requested-menu', async (page) => {
    const target = await showCard(page, 'requested', exchangesCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
  }),
  step('exchange-cancel-confirmation', async (page) => {
    const target = await showCard(page, 'requested', exchangesCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: /^cancel$/i }).click()
    await expect(page.getByRole('button', { name: 'Cancel exchange' })).toBeVisible()
  }),
  step('claim-open-menu', async (page) => {
    const target = await showCard(page, 'requested', claimsCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
  }),
  step('claim-deny-confirmation', async (page) => {
    const target = await showCard(page, 'requested', claimsCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: /^deny$/i }).click()
    await expect(page.getByText(/deny this claim\?/i)).toBeVisible()
  }),
  step('claim-cancel-confirmation', async (page) => {
    const target = await showCard(page, 'requested', claimsCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: /^cancel$/i }).click()
    await expect(page.getByRole('button', { name: 'Cancel claim' })).toBeVisible()
  }),
  ...orderState('after-sale-approved', 'approved'),
  step('receive-dialog', async (page) => {
    const target = await showCard(page, 'approved', returnsCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Receive items' }).click()
    await expect(page.getByRole('heading', { name: 'Receive returned items' })).toBeVisible()
  }),
  step('resolve-dialog', async (page) => {
    const target = await showCard(page, 'approved', claimsCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Resolve' }).click()
    await expect(page.getByRole('heading', { name: 'Resolve claim' })).toBeVisible()
  }),
  step('resolve-dialog-resolutions', async (page) => {
    const target = await showCard(page, 'approved', claimsCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Resolve' }).click()
    await dialog(page).getByRole('combobox', { name: 'How to resolve' }).click()
    await expect(page.getByRole('option').first()).toBeVisible()
  }),
  ...orderState('after-sale-received', 'received'),
  step('refund-dialog', async (page) => {
    const target = await showCard(page, 'received', returnsCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Refund' }).click()
    await expect(page.getByRole('heading', { name: 'Refund return' })).toBeVisible()
  }),
  step('refund-dialog-methods', async (page) => {
    const target = await showCard(page, 'received', returnsCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Refund' }).click()
    await dialog(page).getByRole('combobox', { name: 'Refund to' }).click()
    await expect(page.getByRole('option', { name: 'Store credit' })).toBeVisible()
  }),
  step('exchange-balance-due-confirmation', async (page) => {
    const target = await showCard(page, 'received', exchangesCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Ship replacement' }).click()
    await expect(page.getByText(/the replacement costs more than what came back/i)).toBeVisible()
  }),
  ...orderState('after-sale-settled', 'settled'),
  ...orderState('after-sale-store-credit-and-replacement', 'credited'),
  ...orderState('after-sale-withdrawn', 'withdrawn'),
  ...cardState('nothing-owed', 'nothingOwed', returnsCard),
  step('complete-dialog', async (page) => {
    const target = await showCard(page, 'nothingOwed', returnsCard)
    await target.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Complete return' }).click()
    await expect(page.getByRole('heading', { name: 'Complete return' })).toBeVisible()
  }),
  directVisit('DA-ORD-04', () => orderPath('requested')),
]

// DA-ORD-06 Returns, DA-ORD-07 Exchanges, DA-ORD-08 Claims

const lists = [
  { screen: 'DA-ORD-06', path: 'returns', heading: /^returns$/i, row: 'RET1003' },
  { screen: 'DA-ORD-07', path: 'exchanges', heading: /^exchanges$/i, row: 'EX1003' },
  { screen: 'DA-ORD-08', path: 'claims', heading: /^claims$/i, row: 'CLM1002' },
] as const

const openList = async (page: Page, list: (typeof lists)[number]) => {
  await openStore(page, `/${list.path}`)
  await expect(page.getByRole('heading', { name: list.heading })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('row').filter({ hasText: list.row })).toBeVisible({
    timeout: 15_000,
  })
}

const listCaptures: Capture[] = lists.flatMap((list): Capture[] => [
  ...everyRole.map(
    (variant): Capture => ({
      screen: list.screen,
      state: 'listed',
      variant,
      fullPage: true,
      reach: (page) => openList(page, list),
    }),
  ),
  {
    screen: list.screen,
    state: 'none',
    variant: 'admin',
    intercepted: `The ${list.path} answer has its records taken out`,
    reach: async (page) => {
      await emptied(page, list.path)
      await openStore(page, `/${list.path}`)
    },
  },
  directVisit(list.screen, () => `/${list.path}`),
])

listCaptures.push({
  screen: 'DA-ORD-06',
  state: 'searched',
  variant: 'admin',
  reach: async (page) => {
    await openList(page, lists[0])
    await searchList(page, /search by number/i, 'RET1003')
    await expect(page.getByRole('row').filter({ hasText: 'RET1001' })).toBeHidden({
      timeout: 15_000,
    })
  },
})

test.beforeAll(async ({ baseURL: configured }) => {
  const baseURL = configured ?? 'http://localhost:5174'
  seeded = await seed(baseURL)
  orders = await seedAfterSale(baseURL)
  writeFileSync(
    new URL('./results/orders-batch-8-part-2-numbers.json', import.meta.url).pathname,
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
      !['data:', 'blob:', 'about:'].includes(url.protocol) &&
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
  const path = new URL(page.url())
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
        path:
          path.protocol === 'about:' ? path.href : path.pathname.replace(seeded.storeId, '<store>'),
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
  for (const item of [...fulfilmentCaptures, ...afterSaleCaptures, ...listCaptures]) {
    const label = `${item.screen} ${item.state} ${item.variant}${item.phone ? ' phone' : ''} ${theme}`
    test(label, async ({ page }) => {
      if (item.phone) await page.setViewportSize(phone)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      await serveFiles(page)
      await signIn(page, item.variant)
      const answered = await item.reach(page)
      const opened =
        answered && typeof answered === 'object' && 'screenshot' in answered
          ? (answered as Page)
          : page
      if (opened !== page)
        await opened.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const settled = await settle(opened)
      await opened.waitForTimeout(400)
      await save(opened, item, theme, settled, outside)
    })
  }
}
