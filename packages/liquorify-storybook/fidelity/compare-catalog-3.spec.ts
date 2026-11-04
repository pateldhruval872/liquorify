import { type Page, test } from '@playwright/test'
import { rowButton } from '../../dashboard/e2e/helpers'
import { adminPage, type Case, compareCases } from './comparison'
import { creditMemos, type Loyalty, type promotions, seedLoyalty } from './loyalty'
import { openRowMenu } from './staff'

/**
 * Catalog part 3's diagnostic comparison: each new component's story beside
 * the same component on its running screen (DA-PRM-02 and 03, DA-LOY-02), as
 * `compare.spec.ts` compares the earlier batches'. Start the screens as that
 * file describes; set `FIDELITY_STORYBOOK_URL` when the built Storybook is
 * served elsewhere than port 6007. The promotions and credits the screens show
 * are added through the Admin API first (`loyalty.ts`). The data differs on
 * purpose: the screens show those records, the stories invented ones.
 */

let baseURL = 'http://localhost:5174'
let loyalty: Loyalty

const slot = (page: Page, name: string) => page.locator(`[data-slot="${name}"]`)
const sheet = (page: Page) => slot(page, 'sheet-content')
const dialogContent = (page: Page) => slot(page, 'dialog-content')
const storyRoot = (page: Page) => page.locator('#storybook-root > *').first()

const promotionPath = (key: keyof typeof promotions) => `/promotions/${loyalty.ids.promotions[key]}`

/** The bordered row of a rule or action, found by its title. */
const editorRow = (page: Page, title: RegExp) =>
  page.locator('div.items-stretch').filter({ hasText: title }).first()

/** Opens a saved promotion's rule or action in its editor sheet. */
const openEditor = async (page: Page, key: keyof typeof promotions, title: RegExp) => {
  await adminPage(page, promotionPath(key))
  await editorRow(page, title).click()
  await sheet(page)
    .getByRole('button', { name: /^(save|add)$/i })
    .waitFor()
  await page.waitForTimeout(1_500)
  return sheet(page)
}

const ruleEditor = (
  name: string,
  story: string,
  key: keyof typeof promotions,
  title: RegExp,
): Case => ({
  id: 'CMP-DA-G-15',
  name: `c3-${name}-rule-editor`,
  story: `admin-dashboard-promotion-editors-${story}-rule-editor--saved`,
  window: { width: 1280, height: 960 },
  screen: (page) => openEditor(page, key, title),
  inStory: sheet,
})

const cases: Case[] = [
  {
    id: 'CMP-DUI-C-07',
    name: 'c3-calculator-summary',
    story: 'dashboard-ui-composed-calculator-summary--flat-percent',
    screen: async (page) => {
      await adminPage(page, promotionPath('running'))
      const summary = page.getByText(/^Flat Percent · /).first()
      await summary.waitFor()
      return summary
    },
    inStory: storyRoot,
  },
  {
    id: 'CMP-DA-G-15',
    name: 'c3-promotion-form',
    story: 'admin-dashboard-promotion-editors-promotion-form--editing',
    window: { width: 1280, height: 960 },
    screen: async (page) => {
      await adminPage(page, promotionPath('manyCodes'))
      await page.getByRole('button', { name: /^show codes$/i }).waitFor()
      return page.locator('form').first()
    },
    inStory: (page) => page.locator('form').first(),
  },
  {
    id: 'CMP-DA-G-15',
    name: 'c3-promotion-form-new',
    story: 'admin-dashboard-promotion-editors-promotion-form--new-promotion',
    window: { width: 1280, height: 960 },
    screen: async (page) => {
      await adminPage(page, '/promotions/new')
      await page.locator('#name').waitFor()
      return page.locator('form').first()
    },
    inStory: (page) => page.locator('form').first(),
  },
  {
    id: 'CMP-DA-G-15',
    name: 'c3-coupon-codes-sheet',
    story: 'admin-dashboard-promotion-editors-promotion-form--codes-sheet',
    window: { width: 1280, height: 960 },
    screen: async (page) => {
      await adminPage(page, promotionPath('manyCodes'))
      await page.getByRole('button', { name: /^show codes$/i }).click()
      await sheet(page)
        .getByText(/^winter/i)
        .first()
        .waitFor()
      return sheet(page)
    },
    inStory: sheet,
  },
  ruleEditor('product', 'product', 'manyCodes', /^product\(s\)/i),
  ruleEditor('category', 'category', 'manyCodes', /^categories/i),
  ruleEditor('customer', 'customer', 'singleCode', /^customers/i),
  ruleEditor('customer-group', 'customer-group', 'singleCode', /^customer group\(s\)/i),
  ruleEditor('country', 'country', 'running', /^country/i),
  ruleEditor('channel', 'channel', 'notStarted', /^channel\(s\)/i),
  ruleEditor('market', 'market', 'notStarted', /^market\(s\)/i),
  ruleEditor('option-value', 'option-value', 'expired', /^option value\(s\)/i),
  {
    id: 'CMP-DA-G-15',
    name: 'c3-match-policy-picker',
    story: 'admin-dashboard-promotion-editors-match-policy-picker--product-policies',
    screen: async (page) =>
      (await openEditor(page, 'manyCodes', /^product\(s\)/i)).getByRole('radiogroup').first(),
    inStory: (page) => page.getByRole('radiogroup').first(),
  },
  {
    id: 'CMP-DA-G-15',
    name: 'c3-adjustment-action-editor',
    story: 'admin-dashboard-promotion-editors-adjustment-action-editor--flat-percent',
    window: { width: 1280, height: 960 },
    screen: (page) => openEditor(page, 'running', /^create whole-order adjustment/i),
    inStory: sheet,
  },
  {
    id: 'CMP-DA-G-15',
    name: 'c3-adjustment-action-editor-tiers',
    story: 'admin-dashboard-promotion-editors-adjustment-action-editor--tiered-percent',
    window: { width: 1280, height: 960 },
    screen: (page) => openEditor(page, 'notStarted', /^create whole-order adjustment/i),
    inStory: sheet,
  },
  {
    id: 'CMP-DA-G-15',
    name: 'c3-free-line-items-action-editor',
    story: 'admin-dashboard-promotion-editors-free-line-items-action-editor--with-items',
    window: { width: 1280, height: 960 },
    screen: (page) => openEditor(page, 'expired', /^create line items/i),
    inStory: sheet,
  },
  {
    id: 'CMP-DA-G-21',
    name: 'c3-issue-store-credit-dialog',
    story: 'admin-dashboard-store-credits-issue-store-credit-dialog--choosing-customer',
    window: { width: 1280, height: 960 },
    screen: async (page) => {
      await adminPage(page, '/loyalty/store-credits')
      await page.getByRole('button', { name: /issue store credit/i }).click()
      await dialogContent(page)
        .getByPlaceholder(/search customers/i)
        .waitFor()
      return dialogContent(page)
    },
    inStory: dialogContent,
  },
  {
    id: 'CMP-DA-G-21',
    name: 'c3-edit-store-credit-dialog',
    story: 'admin-dashboard-store-credits-edit-store-credit-dialog--unused',
    window: { width: 1280, height: 960 },
    screen: async (page) => {
      await adminPage(page, '/loyalty/store-credits')
      await rowButton(page, 'liam.murphy@example.com').waitFor()
      await openRowMenu(page, creditMemos.outstanding)
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      await dialogContent(page)
        .getByRole('heading', { name: /edit store credit/i })
        .waitFor()
      return dialogContent(page)
    },
    inStory: dialogContent,
  },
]

const giftCardsPath = '/loyalty/gift-cards'

/** Opens a gift card's edit sheet from the list by its code. */
const openGiftCard = async (page: Page, code: string) => {
  await adminPage(page, giftCardsPath)
  await page.getByText(code, { exact: true }).click()
  await sheet(page)
    .getByText(/^usage$/i)
    .waitFor()
  await page.waitForTimeout(1_000)
  return sheet(page)
}

const openGiftCardCreate = async (page: Page) => {
  await adminPage(page, giftCardsPath)
  await page.getByRole('button', { name: /new gift card/i }).click()
  await sheet(page)
    .getByText(/^quantity$/i)
    .waitFor()
  await page.waitForTimeout(1_000)
  return sheet(page)
}

/**
 * Earlier batches' stories that part 3's running screens show, held by G-33,
 * G-53 and G-58 until a running screen shows their state (LIQ-004's comparison
 * follow-up). Each is compared as part 3's own stories are.
 */
const earlier: Case[] = [
  {
    id: 'CMP-DA-G-15',
    name: 'c3-earlier-editor-shell-editing',
    story: 'admin-dashboard-promotion-editors-editor-shell--editing',
    window: { width: 1280, height: 960 },
    screen: (page) => openEditor(page, 'running', /^country/i),
    inStory: sheet,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'c3-earlier-type-picker-sheet-some-used',
    story: 'admin-dashboard-price-lists-type-picker-sheet--some-used',
    window: { width: 1280, height: 960 },
    screen: async (page) => {
      await adminPage(page, promotionPath('running'))
      await page.getByRole('button', { name: /^add rule$/i }).click()
      await sheet(page)
        .getByText(/^currency$/i)
        .waitFor()
      await page.waitForTimeout(1_000)
      return sheet(page)
    },
    inStory: sheet,
    viewport: true,
  },
  {
    id: 'CMP-CORE-18',
    name: 'c3-earlier-money-euros',
    story: 'dashboard-core-money--euros',
    screen: async (page) => {
      await adminPage(page, giftCardsPath)
      const amount = page
        .getByRole('row', { name: /fidelity-euro/i })
        .getByText('€40.00')
        .first()
      await amount.waitFor()
      return amount
    },
    inStory: storyRoot,
  },
  {
    id: 'CMP-CORE-08',
    name: 'c3-earlier-currency-select-selected',
    story: 'dashboard-core-currency-select--selected',
    screen: async (page) =>
      (await openGiftCardCreate(page))
        .locator('[data-slot="combobox-button-trigger"]')
        .filter({ hasText: 'USD' }),
    inStory: (page) => slot(page, 'combobox-button-trigger').first(),
  },
  {
    id: 'CMP-CORE-23',
    name: 'c3-earlier-resource-combobox-nothing-chosen',
    story: 'dashboard-core-resource-combobox--nothing-chosen',
    screen: async (page) => (await openGiftCardCreate(page)).getByRole('combobox').last(),
    inStory: (page) => page.getByRole('combobox').first(),
  },
  {
    id: 'CMP-CORE-23',
    name: 'c3-earlier-resource-combobox-chosen',
    story: 'dashboard-core-resource-combobox--chosen',
    screen: async (page) =>
      (await openGiftCard(page, 'FIDELITY-WELCOME')).getByRole('combobox').last(),
    inStory: (page) => page.getByRole('combobox').first(),
  },
  {
    id: 'CMP-CORE-35',
    name: 'c3-earlier-store-date-picker-date-chosen',
    story: 'dashboard-core-store-date-picker--date-chosen',
    screen: async (page) =>
      (await openGiftCard(page, 'FIDELITY-WELCOME')).getByRole('button', {
        name: /june 30th, 2027/i,
      }),
    inStory: (page) => page.locator('#storybook-root').getByRole('button').first(),
  },
  {
    id: 'CMP-CORE-35',
    name: 'c3-earlier-store-date-picker-date-and-time',
    story: 'dashboard-core-store-date-picker--date-and-time-in-the-stores-zone',
    screen: async (page) => {
      await adminPage(page, promotionPath('running'))
      const starts = page.getByRole('button', { name: /october 1st, 2026/i }).first()
      await starts.waitFor()
      return starts
    },
    inStory: (page) => page.locator('#storybook-root').getByRole('button').first(),
  },
]

test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? baseURL
  loyalty = await seedLoyalty(baseURL)
})

compareCases([...cases, ...earlier])
