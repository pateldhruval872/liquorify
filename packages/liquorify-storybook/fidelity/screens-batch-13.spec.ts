import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, request, test } from '@playwright/test'
import { addRecordFilter, login, narrowQuickFilter, searchList } from '../../dashboard/e2e/helpers'
import { type Marketplace, seedMarketplace } from './marketplace'
import type { Json } from './orders'
import { admin, openRowMenu, PASSWORD, roles, type Seeded, seed, teammates } from './staff'

/**
 * Captures batch 13 part 1's screens (the operator's seller screens, and the
 * marketplace states of the product, order, home and report screens) in each
 * state the work item maps (§2.1), and each of its eight permission variants
 * (§2.2). It gathers evidence for a person to review and passes whenever it
 * can capture a screen; it compares nothing.
 *
 * Captured on the browser-test server, as `compare.spec.ts` describes. Before
 * the first capture the script adds the staff and roles (`staff.ts`) and the
 * marketplace (`marketplace.ts`): sellers in each status a workflow reaches,
 * their onboarding, products and ledger, a commission rate, and an order
 * group placed through the Store API with one of its orders fulfilled.
 *
 * No capture saves a change: each dialog, sheet and confirmation is captured
 * open and left unanswered. The states that need a saved change are reached
 * by `marketplace-checks.spec.ts`. Each capture is saved as
 * `results/screens/<screen ID>/<state>/<variant>-<theme>.png` with a `.json`
 * that records how the state was reached. A state reached by answering a
 * request in the browser says so in `intercepted`, and claims nothing about
 * the server.
 */

const results = new URL('./results/screens/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

type Variant =
  | 'admin'
  | 'sellerManager'
  | 'sellerViewer'
  | 'payoutsClerk'
  | 'commissionManager'
  | 'merchandiser'
  | 'orderManager'
  | 'storeSettings'

let seeded: Seeded
let market: Marketplace
/** A product and an order of the store's own, with no seller. */
let ownProduct: string
let ownOrder: string
let saltmarshOrder: string

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
  reach: (page: Page) => Promise<unknown>
}

const phone = { width: 390, height: 844 }

async function signIn(page: Page, item: Capture) {
  if (item.variant === 'admin') {
    await login(page)
    return
  }
  const res = await page.request.post('/api/v3/admin/auth/login', {
    data: { email: teammates[item.variant].email, password: PASSWORD },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto('/')
  await expect(page).toHaveURL(new RegExp(`/${seeded.storeId}`), { timeout: 15_000 })
}

/** Pages holding a request unanswered, whose network never goes quiet. */
const holding = new WeakSet<Page>()

async function open(page: Page, path: string) {
  await page.goto(`/${seeded.storeId}${path}`)
  if (!holding.has(page)) await page.waitForLoadState('networkidle')
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

const failing = (page: Page, matches: (url: URL) => boolean, method = 'GET') =>
  page.route(matches, (route) =>
    route.request().method() === method
      ? route.fulfill({
          status: 500,
          json: { error: { code: 'internal_error', message: 'Internal server error' } },
        })
      : route.fallback(),
  )

const held = (page: Page, matches: (url: URL) => boolean, method = 'GET') => {
  holding.add(page)
  return page.route(matches, (route) =>
    route.request().method() === method ? new Promise<void>(() => {}) : route.fallback(),
  )
}

const at = (path: string) => (url: URL) => url.pathname === `/api/v3/admin/${path}`

/** The real answer to a request, changed before the page reads it. */
const answered = (
  page: Page,
  matches: (url: URL) => boolean,
  change: (body: Record<string, unknown>) => Record<string, unknown>,
) =>
  page.route(matches, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    const response = await route.fetch()
    await route.fulfill({ response, json: change(await response.json()) })
  })

const emptyList = (body: Record<string, unknown>) => ({
  ...body,
  data: [],
  meta: { ...(body.meta as object), count: 0, pages: 0, from: 0, to: 0 },
})

const visible = (page: Page, text: RegExp | string) =>
  expect(page.getByText(text).first()).toBeVisible({ timeout: 20_000 })

const directVisit = (screen: string, variant: Variant, path: () => string): Capture => ({
  screen,
  state: 'direct-visit',
  variant,
  reach: async (page) => {
    await open(page, path())
    await expect(
      page
        .getByRole('heading')
        .or(page.getByRole('button', { name: /try again/i }))
        .or(page.getByText(/permission/i))
        .first(),
    ).toBeVisible({ timeout: 30_000 })
  },
})

const button = (page: Page, name: RegExp) => page.getByRole('button', { name }).first()

/** Scopes a control to the card that carries a title. */
const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText(title) })
    .first()

// DA-SEL-01 Sellers

const sellersList = async (page: Page) => {
  await open(page, '/sellers')
  await visible(page, 'Harbour Cask Co.')
}

const sellersCaptures: Capture[] = [
  ...(['admin', 'sellerManager', 'sellerViewer', 'payoutsClerk', 'commissionManager'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SEL-01',
      state: 'listed',
      variant,
      fullPage: true,
      reach: sellersList,
    }),
  ),
  {
    screen: 'DA-SEL-01',
    state: 'filtered-approved',
    variant: 'admin',
    reach: async (page) => {
      await sellersList(page)
      await narrowQuickFilter(page, /^status/i, /^approved$/i)
      await expect(page.getByText('Northgate Vintners')).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SEL-01',
    state: 'searched',
    variant: 'admin',
    reach: async (page) => {
      await sellersList(page)
      await searchList(page, /search sellers/i, 'Harbour')
      await expect(page.getByText('Saltmarsh Gin Co.')).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SEL-01',
    state: 'add-sheet',
    variant: 'admin',
    reach: async (page) => {
      await sellersList(page)
      await button(page, /add seller/i).click()
      await expect(page.getByRole('heading', { name: /new seller/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-SEL-01',
    state: 'add-refused',
    variant: 'admin',
    reach: async (page) => {
      await sellersList(page)
      await button(page, /add seller/i).click()
      await page.locator('#name').fill('Harbour Cask Co.')
      await button(page, /create seller/i).click()
      await page.waitForTimeout(1500)
    },
  },
  {
    screen: 'DA-SEL-01',
    state: 'delete-confirm',
    variant: 'admin',
    reach: async (page) => {
      await sellersList(page)
      await openRowMenu(page, 'Northgate Vintners')
      await page.getByRole('menuitem', { name: /delete/i }).click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SEL-01',
    state: 'none',
    variant: 'admin',
    intercepted: 'The sellers list is answered with no rows',
    reach: async (page) => {
      await answered(page, at('sellers'), emptyList)
      await open(page, '/sellers')
      await visible(page, /no sellers yet/i)
    },
  },
  {
    screen: 'DA-SEL-01',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The sellers list is held unanswered',
    reach: async (page) => {
      await held(page, at('sellers'))
      await open(page, '/sellers')
    },
  },
  {
    screen: 'DA-SEL-01',
    state: 'failed',
    variant: 'admin',
    intercepted: 'The sellers list is answered with a server error',
    reach: async (page) => {
      await failing(page, at('sellers'))
      await open(page, '/sellers')
      await page.waitForTimeout(3000)
    },
  },
  ...(['merchandiser', 'orderManager', 'storeSettings'] as const).map((variant) =>
    directVisit('DA-SEL-01', variant, () => '/sellers'),
  ),
]

// DA-SEL-02 Seller

const sellerPage = (key: keyof Marketplace['sellers'], name: string) => async (page: Page) => {
  await open(page, `/sellers/${market.sellers[key]}`)
  await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 20_000 })
  await settle(page)
}
const harbour = sellerPage('approved', 'Harbour Cask Co.')
const stonecrop = sellerPage('onboarding', 'Stonecrop Cellars')
const juniper = sellerPage('ready', 'Juniper Row Distillers')

const statusPages: [keyof Marketplace['sellers'], string][] = [
  ['pending', 'Fennel & Oak Provisions'],
  ['invited', 'Larkspur Ciderworks'],
  ['onboarding', 'Stonecrop Cellars'],
  ['ready', 'Juniper Row Distillers'],
  ['approved', 'Harbour Cask Co.'],
  ['rejected', 'Northgate Vintners'],
  ['suspended', 'Copperline Brewing'],
]

const confirmFrom =
  (reach: (page: Page) => Promise<void>, control: RegExp, scope?: RegExp) => async (page: Page) => {
    await reach(page)
    const where = scope ? card(page, scope) : page
    await where.getByRole('button', { name: control }).first().click()
    await expect(dialog(page).first()).toBeVisible()
  }

/** A row's own actions menu, in a card rather than a table. */
const openRowActions = (page: Page, text: string) =>
  page
    .getByText(text, { exact: true })
    .locator('xpath=ancestor::*[.//button[@aria-label="Open actions"]][1]')
    .getByRole('button', { name: /open actions/i })
    .click()

/** Suspending, rejecting and reopening onboarding sit in the header's More actions menu. */
const confirmFromMenu =
  (reach: (page: Page) => Promise<void>, item: RegExp) => async (page: Page) => {
    await reach(page)
    await page.getByRole('button', { name: /more actions/i }).click()
    await page.getByRole('menuitem', { name: item }).click()
    await expect(dialog(page).first()).toBeVisible()
  }

const sellerCaptures: Capture[] = [
  ...statusPages.map(
    ([key, name]): Capture => ({
      screen: 'DA-SEL-02',
      state: `status-${key === 'ready' ? 'ready-for-review' : key}`,
      variant: 'admin',
      fullPage: true,
      reach: sellerPage(key, name),
    }),
  ),
  {
    screen: 'DA-SEL-02',
    state: 'status-approved',
    variant: 'admin',
    phone: true,
    fullPage: true,
    reach: harbour,
  },
  ...(['sellerManager', 'sellerViewer', 'payoutsClerk', 'commissionManager'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SEL-02',
      state: 'status-approved',
      variant,
      fullPage: true,
      reach: harbour,
    }),
  ),
  ...(['sellerManager', 'sellerViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SEL-02',
      state: 'status-onboarding',
      variant,
      fullPage: true,
      reach: stonecrop,
    }),
  ),
  {
    screen: 'DA-SEL-02',
    state: 'invite-sheet',
    variant: 'admin',
    reach: confirmFrom(sellerPage('pending', 'Fennel & Oak Provisions'), /^invite$/i),
  },
  {
    screen: 'DA-SEL-02',
    state: 'suspend-confirm',
    variant: 'admin',
    reach: confirmFromMenu(harbour, /^suspend$/i),
  },
  {
    screen: 'DA-SEL-02',
    state: 'reject-confirm',
    variant: 'admin',
    reach: confirmFromMenu(juniper, /^reject$/i),
  },
  {
    screen: 'DA-SEL-02',
    state: 'reopen-confirm',
    variant: 'admin',
    reach: confirmFromMenu(juniper, /send back to onboarding/i),
  },
  {
    screen: 'DA-SEL-02',
    state: 'approve-override-confirm',
    variant: 'admin',
    reach: confirmFrom(stonecrop, /^approve$/i),
  },
  {
    screen: 'DA-SEL-02',
    state: 'reinstate',
    variant: 'admin',
    reach: confirmFrom(sellerPage('suspended', 'Copperline Brewing'), /^reinstate$/i),
  },
  {
    screen: 'DA-SEL-02',
    state: 'edit-profile-sheet',
    variant: 'admin',
    reach: async (page) => {
      await harbour(page)
      await button(page, /^edit$/i).click()
      await expect(page.getByRole('heading', { name: /edit profile/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-SEL-02',
    state: 'edit-settlement-sheet',
    variant: 'admin',
    reach: confirmFrom(harbour, /^edit$/i, /payouts and tax/i),
  },
  {
    screen: 'DA-SEL-02',
    state: 'onboarding-send-back-confirm',
    variant: 'admin',
    reach: confirmFrom(stonecrop, /^send back$/i, /^onboarding$/i),
  },
  {
    screen: 'DA-SEL-02',
    state: 'onboarding-waive-confirm',
    variant: 'admin',
    reach: async (page) => {
      await stonecrop(page)
      // The requirement's menu button carries no name of its own, so it is
      // found beside the requirement it belongs to.
      await card(page, /^onboarding$/i)
        .getByText('Accept terms', { exact: true })
        .locator('xpath=ancestor::*[.//button][1]')
        .getByRole('button')
        .last()
        .click()
      await page.getByRole('menuitem', { name: /waive for this seller/i }).click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SEL-02',
    state: 'team-invite-sheet',
    variant: 'admin',
    reach: confirmFrom(harbour, /^invite$/i, /^team$/i),
  },
  {
    screen: 'DA-SEL-02',
    state: 'team-revoke-confirm',
    variant: 'admin',
    reach: async (page) => {
      await harbour(page)
      await openRowActions(page, 'cellar@harbour-cask.example.com')
      await page.getByRole('menuitem', { name: /^revoke$/i }).click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SEL-02',
    state: 'team-remove-confirm',
    variant: 'admin',
    reach: async (page) => {
      await harbour(page)
      await openRowActions(page, 'ines.carvalho@harbour-cask.example.com')
      await page.getByRole('menuitem', { name: /^remove$/i }).click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SEL-02',
    state: 'settle-confirm',
    variant: 'admin',
    reach: confirmFrom(harbour, /settle now/i),
  },
  {
    screen: 'DA-SEL-02',
    state: 'settle-confirm',
    variant: 'payoutsClerk',
    reach: confirmFrom(harbour, /settle now/i),
  },
  {
    screen: 'DA-SEL-02',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The seller is held unanswered',
    reach: async (page) => {
      await held(page, at(`sellers/${market.sellers.approved}`))
      await open(page, `/sellers/${market.sellers.approved}`)
    },
  },
  {
    screen: 'DA-SEL-02',
    state: 'not-found',
    variant: 'admin',
    reach: async (page) => {
      await open(page, '/sellers/seller_doesnotexist')
      await page.waitForTimeout(3000)
    },
  },
  {
    screen: 'DA-SEL-02',
    state: 'failed',
    variant: 'admin',
    intercepted: 'The seller is answered with a server error',
    reach: async (page) => {
      await failing(page, at(`sellers/${market.sellers.approved}`))
      await open(page, `/sellers/${market.sellers.approved}`)
      await page.waitForTimeout(3000)
    },
  },
  ...(['merchandiser', 'storeSettings'] as const).map((variant) =>
    directVisit('DA-SEL-02', variant, () => `/sellers/${market.sellers.approved}`),
  ),
]

// DA-SEL-03 Commission rates

const ratesList = async (page: Page) => {
  await open(page, '/sellers/commission-rates')
  await visible(page, 'Spirits and wine')
}

const ratesCaptures: Capture[] = [
  ...(['admin', 'commissionManager', 'sellerViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SEL-03',
      state: 'listed',
      variant,
      reach: ratesList,
    }),
  ),
  {
    screen: 'DA-SEL-03',
    state: 'create-sheet',
    variant: 'admin',
    fullPage: true,
    reach: async (page) => {
      await ratesList(page)
      await button(page, /add commission rate/i).click()
      await expect(page.getByRole('heading', { name: /commission rate/i }).last()).toBeVisible()
    },
  },
  {
    screen: 'DA-SEL-03',
    state: 'edit-sheet',
    variant: 'admin',
    fullPage: true,
    reach: async (page) => {
      await ratesList(page)
      await page.getByText('Spirits and wine').first().click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SEL-03',
    state: 'create-refused',
    variant: 'admin',
    reach: async (page) => {
      await ratesList(page)
      await button(page, /add commission rate/i).click()
      await button(page, /create commission rate/i).click()
      await page.waitForTimeout(1500)
    },
  },
  {
    screen: 'DA-SEL-03',
    state: 'delete-confirm',
    variant: 'admin',
    reach: async (page) => {
      await ratesList(page)
      await openRowMenu(page, 'Spirits and wine')
      await page.getByRole('menuitem', { name: /delete/i }).click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SEL-03',
    state: 'none',
    variant: 'admin',
    intercepted: 'The commission rates list is answered with no rows',
    reach: async (page) => {
      await answered(page, at('commission_rates'), emptyList)
      await open(page, '/sellers/commission-rates')
      await visible(page, /no commission rates yet/i)
    },
  },
  ...(['sellerManager', 'payoutsClerk'] as const).map((variant) =>
    directVisit('DA-SEL-03', variant, () => '/sellers/commission-rates'),
  ),
  {
    screen: 'DA-SEL-03',
    state: 'old-address',
    variant: 'admin',
    reach: async (page) => {
      await open(page, '/settings/commission-rates')
      await visible(page, 'Spirits and wine')
    },
  },
]

// DA-SEL-04 Seller transfers, DA-SEL-05 Payouts, DA-SEL-06 Payout

const transfersList = async (page: Page) => {
  await open(page, '/sellers/transfers')
  await visible(page, 'Harbour Cask Co.')
}
const payoutsList = async (page: Page) => {
  await open(page, '/sellers/payouts')
  await visible(page, 'Harbour Cask Co.')
}
const payoutPage = (index: number) => async (page: Page) => {
  await open(page, `/sellers/payouts/${market.payouts[index][0]}`)
  await visible(page, 'Harbour Cask Co.')
  await settle(page)
}
const completedPayout = () => market.payouts.findIndex(([, status]) => status === 'completed')
const pendingPayout = () => market.payouts.findIndex(([, status]) => status === 'pending')

const ledgerCaptures: Capture[] = [
  ...(['admin', 'sellerViewer', 'payoutsClerk'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SEL-04',
      state: 'listed',
      variant,
      fullPage: true,
      reach: transfersList,
    }),
  ),
  {
    screen: 'DA-SEL-04',
    state: 'none',
    variant: 'admin',
    intercepted: 'The seller transfers list is answered with no rows',
    reach: async (page) => {
      await answered(page, at('seller_transfers'), emptyList)
      await open(page, '/sellers/transfers')
      await visible(page, /no seller earnings yet/i)
    },
  },
  ...(['sellerManager', 'commissionManager'] as const).map((variant) =>
    directVisit('DA-SEL-04', variant, () => '/sellers/transfers'),
  ),
  ...(['admin', 'payoutsClerk', 'sellerViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SEL-05',
      state: 'listed',
      variant,
      reach: payoutsList,
    }),
  ),
  {
    screen: 'DA-SEL-05',
    state: 'searched',
    variant: 'admin',
    reach: async (page) => {
      await payoutsList(page)
      await searchList(page, /search by reference/i, 'BACS-HARBOUR')
      await expect(page.getByRole('row')).toHaveCount(2, { timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SEL-05',
    state: 'none',
    variant: 'admin',
    intercepted: 'The payouts list is answered with no rows',
    reach: async (page) => {
      await answered(page, at('seller_payouts'), emptyList)
      await open(page, '/sellers/payouts')
      await visible(page, /no payouts yet/i)
    },
  },
  ...(['sellerManager', 'commissionManager'] as const).map((variant) =>
    directVisit('DA-SEL-05', variant, () => '/sellers/payouts'),
  ),
  {
    screen: 'DA-SEL-05',
    state: 'old-address',
    variant: 'admin',
    reach: async (page) => {
      await open(page, '/settings/payouts')
      await page.waitForTimeout(2000)
      await settle(page)
    },
  },
  ...(['admin', 'payoutsClerk', 'sellerViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SEL-06',
      state: 'pending',
      variant,
      fullPage: true,
      reach: (page) => payoutPage(pendingPayout())(page),
    }),
  ),
  {
    screen: 'DA-SEL-06',
    state: 'mark-paid-dialog',
    variant: 'admin',
    reach: async (page) => {
      await payoutPage(pendingPayout())(page)
      await button(page, /mark as paid/i).click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SEL-06',
    state: 'completed',
    variant: 'admin',
    fullPage: true,
    reach: (page) => payoutPage(completedPayout())(page),
  },
  {
    screen: 'DA-SEL-06',
    state: 'not-found',
    variant: 'admin',
    reach: async (page) => {
      await open(page, '/sellers/payouts/spay_doesnotexist')
      await page.waitForTimeout(3000)
    },
  },
]

// DA-SET-22 Marketplace, DA-SET-23 Seller requirements

const marketplaceSettings = async (page: Page) => {
  await open(page, '/settings/marketplace')
  await expect(page.getByRole('heading', { name: 'Marketplace' }).first()).toBeVisible({
    timeout: 20_000,
  })
  await settle(page)
}
const requirementsList = async (page: Page) => {
  await open(page, '/settings/seller-requirements')
  await visible(page, 'Marketplace background check')
}

const settingsCaptures: Capture[] = [
  ...(['admin', 'storeSettings'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-22',
      state: 'saved',
      variant,
      fullPage: true,
      reach: marketplaceSettings,
    }),
  ),
  {
    screen: 'DA-SET-22',
    state: 'saved',
    variant: 'admin',
    phone: true,
    fullPage: true,
    reach: marketplaceSettings,
  },
  {
    screen: 'DA-SET-22',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The store is held unanswered',
    reach: async (page) => {
      await held(page, at('store'))
      await open(page, '/settings/marketplace')
    },
  },
  {
    screen: 'DA-SET-22',
    state: 'failed',
    variant: 'admin',
    intercepted: 'The store is answered with a server error',
    reach: async (page) => {
      await failing(page, at('store'))
      await open(page, '/settings/marketplace')
      await page.waitForTimeout(3000)
    },
  },
  {
    screen: 'DA-SET-22',
    state: 'refused-save',
    variant: 'admin',
    intercepted: 'The save is answered with a validation error on the payout minimum',
    reach: async (page) => {
      await page.route(at('store'), (route) =>
        route.request().method() === 'PATCH'
          ? route.fulfill({
              status: 422,
              json: {
                error: {
                  code: 'validation_error',
                  message: 'Minimum payout amount must be greater than or equal to 0',
                  details: {
                    preferred_minimum_payout_amount: ['must be greater than or equal to 0'],
                  },
                },
              },
            })
          : route.fallback(),
      )
      await marketplaceSettings(page)
      const minimum = page.locator('input[type="number"]').first()
      await minimum.fill('-5')
      await button(page, /^save/i).click()
      await page.waitForTimeout(1500)
    },
  },
  ...(['sellerManager', 'sellerViewer', 'merchandiser'] as const).map((variant) =>
    directVisit('DA-SET-22', variant, () => '/settings/marketplace'),
  ),
  ...(['admin', 'sellerManager', 'sellerViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-23',
      state: 'listed',
      variant,
      reach: requirementsList,
    }),
  ),
  {
    screen: 'DA-SET-23',
    state: 'add-sheet',
    variant: 'admin',
    reach: async (page) => {
      await requirementsList(page)
      await button(page, /add requirement/i).click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-23',
    state: 'edit-sheet',
    variant: 'admin',
    reach: async (page) => {
      await requirementsList(page)
      await page.getByText('Marketplace background check').first().click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-23',
    state: 'delete-confirm',
    variant: 'admin',
    reach: async (page) => {
      await requirementsList(page)
      await openRowMenu(page, 'Marketplace background check')
      await page.getByRole('menuitem', { name: /delete/i }).click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-23',
    state: 'none',
    variant: 'admin',
    intercepted: 'The requirements list is answered with no rows',
    reach: async (page) => {
      await answered(page, at('seller_requirements'), emptyList)
      await open(page, '/settings/seller-requirements')
      await visible(page, /no requirements yet/i)
    },
  },
  ...(['storeSettings', 'payoutsClerk'] as const).map((variant) =>
    directVisit('DA-SET-23', variant, () => '/settings/seller-requirements'),
  ),
]

// DA-PRD-01 and DA-PRD-03, marketplace states

const productPage = (key: keyof Marketplace['products'] | 'own') => async (page: Page) => {
  await open(page, `/products/${key === 'own' ? ownProduct : market.products[key]}`)
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 })
  await settle(page)
}

const productCaptures: Capture[] = [
  ...(['admin', 'merchandiser'] as const).map(
    (variant): Capture => ({
      screen: 'DA-PRD-01',
      state: 'seller-column',
      variant,
      reach: async (page) => {
        await open(page, '/products')
        await searchList(page, /^search…$/i, 'Harbour')
        await visible(page, 'Harbour Cask 12 Year Single Malt')
      },
    }),
  ),
  {
    screen: 'DA-PRD-01',
    state: 'filtered-by-seller',
    variant: 'admin',
    reach: async (page) => {
      await open(page, '/products')
      await addRecordFilter(page, /^seller$/i, 'Harbour Cask Co.')
      await visible(page, 'Harbour Cask Navy Strength Rum')
    },
  },
  ...(['admin', 'merchandiser', 'sellerManager'] as const).map(
    (variant): Capture => ({
      screen: 'DA-PRD-03',
      state: 'proposed',
      variant,
      fullPage: true,
      reach: productPage('proposed'),
    }),
  ),
  {
    screen: 'DA-PRD-03',
    state: 'approve-confirm',
    variant: 'admin',
    reach: async (page) => {
      await productPage('proposed')(page)
      await button(page, /^approve$/i).click()
      await expect(dialog(page).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'reject-reason',
    variant: 'admin',
    reach: async (page) => {
      await productPage('proposed')(page)
      await button(page, /^send back$/i).click()
      await page
        .getByRole('textbox', { name: /reason/i })
        .fill('Please add the bottle size and ABV.')
    },
  },
  {
    screen: 'DA-PRD-03',
    state: 'rejected',
    variant: 'admin',
    fullPage: true,
    reach: productPage('rejected'),
  },
  {
    screen: 'DA-PRD-03',
    state: 'approved',
    variant: 'admin',
    fullPage: true,
    reach: productPage('active'),
  },
  {
    screen: 'DA-PRD-03',
    state: 'suspended-seller',
    variant: 'admin',
    fullPage: true,
    reach: productPage('suspended'),
  },
  {
    screen: 'DA-PRD-03',
    state: 'store-own',
    variant: 'admin',
    reach: productPage('own'),
  },
]

// DA-ORD-01 and DA-ORD-04, marketplace states

const orderPage = (id: () => string) => async (page: Page) => {
  await open(page, `/orders/${id()}`)
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 })
  await settle(page)
}
const harbourOrder = orderPage(() => market.fulfilledOrder)

const orderCaptures: Capture[] = [
  ...(['admin', 'orderManager'] as const).map(
    (variant): Capture => ({
      screen: 'DA-ORD-01',
      state: 'seller-column',
      variant,
      reach: async (page) => {
        await open(page, '/orders')
        await visible(page, market.orderGroup.number)
      },
    }),
  ),
  {
    screen: 'DA-ORD-01',
    state: 'filtered-by-seller',
    variant: 'admin',
    reach: async (page) => {
      await open(page, '/orders')
      await addRecordFilter(page, /^seller$/i, 'Harbour Cask Co.')
      await settle(page)
    },
  },
  directVisit('DA-ORD-04', 'sellerViewer', () => `/orders/${market.fulfilledOrder}`),
  ...(['admin', 'orderManager'] as const).map(
    (variant): Capture => ({
      screen: 'DA-ORD-04',
      state: 'seller-order-settled',
      variant,
      fullPage: true,
      reach: harbourOrder,
    }),
  ),
  {
    screen: 'DA-ORD-04',
    state: 'seller-order-not-settled',
    variant: 'admin',
    fullPage: true,
    reach: orderPage(() => saltmarshOrder),
  },
  {
    screen: 'DA-ORD-04',
    state: 'store-own',
    variant: 'admin',
    fullPage: true,
    reach: orderPage(() => ownOrder),
  },
  {
    screen: 'DA-ORD-04',
    state: 'commission-failed',
    variant: 'admin',
    intercepted: 'The commission lines are answered with a server error',
    fullPage: true,
    reach: async (page) => {
      await failing(page, at('commission_lines'))
      await harbourOrder(page)
    },
  },
  {
    screen: 'DA-ORD-04',
    state: 'store-own',
    variant: 'orderManager',
    fullPage: true,
    reach: orderPage(() => ownOrder),
  },
]

// DA-HOME-01 and DA-RPT-03, marketplace states

const sellersTab = async (page: Page) => {
  await open(page, '')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
  const tab = page.getByRole('tab', { name: 'Sellers' })
  await tab.scrollIntoViewIfNeeded()
  await tab.click()
  await settle(page)
  await page.waitForTimeout(800)
}

let sellerPayoutsReport: string

const reportCaptures: Capture[] = [
  {
    screen: 'DA-HOME-01',
    state: 'sellers-ranking',
    variant: 'admin',
    reach: sellersTab,
  },
  {
    screen: 'DA-HOME-01',
    state: 'sellers-ranking-none',
    variant: 'admin',
    intercepted: 'The sellers ranking query is answered with no rows',
    reach: async (page) => {
      await page.route(at('reporting/query'), async (route) => {
        const body = route.request().postDataJSON() as { dimensions?: unknown[] } | null
        if (!JSON.stringify(body?.dimensions ?? []).includes('seller')) return route.fallback()
        const response = await route.fetch()
        const json = (await response.json()) as Record<string, unknown>
        await route.fulfill({ response, json: { ...json, rows: [], data: [] } })
      })
      await sellersTab(page)
    },
  },
  ...(['merchandiser', 'orderManager', 'sellerViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-HOME-01',
      state: 'sellers-ranking-hidden',
      variant,
      reach: async (page) => {
        await open(page, '')
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
          timeout: 15_000,
        })
        const rankings = page.getByText('Rankings', { exact: true })
        if (await rankings.count()) await rankings.first().scrollIntoViewIfNeeded()
        await settle(page)
      },
    }),
  ),
  {
    screen: 'DA-RPT-03',
    state: 'seller-payouts',
    variant: 'admin',
    fullPage: true,
    reach: async (page) => {
      await open(page, `/reports/${sellerPayoutsReport}`)
      await expect(page.getByRole('heading', { name: 'Seller payouts' }).first()).toBeVisible({
        timeout: 20_000,
      })
      await settle(page)
    },
  },
]

const captures = [
  ...sellersCaptures,
  ...sellerCaptures,
  ...ratesCaptures,
  ...ledgerCaptures,
  ...settingsCaptures,
  ...productCaptures,
  ...orderCaptures,
  ...reportCaptures,
]

test.beforeAll(async ({ baseURL: configured }) => {
  test.setTimeout(600_000)
  const baseURL = configured ?? 'http://localhost:5174'
  seeded = await seed(baseURL)
  market = await seedMarketplace(baseURL)
  ownOrder = market.ownOrder
  ownProduct = market.products.own

  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const get = async (path: string) => {
      const res = await api.get(`/api/v3/admin/${path}`, { headers })
      expect(res.ok(), `${path}: ${await res.text()}`).toBeTruthy()
      return (await res.json()) as Json
    }
    saltmarshOrder = market.orderGroup.orders.find((id) => id !== market.fulfilledOrder) as string
    const reports = (await get('reporting/saved_reports?limit=100')).data as Json[]
    sellerPayoutsReport = reports.find((report) => report.name === 'Seller payouts')?.id as string
    expect(sellerPayoutsReport, 'the built-in Seller payouts report').toBeTruthy()
  } finally {
    await api.dispose()
  }
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
        server: 'browser-test server',
        theme,
        revision,
        path: path.pathname.replace(seeded.storeId, '<store>'),
        viewport: window,
        fullPage: item.fullPage ?? false,
        capturedHeight: captured?.height ?? null,
        intercepted: item.intercepted ?? null,
        settled,
        outside,
      },
      null,
      2,
    ),
  )
}

for (const theme of ['light', 'dark'] as const) {
  for (const item of captures) {
    const label = `${item.screen} ${item.state} ${item.variant}${item.phone ? ' phone' : ''} ${theme}`
    test(label, async ({ page }) => {
      if (item.phone) await page.setViewportSize(phone)
      page.setDefaultTimeout(20_000)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      await signIn(page, item)
      await item.reach(page)
      const holds = holding.has(page)
      const settled = holds ? null : await settle(page)
      await page.waitForTimeout(holds ? 1500 : 400)
      await save(page, item, theme, settled, outside)
    })
  }
}
