import { expect, type Locator, type Page, test } from '@playwright/test'
import { type Case, compareCases } from './comparison'
import { SELLER_PASSWORD } from './marketplace'
import { type SellerPanel, seedSellerPanel, twoSellerEmail } from './seller-panel'

/**
 * Batch 13 part 2's diagnostic comparison: each new seller panel component's
 * story beside the same component on the running seller panel (work item
 * §10.7), as `compare-batch-13.spec.ts` compares part 1's. Start the stack as
 * `screens-batch-13-part-2.spec.ts` describes, with the seller panel on port
 * 5175 and the built Storybook on port 6007 (`FIDELITY_STORYBOOK_URL`). Run
 * before `seller-panel-checks.spec.ts`, which moves the records compared here.
 * The stories' records were read off this marketplace, so most values match;
 * dates and ids differ on purpose.
 *
 * No case saves a change: each dialog is opened and left unanswered.
 */

const PANEL = process.env.FIDELITY_SELLER_URL ?? 'http://localhost:5175'
let panel: SellerPanel

const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()
const inColumn = (page: Page) => page.locator('[data-story-column] > *').first()
const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).first()

const scrolled = async (found: Locator) => {
  await found.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  return found
}

async function sellerPage(page: Page, path: string, email = panel.market.users.approved) {
  const res = await page.request.post(`${PANEL}/api/v3/seller/auth/login`, {
    data: { email, password: SELLER_PASSWORD },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto(`${PANEL}/${panel.market.sellers.approved}${path}`)
  await page.waitForLoadState('networkidle')
}

type Order = keyof SellerPanel['orders'] | 'ledger'
const orderPath = (order: Order) =>
  `/orders/${order === 'ledger' ? panel.ledgerOrder : panel.orders[order]}`

const orderCard = (name: string, story: string, title: RegExp, order: Order): Case => ({
  id: 'CMP-SP-G-02',
  name: `b13p2-${name}`,
  story: `seller-panel-orders-${story}`,
  window: { width: 1280, height: 1400 },
  screen: async (page) => {
    await sellerPage(page, orderPath(order))
    return scrolled(card(page, title))
  },
  inStory: inColumn,
})

const panelCard = (
  name: string,
  story: string,
  path: string | (() => string),
  title: RegExp,
): Case => ({
  id: 'CMP-SP-G-03',
  name: `b13p2-${name}`,
  story: `seller-panel-${story}`,
  window: { width: 1280, height: 1400 },
  screen: async (page) => {
    await sellerPage(page, typeof path === 'string' ? path : path())
    return scrolled(card(page, title))
  },
  inStory: inColumn,
})

const popup = (
  name: string,
  story: string,
  reach: (page: Page) => Promise<void>,
  id = 'CMP-SP-G-02',
): Case => ({
  id,
  name: `b13p2-${name}`,
  story,
  viewport: true,
  window: { width: 1280, height: 960 },
  screen: async (page) => {
    await reach(page)
    return dialog(page)
  },
  inStory: dialog,
})

const cases: Case[] = [
  orderCard('summary-placed', 'order-summary-card--placed', /^summary$/i, 'new'),
  orderCard(
    'summary-partly-shipped',
    'order-summary-card--partly-shipped',
    /^summary$/i,
    'partial',
  ),
  orderCard('summary-canceled', 'order-summary-card--canceled', /^summary$/i, 'canceled'),
  orderCard('summary-no-items', 'order-summary-card--no-items', /^summary$/i, 'ledger'),
  orderCard('customer-addresses', 'order-customer-card--addresses', /^customer$/i, 'new'),
  orderCard('customer-no-addresses', 'order-customer-card--no-addresses', /^customer$/i, 'ledger'),
  orderCard('payment-one-seller', 'order-payment-card--one-seller', /^payment$/i, 'new'),
  orderCard('earnings-earned', 'order-earnings-card--earned', /what you earned/i, 'returned'),
  orderCard(
    'notes-no-instructions',
    'order-notes-cards--no-instructions',
    /special instructions/i,
    'new',
  ),
  orderCard('fulfillments-unfulfilled', 'fulfillments-card--unfulfilled', /^fulfillments/i, 'new'),
  orderCard(
    'fulfillments-partly-shipped',
    'fulfillments-card--partly-shipped',
    /^fulfillments/i,
    'partial',
  ),
  orderCard('fulfillments-shipped', 'fulfillments-card--shipped', /^fulfillments/i, 'returned'),
  orderCard('returns-approved', 'returns-card--approved', /^returns/i, 'returned'),
  orderCard('returns-empty', 'returns-card--empty', /^returns/i, 'new'),
  orderCard('claims-open', 'post-sale-cards--claim-open', /^claims/i, 'partial'),
  orderCard('claims-none', 'post-sale-cards--no-claims', /^claims/i, 'new'),
  {
    id: 'CMP-SP-G-02',
    name: 'b13p2-fulfill-form-all-units',
    story: 'seller-panel-orders-fulfillment-fulfill-form--all-units',
    window: { width: 1280, height: 1400 },
    screen: async (page) => {
      await sellerPage(page, orderPath('partial'))
      await page.getByRole('button', { name: 'Mark as fulfilled' }).click()
      return scrolled(
        page.getByRole('button', { name: 'Fulfill items' }).locator('xpath=ancestor::form[1]'),
      )
    },
    inStory: (page) =>
      page.getByRole('button', { name: 'Fulfill items' }).locator('xpath=ancestor::form[1]'),
  },
  popup('cancel-dialog', 'seller-panel-orders-order-cancel-dialog--open', async (page) => {
    await sellerPage(page, orderPath('new'))
    await page
      .getByRole('button', { name: /more actions|actions/i })
      .first()
      .click()
    await page.getByRole('menuitem', { name: /cancel order/i }).click()
  }),
  popup('new-return', 'seller-panel-orders-post-sale-create-dialogs--new-return', async (page) => {
    await sellerPage(page, orderPath('partial'))
    await page.getByRole('button', { name: 'New return' }).click()
  }),
  panelCard(
    'status-active',
    'products-product-status-card--active',
    () => `/products/${panel.market.products.active}`,
    /^status$/i,
  ),
  panelCard(
    'status-draft',
    'products-product-status-card--draft',
    () => `/products/${panel.market.products.draft}`,
    /^status$/i,
  ),
  panelCard(
    'status-rejected',
    'products-product-status-card--rejected',
    () => `/products/${panel.market.products.rejected}`,
    /^status$/i,
  ),
  panelCard(
    'business-filled',
    'profile-seller-business-card--filled',
    '/profile',
    /^business details$/i,
  ),
  panelCard(
    'tax-empty',
    'profile-seller-tax-identifiers-card--empty',
    '/profile',
    /^tax registration$/i,
  ),
  panelCard(
    'returns-location-missing',
    'profile-seller-returns-location-card--missing',
    '/profile',
    /^returns address/i,
  ),
  {
    id: 'CMP-SP-G-03',
    name: 'b13p2-balance-one-currency',
    story: 'seller-panel-finance-balance-summary--one-currency',
    window: { width: 1280, height: 1400 },
    // The summary is the grid of balance cards, so the case compares the grid.
    screen: async (page) => {
      await sellerPage(page, '/earnings')
      return scrolled(card(page, /owed to you/i).locator('xpath=..'))
    },
    inStory: inColumn,
  },
  popup(
    'account-dialog',
    'seller-panel-panel-account-dialog--open',
    async (page) => {
      await sellerPage(page, '')
      await page.getByRole('button', { name: /user menu/i }).click()
      await page.getByRole('menuitem', { name: /edit profile/i }).click()
      await expect(dialog(page).getByLabel('First name')).toBeVisible({ timeout: 20_000 })
    },
    'CMP-SP-G-03',
  ),
  {
    id: 'CMP-SP-G-03',
    name: 'b13p2-switcher-two-sellers',
    story: 'seller-panel-panel-seller-switcher--two-sellers',
    screen: async (page) => {
      await sellerPage(page, '', twoSellerEmail)
      return page.getByRole('button', { name: /switch seller/i })
    },
    inStory: (page) => page.getByRole('button', { name: /switch seller/i }),
  },
  {
    id: 'CMP-SP-G-03',
    name: 'b13p2-nav-badge-in-progress',
    story: 'seller-panel-panel-onboarding-nav-badge--in-progress',
    screen: async (page) => {
      await sellerPage(page, '')
      return page.getByRole('link', { name: /^setup/i }).locator('[data-slot="badge"]')
    },
    inStory: (page) => page.locator('[data-slot="badge"]').first(),
  },

  // Earlier stories this part's screens show (work item §10.7): batch 8's
  // fulfil form, which the seller panel draws from dashboard-ui, and batch 7's
  // package types page, which it renders from dashboard-core.
  {
    id: 'CMP-DUI-C-23',
    name: 'b13p2-earlier-fulfill-items-form-all-units',
    story: 'dashboard-ui-composed-fulfill-items-form--all-units',
    window: { width: 1280, height: 1400 },
    screen: async (page) => {
      await sellerPage(page, orderPath('partial'))
      await page.getByRole('button', { name: 'Mark as fulfilled' }).click()
      return scrolled(
        page.getByRole('button', { name: 'Fulfill items' }).locator('xpath=ancestor::form[1]'),
      )
    },
    inStory: (page) => page.locator('form').first(),
  },
  {
    id: 'CMP-CORE-PG-01',
    name: 'b13p2-earlier-package-types-none',
    story: 'dashboard-core-pages-package-types--none',
    screen: async (page) => {
      await sellerPage(page, '/settings/package-types')
      return page
        .locator('[data-slot="card"]')
        .filter({ hasText: /no packaging yet/i })
        .first()
    },
    inStory: (page) =>
      page
        .locator('[data-slot="card"]')
        .filter({ hasText: /no packaging yet/i })
        .first(),
  },
  popup(
    'earlier-package-types-add-sheet',
    'dashboard-core-pages-package-types--add-sheet',
    async (page) => {
      await sellerPage(page, '/settings/package-types')
      await page
        .getByRole('button', { name: /add package type/i })
        .first()
        .click()
    },
    'CMP-CORE-PG-01',
  ),
]

test.beforeAll(async () => {
  test.setTimeout(600_000)
  panel = await seedSellerPanel('http://localhost:3010')
})

compareCases(cases)
