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

test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? baseURL
  loyalty = await seedLoyalty(baseURL)
})

compareCases(cases)
