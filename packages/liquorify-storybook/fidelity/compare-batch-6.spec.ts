import { type Page, test } from '@playwright/test'
import { rowButton } from '../../dashboard/e2e/helpers'
import { adminPage, type Case, compareCases } from './comparison'
import {
  type Inventory,
  locationNames,
  productNames,
  seedInventory,
  supplierNames,
  type TransferState,
} from './inventory'

/**
 * Batch 6's diagnostic comparison: each new inventory component's story beside
 * the same component on its running screen (DA-SET-18 and DA-INV-01 to
 * DA-INV-10), as `compare.spec.ts` compares the earlier batches'. Start the
 * screens as that file describes; set `FIDELITY_STORYBOOK_URL` when the built
 * Storybook is served elsewhere than port 6007. The records the screens show
 * are added through the Admin API first (`inventory.ts`). The data differs on
 * purpose: the screens show those records, the stories invented ones. Nothing
 * is saved: forms are filled and dialogs opened, never confirmed.
 */

let baseURL = 'http://localhost:5174'
let records: Inventory

const tall = { width: 1280, height: 960 }
const slot = (page: Page, name: string) => page.locator(`[data-slot="${name}"]`)
const sheet = (page: Page) => slot(page, 'sheet-content')
const dialog = (page: Page) => slot(page, 'dialog-content')
const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .last()
const storyRoot = (page: Page) => page.locator('#storybook-root > *').first()

const openTransfer = async (page: Page, state: TransferState) => {
  await adminPage(page, `/transfers/${records.transferIds[state]}`)
  await page.getByRole('heading', { name: records.transferNumbers[state] }).waitFor()
}

const openDestination = async (page: Page) => {
  await adminPage(page, `/settings/stock-locations?edit=${records.locationIds.destination}`)
  await page.locator('#name').waitFor()
}

const pick = async (page: Page, field: string, option: string) => {
  await page.locator(field).click()
  await page.getByRole('option', { name: option }).first().click()
}

const transferWithLines = async (page: Page) => {
  await adminPage(page, '/transfers/new')
  await pick(page, '#source', locationNames.source)
  await pick(page, '#destination', locationNames.destination)
  await page
    .getByRole('button', { name: /add a product/i })
    .first()
    .click()
  const picker = page.getByRole('dialog')
  await picker.getByRole('searchbox').fill('Fidelity')
  await picker.getByRole('button', { name: new RegExp(productNames.mug) }).click()
  await picker.getByRole('button', { name: new RegExp(productNames.tote) }).click()
  await picker.getByRole('button', { name: /^add 2$/i }).click()
}

/** The line picker on a new transfer, opened from its source warehouse. */
const linePicker = async (page: Page) => {
  await adminPage(page, '/transfers/new')
  await pick(page, '#source', locationNames.source)
  await page
    .getByRole('button', { name: /add a product/i })
    .first()
    .click()
  return page.getByRole('dialog')
}

const supplierField = async (page: Page) => {
  await adminPage(page, '/purchase-orders/new')
  await page.locator('#supplier').click()
  await page.getByRole('option', { name: supplierNames.kilnworks }).waitFor()
}

const moreAction = async (page: Page, item: RegExp) => {
  await page.getByRole('button', { name: /more actions/i }).click()
  await page.getByRole('menuitem', { name: item }).click()
}

const stockPanel = (page: Page) =>
  page
    .getByText('Stock at this location', { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "rounded-md")][1]')

const cases: Case[] = [
  {
    id: 'CMP-DA-G-24',
    name: 'b6-variant-link',
    story: 'admin-dashboard-stock-variant-link--linked',
    screen: async (page) => {
      await openTransfer(page, 'received')
      return page.getByRole('link', { name: new RegExp(productNames.mug) }).first()
    },
    inStory: (page) => page.getByRole('link').first(),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-status-badge-in-transit',
    story: 'admin-dashboard-stock-inventory-status-badge--transfer-in-transit',
    screen: async (page) => {
      await openTransfer(page, 'inTransit')
      return slot(page, 'status-badge')
        .filter({ hasText: /^in transit$/i })
        .first()
    },
    inStory: (page) => slot(page, 'status-badge').first(),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-status-badge-over-received',
    story: 'admin-dashboard-stock-inventory-status-badge--purchase-order-over-received',
    screen: async (page) => {
      await adminPage(page, `/purchase-orders/${records.orderIds.over}`)
      return slot(page, 'status-badge')
        .filter({ hasText: /^over.received$/i })
        .first()
    },
    inStory: (page) => slot(page, 'status-badge').first(),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-quantity-cell',
    story: 'admin-dashboard-stock-quantity-cell--editable',
    // The receive card's counts are the quantity cell; the line editor's are plain inputs.
    screen: async (page) => {
      await openTransfer(page, 'inTransit')
      return card(page, /^Receive a delivery$/)
        .getByRole('spinbutton', { name: /^accepted/i })
        .first()
    },
    inStory: (page) => page.locator('#storybook-root').getByRole('spinbutton').first(),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-inventory-cells',
    story: 'admin-dashboard-stock-inventory-cells--figures',
    screen: async (page) => {
      await adminPage(page, '/inventory')
      await page.getByPlaceholder(/search sku or product/i).fill(productNames.mug)
      return page
        .getByRole('row')
        .filter({ hasText: productNames.mug })
        .filter({ hasText: locationNames.destination })
    },
    // Storybook keeps a hidden table of its own outside the story's root.
    inStory: (page) => page.locator('#storybook-root tbody tr').first(),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-stock-levels-panel',
    story: 'admin-dashboard-stock-stock-levels-panel--listed',
    window: tall,
    screen: async (page) => {
      await openDestination(page)
      await stockPanel(page).getByText(productNames.mug).waitFor()
      return stockPanel(page)
    },
    inStory: storyRoot,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-stock-history-card-location',
    story: 'admin-dashboard-stock-stock-history-card--location',
    window: tall,
    screen: async (page) => {
      await openDestination(page)
      return card(page, /^Stock history$/)
    },
    inStory: (page) => card(page, /^Stock history$/),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-stock-receipts-card',
    story: 'admin-dashboard-stock-stock-receipts-card--two-deliveries',
    window: tall,
    screen: async (page) => {
      await openTransfer(page, 'received')
      return card(page, /^Deliveries/)
    },
    inStory: (page) => card(page, /^Deliveries/),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-receive-delivery-card',
    story: 'admin-dashboard-stock-receive-delivery-card--empty',
    window: tall,
    screen: async (page) => {
      await openTransfer(page, 'inTransit')
      return card(page, /^Receive a delivery$/)
    },
    inStory: (page) => card(page, /^Receive a delivery$/),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-close-short-dialog',
    story: 'admin-dashboard-stock-close-short-dialog--transfer',
    window: tall,
    screen: async (page) => {
      await openTransfer(page, 'partial')
      await moreAction(page, /close short/i)
      return dialog(page)
    },
    inStory: dialog,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-transfer-cancel-dialog',
    story: 'admin-dashboard-stock-transfer-cancel-dialog--in-transit',
    window: tall,
    screen: async (page) => {
      await openTransfer(page, 'inTransit')
      await moreAction(page, /cancel transfer/i)
      return dialog(page)
    },
    inStory: dialog,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-variant-line-editor',
    story: 'admin-dashboard-stock-variant-line-editor--lines',
    screen: async (page) => {
      await transferWithLines(page)
      return card(page, /^Items$/).locator('table')
    },
    inStory: (page) => page.locator('#storybook-root table').first(),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-stock-transfer-form-details',
    story: 'admin-dashboard-stock-stock-transfer-form--empty',
    window: tall,
    screen: async (page) => {
      await adminPage(page, '/transfers/new')
      return card(page, /^Details$/)
    },
    inStory: (page) => card(page, /^Details$/),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-purchase-order-form-details',
    story: 'admin-dashboard-stock-purchase-order-form--empty',
    window: tall,
    screen: async (page) => {
      await adminPage(page, '/purchase-orders/new')
      return card(page, /^Details$/)
    },
    inStory: (page) => card(page, /^Details$/),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b6-supplier-sheet-edit',
    story: 'admin-dashboard-stock-supplier-sheet--edit',
    window: tall,
    screen: async (page) => {
      await adminPage(page, '/suppliers')
      await rowButton(page, supplierNames.kilnworks).click()
      await page.locator('#supplier-name').waitFor()
      return sheet(page)
    },
    inStory: sheet,
  },
  {
    id: 'CMP-CORE-PG-03',
    name: 'b6-stock-locations',
    story: 'dashboard-core-pages-stock-locations--listed',
    screen: async (page) => {
      await adminPage(page, '/settings/stock-locations')
      await rowButton(page, locationNames.destination).waitFor()
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
    id: 'CMP-CORE-PG-03',
    name: 'b6-stock-location-sheet',
    story: 'dashboard-core-pages-stock-locations--edit-sheet',
    window: tall,
    screen: async (page) => {
      await openDestination(page)
      return sheet(page)
    },
    inStory: sheet,
  },
]

/**
 * Earlier batches' stories that these screens show, held by G-01, G-33, G-53
 * or G-58 (LIQ-004, "Comparisons deferred to later batches"), compared as
 * batch 6's own are. The gap each came from is beside it.
 */
const earlier: Case[] = [
  // G-01
  {
    id: 'CMP-DUI-P-22',
    name: 'b6-earlier-empty-with-action',
    story: 'dashboard-ui-primitives-empty--with-action',
    screen: async (page) => {
      await adminPage(page, '/transfers/new')
      return card(page, /^Items$/).locator('[data-slot="empty"]')
    },
    inStory: (page) => page.locator('#storybook-root [data-slot="empty"]').first(),
  },
  // G-01
  {
    id: 'CMP-DUI-P-24',
    name: 'b6-earlier-input-group-currency-prefix',
    story: 'dashboard-ui-primitives-input-group--currency-prefix',
    // A draft's edit page: a new order leaves its currency unset, and its cost
    // fields show no currency until one is chosen (record §5).
    screen: async (page) => {
      await adminPage(page, `/purchase-orders/${records.orderIds.draft}/edit`)
      return card(page, /^Items$/)
        .locator('[data-slot="input-group"]')
        .first()
    },
    inStory: (page) => page.locator('#storybook-root [data-slot="input-group"]').first(),
  },
  // G-01
  {
    id: 'CMP-DUI-P-25',
    name: 'b6-earlier-input-number',
    story: 'dashboard-ui-primitives-input--number-input',
    screen: async (page) => {
      await transferWithLines(page)
      return card(page, /^Items$/)
        .getByRole('spinbutton', { name: /^shipped$/i })
        .first()
    },
    inStory: (page) => page.locator('#storybook-root input').first(),
  },
  // G-01
  {
    id: 'CMP-DUI-P-43',
    name: 'b6-earlier-textarea-filled',
    story: 'dashboard-ui-primitives-textarea--filled',
    screen: async (page) => {
      await adminPage(page, `/transfers/${records.transferIds.draft}/edit`)
      return page.locator('#notes')
    },
    inStory: (page) => page.locator('#storybook-root textarea').first(),
  },
  // G-33
  {
    id: 'CMP-CORE-07',
    name: 'b6-earlier-country-state-fields-selected',
    story: 'dashboard-core-country-state-fields--selected',
    window: tall,
    screen: async (page) => {
      await adminPage(page, '/suppliers')
      await rowButton(page, supplierNames.kilnworks).click()
      return page.locator('#supplier-state')
    },
    inStory: (page) => slot(page, 'combobox-button-trigger').first(),
  },
  // G-33
  {
    id: 'CMP-CORE-08',
    name: 'b6-earlier-currency-select-disabled',
    story: 'dashboard-core-currency-select--disabled',
    screen: async (page) => {
      await adminPage(page, `/purchase-orders/${records.orderIds.draft}/edit`)
      return page.locator('#currency')
    },
    inStory: (page) => slot(page, 'combobox-button-trigger').first(),
  },
  // G-33
  {
    id: 'CMP-CORE-23',
    name: 'b6-earlier-resource-combobox-open',
    story: 'dashboard-core-resource-combobox--open',
    viewport: true,
    screen: async (page) => {
      await supplierField(page)
      return slot(page, 'combobox-content')
    },
    inStory: (page) => slot(page, 'combobox-content'),
  },
  // G-33
  {
    id: 'CMP-CORE-23',
    name: 'b6-earlier-resource-combobox-searched',
    story: 'dashboard-core-resource-combobox--searched',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '/purchase-orders/new')
      await page.locator('#supplier').fill('Kiln')
      await page.getByRole('option', { name: supplierNames.kilnworks }).waitFor()
      return slot(page, 'combobox-content')
    },
    inStory: (page) => slot(page, 'combobox-content'),
  },
  // G-53
  {
    id: 'CMP-CORE-35',
    name: 'b6-earlier-store-date-picker-date-empty',
    story: 'dashboard-core-store-date-picker--date-empty',
    screen: async (page) => {
      await adminPage(page, '/purchase-orders/new')
      return card(page, /^Details$/).getByRole('button', { name: /the day the supplier promised/i })
    },
    inStory: (page) => page.locator('#storybook-root').getByRole('button').first(),
  },
  // G-53
  {
    id: 'CMP-CORE-35',
    name: 'b6-earlier-store-date-picker-date-chosen',
    story: 'dashboard-core-store-date-picker--date-chosen',
    screen: async (page) => {
      await adminPage(page, `/purchase-orders/${records.orderIds.draft}/edit`)
      return page.getByRole('button', { name: /december 8th, 2026/i })
    },
    inStory: (page) => page.locator('#storybook-root').getByRole('button').first(),
  },
  // G-53
  {
    id: 'CMP-CORE-35',
    name: 'b6-earlier-store-date-picker-date-choosing',
    story: 'dashboard-core-store-date-picker--date-choosing',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, `/purchase-orders/${records.orderIds.draft}/edit`)
      await page.getByRole('button', { name: /december 8th, 2026/i }).click()
      return slot(page, 'popover-content')
    },
    inStory: (page) => slot(page, 'popover-content'),
  },
  // G-58
  {
    id: 'CMP-CORE-18',
    name: 'b6-earlier-money-dollars',
    story: 'dashboard-core-money--dollars',
    screen: async (page) => {
      await adminPage(page, `/purchase-orders/${records.orderIds.ordered}`)
      const amount = page
        .getByRole('row', { name: new RegExp(productNames.mug) })
        .getByText('$6.50', { exact: true })
        .first()
      await amount.waitFor()
      return amount
    },
    inStory: storyRoot,
  },
  // G-58
  {
    id: 'CMP-CORE-25',
    name: 'b6-earlier-resource-picker-sheet-picking',
    story: 'dashboard-core-resource-picker-sheet--picking',
    window: tall,
    screen: async (page) => {
      const picker = await linePicker(page)
      await picker.getByRole('searchbox').fill('Fidelity')
      await picker.getByRole('button', { name: new RegExp(productNames.mug) }).click()
      await picker.getByRole('button', { name: new RegExp(productNames.tote) }).click()
      await picker.getByRole('button', { name: /^add 2$/i }).waitFor()
      return sheet(page)
    },
    inStory: sheet,
  },
  // G-58
  {
    id: 'CMP-CORE-25',
    name: 'b6-earlier-resource-picker-sheet-searching',
    story: 'dashboard-core-resource-picker-sheet--searching',
    window: tall,
    screen: async (page) => {
      const picker = await linePicker(page)
      await picker.getByRole('searchbox').fill('speckled')
      await picker.getByRole('button', { name: new RegExp(productNames.mug) }).waitFor()
      return sheet(page)
    },
    inStory: sheet,
  },
  // G-58
  {
    id: 'CMP-CORE-25',
    name: 'b6-earlier-resource-picker-sheet-no-results',
    story: 'dashboard-core-resource-picker-sheet--no-results',
    window: tall,
    screen: async (page) => {
      const picker = await linePicker(page)
      await picker.getByRole('searchbox').fill('teapot')
      await picker.getByText(/no results found/i).waitFor()
      return sheet(page)
    },
    inStory: sheet,
  },
]

test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? baseURL
  records = await seedInventory(baseURL)
})

compareCases([...cases, ...earlier])
