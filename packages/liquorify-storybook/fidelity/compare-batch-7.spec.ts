import { type Page, test } from '@playwright/test'
import { rowButton } from '../../dashboard/e2e/helpers'
import { adminPage, type Case, compareCases } from './comparison'
import {
  deliveryNames,
  ensurePaymentMethods,
  type PaymentsDelivery,
  packageNames,
  paymentNames,
  removePaymentMethods,
  seedPaymentsDelivery,
  taxNames,
} from './payments-delivery'

/**
 * Batch 7's diagnostic comparison: each new component's story beside the same
 * component on its running screen (DA-SET-12, 13, 14, 16, 17 and 19), as
 * `compare.spec.ts` compares the earlier batches'. Start the screens as that
 * file describes; set `FIDELITY_STORYBOOK_URL` when the built Storybook is
 * served elsewhere than port 6007. The records the screens show are added
 * through the Admin API first (`payments-delivery.ts`). The data differs on
 * purpose: the screens show those records, the stories invented ones. The test
 * gateway's secret setting is painted out of both images.
 */

let baseURL = 'http://localhost:5174'
let records: PaymentsDelivery

const slot = (page: Page, name: string) => page.locator(`[data-slot="${name}"]`)
const sheet = (page: Page) => slot(page, 'sheet-content')
const card = (page: Page, title: string) =>
  page
    .locator('[data-slot="card"]')
    .filter({
      has: page.locator('[data-slot="card-title"]', { hasText: new RegExp(`^${title}$`) }),
    })
    .last()
const storyRoot = (page: Page) => page.locator('#storybook-root > *').first()
const secret = '#preference-dummy_secret_key'

const paymentsPath = '/settings/payment-methods'
const profilePath = (id: string) => `/settings/delivery-profiles/${id}`
const homeGoods = () => profilePath(records.profileId)
const general = () => profilePath(records.generalProfileId)

const openPaymentMethod = async (page: Page, name: string) => {
  await ensurePaymentMethods(baseURL)
  await adminPage(page, paymentsPath)
  await rowButton(page, name).click()
  await sheet(page).locator('#name').waitFor()
  return sheet(page)
}

const openAddPayment = async (page: Page, provider: string) => {
  await removePaymentMethods(baseURL)
  await adminPage(page, paymentsPath)
  await page.getByRole('button', { name: /add payment method/i }).click()
  await page.locator('#type').click()
  await page.getByRole('option', { name: provider }).click()
}

const openMethodSheet = async (page: Page, name: string) => {
  await adminPage(page, homeGoods())
  await page.getByRole('button', { name, exact: true }).click()
  await sheet(page).locator('#name').waitFor()
  return sheet(page)
}

/** The zones and methods section has no box of its own: its heading's row and what follows share a column. */
const zonesColumn = (page: Page) =>
  page.getByRole('heading', { name: 'Zones and delivery methods' }).locator('xpath=../..')

const cases: Case[] = [
  {
    id: 'CMP-DUI-C-49',
    name: 'b7-storefront-visible-switch',
    story: 'dashboard-ui-composed-storefront-visible-switch--admin-only',
    screen: async (page) =>
      (await openPaymentMethod(page, paymentNames.cheque))
        .locator('[data-slot="field"]')
        .filter({ has: page.getByRole('switch', { name: 'Visible in storefront' }) }),
    inStory: (page) => page.locator('[data-slot="field"]').first(),
  },
  {
    id: 'CMP-DA-G-12',
    name: 'b7-payment-method-sheet-add-test-gateway',
    story: 'admin-dashboard-payment-methods-payment-method-sheets--add-test-gateway',
    window: { width: 1280, height: 960 },
    paintedOut: secret,
    screen: async (page) => {
      await openAddPayment(page, 'Bogus')
      return sheet(page)
    },
    inStory: sheet,
    after: () => ensurePaymentMethods(baseURL),
  },
  {
    id: 'CMP-DA-G-12',
    name: 'b7-payment-method-sheet-edit',
    story: 'admin-dashboard-payment-methods-payment-method-sheets--edit',
    window: { width: 1280, height: 960 },
    paintedOut: secret,
    screen: (page) => openPaymentMethod(page, paymentNames.gateway),
    inStory: sheet,
  },
  {
    id: 'CMP-DA-G-12',
    name: 'b7-payment-method-form-cheque',
    story: 'admin-dashboard-payment-methods-payment-method-form--cheque-chosen',
    screen: async (page) => {
      await openAddPayment(page, 'Check')
      return sheet(page).locator('form > div').first()
    },
    inStory: (page) => storyRoot(page).locator('> div').first(),
    after: () => ensurePaymentMethods(baseURL),
  },
  {
    id: 'CMP-DA-G-22',
    name: 'b7-taxes-tabs',
    story: 'admin-dashboard-taxes-taxes-tabs--categories',
    screen: async (page) => {
      await adminPage(page, '/settings/taxes/categories')
      return slot(page, 'tabs-list').first()
    },
    inStory: (page) => slot(page, 'tabs-list').first(),
  },
  {
    id: 'CMP-DA-G-22',
    name: 'b7-market-tax-providers',
    story: 'admin-dashboard-taxes-market-tax-providers--spree-rates-everywhere',
    screen: async (page) => {
      await adminPage(page, '/settings/taxes/categories')
      return slot(page, 'item').filter({ hasText: 'Tax calculation' }).first()
    },
    inStory: (page) => slot(page, 'item').filter({ hasText: 'Tax calculation' }).first(),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b7-jurisdiction-label',
    story: 'admin-dashboard-taxes-jurisdiction-label--state',
    screen: async (page) => {
      await adminPage(page, '/settings/taxes/rates')
      return page
        .getByRole('row')
        .filter({ has: rowButton(page, taxNames.state) })
        .getByRole('cell')
        .filter({ hasText: /United States/ })
        .first()
    },
    inStory: storyRoot,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b7-tax-category-label',
    story: 'admin-dashboard-taxes-tax-category-label--named',
    screen: async (page) => {
      await adminPage(page, '/settings/taxes/rates')
      return page
        .getByRole('row')
        .filter({ has: rowButton(page, taxNames.precise) })
        .getByRole('cell')
        .filter({ hasText: taxNames.category })
        .first()
    },
    inStory: storyRoot,
  },
  {
    id: 'CMP-DA-G-20',
    name: 'b7-delivery-profile-general-card',
    story: 'admin-dashboard-shipping-delivery-profile-general-card--store-default',
    screen: async (page) => {
      await adminPage(page, general())
      return card(page, 'General')
    },
    inStory: (page) => card(page, 'General'),
  },
  {
    id: 'CMP-DA-G-20',
    name: 'b7-delivery-profile-origins-card',
    story: 'admin-dashboard-shipping-delivery-profile-origins-card--all-locations',
    screen: async (page) => {
      await adminPage(page, general())
      return card(page, 'Ships from')
    },
    inStory: (page) => card(page, 'Ships from'),
  },
  {
    id: 'CMP-DA-G-20',
    name: 'b7-delivery-pickup-card',
    story: 'admin-dashboard-shipping-delivery-pickup-card--not-offered',
    screen: async (page) => {
      await adminPage(page, general())
      return card(page, 'Pickup')
    },
    inStory: (page) => card(page, 'Pickup'),
  },
  {
    id: 'CMP-DA-G-20',
    name: 'b7-delivery-digital-methods-card',
    story: 'admin-dashboard-shipping-delivery-digital-methods-card--digital-method',
    screen: async (page) => {
      await adminPage(page, profilePath(records.digitalProfileId))
      return card(page, 'Digital delivery')
    },
    inStory: (page) => card(page, 'Digital delivery'),
  },
  {
    id: 'CMP-DA-G-20',
    name: 'b7-delivery-zones-and-methods-section',
    story: 'admin-dashboard-shipping-delivery-zones-and-methods-section--split-origins',
    window: { width: 1280, height: 1800 },
    screen: async (page) => {
      await adminPage(page, homeGoods())
      return zonesColumn(page)
    },
    inStory: zonesColumn,
  },
  {
    id: 'CMP-DA-G-20',
    name: 'b7-delivery-origin-group-section',
    story: 'admin-dashboard-shipping-delivery-origin-group-section--east-coast',
    screen: async (page) => {
      await adminPage(page, homeGoods())
      return page.locator('section').filter({ hasText: deliveryNames.splitGroup }).last()
    },
    inStory: (page) => page.locator('section').first(),
  },
  {
    id: 'CMP-DA-G-20',
    name: 'b7-delivery-zone-card',
    story: 'admin-dashboard-shipping-delivery-zone-card--states-and-postal-codes',
    screen: async (page) => {
      await adminPage(page, homeGoods())
      return card(page, deliveryNames.westCoast)
    },
    inStory: (page) => page.locator('[data-slot="card"]').first(),
  },
  {
    id: 'CMP-DA-G-20',
    name: 'b7-delivery-method-list',
    story: 'admin-dashboard-shipping-delivery-method-list--priced',
    screen: async (page) => {
      await adminPage(page, homeGoods())
      return card(page, deliveryNames.domestic).locator('.divide-y').first()
    },
    inStory: (page) => page.locator('.divide-y').first(),
  },
  {
    id: 'CMP-DA-G-20',
    name: 'b7-delivery-zone-sheet',
    story: 'admin-dashboard-shipping-delivery-zone-sheet--edit',
    window: { width: 1280, height: 960 },
    screen: async (page) => {
      await adminPage(page, homeGoods())
      await card(page, deliveryNames.westCoast)
        .getByRole('button', { name: 'Open actions' })
        .first()
        .click()
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      await sheet(page).locator('#name').waitFor()
      return sheet(page)
    },
    inStory: sheet,
  },
  {
    id: 'CMP-DA-G-20',
    name: 'b7-delivery-zone-region-picker',
    story: 'admin-dashboard-shipping-delivery-zone-region-picker--new-zone',
    window: { width: 1280, height: 960 },
    screen: async (page) => {
      await adminPage(page, general())
      await page
        .getByRole('button', { name: /add delivery zone/i })
        .first()
        .click()
      return sheet(page)
        .locator('div.flex.flex-col.gap-3')
        .filter({ has: page.getByText('Countries and regions', { exact: true }) })
        .last()
    },
    inStory: (page) =>
      page
        .locator('div.flex.flex-col.gap-3')
        .filter({ has: page.getByText('Countries and regions', { exact: true }) })
        .last(),
  },
  {
    id: 'CMP-DA-G-20',
    name: 'b7-delivery-method-sheet',
    story: 'admin-dashboard-shipping-delivery-method-sheet--edit',
    window: { width: 1280, height: 1600 },
    screen: (page) => openMethodSheet(page, deliveryNames.standard),
    inStory: sheet,
  },
  {
    id: 'CMP-DA-G-20',
    name: 'b7-delivery-method-form-freight',
    story: 'admin-dashboard-shipping-delivery-method-form--freight',
    window: { width: 1280, height: 1600 },
    screen: async (page) => (await openMethodSheet(page, deliveryNames.freight)).locator('form'),
    inStory: storyRoot,
  },
  {
    id: 'CMP-DA-G-20',
    name: 'b7-delivery-origin-group-dialog',
    story: 'admin-dashboard-shipping-delivery-origin-group-dialog--split',
    screen: async (page) => {
      await adminPage(page, general())
      await page.getByRole('button', { name: /split shipping origins/i }).click()
      return slot(page, 'dialog-content')
    },
    inStory: (page) => slot(page, 'dialog-content'),
  },
  {
    id: 'CMP-CORE-PG-01',
    name: 'b7-package-types',
    story: 'dashboard-core-pages-package-types--listed',
    screen: async (page) => {
      await adminPage(page, '/settings/package-types')
      await rowButton(page, packageNames.carton).waitFor()
      return page
        .locator('[data-slot="card"]')
        .filter({ has: page.locator('table') })
        .first()
    },
    inStory: (page) =>
      page
        .locator('[data-slot="card"]')
        .filter({ has: page.locator('table') })
        .first(),
  },
  {
    id: 'CMP-CORE-PG-01',
    name: 'b7-package-type-sheet',
    story: 'dashboard-core-pages-package-types--edit-sheet',
    window: { width: 1280, height: 960 },
    screen: async (page) => {
      await adminPage(page, '/settings/package-types')
      await rowButton(page, packageNames.carton).click()
      await page.locator('#package-type-name').waitFor()
      return sheet(page)
    },
    inStory: sheet,
  },
]

test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? baseURL
  records = await seedPaymentsDelivery(baseURL)
})

compareCases(cases)
