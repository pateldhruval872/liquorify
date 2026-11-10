import { expect, type Locator, type Page, test } from '@playwright/test'
import { adminPage, type Case, compareCases } from './comparison'
import { type Marketplace, seedMarketplace } from './marketplace'
import { seed } from './staff'

/**
 * Batch 13 part 1's diagnostic comparison: each new seller, order and product
 * component's story beside the same component on its running screen (DA-SEL-02
 * and 06, DA-ORD-04 and DA-PRD-03), as `compare.spec.ts` compares the earlier
 * batches', and the earlier stories this batch's screens show (work item
 * §3.1). Start the screens as that file describes; set `FIDELITY_STORYBOOK_URL`
 * when the built Storybook is served elsewhere than port 6007. The
 * marketplace the screens show is seeded first (`marketplace.ts`). The stories'
 * records were shaped from that marketplace, so most values match; dates and
 * the order's other cards differ on purpose.
 *
 * No case saves a change: each confirmation is opened and left unanswered.
 */

let baseURL = 'http://localhost:5174'
let market: Marketplace

const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()
const inColumn = (page: Page) => page.locator('[data-story-column] > *').first()
const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).first()

const openSeller = async (page: Page, key: keyof Marketplace['sellers'], name: string) => {
  await adminPage(page, `/sellers/${market.sellers[key]}`)
  await page.getByRole('heading', { name }).waitFor()
}
const harbour = (page: Page) => openSeller(page, 'approved', 'Harbour Cask Co.')

const scrolled = async (found: Locator) => {
  await found.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  return found
}

const sellerCard = (
  name: string,
  story: string,
  title: RegExp,
  open: (page: Page) => Promise<void> = harbour,
  window?: Case['window'],
): Case => ({
  id: 'CMP-DA-G-18',
  name: `b13-${name}`,
  story: `admin-dashboard-sellers-${story}`,
  window,
  screen: async (page) => {
    await open(page)
    return scrolled(card(page, title))
  },
  inStory: inColumn,
})

const popup = (
  name: string,
  story: string,
  reach: (page: Page) => Promise<void>,
  id = 'CMP-DA-G-18',
): Case => ({
  id,
  name: `b13-${name}`,
  story,
  viewport: true,
  window: { width: 1280, height: 960 },
  screen: async (page) => {
    await reach(page)
    return dialog(page)
  },
  inStory: dialog,
})

const orderCard = (name: string, story: string, title: RegExp, order: () => string): Case => ({
  id: 'CMP-DA-G-11',
  name: `b13-${name}`,
  story: `admin-dashboard-orders-${story}`,
  screen: async (page) => {
    await adminPage(page, `/orders/${order()}`)
    return scrolled(card(page, title))
  },
  inStory: inColumn,
})

const cases: Case[] = [
  sellerCard('status-approved', 'seller-status-card--approved', /^status$/i),
  sellerCard('status-onboarding', 'seller-status-card--onboarding', /^status$/i, (page) =>
    openSeller(page, 'onboarding', 'Stonecrop Cellars'),
  ),
  sellerCard('status-suspended', 'seller-status-card--suspended', /^status$/i, (page) =>
    openSeller(page, 'suspended', 'Copperline Brewing'),
  ),
  sellerCard('at-a-glance', 'seller-at-a-glance-card--trading', /^at a glance$/i),
  {
    id: 'CMP-DA-G-18',
    name: 'b13-brand-described',
    story: 'admin-dashboard-sellers-seller-brand-card--described',
    screen: async (page) => {
      await harbour(page)
      return scrolled(page.locator('[data-slot="card"]').first())
    },
    inStory: inColumn,
  },
  {
    id: 'CMP-DA-G-18',
    name: 'b13-brand-not-filled-in',
    story: 'admin-dashboard-sellers-seller-brand-card--not-filled-in',
    screen: async (page) => {
      await openSeller(page, 'pending', 'Fennel & Oak Provisions')
      return scrolled(page.locator('[data-slot="card"]').first())
    },
    inStory: inColumn,
  },
  sellerCard('contact', 'seller-contact-card--both-emails', /^contact$/i),
  sellerCard('address-billing', 'seller-address-card--billing-not-filled', /^billing address/i),
  sellerCard('settlement', 'seller-settlement-card--own-schedule', /^payouts and tax$/i),
  sellerCard('balance', 'seller-balance-card--owed', /^balance$/i),
  sellerCard('team', 'seller-team-card--member-and-invitation', /^team$/i),
  sellerCard(
    'onboarding-sent-back',
    'seller-onboarding-card--sent-back',
    /^onboarding$/i,
    harbour,
    { width: 1280, height: 1800 },
  ),
  sellerCard(
    'onboarding-under-review',
    'seller-onboarding-card--under-review',
    /^onboarding$/i,
    (page) => openSeller(page, 'onboarding', 'Stonecrop Cellars'),
    { width: 1280, height: 1800 },
  ),
  sellerCard('onboarding-all-done', 'seller-onboarding-card--all-done', /^onboarding$/i, (page) =>
    openSeller(page, 'ready', 'Juniper Row Distillers'),
  ),
  popup('invite-sheet', 'admin-dashboard-sellers-seller-invite-sheet--open', async (page) => {
    await openSeller(page, 'pending', 'Fennel & Oak Provisions')
    await page
      .getByRole('button', { name: /^invite$/i })
      .first()
      .click()
  }),
  popup(
    'edit-profile-sheet',
    'admin-dashboard-sellers-seller-edit-profile-sheet--filled',
    async (page) => {
      await harbour(page)
      await page
        .getByRole('button', { name: /^edit$/i })
        .first()
        .click()
    },
  ),
  popup(
    'edit-settlement-sheet',
    'admin-dashboard-sellers-seller-edit-settlement-sheet--own-schedule',
    async (page) => {
      await harbour(page)
      await card(page, /^payouts and tax$/i)
        .getByRole('button', { name: /^edit$/i })
        .click()
    },
  ),
  popup(
    'settle-confirm',
    'admin-dashboard-sellers-seller-balance-card--settle-confirm',
    async (page) => {
      await harbour(page)
      await page.getByRole('button', { name: /settle now/i }).click()
    },
  ),
  popup(
    'onboarding-send-back-confirm',
    'admin-dashboard-sellers-seller-onboarding-card--send-back-confirm',
    async (page) => {
      await openSeller(page, 'onboarding', 'Stonecrop Cellars')
      await card(page, /^onboarding$/i)
        .getByRole('button', { name: /^send back$/i })
        .click()
    },
  ),
  popup('payout-complete', 'admin-dashboard-sellers-payout-complete-dialog--open', async (page) => {
    const pending = market.payouts.find(([, status]) => status === 'pending')?.[0]
    await adminPage(page, `/sellers/payouts/${pending}`)
    await page
      .getByRole('button', { name: /mark as paid/i })
      .first()
      .click()
  }),
  orderCard(
    'commission-lines',
    'order-commission-lines-card--lines',
    /^commission$/i,
    () => market.fulfilledOrder,
  ),
  orderCard(
    'seller-transfers',
    'order-seller-transfers-card--not-settled',
    /^seller transfers$/i,
    () => market.fulfilledOrder,
  ),
  orderCard(
    'marketplace',
    'order-marketplace-card--sellers-order',
    /^seller$/i,
    () => market.fulfilledOrder,
  ),
  {
    id: 'CMP-DA-G-14',
    name: 'b13-product-seller-card',
    story: 'admin-dashboard-products-product-seller-card--suspended-seller',
    screen: async (page) => {
      await adminPage(page, `/products/${market.products.suspended}`)
      return scrolled(card(page, /^seller$/i))
    },
    inStory: inColumn,
  },
  {
    id: 'CMP-DA-G-14',
    name: 'b13-product-review-actions',
    story: 'admin-dashboard-products-product-review-actions--in-review',
    screen: async (page) => {
      await adminPage(page, `/products/${market.products.proposed}`)
      const approve = page.getByRole('button', { name: /^approve$/i })
      await approve.waitFor()
      return approve.locator('xpath=..')
    },
    inStory: (page) => page.locator('[data-story-column] > *').first().locator('xpath=..'),
  },
  popup(
    'product-approve-confirm',
    'admin-dashboard-products-product-review-actions--approve-confirm',
    async (page) => {
      await adminPage(page, `/products/${market.products.proposed}`)
      await page.getByRole('button', { name: /^approve$/i }).click()
    },
    'CMP-DA-G-14',
  ),

  // Earlier stories this batch's screens show (work item §3.1).
  {
    id: 'CMP-DA-G-20',
    name: 'b13-earlier-delivery-method-list-marketplace',
    story: 'admin-dashboard-shipping-delivery-method-list--marketplace',
    screen: async (page) => {
      await adminPage(page, '/settings/delivery-profiles')
      await page.getByText('General', { exact: true }).first().click()
      const methods = page
        .locator('[data-slot="card"]')
        .filter({ hasText: 'Harbour Cask courier' })
        .first()
      await expect(methods).toBeVisible({ timeout: 20_000 })
      return scrolled(methods)
    },
    inStory: inColumn,
  },
  {
    id: 'CMP-CORE-37',
    name: 'b13-earlier-table-toolbar-filter-panel-open',
    story: 'dashboard-core-table-toolbar--filter-panel-open',
    viewport: true,
    window: { width: 1280, height: 960 },
    screen: async (page) => {
      await adminPage(page, '/products')
      await page.getByRole('button', { name: /add filter/i }).click()
      const panel = page.locator('[data-slot="filter-panel-item"]').first()
      await expect(panel).toBeVisible()
      return panel.locator('xpath=ancestor::*[@role="dialog" or @data-slot="popover-content"][1]')
    },
    inStory: (page) =>
      page
        .locator('[data-slot="filter-panel-item"]')
        .first()
        .locator('xpath=ancestor::*[@role="dialog" or @data-slot="popover-content"][1]'),
  },
]

test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? baseURL
  await seed(baseURL)
  market = await seedMarketplace(baseURL)
})

compareCases(cases)
