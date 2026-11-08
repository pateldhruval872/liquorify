import { expect, type Locator, type Page, test } from '@playwright/test'
import { type AfterSaleKey, type AfterSaleOrders, seedAfterSale, tracking } from './after-sale'
import { adminPage, type Case, compareCases } from './comparison'
import { seed } from './staff'

/**
 * Part 2 of batch 8's diagnostic comparison: each new fulfilment and
 * after-sale component's story beside the same component on the order page
 * (DA-ORD-04), as `compare-batch-8.spec.ts` compares part 1's. Start the
 * screens as `compare.spec.ts` describes; set `FIDELITY_STORYBOOK_URL` when
 * the built Storybook is served elsewhere than port 6007. The orders the
 * screens show are made through the Admin API first (`after-sale.ts`). The
 * data differs on purpose: the screens show those orders, the stories
 * invented ones. Nothing a case opens is saved.
 *
 * The shipping documents and a line priced by a catalog have no case: the
 * browser-test server makes neither, so they are shown in stories only. Two
 * of part 1's stories whose state first shows here, the fulfilled order's
 * header and a return's reason field, are compared too, as LIQ-004's
 * comparison follow-up asks.
 */

let orders: AfterSaleOrders

const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()
const inColumn = (page: Page) => page.locator('[data-story-column] > *').first()
const pageHeader = (page: Page) =>
  page
    .locator('header')
    .filter({ has: page.getByRole('heading', { level: 1 }) })
    .first()
const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).first()
const menu = (page: Page) => page.getByRole('menu').first()
const listbox = (page: Page) => page.getByRole('listbox').first()

const openOrder = async (page: Page, key: AfterSaleKey) => {
  await adminPage(page, `/orders/${orders[key].id}`)
  await page.getByRole('heading', { name: orders[key].number }).waitFor()
}

/** A card on an order's page, scrolled into view. */
const orderCard = async (page: Page, key: AfterSaleKey, title: RegExp) => {
  await openOrder(page, key)
  const found = card(page, title)
  await found.waitFor()
  await found.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  return found
}

const fulfilments = /^fulfillments/i

/** The first fulfilment inside the order's fulfilments card. */
const parcel = (container: Locator) => container.locator('[data-slot="card"]').first()

const fulfilmentMenu = async (page: Page, key: AfterSaleKey) => {
  const found = await orderCard(page, key, fulfilments)
  await found.getByRole('button', { name: 'Actions' }).first().click()
}

const fulfilmentAction = async (page: Page, key: AfterSaleKey, item: RegExp) => {
  await fulfilmentMenu(page, key)
  await page.getByRole('menuitem', { name: item }).click()
}

const recordMenu = async (page: Page, key: AfterSaleKey, title: RegExp) => {
  const found = await orderCard(page, key, title)
  await found.getByRole('button', { name: 'Actions' }).first().click()
}

const recordAction = async (page: Page, key: AfterSaleKey, title: RegExp, item: RegExp) => {
  await recordMenu(page, key, title)
  await page.getByRole('menuitem', { name: item }).click()
}

const cardButton = async (page: Page, key: AfterSaleKey, title: RegExp, button: RegExp) => {
  const found = await orderCard(page, key, title)
  await found.getByRole('button', { name: button }).first().click()
}

const cardCase = (
  name: string,
  story: string,
  key: AfterSaleKey,
  title: RegExp,
  id = 'CMP-DA-G-11',
): Case => ({
  id,
  name: `b8p2-${name}`,
  story,
  window: { width: 1280, height: 1400 },
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
  name: `b8p2-${name}`,
  story,
  viewport: true,
  window: { width: 1280, height: 960 },
  screen: async (page) => {
    await reach(page)
    return found(page)
  },
  inStory: found,
})

const orderStory = (name: string) => `admin-dashboard-orders-${name}`
const composed = (name: string) => `dashboard-ui-composed-${name}`

const cases: Case[] = [
  // Fulfilments card
  ...(
    [
      ['draft-unclaimed', 'unaddressedDraft'],
      ['draft-with-parcel', 'draft'],
      ['ready', 'toShip'],
      ['shipped', 'shipped'],
      ['tracked', 'tracked'],
      ['delivered', 'delivered'],
      ['two-locations', 'twoLocations'],
      ['label-uploaded', 'labelled'],
      ['backordered', 'backordered'],
      ['priced', 'priced'],
      ['canceled', 'awaiting'],
      ['replacement', 'settled'],
    ] as const
  ).map(([name, key]) =>
    cardCase(
      `fulfillments-card-${name}`,
      orderStory(`fulfillments-card--${name}`),
      key,
      fulfilments,
    ),
  ),
  popup(
    'fulfillments-card-ready-menu',
    orderStory('fulfillments-card--ready-menu'),
    (page) => fulfilmentMenu(page, 'toShip'),
    menu,
  ),
  popup('fulfillments-card-split', orderStory('fulfillments-card--split'), (page) =>
    fulfilmentAction(page, 'toShip', /^split$/i),
  ),
  popup(
    'fulfillments-card-cancel-confirmation',
    orderStory('fulfillments-card--cancel-confirmation'),
    (page) => fulfilmentAction(page, 'toShip', /^cancel$/i),
  ),

  // The fulfilment's own parts
  {
    id: 'CMP-DA-G-11',
    name: 'b8p2-fulfillment-fulfill-form',
    story: orderStory('fulfillment-fulfill-form--everything'),
    screen: async (page) => {
      const found = await orderCard(page, 'toShip', fulfilments)
      await found.getByRole('button', { name: 'Mark as fulfilled' }).click()
      await expect(page.getByRole('button', { name: 'Fulfill items' })).toBeVisible()
      return parcel(found)
    },
    inStory: inColumn,
  },
  popup('fulfillment-edit-dialog', orderStory('fulfillment-edit-dialog--default'), (page) =>
    fulfilmentAction(page, 'toShip', /^edit$/i),
  ),
  popup('fulfillment-delivery-dialog', orderStory('fulfillment-delivery-dialog--add'), (page) =>
    fulfilmentAction(page, 'toShip', /^add tracking$/i),
  ),
  popup(
    'fulfillment-label-upload-dialog',
    orderStory('fulfillment-label-upload-dialog--empty'),
    (page) => fulfilmentAction(page, 'toShip', /^upload label$/i),
  ),
  // The deliveries and the label row are each a card's content inside the
  // parcel, which sits in the fulfilments card's own content, so the last
  // match is the part itself.
  {
    id: 'CMP-DA-G-11',
    name: 'b8p2-fulfillment-deliveries',
    story: orderStory('fulfillment-deliveries--one'),
    screen: async (page) => {
      const found = await orderCard(page, 'shipped', fulfilments)
      return found
        .locator('[data-slot="card-content"]')
        .filter({ has: page.getByRole('link', { name: tracking.ups }) })
        .last()
    },
    inStory: (page) => page.locator('[data-slot="card-content"]').first(),
  },
  {
    id: 'CMP-DA-G-11',
    name: 'b8p2-shipping-label-row',
    story: orderStory('shipping-label-row--uploaded'),
    screen: async (page) => {
      const found = await orderCard(page, 'labelled', fulfilments)
      return found
        .locator('[data-slot="card-content"]')
        .filter({ hasText: 'Shipping label' })
        .last()
    },
    inStory: (page) => page.locator('[data-slot="card-content"]').first(),
  },

  // Composed fulfilment components, as the fulfilments card uses them
  {
    id: 'CMP-DUI-C-26',
    name: 'b8p2-dui-fulfillment-panel',
    story: composed('fulfillment-panel--unfulfilled'),
    screen: async (page) => parcel(await orderCard(page, 'toShip', fulfilments)),
    inStory: inColumn,
  },
  popup(
    'dui-delivery-form-dialog',
    composed('delivery-form-dialog--add'),
    (page) => fulfilmentAction(page, 'toShip', /^add tracking$/i),
    dialog,
    'CMP-DUI-C-16',
  ),
  popup(
    'dui-fulfillment-edit-dialog',
    composed('fulfillment-edit-dialog--default'),
    (page) => fulfilmentAction(page, 'toShip', /^edit$/i),
    dialog,
    'CMP-DUI-C-24',
  ),
  popup(
    'dui-fulfillment-edit-dialog-origins',
    composed('fulfillment-edit-dialog--origin-list'),
    async (page) => {
      await fulfilmentAction(page, 'toShip', /^edit$/i)
      await dialog(page).getByRole('combobox', { name: 'Ships from' }).click()
      await expect(page.getByRole('option').first()).toBeVisible()
    },
    listbox,
    'CMP-DUI-C-24',
  ),
  popup(
    'dui-label-upload-dialog',
    composed('label-upload-dialog--default'),
    (page) => fulfilmentAction(page, 'toShip', /^upload label$/i),
    dialog,
    'CMP-DUI-C-29',
  ),

  // Returns, exchanges and claims
  ...(
    [
      ['none', 'returnable'],
      ['requested', 'requested'],
      ['partly-received', 'received'],
      ['refunded', 'settled'],
      ['canceled', 'withdrawn'],
    ] as const
  ).map(([name, key]) =>
    cardCase(
      `order-returns-card-${name}`,
      orderStory(`order-returns-card--${name}`),
      key,
      /^returns/i,
      'CMP-DA-G-24',
    ),
  ),
  ...(
    [
      ['no-exchanges', 'returnable', /^exchanges/i],
      ['exchange-received', 'received', /^exchanges/i],
      ['no-claims', 'returnable', /^claims/i],
      ['two-lines', 'requested', /^claims/i],
    ] as const
  ).map(([name, key, title]) =>
    cardCase(
      `order-post-sale-cards-${name}`,
      orderStory(`order-post-sale-cards--${name}`),
      key,
      title,
      'CMP-DA-G-24',
    ),
  ),
  popup(
    'order-returns-card-requested-menu',
    orderStory('order-returns-card--requested-menu'),
    (page) => recordMenu(page, 'requested', /^returns/i),
    menu,
    'CMP-DA-G-24',
  ),
  popup(
    'order-returns-card-cancel-confirmation',
    orderStory('order-returns-card--cancel-confirmation'),
    (page) => recordAction(page, 'requested', /^returns/i, /^cancel$/i),
    dialog,
    'CMP-DA-G-24',
  ),
  popup(
    'order-post-sale-cards-deny-confirmation',
    orderStory('order-post-sale-cards--claim-deny-confirmation'),
    (page) => recordAction(page, 'requested', /^claims/i, /^deny$/i),
    dialog,
    'CMP-DA-G-24',
  ),
  popup(
    'order-post-sale-cards-balance-due',
    orderStory('order-post-sale-cards--exchange-balance-due'),
    (page) => recordAction(page, 'received', /^exchanges/i, /^ship replacement$/i),
    dialog,
    'CMP-DA-G-24',
  ),

  // The after-sale dialogs, the dashboard's and the composed ones
  popup(
    'post-sale-create-dialogs-return',
    orderStory('post-sale-create-dialogs--new-return'),
    (page) => cardButton(page, 'returnable', /^returns/i, /^new return$/i),
    dialog,
    'CMP-DA-G-24',
  ),
  popup(
    'post-sale-create-dialogs-exchange',
    orderStory('post-sale-create-dialogs--new-exchange'),
    (page) => cardButton(page, 'returnable', /^exchanges/i, /^new exchange$/i),
    dialog,
    'CMP-DA-G-24',
  ),
  popup(
    'post-sale-create-dialogs-claim',
    orderStory('post-sale-create-dialogs--new-claim'),
    (page) => cardButton(page, 'returnable', /^claims/i, /^new claim$/i),
    dialog,
    'CMP-DA-G-24',
  ),
  popup(
    'post-sale-create-dialogs-resolve',
    orderStory('post-sale-create-dialogs--resolve'),
    (page) => recordAction(page, 'approved', /^claims/i, /^resolve$/i),
    dialog,
    'CMP-DA-G-24',
  ),
  popup(
    'dui-post-sale-create-dialogs-return',
    composed('post-sale-create-dialogs--return'),
    (page) => cardButton(page, 'returnable', /^returns/i, /^new return$/i),
    dialog,
    'CMP-DUI-C-33',
  ),
  popup(
    'dui-post-sale-create-dialogs-claim',
    composed('post-sale-create-dialogs--claim'),
    (page) => cardButton(page, 'returnable', /^claims/i, /^new claim$/i),
    dialog,
    'CMP-DUI-C-33',
  ),
  {
    id: 'CMP-DUI-C-34',
    name: 'b8p2-dui-post-sale-fields',
    story: composed('post-sale-fields--default'),
    screen: async (page) => {
      await cardButton(page, 'returnable', /^returns/i, /^new return$/i)
      return dialog(page)
        .locator('[data-slot="field"]')
        .filter({ has: page.getByRole('combobox', { name: 'Reason' }) })
    },
    inStory: (page) => page.locator('[data-slot="field"]').first(),
  },
  popup(
    'dui-return-dialogs-receive',
    composed('return-dialogs--receive'),
    (page) => recordAction(page, 'approved', /^returns/i, /^receive items$/i),
    dialog,
    'CMP-DUI-C-43',
  ),
  popup(
    'dui-return-dialogs-refund',
    composed('return-dialogs--refund'),
    (page) => recordAction(page, 'received', /^returns/i, /^refund$/i),
    dialog,
    'CMP-DUI-C-43',
  ),
  popup(
    'dui-return-dialogs-nothing-owed',
    composed('return-dialogs--nothing-owed'),
    (page) => recordAction(page, 'nothingOwed', /^returns/i, /^complete return$/i),
    dialog,
    'CMP-DUI-C-43',
  ),
  popup(
    'dui-claim-resolve-dialog',
    composed('claim-resolve-dialog--refund'),
    (page) => recordAction(page, 'approved', /^claims/i, /^resolve$/i),
    dialog,
    'CMP-DUI-C-08',
  ),

  // Part 1's stories whose state first shows on part 2's screens (G-88)
  {
    id: 'CMP-DA-G-11',
    name: 'b8p2-earlier-order-header-fulfilled',
    story: 'admin-dashboard-orders-order-header--fulfilled',
    screen: async (page) => {
      await openOrder(page, 'shipped')
      return pageHeader(page)
    },
    inStory: pageHeader,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b8p2-earlier-reason-field-return-reason',
    story: 'admin-dashboard-orders-reason-field--return-reason',
    screen: async (page) => {
      await cardButton(page, 'returnable', /^returns/i, /^new return$/i)
      return dialog(page)
        .locator('[data-slot="field"]')
        .filter({ has: page.getByRole('combobox', { name: 'Reason' }) })
    },
    inStory: (page) => page.locator('[data-slot="field"]').first(),
  },
]

test.beforeAll(async ({ baseURL: configured }) => {
  const baseURL = configured ?? 'http://localhost:5174'
  await seed(baseURL)
  orders = await seedAfterSale(baseURL)
})

compareCases(cases)
