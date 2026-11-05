import { expect, type Locator, type Page, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { adminPage, type Case, compareCases } from './comparison'
import { type OrderKey, type Orders, seedOrders } from './orders'
import { seed } from './staff'

/**
 * Batch 8's diagnostic comparison: each new order component's story beside
 * the same component on its running screen (DA-ORD-03, 04 and 05), as
 * `compare.spec.ts` compares the earlier batches'. Start the screens as that
 * file describes; set `FIDELITY_STORYBOOK_URL` when the built Storybook is
 * served elsewhere than port 6007. The orders the screens show are placed
 * through the Admin API first (`orders.ts`). The data differs on purpose: the
 * screens show those orders, the stories invented ones.
 *
 * The actor label has no case of its own: a member of staff is drawn as bare
 * text, which takes its look from wherever it sits, so the summary cases
 * compare it where it is used.
 */

let baseURL = 'http://localhost:5174'
let orders: Orders

const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()
const inColumn = (page: Page) => page.locator('[data-story-column] > *').first()
const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).first()
const menu = (page: Page) => page.getByRole('menu').first()
/** The page header: the `<header>` that holds the page's only first-level heading. */
const pageHeader = (page: Page) =>
  page
    .locator('header')
    .filter({ has: page.getByRole('heading', { level: 1 }) })
    .first()
const itemsCard = (page: Page) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole('table') })
    .first()

const openOrder = async (page: Page, key: OrderKey) => {
  await adminPage(page, `/orders/${orders[key].id}`)
  await page.getByRole('heading', { name: orders[key].number }).waitFor()
}

const openEdit = async (page: Page, key: OrderKey) => {
  await adminPage(page, `/orders/${orders[key].id}/edit`)
  await page.getByRole('heading', { name: /^edit order$/i }).waitFor()
}

/** A card on an order's page, scrolled into view. */
const orderCard = async (page: Page, key: OrderKey, title: RegExp) => {
  await openOrder(page, key)
  const found = card(page, title)
  // In the middle of the window, clear of the page's sticky header.
  await found.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  return found
}

const moreActions = async (page: Page, key: OrderKey) => {
  await openOrder(page, key)
  await page.getByRole('button', { name: 'More actions' }).click()
}

const cancelDialog = async (page: Page) => {
  await moreActions(page, 'paid')
  await page.getByRole('menuitem', { name: 'Cancel order' }).click()
  return dialog(page)
}

/** A card's action button, opening what it adds. */
const cardButton = async (page: Page, key: OrderKey, title: RegExp, button: RegExp) => {
  const found = await orderCard(page, key, title)
  await found.getByRole('button', { name: button }).first().click()
}

const cardCase = (
  name: string,
  story: string,
  key: OrderKey,
  title: RegExp,
  id = 'CMP-DA-G-11',
): Case => ({
  id,
  name: `b8-${name}`,
  story,
  screen: (page) => orderCard(page, key, title),
  inStory: inColumn,
})

const popup = (
  name: string,
  story: string,
  reach: (page: Page) => Promise<void>,
  found: (page: Page) => Locator = dialog,
  id = 'CMP-DA-G-11',
): Case => ({
  id,
  name: `b8-${name}`,
  story,
  viewport: true,
  window: { width: 1280, height: 960 },
  screen: async (page) => {
    await reach(page)
    return found(page)
  },
  inStory: found,
})

const story = (name: string) => `admin-dashboard-orders-${name}`

const cases: Case[] = [
  // Order header
  ...(
    [
      ['paid', 'paid'],
      ['authorized', 'authorized'],
      ['canceled', 'canceled'],
      ['draft', 'draft'],
    ] as const
  ).map(
    ([storyName, key]): Case => ({
      id: 'CMP-DA-G-11',
      name: `b8-order-header-${storyName}`,
      story: story(`order-header--${storyName}`),
      screen: async (page) => {
        await openOrder(page, key)
        return pageHeader(page)
      },
      inStory: pageHeader,
    }),
  ),
  popup(
    'order-header-placed-menu',
    story('order-header--placed-menu'),
    (page) => moreActions(page, 'paid'),
    menu,
  ),
  popup(
    'order-header-draft-menu',
    story('order-header--draft-menu'),
    (page) => moreActions(page, 'draft'),
    menu,
  ),
  popup(
    'order-header-delete-confirmation',
    story('order-header--delete-confirmation'),
    async (page) => {
      await moreActions(page, 'draft')
      await page.getByRole('menuitem', { name: 'Delete' }).click()
    },
  ),

  // Cancel dialog, the dashboard's and the composed one, and its reason field
  popup('order-cancel-dialog', story('order-cancel-dialog--open'), async (page) => {
    await cancelDialog(page)
  }),
  popup(
    'dui-order-cancel-dialog',
    'dashboard-ui-composed-order-cancel-dialog--with-refund',
    async (page) => {
      await cancelDialog(page)
    },
    dialog,
    'CMP-DUI-C-32',
  ),
  {
    id: 'CMP-DA-G-24',
    name: 'b8-reason-field',
    story: story('reason-field--with-none-choice'),
    screen: async (page) =>
      (await cancelDialog(page))
        .locator('[data-slot="field"]')
        .filter({ has: page.getByRole('combobox', { name: 'Reason' }) }),
    inStory: (page) => page.locator('[data-slot="field"]').first(),
  },

  // Payments
  cardCase('payments-card-paid', story('order-payments-card--paid'), 'paid', /^payments/i),
  cardCase(
    'payments-card-authorized',
    story('order-payments-card--authorized'),
    'authorized',
    /^payments/i,
  ),
  popup(
    'payments-card-authorized-menu',
    story('order-payments-card--authorized-menu'),
    async (page) => {
      await cardButton(page, 'authorized', /^payments/i, /actions/i)
    },
    menu,
  ),
  popup('payments-card-add-payment', story('order-payments-card--add-payment'), async (page) => {
    await cardButton(page, 'unpaid', /^payments/i, /^add$/i)
  }),
  popup('payment-details-dialog', story('payment-details-dialog--not-a-card'), async (page) => {
    // The cheque collected later, not yet captured, as the story's cheque is.
    await cardButton(page, 'authorized', /^payments/i, /actions/i)
    await page.getByRole('menuitem', { name: 'View details' }).click()
  }),

  // Taxes, discounts and fees
  cardCase('taxes-card', story('order-adjustments-cards--taxes-unmatched'), 'paid', /^tax/i),
  cardCase(
    'discounts-card',
    story('order-adjustments-cards--discounts'),
    'discounted',
    /^discounts$/i,
  ),
  cardCase('fees-card', story('order-adjustments-cards--fees'), 'discounted', /^fees$/i),
  popup('add-discount', story('order-adjustments-cards--add-discount-amount'), async (page) => {
    await cardButton(page, 'draft', /^discounts$/i, /add discount/i)
  }),
  popup('add-fee', story('order-adjustments-cards--add-fee'), async (page) => {
    await cardButton(page, 'draft', /^fees$/i, /add fee/i)
  }),

  // Summary
  cardCase('summary-paid', story('order-summary-card--paid'), 'paid', /^summary$/i),
  cardCase(
    'summary-discounted',
    story('order-summary-card--discounted'),
    'discounted',
    /^summary$/i,
  ),
  cardCase('summary-canceled', story('order-summary-card--canceled'), 'canceled', /^summary$/i),
  cardCase('summary-draft', story('order-summary-card--draft'), 'draft', /^summary$/i),

  // Sidebar cards
  cardCase('customer-card', story('order-customer-card--customer'), 'paid', /^customer$/i),
  cardCase(
    'customer-card-email-only',
    story('order-customer-card--email-only'),
    'guestDraft',
    /^customer$/i,
  ),
  popup(
    'customer-card-menu',
    story('order-customer-card--menu'),
    async (page) => {
      await cardButton(page, 'paid', /^customer$/i, /^actions$/i)
    },
    menu,
  ),
  cardCase('tags-card', story('order-notes-cards--tags'), 'annotated', /^tags$/i),
  cardCase(
    'instructions-card',
    story('order-notes-cards--instructions'),
    'annotated',
    /^special instructions$/i,
  ),
  cardCase(
    'internal-note-card',
    story('order-notes-cards--internal-note'),
    'annotated',
    /^internal note$/i,
  ),
  {
    ...cardCase(
      'dui-editable-note-card',
      'dashboard-ui-composed-editable-note-card--with-note',
      'annotated',
      /^special instructions$/i,
      'CMP-DUI-C-18',
    ),
    inStory: (page) => page.locator('[data-slot="card"]').first(),
  },
  cardCase(
    'sidebar-discounts-placed',
    story('order-discounts-sidebar-card--placed-applied'),
    'discounted',
    /^discounts & credit$/i,
  ),
  cardCase(
    'sidebar-discounts-gift-card',
    story('order-discounts-sidebar-card--gift-card-applied'),
    'giftCard',
    /^discounts & credit$/i,
  ),
  cardCase(
    'sidebar-discounts-draft',
    story('order-discounts-sidebar-card--draft-none-applied'),
    'draft',
    /^discounts & credit$/i,
  ),
  popup(
    'discount-code-dialog',
    story('order-discounts-sidebar-card--code-dialog'),
    async (page) => {
      await cardButton(page, 'draft', /^discounts & credit$/i, /^apply$/i)
    },
  ),
  cardCase(
    'logistics-measured',
    story('order-logistics-card--measured'),
    'freight',
    /^logistics$/i,
  ),
  cardCase(
    'logistics-incomplete',
    story('order-logistics-card--incomplete'),
    'incompleteFreight',
    /^logistics$/i,
  ),
  cardCase(
    'purchase-order',
    story('order-purchase-order-card--with-number-and-document'),
    'freight',
    /^purchase order$/i,
  ),
  cardCase(
    'digital-links',
    story('order-digital-links-card--links'),
    'digital',
    /^downloads$/i,
    'CMP-DA-G-24',
  ),

  // Loading
  {
    id: 'CMP-DA-G-11',
    name: 'b8-order-skeleton',
    story: story('order-skeleton--loading'),
    screen: async (page) => {
      await page.route(
        (url) => url.pathname === `/api/v3/admin/orders/${orders.paid.id}`,
        (route) => (route.request().method() === 'GET' ? new Promise(() => {}) : route.fallback()),
      )
      // Not `adminPage`: the network never goes quiet while the order is held.
      const session = await login(page)
      await page.goto(`/${session.store_id}/orders/${orders.paid.id}`)
      const skeleton = page.locator('[data-slot="skeleton"]').first()
      await expect(skeleton).toBeAttached({ timeout: 15_000 })
      return skeleton.locator('xpath=../..')
    },
    inStory: inColumn,
  },

  // Edit order
  {
    id: 'CMP-DA-G-11',
    name: 'b8-edit-items-placed',
    story: story('order-edit-items-table--placed'),
    screen: async (page) => {
      await openEdit(page, 'paid')
      return itemsCard(page)
    },
    inStory: itemsCard,
  },
  {
    id: 'CMP-DA-G-11',
    name: 'b8-edit-items-draft',
    story: story('order-edit-items-table--draft'),
    screen: async (page) => {
      await openEdit(page, 'draft')
      return itemsCard(page)
    },
    inStory: itemsCard,
  },
  {
    id: 'CMP-DA-G-11',
    name: 'b8-edit-items-partly-fulfilled',
    story: story('order-edit-items-table--partly-fulfilled'),
    screen: async (page) => {
      await openEdit(page, 'partlyFulfilled')
      return itemsCard(page)
    },
    inStory: itemsCard,
  },
  popup('add-line-item-sheet', story('add-line-item-sheet--open'), async (page) => {
    await openEdit(page, 'paid')
    await page.getByRole('button', { name: /^add product$/i }).click()
  }),

  // New order
  {
    id: 'CMP-DA-G-24',
    name: 'b8-channel-select',
    story: story('channel-select--empty'),
    screen: async (page) => {
      await adminPage(page, '/orders/new')
      const channel = card(page, /^sales channel$/i).getByRole('combobox')
      await channel.scrollIntoViewIfNeeded()
      return channel
    },
    inStory: (page) => page.getByRole('combobox').first(),
  },
  popup(
    'channel-select-open',
    story('channel-select--open'),
    async (page) => {
      await adminPage(page, '/orders/new')
      const channel = card(page, /^sales channel$/i).getByRole('combobox')
      await channel.scrollIntoViewIfNeeded()
      await channel.click()
    },
    (page) => page.getByRole('listbox').first(),
    'CMP-DA-G-24',
  ),
  // Earlier batches' stories these screens show (work item §3.1)
  popup(
    'earlier-address-form-dialog-address-given',
    'dashboard-core-address-form-dialog--address-given',
    async (page) => {
      await cardButton(page, 'paid', /^customer$/i, /^actions$/i)
      await page.getByRole('menuitem', { name: 'Edit Shipping Address' }).click()
      await expect(dialog(page).getByText('Select a country')).toBeHidden({ timeout: 15_000 })
    },
    dialog,
    'CMP-CORE-01',
  ),
  {
    id: 'CMP-DUI-C-01',
    name: 'b8-earlier-address-block-person',
    story: 'dashboard-ui-composed-address-block--person',
    screen: async (page) =>
      (await orderCard(page, 'paid', /^customer$/i))
        .locator('div')
        .filter({ has: page.locator('h6', { hasText: /^shipping address$/i }) })
        .last(),
    // The address block's stories have no column around them.
    inStory: (page) => page.locator('#storybook-root > *').first(),
  },
  {
    ...cardCase(
      'earlier-metadata-card-empty',
      'dashboard-ui-composed-metadata-metadata-card--empty',
      'paid',
      /^metadata$/i,
      'CMP-DUI-C-31',
    ),
    inStory: (page) => card(page, /^metadata$/i),
  },
  {
    ...cardCase(
      'earlier-custom-fields-no-fields',
      'admin-dashboard-custom-fields-custom-fields-inline-card--no-fields',
      'paid',
      /^custom fields$/i,
      'CMP-DA-G-06',
    ),
    inStory: (page) => card(page, /^custom fields$/i),
  },
  popup(
    'earlier-tag-combobox-open',
    'dashboard-core-tag-combobox--open',
    async (page) => {
      const tags = await orderCard(page, 'paid', /^tags$/i)
      await tags.getByRole('button', { name: 'Edit' }).click()
      await tags.getByRole('combobox').click()
      await expect(page.getByRole('option').first()).toBeVisible()
    },
    (page) => page.getByRole('listbox').first(),
    'CMP-CORE-38',
  ),
  popup(
    'earlier-export-button-filtered',
    'dashboard-core-export-button--filtered',
    async (page) => {
      await adminPage(page, '/orders')
      await page.getByPlaceholder(/search by number/i).fill(orders.canceled.number)
      await expect(page.getByRole('row').filter({ hasText: orders.paid.number })).toBeHidden({
        timeout: 15_000,
      })
      await page.getByRole('button', { name: /^export/i }).click()
      await expect(dialog(page).getByText(/matching your current filter/i)).toBeVisible()
    },
    dialog,
    'CMP-CORE-09',
  ),
]

test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? baseURL
  await seed(baseURL)
  orders = await seedOrders(baseURL)
})

compareCases(cases)
