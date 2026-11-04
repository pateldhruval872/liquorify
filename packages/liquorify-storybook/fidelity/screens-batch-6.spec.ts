import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { FIXTURE_INVENTORY_SKU, login, rowButton } from '../../dashboard/e2e/helpers'
import {
  type Inventory,
  locationNames,
  type OrderState,
  productNames,
  seedInventory,
  supplierNames,
  type TransferState,
} from './inventory'
import { openRowMenu, PASSWORD, roles, type Seeded, seed, teammates } from './staff'

/**
 * Captures batch 6's eleven screens (DA-SET-18 and DA-INV-01 to DA-INV-10) in
 * each state and permission variant the work item maps, as
 * `screens-batch-7.spec.ts` captures batch 7's. It gathers evidence for a
 * person to review and passes whenever it can capture a screen; it compares
 * nothing.
 *
 * Start the screens as `compare.spec.ts` describes. Before the first capture
 * it adds the staff and roles (`staff.ts`) and the products, suppliers,
 * transfers and purchase orders the states need (`inventory.ts`); running it
 * again reuses them. No capture saves a change: forms are filled and dialogs
 * opened, never confirmed, so the seeded documents keep their states.
 *
 * Each capture is saved as `results/screens/<screen ID>/<state>/<variant>-<theme>.png`
 * with a `.json` that records how the state was reached.
 */

const results = new URL('./results/screens/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

type Variant = 'admin' | 'merchandiser' | 'stockViewer' | 'purchaser' | 'orderManager'
const roleVariants = ['merchandiser', 'stockViewer', 'purchaser'] as const

let seeded: Seeded
let records: Inventory

interface Capture {
  screen: string
  state: string
  variant: Variant
  /** How the state was reached when the browser answered or held a request, for the record. */
  intercepted?: string
  /** A loading state: captured as soon as it shows, without waiting for skeletons to clear. */
  loading?: true
  /** Captured at a phone's width instead of the desktop's. */
  phone?: true
  reach: (page: Page) => Promise<void>
}

const phone = { width: 390, height: 844 }

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

const dialog = (page: Page) => page.getByRole('dialog')

/** Holds every GET to an Admin API path open, so its screen stays loading. */
const holdList = (page: Page, path: string) =>
  page.route(
    (url) => url.pathname === `/api/v3/admin/${path}`,
    (route) => (route.request().method() === 'GET' ? new Promise(() => {}) : route.fallback()),
  )

/** Fails every GET to an Admin API path, as a server error would. */
const failRead = (page: Page, path: RegExp) =>
  page.route(
    (url) => path.test(url.pathname),
    (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            status: 500,
            json: { error: { message: 'Fidelity: failed on purpose' } },
          })
        : route.fallback(),
  )

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

/** Answers a write with a refusal naming one field, as a server validation would. */
const refuseWrite = (page: Page, path: RegExp, method: 'POST' | 'PATCH', field: string) =>
  page.route(
    (url) => path.test(url.pathname),
    (route) =>
      route.request().method() === method
        ? route.fulfill({
            status: 422,
            json: {
              error: {
                code: 'validation_error',
                message: `${field} is invalid`,
                details: { [field]: [{ code: 'invalid', message: 'is invalid', specific: false }] },
              },
            },
          })
        : route.fallback(),
  )

/** Scrolls an element to the middle of its scrolling area, for a state lower on a page. */
const toMiddle = (target: Locator) =>
  target.evaluate((element) => element.scrollIntoView({ block: 'center' }))

const optionIn = async (page: Page, field: Locator, option: string | RegExp) => {
  await field.click()
  await page.getByRole('option', { name: option }).first().click()
}

const directVisit = (screen: string, path: () => string, variant: Variant = 'orderManager') => ({
  screen,
  state: 'direct-visit',
  variant,
  reach: (page: Page) => openStore(page, path()),
})

const each = (variants: readonly Variant[], capture: Omit<Capture, 'variant'>): Capture[] =>
  variants.map((variant) => ({ ...capture, variant }))

// DA-SET-18 Stock locations

const locationsPath = '/settings/stock-locations'

const openLocations = async (page: Page) => {
  await openStore(page, locationsPath)
  await expect(rowButton(page, locationNames.destination)).toBeVisible({ timeout: 15_000 })
}

const openDestination = async (page: Page) => {
  await openStore(page, `${locationsPath}?edit=${records.locationIds.destination}`)
  await expect(page.locator('#name')).toHaveValue(locationNames.destination, { timeout: 15_000 })
}

const stockPanel = (page: Page) =>
  dialog(page)
    .getByText('Stock at this location', { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "rounded-md")][1]')

const locationCaptures: Capture[] = [
  ...each(['admin', ...roleVariants], {
    screen: 'DA-SET-18',
    state: 'listed',
    reach: openLocations,
  }),
  {
    screen: 'DA-SET-18',
    state: 'none',
    variant: 'admin',
    intercepted: "The stock locations list is answered with the server's own response, emptied",
    reach: async (page) => {
      await emptied(page, 'stock_locations')
      await openStore(page, locationsPath)
      await expect(page.getByText(/no stock locations yet/i)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-18',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The stock locations request is held open',
    loading: true,
    reach: async (page) => {
      await holdList(page, 'stock_locations')
      await page.goto(`/${seeded.storeId}${locationsPath}`)
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-18',
    state: 'create-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openLocations(page)
      await page.getByRole('button', { name: /add stock location/i }).click()
      await expect(page.getByRole('heading', { name: /add stock location/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-18',
    state: 'create-sheet-pickup',
    variant: 'admin',
    reach: async (page) => {
      await openLocations(page)
      await page.getByRole('button', { name: /add stock location/i }).click()
      await expect(page.getByRole('heading', { name: /add stock location/i })).toBeVisible()
      await toMiddle(dialog(page).getByText('Pickup', { exact: true }))
    },
  },
  ...each(['admin', ...roleVariants], {
    screen: 'DA-SET-18',
    state: 'edit',
    reach: openDestination,
  }),
  ...each(['admin', 'stockViewer'], {
    screen: 'DA-SET-18',
    state: 'edit-stock-levels',
    reach: async (page) => {
      await openDestination(page)
      const panel = stockPanel(page)
      await expect(panel.getByText(productNames.mug)).toBeVisible({ timeout: 15_000 })
      await toMiddle(panel)
    },
  }),
  {
    screen: 'DA-SET-18',
    state: 'edit-stock-levels-no-match',
    variant: 'admin',
    reach: async (page) => {
      await openDestination(page)
      const panel = stockPanel(page)
      await panel.getByPlaceholder(/search sku or product/i).fill('Fidelity teapot')
      await expect(panel.getByText(/no stock levels match your search/i)).toBeVisible({
        timeout: 15_000,
      })
      await toMiddle(panel)
    },
  },
  {
    screen: 'DA-SET-18',
    state: 'edit-history',
    variant: 'admin',
    reach: async (page) => {
      await openDestination(page)
      const history = dialog(page).getByText('Stock history', { exact: true }).last()
      await expect(history).toBeVisible({ timeout: 15_000 })
      await toMiddle(history)
    },
  },
  {
    screen: 'DA-SET-18',
    state: 'save-refused',
    variant: 'admin',
    reach: async (page) => {
      await openDestination(page)
      await page.locator('#name').fill(locationNames.source)
      // The stock levels panel's rows have Save buttons of their own.
      await dialog(page).locator('button[type="submit"]').click()
      await expect(dialog(page).getByText(/taken/i).first()).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-18',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openLocations(page)
      await openRowMenu(page, locationNames.destination)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByRole('heading', { name: /delete stock location\?/i })).toBeVisible()
    },
  },
  directVisit('DA-SET-18', () => locationsPath),
]

// DA-INV-01 Inventory

const inventoryPath = '/inventory'

const openInventory = async (page: Page, search?: string) => {
  await openStore(page, inventoryPath)
  await expect(page.getByRole('heading', { name: /^inventory$/i })).toBeVisible({
    timeout: 15_000,
  })
  if (search) await page.getByPlaceholder(/search sku or product/i).fill(search)
  await expect(
    page
      .getByRole('row')
      .filter({ hasText: search ?? '' })
      .nth(1),
  ).toBeVisible({
    timeout: 15_000,
  })
}

/** Every option of these filters starts selected, so narrowing one means unchecking the rest. */
const keepOnly = async (page: Page, filter: RegExp, uncheck: (string | RegExp)[]) => {
  await page.getByRole('button', { name: filter }).click()
  for (const name of uncheck) await page.getByRole('menuitemcheckbox', { name }).click()
  await page.keyboard.press('Escape')
  await page.waitForLoadState('networkidle')
}

const mugRow = (page: Page) =>
  page
    .getByRole('row')
    .filter({ hasText: productNames.mug })
    .filter({ hasText: locationNames.destination })

const openCorrection = async (page: Page) => {
  await openInventory(page, productNames.mug)
  await mugRow(page)
    .getByRole('button', { name: /edit on-hand count/i })
    .click()
  await expect(page.getByLabel(/^amount$/i)).toBeVisible()
}

const inventoryCaptures: Capture[] = [
  ...each(['admin', ...roleVariants], {
    screen: 'DA-INV-01',
    state: 'listed',
    reach: (page) => openInventory(page),
  }),
  ...each(['admin', ...roleVariants], {
    screen: 'DA-INV-01',
    state: 'searched-incoming',
    reach: (page) => openInventory(page, productNames.mug),
  }),
  {
    screen: 'DA-INV-01',
    state: 'column-explanation',
    variant: 'admin',
    reach: async (page) => {
      await openInventory(page)
      await page
        .getByRole('button', { name: /units held by customers who are in checkout/i })
        .hover()
      await expect(
        page.getByText(/units held by customers who are in checkout right now/i).last(),
      ).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-INV-01',
    state: 'filtered-low-stock',
    variant: 'admin',
    reach: async (page) => {
      await openInventory(page, 'Fidelity')
      await keepOnly(page, /stock status/i, [
        /^in stock$/i,
        /^out of stock$/i,
        /^reserved$/i,
        /^incoming$/i,
      ])
      await expect(page.getByRole('button', { name: /stock status/i })).toContainText('1/5')
    },
  },
  {
    screen: 'DA-INV-01',
    state: 'filtered-reserved',
    variant: 'admin',
    reach: async (page) => {
      // The browser tests' own product, which a checkout holds at the destination.
      await openInventory(page, FIXTURE_INVENTORY_SKU)
      await keepOnly(page, /stock status/i, [
        /^in stock$/i,
        /^low stock$/i,
        /^out of stock$/i,
        /^incoming$/i,
      ])
      await expect(page.getByRole('button', { name: /stock status/i })).toContainText('1/5')
    },
  },
  {
    screen: 'DA-INV-01',
    state: 'filtered-location',
    variant: 'admin',
    reach: async (page) => {
      await openInventory(page, 'Fidelity')
      await keepOnly(page, /^location/i, [locationNames.source, locationNames.shop])
      await expect(mugRow(page)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-INV-01',
    state: 'correction-set',
    variant: 'admin',
    reach: async (page) => {
      await openCorrection(page)
      await page.getByLabel(/^amount$/i).fill('5')
      await optionIn(page, page.getByLabel(/^reason$/i), /^count$/i)
    },
  },
  {
    screen: 'DA-INV-01',
    state: 'correction-adjust',
    variant: 'admin',
    reach: async (page) => {
      await openCorrection(page)
      await optionIn(page, page.getByLabel(/how to change the count/i), /adjust by/i)
      await page.getByLabel(/^amount$/i).fill('-1')
      await optionIn(page, page.getByLabel(/^reason$/i), /^damaged$/i)
    },
  },
  ...each(['admin', 'merchandiser', 'purchaser'], {
    screen: 'DA-INV-01',
    state: 'incoming-menu',
    reach: async (page) => {
      await openInventory(page, productNames.mug)
      await mugRow(page)
        .getByRole('button', { name: /add incoming stock/i })
        .click()
      await expect(
        page
          .getByRole('link')
          .filter({ hasText: /^create/i })
          .first(),
      ).toBeVisible()
    },
  }),
  {
    screen: 'DA-INV-01',
    state: 'none',
    variant: 'admin',
    intercepted: "The stock levels list is answered with the server's own response, emptied",
    reach: async (page) => {
      await emptied(page, 'stock_levels')
      await openStore(page, inventoryPath)
      await expect(page.getByText(/no stock levels yet/i)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-INV-01',
    state: 'no-match',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, inventoryPath)
      await page.getByPlaceholder(/search sku or product/i).fill('Fidelity teapot')
      await page.waitForLoadState('networkidle')
    },
  },
  {
    screen: 'DA-INV-01',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The stock levels request is held open',
    loading: true,
    reach: async (page) => {
      await holdList(page, 'stock_levels')
      await page.goto(`/${seeded.storeId}${inventoryPath}`)
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible()
    },
  },
  directVisit('DA-INV-01', () => inventoryPath),
]

// DA-INV-02 to DA-INV-05 Stock transfers

const transfersPath = '/transfers'
const transferPath = (state: TransferState) => `${transfersPath}/${records.transferIds[state]}`

const openTransfers = async (page: Page) => {
  await openStore(page, transfersPath)
  await expect(page.getByText(records.transferNumbers.draft)).toBeVisible({ timeout: 15_000 })
}

const openTransfer = async (page: Page, state: TransferState) => {
  await openStore(page, transferPath(state))
  await expect(page.getByRole('heading', { name: records.transferNumbers[state] })).toBeVisible({
    timeout: 15_000,
  })
}

const moreActions = (page: Page) => page.getByRole('button', { name: /more actions/i })

const transferCaptures: Capture[] = [
  ...each(['admin', ...roleVariants], {
    screen: 'DA-INV-02',
    state: 'listed',
    reach: openTransfers,
  }),
  {
    screen: 'DA-INV-02',
    state: 'none',
    variant: 'admin',
    intercepted: "The transfers list is answered with the server's own response, emptied",
    reach: async (page) => {
      await emptied(page, 'stock_transfers')
      await openStore(page, transfersPath)
      await expect(page.getByText(/no stock transfers yet/i)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-INV-02',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The transfers request is held open',
    loading: true,
    reach: async (page) => {
      await holdList(page, 'stock_transfers')
      await page.goto(`/${seeded.storeId}${transfersPath}`)
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-INV-02',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openTransfers(page)
      await openRowMenu(page, records.transferNumbers.draft)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByRole('heading', { name: /delete this transfer\?/i })).toBeVisible()
    },
  },
  directVisit('DA-INV-02', () => transfersPath),

  ...each(['admin', 'merchandiser'], {
    screen: 'DA-INV-03',
    state: 'empty',
    reach: async (page) => {
      await openStore(page, `${transfersPath}/new`)
      await expect(page.getByRole('heading', { name: /new stock transfer/i })).toBeVisible({
        timeout: 15_000,
      })
    },
  }),
  {
    screen: 'DA-INV-03',
    state: 'picker',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, `${transfersPath}/new`)
      await optionIn(page, page.locator('#source'), locationNames.source)
      await optionIn(page, page.locator('#destination'), locationNames.destination)
      await page
        .getByRole('button', { name: /add a product/i })
        .first()
        .click()
      const picker = dialog(page)
      await picker.getByRole('searchbox').fill('Fidelity')
      await picker.getByRole('button', { name: new RegExp(productNames.mug) }).click()
      await picker.getByRole('button', { name: new RegExp(productNames.tote) }).click()
    },
  },
  {
    screen: 'DA-INV-03',
    state: 'lines-added',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, `${transfersPath}/new`)
      await optionIn(page, page.locator('#source'), locationNames.source)
      await optionIn(page, page.locator('#destination'), locationNames.destination)
      await page
        .getByRole('button', { name: /add a product/i })
        .first()
        .click()
      const picker = dialog(page)
      await picker.getByRole('searchbox').fill('Fidelity')
      await picker.getByRole('button', { name: new RegExp(productNames.mug) }).click()
      await picker.getByRole('button', { name: new RegExp(productNames.tote) }).click()
      await picker.getByRole('button', { name: /^add 2$/i }).click()
      await page
        .getByRole('spinbutton', { name: /^shipped$/i })
        .first()
        .fill('12')
      await page.locator('#reference').fill('Fidelity restock the destination')
    },
  },
  {
    screen: 'DA-INV-03',
    state: 'same-warehouse',
    variant: 'admin',
    reach: async (page) => {
      // Destination first: the source list may still offer the same warehouse.
      await openStore(page, `${transfersPath}/new`)
      await optionIn(page, page.locator('#destination'), locationNames.source)
      await optionIn(page, page.locator('#source'), locationNames.source)
    },
  },
  {
    screen: 'DA-INV-03',
    state: 'save-refused',
    variant: 'admin',
    intercepted: 'The create request is answered with a refusal naming the destination',
    reach: async (page) => {
      await refuseWrite(page, /\/stock_transfers$/, 'POST', 'destination_location_id')
      await openStore(page, `${transfersPath}/new`)
      await optionIn(page, page.locator('#source'), locationNames.source)
      await optionIn(page, page.locator('#destination'), locationNames.destination)
      await page.getByRole('button', { name: /create draft/i }).click()
      await page.waitForTimeout(500)
    },
  },
  {
    screen: 'DA-INV-03',
    state: 'prefilled',
    variant: 'admin',
    reach: async (page) => {
      await openInventory(page, productNames.mug)
      await mugRow(page)
        .getByRole('button', { name: /add incoming stock/i })
        .click()
      await page.getByRole('link', { name: /create transfer/i }).click()
      await expect(page.getByRole('heading', { name: /new stock transfer/i })).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  directVisit('DA-INV-03', () => `${transfersPath}/new`, 'stockViewer'),
  directVisit('DA-INV-03', () => `${transfersPath}/new`, 'purchaser'),

  ...(
    [
      ['draft', 'draft'],
      ['ready', 'ready-to-ship'],
      ['inTransit', 'in-transit'],
      ['partial', 'partially-received'],
      ['received', 'received'],
      ['over', 'over-received'],
      ['closedShort', 'closed-short'],
      ['canceled', 'canceled'],
    ] as const
  ).map(
    ([state, name]): Capture => ({
      screen: 'DA-INV-04',
      state: name,
      variant: 'admin',
      reach: (page) => openTransfer(page, state),
    }),
  ),
  ...each(roleVariants, {
    screen: 'DA-INV-04',
    state: 'in-transit',
    reach: (page) => openTransfer(page, 'inTransit'),
  }),
  {
    screen: 'DA-INV-04',
    state: 'in-transit',
    variant: 'admin',
    phone: true,
    reach: (page) => openTransfer(page, 'inTransit'),
  },
  {
    screen: 'DA-INV-04',
    state: 'partially-received',
    variant: 'admin',
    phone: true,
    reach: (page) => openTransfer(page, 'partial'),
  },
  {
    screen: 'DA-INV-04',
    state: 'counted-with-damage',
    variant: 'admin',
    reach: async (page) => {
      await openTransfer(page, 'inTransit')
      await page.getByLabel(/^delivery note$/i).fill('Fidelity van 3')
      await page
        .getByLabel(/^accepted$/i)
        .first()
        .fill('11')
      await page
        .getByLabel(/^rejected$/i)
        .first()
        .fill('1')
      await optionIn(page, page.getByLabel(/^reason$/i), /^damaged$/i)
    },
  },
  {
    screen: 'DA-INV-04',
    state: 'deliveries',
    variant: 'admin',
    reach: async (page) => {
      await openTransfer(page, 'received')
      await toMiddle(page.getByText('Deliveries', { exact: true }))
    },
  },
  {
    screen: 'DA-INV-04',
    state: 'cancel-in-flight',
    variant: 'admin',
    reach: async (page) => {
      await openTransfer(page, 'inTransit')
      await moreActions(page).click()
      await page.getByRole('menuitem', { name: /cancel transfer/i }).click()
      await expect(page.getByText(/what happened to them\?/i)).toBeVisible()
    },
  },
  {
    screen: 'DA-INV-04',
    state: 'close-short',
    variant: 'admin',
    reach: async (page) => {
      await openTransfer(page, 'partial')
      await moreActions(page).click()
      await page.getByRole('menuitem', { name: /close short/i }).click()
      await expect(
        page.getByRole('heading', { name: /close this transfer short\?/i }),
      ).toBeVisible()
    },
  },
  {
    screen: 'DA-INV-04',
    state: 'load-failed',
    variant: 'admin',
    intercepted: 'The transfer request is answered with a server error',
    reach: async (page) => {
      await failRead(page, /\/api\/v3\/admin\/stock_transfers\/[^/]+$/)
      await openStore(page, transferPath('draft'))
      await expect(page.getByText(/this transfer could not be loaded/i)).toBeVisible({
        timeout: 30_000,
      })
    },
  },
  directVisit('DA-INV-04', () => transferPath('inTransit')),

  {
    screen: 'DA-INV-05',
    state: 'draft',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, `${transferPath('draft')}/edit`)
      await expect(
        page.getByRole('heading', {
          name: new RegExp(`edit transfer ${records.transferNumbers.draft}`, 'i'),
        }),
      ).toBeVisible({ timeout: 15_000 })
      await page.locator('#reference').fill('Fidelity transfer draft, corrected')
    },
  },
  {
    screen: 'DA-INV-05',
    state: 'shipped',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, `${transferPath('inTransit')}/edit`)
      await page.waitForTimeout(500)
    },
  },
]

// DA-INV-06 to DA-INV-09 Purchase orders

const ordersPath = '/purchase-orders'
const orderPath = (state: OrderState) => `${ordersPath}/${records.orderIds[state]}`

const openOrders = async (page: Page) => {
  await openStore(page, ordersPath)
  await expect(page.getByText(records.orderNumbers.draft)).toBeVisible({ timeout: 15_000 })
}

const openOrder = async (page: Page, state: OrderState) => {
  await openStore(page, orderPath(state))
  await expect(page.getByRole('heading', { name: records.orderNumbers[state] })).toBeVisible({
    timeout: 15_000,
  })
}

const orderCaptures: Capture[] = [
  ...each(['admin', 'stockViewer', 'purchaser'], {
    screen: 'DA-INV-06',
    state: 'listed',
    reach: openOrders,
  }),
  {
    screen: 'DA-INV-06',
    state: 'filtered-status',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await page.getByRole('button', { name: /^status/i }).click()
      await page.getByRole('menuitemcheckbox', { name: /^ordered$/i }).click()
      await page.keyboard.press('Escape')
      await page.waitForLoadState('networkidle')
    },
  },
  {
    screen: 'DA-INV-06',
    state: 'filtered-supplier',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await page.getByRole('button', { name: /^supplier/i }).click()
      await page.getByRole('menuitemcheckbox', { name: supplierNames.kilnworks }).click()
      await page.keyboard.press('Escape')
      await page.waitForLoadState('networkidle')
    },
  },
  {
    screen: 'DA-INV-06',
    state: 'filtered-overdue',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await page.getByRole('button', { name: /^overdue/i }).click()
      await page.getByRole('menuitemcheckbox', { name: /^overdue$/i }).click()
      await page.keyboard.press('Escape')
      await page.waitForLoadState('networkidle')
    },
  },
  {
    screen: 'DA-INV-06',
    state: 'import-dialog',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await page.getByRole('button', { name: /^import/i }).click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-INV-06',
    state: 'none',
    variant: 'admin',
    intercepted: "The purchase orders list is answered with the server's own response, emptied",
    reach: async (page) => {
      await emptied(page, 'purchase_orders')
      await openStore(page, ordersPath)
      await expect(page.getByText(/no purchase orders yet/i)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-INV-06',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The purchase orders request is held open',
    loading: true,
    reach: async (page) => {
      await holdList(page, 'purchase_orders')
      await page.goto(`/${seeded.storeId}${ordersPath}`)
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-INV-06',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openOrders(page)
      await openRowMenu(page, records.orderNumbers.draft)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(
        page.getByRole('heading', { name: /delete this purchase order\?/i }),
      ).toBeVisible()
    },
  },
  directVisit('DA-INV-06', () => ordersPath, 'merchandiser'),
  directVisit('DA-INV-06', () => ordersPath),

  ...each(['admin', 'purchaser'], {
    screen: 'DA-INV-07',
    state: 'empty',
    reach: async (page) => {
      await openStore(page, `${ordersPath}/new`)
      await expect(page.getByRole('heading', { name: /new purchase order/i })).toBeVisible({
        timeout: 15_000,
      })
    },
  }),
  {
    screen: 'DA-INV-07',
    state: 'supplier-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, `${ordersPath}/new`)
      await page.locator('#supplier').click()
      await page
        .getByText(/^new supplier$/i)
        .last()
        .click()
      await expect(page.getByRole('heading', { name: /^new supplier$/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-INV-07',
    state: 'lines-with-costs',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, `${ordersPath}/new`)
      await page.locator('#supplier').fill(supplierNames.kilnworks)
      await page.getByRole('option', { name: supplierNames.kilnworks }).click()
      await optionIn(page, page.locator('#destination'), locationNames.destination)
      await page
        .getByRole('button', { name: /add a product/i })
        .first()
        .click()
      const picker = dialog(page)
      await picker.getByRole('searchbox').fill('Fidelity')
      await picker.getByRole('button', { name: new RegExp(productNames.mug) }).click()
      await picker.getByRole('button', { name: new RegExp(productNames.tote) }).click()
      await picker.getByRole('button', { name: /^add 2$/i }).click()
      await page
        .getByRole('spinbutton', { name: /^ordered$/i })
        .first()
        .fill('24')
      await page
        .getByLabel(/^unit cost$/i)
        .first()
        .fill('6.50')
    },
  },
  {
    screen: 'DA-INV-07',
    state: 'save-refused',
    variant: 'admin',
    intercepted: 'The create request is answered with a refusal naming the supplier',
    reach: async (page) => {
      await refuseWrite(page, /\/purchase_orders$/, 'POST', 'supplier_id')
      await openStore(page, `${ordersPath}/new`)
      await page.locator('#supplier').fill(supplierNames.kilnworks)
      await page.getByRole('option', { name: supplierNames.kilnworks }).click()
      await optionIn(page, page.locator('#destination'), locationNames.destination)
      await page.getByRole('button', { name: /create draft/i }).click()
      await page.waitForTimeout(500)
    },
  },
  {
    screen: 'DA-INV-07',
    state: 'prefilled',
    variant: 'admin',
    reach: async (page) => {
      await openInventory(page, productNames.mug)
      await mugRow(page)
        .getByRole('button', { name: /add incoming stock/i })
        .click()
      await page.getByRole('link', { name: /create purchase order/i }).click()
      await expect(page.getByRole('heading', { name: /new purchase order/i })).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  directVisit('DA-INV-07', () => `${ordersPath}/new`, 'merchandiser'),
  directVisit('DA-INV-07', () => `${ordersPath}/new`, 'stockViewer'),

  ...(
    [
      ['draft', 'draft'],
      ['ordered', 'ordered'],
      ['late', 'overdue'],
      ['partial', 'partially-received'],
      ['received', 'received'],
      ['over', 'over-received'],
      ['closedShort', 'closed-short'],
      ['canceled', 'canceled'],
    ] as const
  ).map(
    ([state, name]): Capture => ({
      screen: 'DA-INV-08',
      state: name,
      variant: 'admin',
      reach: (page) => openOrder(page, state),
    }),
  ),
  ...each(['stockViewer', 'purchaser'], {
    screen: 'DA-INV-08',
    state: 'ordered',
    reach: (page) => openOrder(page, 'ordered'),
  }),
  {
    screen: 'DA-INV-08',
    state: 'partially-received',
    variant: 'admin',
    phone: true,
    reach: (page) => openOrder(page, 'partial'),
  },
  {
    screen: 'DA-INV-08',
    state: 'place-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'draft')
      await page.getByRole('button', { name: /mark as ordered/i }).click()
      await expect(page.getByRole('heading', { name: /place this order\?/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-INV-08',
    state: 'cancel-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'ordered')
      await moreActions(page).click()
      await page.getByRole('menuitem', { name: /cancel order/i }).click()
      await expect(
        page.getByRole('heading', { name: /cancel this purchase order\?/i }),
      ).toBeVisible()
    },
  },
  {
    screen: 'DA-INV-08',
    state: 'close-short',
    variant: 'admin',
    reach: async (page) => {
      await openOrder(page, 'partial')
      await moreActions(page).click()
      await page.getByRole('menuitem', { name: /close short/i }).click()
      await expect(page.getByRole('heading', { name: /close this order short\?/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-INV-08',
    state: 'load-failed',
    variant: 'admin',
    intercepted: 'The purchase order request is answered with a server error',
    reach: async (page) => {
      await failRead(page, /\/api\/v3\/admin\/purchase_orders\/[^/]+$/)
      await openStore(page, orderPath('draft'))
      await expect(page.getByText(/this purchase order could not be loaded/i)).toBeVisible({
        timeout: 30_000,
      })
    },
  },
  directVisit('DA-INV-08', () => orderPath('ordered'), 'merchandiser'),

  {
    screen: 'DA-INV-09',
    state: 'draft',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, `${orderPath('draft')}/edit`)
      await expect(
        page.getByRole('heading', {
          name: new RegExp(`edit order ${records.orderNumbers.draft}`, 'i'),
        }),
      ).toBeVisible({ timeout: 15_000 })
      await page.locator('#reference').fill('Fidelity order draft, corrected')
    },
  },
  {
    screen: 'DA-INV-09',
    state: 'cost-missing',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, `${orderPath('draft')}/edit`)
      await expect(page.getByLabel(/^unit cost$/i).first()).toBeVisible({ timeout: 15_000 })
      await page
        .getByLabel(/^unit cost$/i)
        .first()
        .fill('')
    },
  },
  {
    screen: 'DA-INV-09',
    state: 'placed',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, `${orderPath('ordered')}/edit`)
      await page.waitForTimeout(500)
    },
  },
]

// DA-INV-10 Suppliers

const suppliersPath = '/suppliers'

const openSuppliers = async (page: Page) => {
  await openStore(page, suppliersPath)
  await expect(rowButton(page, supplierNames.harbor)).toBeVisible({ timeout: 15_000 })
}

const supplierCaptures: Capture[] = [
  ...each(['admin', 'stockViewer', 'purchaser'], {
    screen: 'DA-INV-10',
    state: 'listed',
    reach: openSuppliers,
  }),
  {
    screen: 'DA-INV-10',
    state: 'none',
    variant: 'admin',
    intercepted: "The suppliers list is answered with the server's own response, emptied",
    reach: async (page) => {
      await emptied(page, 'suppliers')
      await openStore(page, suppliersPath)
      await expect(page.getByText(/no suppliers yet/i)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-INV-10',
    state: 'add-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openSuppliers(page)
      await page.getByRole('button', { name: /new supplier/i }).click()
      await expect(page.getByRole('heading', { name: /^new supplier$/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-INV-10',
    state: 'name-required',
    variant: 'admin',
    reach: async (page) => {
      await openSuppliers(page)
      await page.getByRole('button', { name: /new supplier/i }).click()
      await dialog(page)
        .getByRole('button', { name: /^save$/i })
        .click()
      await expect(page.getByText(/a supplier needs a name/i)).toBeVisible()
    },
  },
  {
    screen: 'DA-INV-10',
    state: 'name-taken',
    variant: 'admin',
    reach: async (page) => {
      // The server's own refusal: names are unique within a store.
      await openSuppliers(page)
      await page.getByRole('button', { name: /new supplier/i }).click()
      await page.locator('#supplier-name').fill(supplierNames.kilnworks)
      await dialog(page)
        .getByRole('button', { name: /^save$/i })
        .click()
      await expect(page.getByText(/already been taken/).first()).toBeAttached({ timeout: 15_000 })
    },
  },
  ...each(['admin', 'stockViewer', 'purchaser'], {
    screen: 'DA-INV-10',
    state: 'edit',
    reach: async (page) => {
      await openSuppliers(page)
      await rowButton(page, supplierNames.kilnworks).click()
      await expect(page.locator('#supplier-name')).toHaveValue(supplierNames.kilnworks, {
        timeout: 15_000,
      })
    },
  }),
  {
    screen: 'DA-INV-10',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openSuppliers(page)
      await openRowMenu(page, supplierNames.harbor)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByRole('heading', { name: /delete this supplier\?/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-INV-10',
    state: 'with-history-menu',
    variant: 'admin',
    reach: async (page) => {
      await openSuppliers(page)
      await openRowMenu(page, supplierNames.kilnworks)
      await expect(page.getByRole('menu')).toBeVisible()
    },
  },
  directVisit('DA-INV-10', () => suppliersPath, 'merchandiser'),
  directVisit('DA-INV-10', () => suppliersPath),
]

test.beforeAll(async ({ baseURL }) => {
  const url = baseURL ?? 'http://localhost:5174'
  seeded = await seed(url)
  records = await seedInventory(url)
})

test.use({ viewport: { width: 1280, height: 960 } })
// A state that is not reached fails in a minute rather than three.
test.describe.configure({ timeout: 60_000 })

async function blockOutside(page: Page): Promise<string[]> {
  const outside: string[] = []
  await page.context().route(
    (url) =>
      !['data:', 'blob:'].includes(url.protocol) &&
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
  await page.screenshot({ path: `${folder}${name}.png` })
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
        path: new URL(page.url()).pathname.replace(seeded.storeId, '<store>'),
        viewport: page.viewportSize(),
        intercepted: item.intercepted ?? null,
        settled,
        outside,
      },
      null,
      2,
    ),
  )
}

const only = process.env.FIDELITY_SCREENS?.split(',')

for (const theme of ['light', 'dark'] as const) {
  for (const item of [
    ...locationCaptures,
    ...inventoryCaptures,
    ...transferCaptures,
    ...orderCaptures,
    ...supplierCaptures,
  ]) {
    if (only && !only.includes(item.screen)) continue
    const label = `${item.screen} ${item.state} ${item.variant}${item.phone ? ' phone' : ''} ${theme}`
    test(label, async ({ page }) => {
      if (item.phone) await page.setViewportSize(phone)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      await signIn(page, item.variant)
      await item.reach(page)
      const settled = item.loading ? null : await settle(page)
      await page.waitForTimeout(400)
      await save(page, item, theme, settled, outside)
    })
  }
}
