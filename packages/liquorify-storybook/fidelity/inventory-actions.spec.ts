import { readFileSync } from 'node:fs'
import { expect, type Page, type Route, test } from '@playwright/test'
import { getCredentials, login, openRowMenu } from '../../dashboard/e2e/helpers'
import { locationNames } from './inventory'
import {
  answeredEmpty,
  blockOutside,
  expectFailureWhenSabotaged,
  onTop,
  openIn,
  recorder,
  reload,
  type Seed,
  type Steps,
  sabotage,
  sabotaged,
  seeded,
  stamp,
  toast,
  withBody,
} from './p9'

/**
 * The platform batch's step P11, part 1, G-87: the inventory actions batch 6
 * captured but no browser test drives, as browser tests (actions 1.1 to 1.12
 * of the work item). Each drives the dashboard as the browser tests' admin and
 * asserts what the screen shows and, after a reload, what was kept.
 *
 * Start Spree's browser-test server and the built dashboard as
 * `compare.spec.ts` describes. Each test first adds the records it starts
 * from through the Admin API, named with the run's stamp: its own products,
 * stocked where it needs them, and its own locations, suppliers, transfers
 * and purchase orders. Transfers and purchase orders use the browser tests'
 * two warehouses. Nothing is written to the database directly, and no shared
 * setting is changed. With `P11_SABOTAGE=1` each test undoes the change it
 * looks for (see p9.ts).
 *
 * Two tests check behaviours that are known not to work. 1.9 checks that a
 * refused supplier name is shown where the merchant can read it, which batch 6
 * recorded as B5 (held for the owner); 1.11 checks the purchase order list's
 * Overdue and Past cancel-by filters and columns, which fail on SD-23. Their
 * other checks run first, and each part is recorded, so the failure shows only
 * what does not work.
 */

const { snap, save } = recorder('inventory', 'p11')

const named = (name: string) => `P11 ${name} ${stamp}`
const skuOf = (name: string) => `P11-${name.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${stamp}`

let storeId = ''

test.beforeAll(() => {
  storeId = getCredentials().store_id
})

test.beforeEach(async ({ page }) => {
  test.setTimeout(180_000)
  await login(page)
})

// --- Records each test starts from -----------------------------------------

interface Product {
  name: string
  sku: string
  productId: string
  variantId: string
}

async function locationIds(seed: Seed) {
  const { data } = await seed.get<{ data: { id: string; name: string }[] }>(
    'stock_locations?limit=100',
  )
  const idOf = (name: string) => {
    const found = data.find((location) => location.name === name)
    expect(found, `the ${name} location`).toBeTruthy()
    return found?.id as string
  }
  return { source: idOf(locationNames.source), destination: idOf(locationNames.destination) }
}

/** A product of one variant with its own SKU, stocked at these locations. */
async function stockedProduct(
  seed: Seed,
  label: string,
  levels: { locationId: string; count: number; backorderable?: boolean }[],
): Promise<Product> {
  const name = named(label)
  const sku = skuOf(label)
  const created = await seed.post<{ id: string; default_variant_id: string }>('products', {
    name,
    status: 'active',
    prices: [{ amount: '15.00', currency: 'USD' }],
  })
  await seed.patch(`products/${created.id}/variants/${created.default_variant_id}`, { sku })
  if (levels.length > 0) {
    await seed.post('stock_levels/bulk_upsert', {
      stock_levels: levels.map((level) => ({
        variant_id: created.default_variant_id,
        stock_location_id: level.locationId,
        count_on_hand: level.count,
        backorderable: level.backorderable ?? false,
      })),
    })
  }
  return { name, sku, productId: created.id, variantId: created.default_variant_id }
}

async function supplier(seed: Seed, label: string) {
  const name = named(label)
  const created = await seed.post<{ id: string }>('suppliers', { name })
  return { id: created.id, name }
}

interface Document {
  id: string
  number: string
  items: { id: string; variant_id?: string }[]
}

async function transfer(
  seed: Seed,
  label: string,
  lines: { product: Product; quantity: number }[],
  then: 'draft' | 'ready' | 'inTransit',
) {
  const locations = await locationIds(seed)
  const created = await seed.post<Document>('stock_transfers?expand=items', {
    source_location_id: locations.source,
    destination_location_id: locations.destination,
    reference: named(label),
    items: lines.map((line) => ({
      variant_id: line.product.variantId,
      quantity_shipped: line.quantity,
    })),
  })
  if (then === 'ready') await seed.patch(`stock_transfers/${created.id}/mark_ready`)
  if (then === 'inTransit') await seed.patch(`stock_transfers/${created.id}/mark_in_transit`)
  return created
}

async function purchaseOrder(
  seed: Seed,
  label: string,
  supplierId: string,
  lines: { product: Product; quantity: number }[],
  options: { place?: boolean; expectedAt?: string; cancelBy?: string } = {},
) {
  const locations = await locationIds(seed)
  const created = await seed.post<Document>('purchase_orders?expand=items', {
    supplier_id: supplierId,
    destination_location_id: locations.destination,
    currency: 'USD',
    reference: named(label),
    expected_at: options.expectedAt,
    cancel_by: options.cancelBy,
    items: lines.map((line) => ({
      variant_id: line.product.variantId,
      quantity_ordered: line.quantity,
      unit_cost: '4.50',
    })),
  })
  if (options.place) await seed.patch(`purchase_orders/${created.id}/mark_ordered`)
  return created
}

// --- Reading the screens ---------------------------------------------------

/** The inventory list, searched for one product. */
async function openInventory(page: Page, search: string) {
  await openIn(page, storeId, `/inventory?search=${encodeURIComponent(search)}`)
  await expect(page.getByRole('heading', { name: /^inventory$/i })).toBeVisible({
    timeout: 15_000,
  })
}

const inventoryRow = (page: Page, product: string, location: string) =>
  page.getByRole('row').filter({ hasText: product }).filter({ hasText: location })

/** The on-hand count a row of the inventory list shows. */
async function onHand(page: Page, product: string, location: string) {
  const cell = inventoryRow(page, product, location).getByRole('button', {
    name: /edit on-hand count/i,
  })
  await expect(cell).toBeVisible({ timeout: 15_000 })
  return Number.parseInt((await cell.innerText()).trim(), 10)
}

async function openTransfer(page: Page, document: Document) {
  await openIn(page, storeId, `/transfers/${document.id}`)
  await expect(page.getByRole('heading', { name: document.number })).toBeVisible({
    timeout: 15_000,
  })
}

async function openPurchaseOrder(page: Page, document: Document) {
  await openIn(page, storeId, `/purchase-orders/${document.id}`)
  await expect(page.getByRole('heading', { name: document.number })).toBeVisible({
    timeout: 15_000,
  })
}

/** The status badge in a document page's header. */
const headerStatus = (page: Page) => page.locator('[data-slot="status-badge"]').first()

async function statusOf(page: Page) {
  const badge = headerStatus(page)
  await expect(badge).toBeVisible({ timeout: 15_000 })
  return ((await badge.textContent()) ?? '').trim()
}

/** Fills the receive card's Accepted cells, line by line, and books the delivery. */
async function receive(page: Page, accepted: number[]) {
  const cells = page.getByLabel(/^accepted$/i)
  await expect(cells.first()).toBeVisible({ timeout: 15_000 })
  for (const [index, quantity] of accepted.entries()) await cells.nth(index).fill(String(quantity))
  await page.getByRole('button', { name: /^receive$/i }).click()
}

/** Sends a stock receipt with each line's accepted quantity changed by `edit`. */
const receiptEdited = (edit: (accepted: number) => number) =>
  withBody((body) => ({
    ...body,
    items: ((body.items as Record<string, unknown>[]) ?? []).map((item) => ({
      ...item,
      quantity_accepted: edit(Number(item.quantity_accepted)),
    })),
  }))

/** Sends a list request with its search and filters left out, so it lists everything. */
const unfiltered = (route: Route) => {
  const url = new URL(route.request().url())
  for (const key of [...url.searchParams.keys()])
    if (/search|q\[|filter/i.test(key)) url.searchParams.delete(key)
  return route.continue({ url: url.toString() })
}

/** A location's sheet on the stock locations page. */
async function openLocation(page: Page, id: string, name: string) {
  await openIn(page, storeId, `/settings/stock-locations?edit=${id}`)
  await expect(page.locator('#name')).toHaveValue(name, { timeout: 15_000 })
}

const stockPanel = (page: Page) =>
  page
    .getByRole('dialog')
    .getByText('Stock at this location', { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "rounded-md")][1]')

/** Opens a product's group in the stock levels panel, if it is closed. */
async function openGroup(page: Page, product: Product) {
  const input = stockPanel(page).getByLabel(`On hand for ${product.sku}`)
  if (!(await input.isVisible())) {
    await stockPanel(page).getByText(product.name, { exact: true }).click()
  }
  await expect(input).toBeVisible({ timeout: 15_000 })
  return input
}

async function newLocation(seed: Seed, label: string) {
  const name = named(label)
  const created = await seed.post<{ id: string }>('stock_locations', {
    name,
    country_code: 'US',
  })
  return { id: created.id, name }
}

// --- 1.1 and 1.2: the inventory list after stock arrives --------------------

test.describe('the inventory list after stock arrives (P11, G-87)', () => {
  test('1.1 receiving a transfer, then opening the inventory list', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'POST',
      /\/stock_transfers\/[^/]+\/stock_receipts$/,
      receiptEdited(() => 1),
    )
    const { product, document } = await seeded(baseURL, async (seed) => {
      const locations = await locationIds(seed)
      const product = await stockedProduct(seed, 'Transfer mug', [
        { locationId: locations.source, count: 20 },
        { locationId: locations.destination, count: 0 },
      ])
      const document = await transfer(
        seed,
        'transfer to receive',
        [{ product, quantity: 6 }],
        'inTransit',
      )
      return { product, document }
    })

    await openInventory(page, product.sku)
    const before = {
      source: await onHand(page, product.name, locationNames.source),
      destination: await onHand(page, product.name, locationNames.destination),
    }
    const steps: Steps = [
      { step: 'opened the inventory list after the transfer was sent', ...before },
    ]

    await openTransfer(page, document)
    await receive(page, [6])
    await expect(page.getByText('6 received of 6 shipped')).toBeVisible({ timeout: 15_000 })
    steps.push({ step: 'received the 6 units on the transfer page', status: await statusOf(page) })

    await openInventory(page, product.sku)
    await reload(page)
    const after = {
      source: await onHand(page, product.name, locationNames.source),
      destination: await onHand(page, product.name, locationNames.destination),
    }
    steps.push({ step: 'opened the inventory list and reloaded', ...after })
    expect(before).toEqual({ source: 14, destination: 0 })
    expect(after).toEqual({ source: 14, destination: 6 })
    await save(page, 'inventory-after-transfer', steps, outside)
  })

  test("1.2 receiving a purchase order's delivery, then opening the inventory list", async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'POST',
      /\/purchase_orders\/[^/]+\/stock_receipts$/,
      receiptEdited(() => 1),
    )
    const { products, document } = await seeded(baseURL, async (seed) => {
      const locations = await locationIds(seed)
      const products = [
        await stockedProduct(seed, 'PO jug', [{ locationId: locations.destination, count: 2 }]),
        await stockedProduct(seed, 'PO bowl', [{ locationId: locations.destination, count: 0 }]),
      ]
      const from = await supplier(seed, 'Receiving supplier')
      const document = await purchaseOrder(
        seed,
        'order to receive',
        from.id,
        [
          { product: products[0], quantity: 10 },
          { product: products[1], quantity: 4 },
        ],
        { place: true },
      )
      return { products, document }
    })

    await openPurchaseOrder(page, document)
    await receive(page, [10, 4])
    await expect(page.getByText('14 received of 14 ordered')).toBeVisible({ timeout: 15_000 })
    const steps: Steps = [{ step: 'received both lines in full', status: await statusOf(page) }]

    const counts: Record<string, number> = {}
    for (const product of products) {
      await openInventory(page, product.sku)
      await reload(page)
      counts[product.name] = await onHand(page, product.name, locationNames.destination)
    }
    steps.push({ step: 'opened the inventory list for each line and reloaded', counts })
    expect(counts).toEqual({ [products[0].name]: 12, [products[1].name]: 4 })
    await save(page, 'inventory-after-purchase-order', steps, outside)
  })
})

// --- 1.3 to 1.5: a location's sheet ----------------------------------------

test.describe("a location's stock levels and history (P11, G-87)", () => {
  test("1.3 correcting a row's on-hand count and backorder setting", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /^\/api\/v3\/admin\/stock_levels\/[^/]+$/, answeredEmpty)
    const { location, product } = await seeded(baseURL, async (seed) => {
      const location = await newLocation(seed, 'Corrected location')
      const product = await stockedProduct(seed, 'Corrected tumbler', [
        { locationId: location.id, count: 5, backorderable: false },
      ])
      return { location, product }
    })

    await openLocation(page, location.id, location.name)
    const count = await openGroup(page, product)
    const backorder = stockPanel(page).getByLabel(`Backorderable for ${product.sku}`)
    await expect(count).toHaveValue('5')
    await expect(backorder).not.toBeChecked()
    await count.fill('17')
    await backorder.click()
    await count
      .locator('xpath=ancestor::tr[1]')
      .getByRole('button', { name: /^save$/i })
      .click()
    await page.waitForLoadState('networkidle')
    const steps: Steps = [{ step: 'set on hand from 5 to 17, turned backorders on, saved the row' }]

    await reload(page)
    await expect(page.locator('#name')).toHaveValue(location.name, { timeout: 15_000 })
    const kept = await openGroup(page, product)
    const shown = {
      onHand: await kept.inputValue(),
      backorderable: await stockPanel(page)
        .getByLabel(`Backorderable for ${product.sku}`)
        .isChecked(),
    }
    steps.push({ step: 'reloaded the sheet', ...shown })
    await snap(page, 'stock-level-corrected-sheet')
    expect(shown).toEqual({ onHand: '17', backorderable: true })

    await openInventory(page, product.sku)
    const listed = await onHand(page, product.name, location.name)
    steps.push({ step: 'opened the inventory list', onHand: listed })
    expect(listed).toBe(17)
    await save(page, 'stock-level-corrected', steps, outside)
  })

  test('1.4 searching the stock levels panel', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    if (sabotaged)
      await page.route((url) => url.pathname === '/api/v3/admin/stock_levels', unfiltered)
    const { location, found, missed } = await seeded(baseURL, async (seed) => {
      const location = await newLocation(seed, 'Searched location')
      const found = await stockedProduct(seed, 'Juniper carafe', [
        { locationId: location.id, count: 3 },
      ])
      const missed = await stockedProduct(seed, 'Rowan carafe', [
        { locationId: location.id, count: 4 },
      ])
      return { location, found, missed }
    })

    await openLocation(page, location.id, location.name)
    const panel = stockPanel(page)
    await expect(panel.getByText(found.name, { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(panel.getByText(missed.name, { exact: true })).toBeVisible()
    const search = panel.getByPlaceholder(/search sku or product/i)

    await search.fill(`Juniper carafe ${stamp}`)
    // The panel shows "Loading…" while it asks again, so the result is read once the answer is in.
    await page.waitForLoadState('networkidle')
    await expect(panel.getByText(found.name, { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(panel.getByText(missed.name, { exact: true })).toHaveCount(0)
    const steps: Steps = [{ step: 'searched for one product', shows: found.name }]
    await snap(page, 'stock-levels-search-found')

    await search.fill(`P11 no such product ${stamp}`)
    await expect(panel.getByText(/no stock levels match your search/i)).toBeVisible({
      timeout: 15_000,
    })
    await expect(panel.getByText(found.name, { exact: true })).toHaveCount(0)
    steps.push({
      step: 'searched for nothing the location holds',
      shows: 'No stock levels match your search.',
    })
    await snap(page, 'stock-levels-search-no-match')

    await search.fill('')
    await expect(panel.getByText(found.name, { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(panel.getByText(missed.name, { exact: true })).toBeVisible()
    steps.push({ step: 'cleared the search', shows: [found.name, missed.name] })
    await save(page, 'stock-levels-search', steps, outside)
  })

  test("1.5 a location's stock history after a stock change there", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    if (sabotaged) {
      await page.route(
        (url) => url.pathname === '/api/v3/admin/stock_movements',
        async (route) => {
          const response = await route.fetch()
          const body = await response.json()
          await route.fulfill({ response, json: { ...body, data: [] } })
        },
      )
    }
    const { location, product } = await seeded(baseURL, async (seed) => {
      const location = await newLocation(seed, 'History location')
      const product = await stockedProduct(seed, 'History decanter', [
        { locationId: location.id, count: 5 },
      ])
      return { location, product }
    })

    // The stock change: seven more counted in, from the inventory list.
    await openInventory(page, product.sku)
    const cell = inventoryRow(page, product.name, location.name).getByRole('button', {
      name: /edit on-hand count/i,
    })
    await expect(cell).toHaveText('5', { timeout: 15_000 })
    await cell.click()
    await page.getByLabel(/how to change the count/i).click()
    await page.getByRole('option', { name: /adjust by/i }).click()
    await page.getByLabel(/^amount$/i).fill('7')
    await page.getByLabel(/^reason$/i).click()
    await page.getByRole('option', { name: /^count$/i }).click()
    await page.getByRole('button', { name: /^apply$/i }).click()
    await expect(cell).toHaveText('12', { timeout: 15_000 })
    const steps: Steps = [{ step: 'adjusted the count by +7, reason Count, on the inventory list' }]

    await openLocation(page, location.id, location.name)
    const history = page
      .getByRole('dialog')
      .getByText('Stock history', { exact: true })
      .locator('xpath=ancestor::*[@data-slot="card"][1]')
    const movement = history
      .getByRole('row')
      .filter({ hasText: product.name })
      .filter({ hasText: '+7' })
    await expect(movement).toBeVisible({ timeout: 15_000 })
    const rows = await history.getByRole('row').filter({ hasText: product.name }).allInnerTexts()
    steps.push({ step: "opened the location's sheet; its stock history", rows })
    await movement.scrollIntoViewIfNeeded()
    await save(page, 'stock-history', steps, outside)
  })
})

// --- 1.6 and 1.7: importing and exporting purchase orders -------------------

test.describe('importing and exporting purchase orders (P11, G-87)', () => {
  test('1.6 importing a purchase order file through the wizard', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    const { products, from } = await seeded(baseURL, async (seed) => ({
      products: [
        await stockedProduct(seed, 'Import glass', []),
        await stockedProduct(seed, 'Import coaster', []),
      ],
      from: await supplier(seed, 'Import supplier'),
    }))
    const references = [named('import order one'), named('import order two')]
    // Sabotaged, the file names other references, so the orders it makes are not the ones looked for.
    const written = references.map((reference) =>
      sabotaged ? reference.replace('import order', 'imported order') : reference,
    )
    const rows = [
      'reference,supplier,destination,sku,quantity,unit_cost,currency',
      `${written[0]},${from.name},${locationNames.destination},${products[0].sku},5,4.50,USD`,
      `${written[0]},${from.name},${locationNames.destination},${products[1].sku},3,1.25,USD`,
      `${written[1]},${from.name},${locationNames.destination},${products[0].sku},8,4.25,USD`,
    ]

    await openIn(page, storeId, '/purchase-orders')
    await page.getByRole('button', { name: /^import/i }).click()
    await expect(page.getByRole('heading', { name: /import from csv/i })).toBeVisible({
      timeout: 15_000,
    })
    await page
      .getByRole('dialog')
      .locator('input[type="file"]')
      .setInputFiles({
        name: `p11-purchase-orders-${stamp}.csv`,
        mimeType: 'text/csv',
        buffer: Buffer.from(`${rows.join('\n')}\n`),
      })
    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByText('Map columns')).toBeVisible({ timeout: 30_000 })
    await snap(page, 'purchase-order-import-mapping')
    await page.getByRole('button', { name: /start import/i }).click()
    await expect(page.getByText(/import completed/i)).toBeVisible({ timeout: 120_000 })
    const summary = await page
      .getByText(/rows imported/i)
      .first()
      .innerText()
    const steps: Steps = [{ step: 'ran a file of 3 rows for 2 orders through the wizard', summary }]
    await snap(page, 'purchase-order-import-completed')
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^close$/i })
      .click()
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 })

    await reload(page)
    const search = page.getByPlaceholder(/search/i).first()
    await search.fill(stamp)
    await page.waitForLoadState('networkidle')
    const listed = page.getByRole('main').getByRole('row').filter({ hasText: from.name })
    await expect(listed).toHaveCount(2, { timeout: 15_000 })
    const units = (await listed.allInnerTexts()).map((text) => text.match(/\b0 \/ \d+\b/)?.[0])
    steps.push({ step: 'reloaded the list and searched for the two references', units })
    expect(units.sort()).toEqual(['0 / 8', '0 / 8'])

    const numbers = (await listed.allInnerTexts()).map(
      (text) => text.match(/\bPO\d+\b/)?.[0] as string,
    )
    const opened: Record<string, number> = {}
    for (const number of numbers) {
      await openIn(page, storeId, `/purchase-orders?search=${number}`)
      await page
        .getByRole('main')
        .getByRole('row')
        .filter({ hasText: number })
        .getByRole('button')
        .first()
        .click()
      await expect(page.getByRole('heading', { name: number })).toBeVisible({ timeout: 15_000 })
      const text = await page.getByRole('main').innerText()
      const which = references.find((each) => text.includes(each)) ?? 'neither reference'
      const lines = await page
        .getByRole('row')
        .filter({ hasText: /P11 Import/ })
        .allInnerTexts()
      const status = await statusOf(page)
      steps.push({ step: `opened ${number}`, reference: which, status, lines })
      expect(status).toBe('Draft')
      opened[which] = lines.length
    }
    expect(opened).toEqual({ [references[0]]: 2, [references[1]]: 1 })
    await save(page, 'purchase-order-import', steps, outside)
  })

  test('1.7 exporting purchase orders', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    const documents = await seeded(baseURL, async (seed) => {
      const locations = await locationIds(seed)
      const product = await stockedProduct(seed, 'Export plate', [
        { locationId: locations.destination, count: 1 },
      ])
      const from = await supplier(seed, 'Export supplier')
      return [
        await purchaseOrder(seed, 'export order one', from.id, [{ product, quantity: 2 }]),
        await purchaseOrder(seed, 'export order two', from.id, [{ product, quantity: 3 }], {
          place: true,
        }),
      ]
    })
    // Sabotaged, the export is asked for with a search nothing matches.
    if (sabotaged) {
      await page.route(
        (url) => url.pathname === '/api/v3/admin/exports',
        (route) =>
          route.request().method() === 'POST'
            ? withBody((body) => ({
                ...body,
                record_selection: 'filtered',
                search_params: { search: 'P11 nothing at all' },
              }))(route)
            : route.fallback(),
      )
    }

    await openIn(page, storeId, '/purchase-orders')
    await expect(page.getByText(documents[1].number)).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /^export$/i }).click()
    const dialog = page.getByRole('dialog')
    const all = dialog.getByRole('radio', { name: /^all records/i })
    if (await all.isVisible()) await all.click()
    await snap(page, 'purchase-order-export-dialog')
    const downloading = page.waitForEvent('download', { timeout: 120_000 })
    await dialog.getByRole('button', { name: /^export$/i }).click()
    const download = await downloading
    await expect(toast(page, 'Export downloaded')).toBeVisible({ timeout: 15_000 })
    const text = readFileSync((await download.path()) as string, 'utf8').replace(/^﻿/, '')
    const lines = text.trim().split('\n')
    const steps: Steps = [
      {
        step: 'exported every purchase order from the list',
        toast: 'Export downloaded',
        header: lines[0],
        lines: lines.length - 1,
      },
    ]
    const ours = lines.filter((line) =>
      documents.some((document) => line.includes(document.number)),
    )
    steps.push({ step: 'read the downloaded file', linesForTheTwoOrders: ours })
    expect(ours.some((line) => line.includes(documents[0].number))).toBe(true)
    expect(ours.some((line) => line.includes(documents[1].number))).toBe(true)
    await save(page, 'purchase-order-export', steps, outside)
  })
})

// --- 1.8 and 1.9: suppliers -----------------------------------------------

const supplierRow = (page: Page, name: string) => page.locator('tr').filter({ hasText: name })

async function openSuppliers(page: Page, search?: string) {
  await openIn(page, storeId, `/suppliers${search ? `?search=${encodeURIComponent(search)}` : ''}`)
  await expect(page.getByRole('button', { name: /new supplier/i })).toBeVisible({ timeout: 15_000 })
}

test.describe('suppliers (P11, G-87)', () => {
  test('1.8 the row menu of a supplier with purchasing history', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    if (sabotaged) {
      await page.route(
        (url) => url.pathname === '/api/v3/admin/suppliers',
        async (route) => {
          const response = await route.fetch()
          const body = (await response.json()) as { data: Record<string, unknown>[] }
          await route.fulfill({
            response,
            json: { ...body, data: body.data.map((row) => ({ ...row, can_be_deleted: true })) },
          })
        },
      )
    }
    const { used, unused } = await seeded(baseURL, async (seed) => {
      const locations = await locationIds(seed)
      const product = await stockedProduct(seed, 'Supplier history cup', [
        { locationId: locations.destination, count: 1 },
      ])
      const used = await supplier(seed, 'Supplier with history')
      await purchaseOrder(seed, 'order naming the supplier', used.id, [{ product, quantity: 1 }])
      const unused = await supplier(seed, 'Supplier without history')
      return { used, unused }
    })

    await openSuppliers(page, stamp)
    await expect(supplierRow(page, unused.name)).toBeVisible({ timeout: 15_000 })
    await openRowMenu(page, unused.name)
    const control = (await page.getByRole('menuitem').allInnerTexts()).map((item) => item.trim())
    await page.keyboard.press('Escape')
    const steps: Steps = [
      { step: 'opened the row menu of a supplier never ordered from', offers: control },
    ]

    await openRowMenu(page, used.name)
    await expect(page.getByRole('menuitem', { name: /^edit$/i })).toBeVisible()
    const offered = (await page.getByRole('menuitem').allInnerTexts()).map((item) => item.trim())
    steps.push({
      step: 'opened the row menu of the supplier with a purchase order',
      offers: offered,
    })
    await snap(page, 'supplier-with-history-menu')
    expect(control).toContain('Delete')
    expect(offered).toContain('Edit')
    expect(offered).not.toContain('Delete')
    await page.keyboard.press('Escape')
    await save(page, 'supplier-with-history', steps, outside)
  })

  test('1.9 saving a supplier with a name already used in the store', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    const taken = await seeded(baseURL, (seed) => supplier(seed, 'Taken supplier name'))
    // Sabotaged, a name nobody has is typed, so nothing is refused.
    const typed = sabotaged ? `${taken.name} unused` : taken.name

    await openSuppliers(page)
    await page.getByRole('button', { name: /new supplier/i }).click()
    await expect(page.getByRole('heading', { name: /^new supplier$/i })).toBeVisible()
    await page.locator('#supplier-name').fill(typed)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^save$/i })
      .click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1_000)
    const sheetOpen = await page.getByRole('heading', { name: /^new supplier$/i }).isVisible()
    const messageText = /already been taken|taken/i
    const messageExists = (await page.getByText(messageText).count()) > 0
    const messageOnTop = messageExists ? await onTop(page, 'taken') : false
    const steps: Steps = [
      {
        step: 'typed a name another supplier has and pressed Save',
        sheetOpen,
        refusalInThePage: messageExists,
        refusalReadable: messageOnTop,
        fieldError: await page.locator('#supplier-name[aria-invalid="true"]').count(),
      },
    ]
    await snap(page, 'supplier-name-taken-refused')

    await openSuppliers(page, taken.name)
    await page.waitForLoadState('networkidle')
    const saved = await page
      .getByRole('main')
      .getByRole('row')
      .filter({ has: page.getByText(taken.name, { exact: true }) })
      .count()
    steps.push({
      step: 'reloaded the suppliers searched for the name',
      suppliersWithTheName: saved,
    })
    await save(page, 'supplier-name-taken', steps, outside)
    expect(saved).toBe(1)
    // Batch 6's B5: the refusal is a toast drawn beneath the open sheet.
    expect(messageOnTop, 'the refusal is shown where the merchant can read it').toBe(true)
  })
})

// --- 1.10 to 1.12: over-received, the late filters, back to draft ----------

test.describe('transfers and purchase orders (P11, G-87)', () => {
  test('1.10 receiving more than was sent, and more than was ordered', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'POST',
      /\/stock_receipts$/,
      receiptEdited((accepted) => accepted - 1),
    )
    const { sent, ordered } = await seeded(baseURL, async (seed) => {
      const locations = await locationIds(seed)
      const product = await stockedProduct(seed, 'Over-received vase', [
        { locationId: locations.source, count: 10 },
      ])
      const from = await supplier(seed, 'Over-receiving supplier')
      return {
        sent: await transfer(
          seed,
          'transfer over-received',
          [{ product, quantity: 4 }],
          'inTransit',
        ),
        ordered: await purchaseOrder(
          seed,
          'order over-received',
          from.id,
          [{ product, quantity: 3 }],
          {
            place: true,
          },
        ),
      }
    })

    await openTransfer(page, sent)
    await receive(page, [5])
    await expect(page.getByText('5 received of 4 shipped')).toBeVisible({ timeout: 15_000 })
    await reload(page)
    const transferStatus = await statusOf(page)
    const steps: Steps = [{ step: 'received 5 of the 4 sent, reloaded', status: transferStatus }]
    await snap(page, 'transfer-over-received')

    await openPurchaseOrder(page, ordered)
    await receive(page, [4])
    await expect(page.getByText('4 received of 3 ordered')).toBeVisible({ timeout: 15_000 })
    await reload(page)
    const orderStatus = await statusOf(page)
    steps.push({ step: 'received 4 of the 3 ordered, reloaded', status: orderStatus })
    expect(transferStatus).toBe('Over-received')
    expect(orderStatus).toBe('Over-received')
    await save(page, 'over-received', steps, outside)
  })

  test("1.11 the purchase order list's Overdue and Past cancel-by filters, and its columns menu", async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    if (sabotaged)
      await page.route((url) => url.pathname === '/api/v3/admin/purchase_orders', unfiltered)
    const { late, onTime, pastCancelBy } = await seeded(baseURL, async (seed) => {
      const locations = await locationIds(seed)
      const product = await stockedProduct(seed, 'Late saucer', [
        { locationId: locations.destination, count: 1 },
      ])
      const from = await supplier(seed, 'Late supplier')
      const line = [{ product, quantity: 2 }]
      return {
        late: await purchaseOrder(seed, 'late order', from.id, line, {
          place: true,
          expectedAt: '2026-10-01',
          cancelBy: '2026-12-31',
        }),
        pastCancelBy: await purchaseOrder(seed, 'order past cancel-by', from.id, line, {
          place: true,
          expectedAt: '2026-09-20',
          cancelBy: '2026-10-05',
        }),
        onTime: await purchaseOrder(seed, 'order on time', from.id, line, {
          place: true,
          expectedAt: '2027-03-01',
          cancelBy: '2027-03-31',
        }),
      }
    })
    // Waits for the table's loading rows to go, which a refused request keeps for its retries.
    const listedNumbers = async () => {
      await page.waitForLoadState('networkidle')
      await expect(page.locator('[data-slot="skeleton"]'))
        .toHaveCount(0, { timeout: 30_000 })
        .catch(() => undefined)
      const text = await page.getByRole('main').innerText()
      return [late, pastCancelBy, onTime]
        .filter((each) => text.includes(each.number))
        .map((each) => each.number)
    }

    await openIn(page, storeId, `/purchase-orders?search=${stamp}`)
    await expect(page.getByText(onTime.number)).toBeVisible({ timeout: 15_000 })
    const steps: Steps = [
      { step: "listed the run's three placed orders", listed: await listedNumbers() },
    ]

    // Overdue: every option starts selected, so On time is cleared.
    await page.getByRole('button', { name: /^overdue/i }).click()
    await page.getByRole('menuitemcheckbox', { name: /^on time$/i }).click()
    await page.keyboard.press('Escape')
    const overdue = await listedNumbers()
    const mainText = await page.getByRole('main').innerText()
    const overdueText = mainText.includes('No purchase orders yet')
      ? 'No purchase orders yet'
      : (await page.locator('[data-slot="skeleton"]').count()) > 0
        ? 'still loading after 30 seconds'
        : null
    steps.push({ step: 'kept only Overdue', listed: overdue, empty: overdueText })
    await snap(page, 'purchase-orders-filtered-overdue')
    expect
      .soft(overdue, 'Overdue lists only the late orders')
      .toEqual([late.number, pastCancelBy.number])

    // Past cancel-by, from the filter panel, the only place it is offered.
    await openIn(page, storeId, `/purchase-orders?search=${stamp}`)
    await expect(page.getByText(onTime.number)).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /^add filter$/i }).click()
    const panelItems = (await page.locator('[data-slot="filter-panel-item"]').allInnerTexts()).map(
      (item) => item.trim(),
    )
    const pastItem = page.locator('[data-slot="filter-panel-item"]', { hasText: /past cancel/i })
    let pastCancel: string[] | null = null
    if ((await pastItem.count()) > 0) {
      await pastItem.first().click()
      // Stage two lists the filter's two values: "Past cancel-by" and "Within cancel-by".
      await page
        .locator('[data-slot="filter-panel-item"]')
        .filter({ hasText: /^past cancel-by$/i })
        .first()
        .click()
      await page.keyboard.press('Escape')
      pastCancel = await listedNumbers()
    } else {
      await page.keyboard.press('Escape')
    }
    steps.push({ step: 'opened Add filter for Past cancel-by', panelItems, listed: pastCancel })
    await snap(page, 'purchase-orders-filtered-past-cancel-by')
    expect
      .soft(pastCancel, 'Past cancel-by lists only the order past its cancel-by date')
      .toEqual([pastCancelBy.number])

    await page.getByRole('button', { name: /^columns$/i }).click()
    const columns = (await page.getByRole('menuitemcheckbox').allInnerTexts()).map((item) =>
      item.trim(),
    )
    steps.push({ step: 'opened the columns menu', columns })
    await snap(page, 'purchase-orders-columns-menu')
    await page.keyboard.press('Escape')
    for (const column of ['Cancel by', 'Overdue', 'Past cancel-by'])
      expect.soft(columns, `the columns menu offers ${column}`).toContain(column)
    await save(page, 'purchase-orders-late-filters', steps, outside)
  })

  test('1.12 taking a transfer and a placed purchase order back to draft', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/mark_draft$/, answeredEmpty)
    const { packed, placed } = await seeded(baseURL, async (seed) => {
      const locations = await locationIds(seed)
      const product = await stockedProduct(seed, 'Back to draft pitcher', [
        { locationId: locations.source, count: 10 },
      ])
      const from = await supplier(seed, 'Back to draft supplier')
      return {
        packed: await transfer(seed, 'transfer back to draft', [{ product, quantity: 2 }], 'ready'),
        placed: await purchaseOrder(
          seed,
          'order back to draft',
          from.id,
          [{ product, quantity: 2 }],
          {
            place: true,
          },
        ),
      }
    })

    await openTransfer(page, packed)
    expect(await statusOf(page)).toBe('Ready to ship')
    await page.getByRole('button', { name: /^back to draft$/i }).click()
    await expect(toast(page, 'Back in draft')).toBeVisible({ timeout: 15_000 })
    await reload(page)
    await expect(page.getByRole('heading', { name: packed.number })).toBeVisible({
      timeout: 15_000,
    })
    const transferAfter = {
      status: await statusOf(page),
      edit: await page.getByRole('link', { name: /^edit$/i }).count(),
    }
    const steps: Steps = [
      { step: 'took the ready transfer back to draft, reloaded', ...transferAfter },
    ]
    await snap(page, 'transfer-back-to-draft')

    await openPurchaseOrder(page, placed)
    expect(await statusOf(page)).toBe('Ordered')
    await page.getByRole('button', { name: /^back to draft$/i }).click()
    await expect(toast(page, 'Back in draft')).toBeVisible({ timeout: 15_000 })
    await reload(page)
    await expect(page.getByRole('heading', { name: placed.number })).toBeVisible({
      timeout: 15_000,
    })
    const orderAfter = {
      status: await statusOf(page),
      edit: await page.getByRole('link', { name: /^edit$/i }).count(),
    }
    steps.push({
      step: 'took the placed order back to draft before anything arrived, reloaded',
      ...orderAfter,
    })
    expect(transferAfter).toEqual({ status: 'Draft', edit: 1 })
    expect(orderAfter).toEqual({ status: 'Draft', edit: 1 })
    await save(page, 'back-to-draft', steps, outside)
  })
})
