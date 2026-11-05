import { readFileSync } from 'node:fs'
import {
  type APIRequestContext,
  type Download,
  expect,
  type Locator,
  type Page,
  type Route,
  request,
  test,
} from '@playwright/test'
import { getCredentials, login } from '../../dashboard/e2e/helpers'
import { fixture, translateProduct, upload } from './catalog'
import {
  answeredEmpty,
  blockOutside,
  expectFailureWhenSabotaged,
  type Headers,
  json,
  openIn,
  recorder,
  reload,
  type Steps,
  sabotage,
  sabotaged,
  stamp,
  withBody,
} from './p9'
import { admin } from './staff'

/**
 * The platform batch's step P9, G-61: the catalog actions part 2 of the
 * catalog and pricing batch captured but no browser test drives, as browser
 * tests: categories, collections, catalogs, translations, price lists and the
 * imports page. Each drives the dashboard as the browser tests' admin and
 * asserts what the screen shows and, after a reload, what was kept. A search
 * keeps or clears its words on a reload, and a download is checked against the
 * file the server holds after the reload.
 *
 * Start Spree's browser-test server and the built dashboard as
 * `compare.spec.ts` describes; Spree's sample catalog is not needed. The
 * categories' and collections' tests open records each worker adds first; the
 * others add their own as they start, since an import takes seconds. All are
 * added through the Admin API and named with the run's stamp. Nothing is
 * written to the database directly. With
 * `P9_SABOTAGE=1` each test undoes the change it looks for (see p9.ts).
 */

const { snap, save } = recorder('catalog')

const named = (name: string) => `P9 ${name} ${stamp}`

const names = {
  parent: named('Parent'),
  child: named('Child'),
  pictured: named('Pictured category'),
  doomed: named('Doomed category'),
  ordered: named('Ordered category'),
  searchFound: named('Juniper category'),
  searchMissed: named('Rowan category'),
  products: [named('Alder'), named('Birch'), named('Cedar')],
  collectionPictured: named('Pictured collection'),
  collectionFound: named('Juniper collection'),
  collectionMissed: named('Rowan collection'),
  collectionManual: named('Hand-picked collection'),
  collectionAutomatic: named('Rule-made collection'),
}

let ids: {
  store: string
  parent: string
  child: string
  pictured: string
  doomed: string
  ordered: string
  products: string[]
  collectionPictured: string
}

test.beforeAll(async ({ baseURL }) => {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const post = <T>(path: string, data: object) =>
      api.post(`/api/v3/admin/${path}`, { headers, data }).then((res) => json<T>(res))
    const category = async (name: string) => (await post<{ id: string }>('categories', { name })).id
    const product = async (name: string) =>
      (
        await post<{ id: string }>('products', {
          name,
          status: 'active',
          prices: [{ amount: '12.00', currency: 'USD' }],
        })
      ).id

    const products = []
    for (const name of names.products) products.push(await product(name))
    const ordered = await category(names.ordered)
    await post(`categories/${ordered}/products`, { product_ids: products })
    await category(names.searchFound)
    await category(names.searchMissed)
    const collection = async (name: string, data: object = {}) =>
      (await post<{ id: string }>('collections', { name, ...data })).id
    await collection(names.collectionFound)
    await collection(names.collectionMissed)
    await collection(names.collectionManual)
    await collection(names.collectionAutomatic, {
      automatic: true,
      rules: [{ type: 'tag', match_policy: 'contains', value: `p9-${stamp}` }],
    })
    ids = {
      store: getCredentials().store_id,
      parent: await category(names.parent),
      child: await category(names.child),
      pictured: await category(names.pictured),
      doomed: await category(names.doomed),
      ordered,
      products,
      collectionPictured: await collection(names.collectionPictured),
    }
  } finally {
    await api.dispose()
  }
})

test.beforeEach(async ({ page }) => {
  test.setTimeout(120_000)
  await login(page)
})

// --- Shared ---------------------------------------------------------------

const toast = (page: Page, text: string | RegExp) =>
  page.getByRole('region', { name: 'Notifications' }).getByText(text).first()
const saveButton = (page: Page) => page.getByRole('main').getByRole('button', { name: /^save$/i })
const card = (page: Page, title: string) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText(title, { exact: true }) })
    .last()

/** Removes a JSON attribute from a request's body, so the save leaves it unchanged. */
const without = (...keys: string[]) =>
  withBody((body) =>
    Object.fromEntries(Object.entries(body).filter(([key]) => !keys.includes(key))),
  )

/** Sends a list request with its search or filter left out, so it lists everything. */
const unfiltered = (route: Route) => {
  const url = new URL(route.request().url())
  for (const key of [...url.searchParams.keys()])
    if (/search|q\[|filter/i.test(key)) url.searchParams.delete(key)
  return route.continue({ url: url.toString() })
}

/** The first image field of a record's Images card: its file input and what it shows. */
const imageField = (page: Page) =>
  card(page, 'Images')
    .getByRole('group')
    .filter({ has: page.getByText('Image', { exact: true }) })
    .first()

/**
 * What the image field shows: whether its picture comes from the server rather
 * than from the file just picked, and the file named in its address. Spree's
 * browser-test server gives every file an address on port 3000, where nothing
 * runs (P8's record), so the picture is found by its address, not its pixels.
 */
async function shownPicture(field: Locator) {
  const picture = field.locator('img').first()
  await expect(picture).toBeVisible({ timeout: 15_000 })
  const address = new URL((await picture.getAttribute('src')) ?? '', 'blob:')
  return {
    fromServer: address.protocol === 'http:' || address.protocol === 'https:',
    file: decodeURIComponent(address.pathname.split('/').pop() ?? ''),
  }
}

/**
 * Moves a row one place down with the keyboard, as dnd-kit's keyboard sensor
 * takes it: Space picks the row up, the arrow moves it, Space puts it down.
 * Each key waits for dnd-kit's own announcement of it before the next: picked
 * up (which it at once reports as over its own place), over another row, and
 * dropped.
 */
async function moveDownOnePlace(page: Page, row: Locator) {
  const announcement = async () =>
    (await page.locator('[id^="DndLiveRegion"]').allTextContents()).join(' ')
  const overAnother = (text: string) => {
    const over = text.match(/item (\S+) was moved over droppable area (\S+)\./)
    return Boolean(over && over[1] !== over[2])
  }
  await row.getByRole('button', { name: 'Drag to reorder' }).focus()
  await page.keyboard.press('Space')
  await expect.poll(announcement).toMatch(/Picked up|was moved over/)
  // The sensor starts listening for the arrow keys on a timer after the pick-up.
  await page.waitForTimeout(250)
  await page.keyboard.press('ArrowDown')
  await expect.poll(async () => overAnother(await announcement())).toBe(true)
  await page.keyboard.press('Space')
  await expect.poll(announcement).toMatch(/was dropped/)
}

/** The Admin API as the browser tests' admin, for the records a test opens first. */
async function seeded<T>(baseURL: string | undefined, work: (seed: Seed) => Promise<T>) {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const call = async <R>(method: string, path: string, data?: object) => {
      const res = await api.fetch(`/api/v3/admin/${path}`, { method, headers, data })
      const text = await res.text()
      expect(res.ok(), `${method} ${path}: ${text}`).toBeTruthy()
      return (text ? JSON.parse(text) : undefined) as R
    }
    return await work({
      api,
      headers,
      get: (path) => call('GET', path),
      post: (path, data) => call('POST', path, data),
      patch: (path, data) => call('PATCH', path, data ?? {}),
    })
  } finally {
    await api.dispose()
  }
}

interface Seed {
  api: APIRequestContext
  headers: Headers
  get: <R>(path: string) => Promise<R>
  post: <R>(path: string, data: object) => Promise<R>
  patch: <R>(path: string, data?: object) => Promise<R>
}

interface Import {
  id: string
  number: string
  status: string
}

const csv = (name: string, rows: string[]) => ({
  name,
  mimeType: 'text/csv',
  buffer: Buffer.from(`${rows.join('\n')}\n`),
})

const priceHeader = 'sku,currency,min_quantity,price,compare_at_price'

/** A price file with one row for `sku` and one for a SKU the store does not have. */
const prices = (name: string, sku: string, price: string) =>
  csv(name, [priceHeader, `${sku},USD,1,${price},`, `P9-NO-SUCH-${stamp},USD,1,1.00,`])

/** A product with its own SKU, so a price file can name it. */
const skuProduct = (seed: Seed, name: string, sku: string) =>
  seed.post<{ id: string; slug: string }>('products', {
    name,
    status: 'active',
    variants: [{ sku, prices: [{ amount: '12.00', currency: 'USD' }] }],
  })

/** A catalog that prices by hand, so it owns a price list, holding these products. */
async function fixedCatalog(seed: Seed, name: string, productIds: string[]) {
  const catalog = await seed.post<{ id: string }>('catalogs', {
    name,
    price_list: {
      price_adjustment_percentage: null,
      adjust_compare_at: false,
      rules: [],
      price_adjustment_tiers: [],
    },
  })
  if (productIds.length > 0)
    await seed.post(`catalogs/${catalog.id}/products`, { product_ids: productIds })
  const { price_list } = await seed.get<{ price_list: { id: string } }>(
    `catalogs/${catalog.id}?expand=price_list`,
  )
  return { id: catalog.id, priceListId: price_list.id }
}

/** Imports a file through the Admin API, accepting the columns it maps itself. */
async function importedThroughApi(
  seed: Seed,
  type: string,
  file: ReturnType<typeof csv>,
  extra: object = {},
) {
  const signedId = await upload(
    seed.api,
    seed.headers,
    file.name,
    file.mimeType,
    file.buffer,
    'private',
  )
  const created = await seed.post<Import>('imports', {
    type,
    attachment_signed_id: signedId,
    ...extra,
  })
  const status = async () => (await seed.get<Import>(`imports/${created.id}`)).status
  await expect.poll(status, { timeout: 60_000 }).toBe('mapping')
  await seed.patch(`imports/${created.id}/complete_mapping`)
  await expect.poll(status, { timeout: 120_000 }).toBe('completed')
  return created
}

/** Answers a request with this JSON, so it never reaches the server. */
const answeredJson = (body: object) => (route: Route) => route.fulfill({ json: body })

/** Answers a read with the server's own answer, edited. */
const answeredEdited =
  (edit: (body: Record<string, unknown>) => Record<string, unknown>) => async (route: Route) => {
    const response = await route.fetch()
    await route.fulfill({ response, json: edit(await response.json()) })
  }

/** Reads a downloaded file as text, without a byte-order mark. */
const textOf = async (download: Download) =>
  readFileSync((await download.path()) as string, 'utf8').replace(/^\uFEFF/, '')

/** The text of the export the server holds under this file name. */
async function heldExport(baseURL: string | undefined, filename: string) {
  return seeded(baseURL, async (seed) => {
    const { data } = await seed.get<{
      data: { filename: string | null; download_url: string | null }[]
    }>('exports?limit=25&sort=-created_at')
    const held = data.find((exported) => exported.filename === filename)
    expect(held?.download_url, `an export named ${filename}`).toBeTruthy()
    const res = await seed.api.get(held?.download_url as string, { headers: seed.headers })
    expect(res.ok()).toBeTruthy()
    return (await res.text()).replace(/^\uFEFF/, '')
  })
}

const confirmation = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog'))

// --- Categories -----------------------------------------------------------

const productRow = (page: Page, name: string) =>
  page
    .getByRole('main')
    .getByRole('row')
    .filter({ has: page.getByRole('link', { name, exact: true }) })

const categoryRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('button', { name, exact: true }) })

async function openCategories(page: Page) {
  await openIn(page, ids.store, '/products/categories')
  await expect(page.getByRole('heading', { name: 'Categories', level: 1 })).toBeVisible({
    timeout: 15_000,
  })
}

async function openCategory(page: Page, id: string, name: string) {
  await openIn(page, ids.store, `/products/categories/${id}`)
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible({ timeout: 15_000 })
}

test.describe('categories (P9, G-61)', () => {
  test("choosing a category's parent", async ({ page }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /^\/api\/v3\/admin\/categories\/[^/]+$/, without('parent_id'))
    await openCategories(page)
    await expect(categoryRow(page, names.child)).toBeVisible({ timeout: 15_000 })
    const steps: Steps = [{ step: 'the category is listed at the top level' }]

    await openCategory(page, ids.child, names.child)
    const parentPicker = card(page, 'Navigation').getByRole('combobox')
    await parentPicker.click()
    await parentPicker.fill(names.parent)
    await page.getByRole('option', { name: names.parent, exact: true }).click()
    await saveButton(page).click()
    await expect(toast(page, 'Category updated')).toBeVisible({ timeout: 15_000 })
    steps.push({ step: 'chose the parent and saved' })

    await reload(page)
    await expect(card(page, 'Navigation').getByRole('combobox')).toHaveValue(names.parent, {
      timeout: 15_000,
    })
    steps.push({
      step: 'reloaded the category',
      parent: await card(page, 'Navigation').getByRole('combobox').inputValue(),
    })

    await openCategories(page)
    await expect(categoryRow(page, names.child)).toHaveCount(0)
    await categoryRow(page, names.parent).getByRole('button', { name: 'Expand' }).click()
    await expect(categoryRow(page, names.child)).toBeVisible()
    const rows = await page.getByRole('row').allInnerTexts()
    const parentAt = rows.findIndex((row) => row.includes(names.parent))
    expect(rows[parentAt + 1]).toContain(names.child)
    steps.push({ step: 'opened the categories, expanded the parent', below: names.child })
    await save(page, 'category-parent', steps, outside)
  })

  test("a category's image", async ({ page }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/categories\/[^/]+$/,
      without('image_signed_id'),
    )
    await openCategory(page, ids.pictured, names.pictured)
    await expect(imageField(page).locator('img')).toHaveCount(0)
    await imageField(page)
      .locator('input[type="file"]')
      .setInputFiles({
        name: `p9-category-${stamp}.png`,
        mimeType: 'image/png',
        buffer: fixture('product-olive.png'),
      })
    await expect(saveButton(page)).toBeEnabled({ timeout: 15_000 })
    await saveButton(page).click()
    await expect(toast(page, 'Category updated')).toBeVisible({ timeout: 15_000 })
    const steps: Steps = [{ step: 'added an image and saved' }]

    await reload(page)
    const shown = await shownPicture(imageField(page))
    expect(shown).toEqual({ fromServer: true, file: `p9-category-${stamp}.png` })
    steps.push({ step: 'reloaded', picture: shown })
    await save(page, 'category-image', steps, outside)
  })

  test('deleting a category', async ({ page }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'DELETE', /^\/api\/v3\/admin\/categories\/[^/]+$/, answeredEmpty)
    await openCategories(page)
    let asked = ''
    page.once('dialog', (dialog) => {
      asked = dialog.message()
      return dialog.accept()
    })
    await categoryRow(page, names.doomed).getByRole('button', { name: 'Open actions' }).click()
    await page.getByRole('menuitem', { name: /delete/i }).click()
    await expect(toast(page, 'Category deleted')).toBeVisible({ timeout: 15_000 })
    expect(asked).toBe(`Delete the category "${names.doomed}" and all its subcategories?`)
    await expect(categoryRow(page, names.doomed)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [{ step: 'deleted the category from its menu, confirming', asked }]

    await reload(page)
    await expect(categoryRow(page, names.parent)).toBeVisible({ timeout: 15_000 })
    await expect(categoryRow(page, names.doomed)).toHaveCount(0)
    steps.push({ step: 'reloaded; the category is gone' })
    await save(page, 'category-deleted', steps, outside)
  })

  test("reordering a category's products", async ({ page }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/products\/[^/]+\/reposition$/, answeredEmpty)
    const order = async () =>
      (await page.getByRole('main').getByRole('table').getByRole('link').allInnerTexts()).filter(
        (name) => names.products.includes(name),
      )
    await openCategory(page, ids.ordered, names.ordered)
    await expect.poll(order, { timeout: 15_000 }).toEqual(names.products)
    const steps: Steps = [{ step: 'opened the category', order: names.products }]

    await moveDownOnePlace(page, productRow(page, names.products[0]))
    const moved = [names.products[1], names.products[0], names.products[2]]
    await expect.poll(order, { timeout: 15_000 }).toEqual(moved)
    steps.push({ step: 'moved the first product one place down with the keyboard', order: moved })
    await page.waitForLoadState('networkidle')

    await reload(page)
    await expect.poll(order, { timeout: 15_000 }).toEqual(moved)
    steps.push({ step: 'reloaded', order: await order() })
    await save(page, 'category-products-reordered', steps, outside)
  })

  test('searching categories', async ({ page }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    if (sabotaged)
      await page.route((url) => url.pathname === '/api/v3/admin/categories', unfiltered)
    await openCategories(page)
    await page
      .getByRole('textbox', { name: 'Search categories…' })
      .fill(`Juniper category ${stamp}`)
    await expect(categoryRow(page, names.searchFound)).toBeVisible({ timeout: 15_000 })
    await expect(categoryRow(page, names.searchMissed)).toHaveCount(0)
    const found = await page.getByRole('row').count()
    const steps: Steps = [
      { step: 'searched for one category', rows: found - 1, shows: names.searchFound },
    ]
    await snap(page, 'category-search-found')

    await reload(page)
    await expect(page.getByRole('textbox', { name: 'Search categories…' })).toHaveValue('')
    await expect(categoryRow(page, names.searchFound)).toBeVisible({ timeout: 15_000 })
    await expect(categoryRow(page, names.searchMissed)).toBeVisible()
    steps.push({ step: 'reloaded; the search is cleared and both categories are listed again' })
    await save(page, 'category-search', steps, outside)
  })
})

// --- Collections ----------------------------------------------------------

const collectionRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('button', { name: new RegExp(`^${name}`) }) })

async function openCollections(page: Page) {
  await openIn(page, ids.store, '/products/collections')
  await expect(page.getByRole('heading', { name: 'Collections', level: 1 })).toBeVisible({
    timeout: 15_000,
  })
}

test.describe('collections (P9, G-61)', () => {
  test("a collection's image", async ({ page }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/collections\/[^/]+$/,
      without('image_signed_id'),
    )
    await openIn(page, ids.store, `/products/collections/${ids.collectionPictured}`)
    await expect(
      page.getByRole('heading', { name: names.collectionPictured, level: 1 }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(imageField(page).locator('img')).toHaveCount(0)
    await imageField(page)
      .locator('input[type="file"]')
      .setInputFiles({
        name: `p9-collection-${stamp}.png`,
        mimeType: 'image/png',
        buffer: fixture('product-olive.png'),
      })
    await expect(saveButton(page)).toBeEnabled({ timeout: 15_000 })
    await saveButton(page).click()
    await expect(toast(page, 'Collection updated')).toBeVisible({ timeout: 15_000 })
    const steps: Steps = [{ step: 'added an image and saved' }]

    await reload(page)
    const shown = await shownPicture(imageField(page))
    expect(shown).toEqual({ fromServer: true, file: `p9-collection-${stamp}.png` })
    steps.push({ step: 'reloaded', picture: shown })
    await save(page, 'collection-image', steps, outside)
  })

  test('searching collections', async ({ page }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    if (sabotaged)
      await page.route((url) => url.pathname === '/api/v3/admin/collections', unfiltered)
    await openCollections(page)
    await page.getByRole('searchbox', { name: 'Search collections…' }).fill(names.collectionFound)
    await expect(collectionRow(page, names.collectionFound)).toBeVisible({ timeout: 15_000 })
    await expect(collectionRow(page, names.collectionMissed)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [{ step: 'searched for one collection', shows: names.collectionFound }]

    await reload(page)
    await expect(page.getByRole('searchbox', { name: 'Search collections…' })).toHaveValue(
      names.collectionFound,
    )
    await expect(collectionRow(page, names.collectionFound)).toBeVisible({ timeout: 15_000 })
    await expect(collectionRow(page, names.collectionMissed)).toHaveCount(0)
    steps.push({ step: 'reloaded; the search and its result are kept' })
    await save(page, 'collection-search', steps, outside)
  })

  test('the kind filter', async ({ page }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    if (sabotaged)
      await page.route((url) => url.pathname === '/api/v3/admin/collections', unfiltered)
    await openCollections(page)
    await expect(collectionRow(page, names.collectionManual)).toBeVisible({ timeout: 15_000 })
    await expect(collectionRow(page, names.collectionAutomatic)).toBeVisible()
    await page.getByRole('button', { name: /^kind/i }).click()
    await page.getByRole('menuitemcheckbox', { name: /manual/i }).click()
    await page.keyboard.press('Escape')
    await expect(collectionRow(page, names.collectionManual)).toHaveCount(0, { timeout: 15_000 })
    await expect(collectionRow(page, names.collectionAutomatic)).toBeVisible()
    const kinds = async () => [
      ...new Set(await page.getByRole('row').locator('td:nth-child(3)').allInnerTexts()),
    ]
    expect(await kinds()).toEqual(['Automatic'])
    const steps: Steps = [
      { step: 'left only Automatic ticked in the kind filter', kinds: await kinds() },
    ]

    await reload(page)
    await expect(page.getByRole('button', { name: /^kind/i })).toContainText('1/2')
    await expect(collectionRow(page, names.collectionAutomatic)).toBeVisible({ timeout: 15_000 })
    await expect(collectionRow(page, names.collectionManual)).toHaveCount(0)
    expect(await kinds()).toEqual(['Automatic'])
    steps.push({ step: 'reloaded; the filter and its result are kept', kinds: await kinds() })
    await save(page, 'collection-kind-filter', steps, outside)
  })
})

// --- Catalogs -------------------------------------------------------------

const catalogRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('button', { name, exact: true }) })
const catalogStatus = (page: Page) =>
  page
    .getByRole('main')
    .getByText(/^(Active|Inactive)$/)
    .first()

async function openCatalog(page: Page, id: string, name: string) {
  await openIn(page, ids.store, `/products/catalogs/${id}`)
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible({ timeout: 15_000 })
}

async function openCatalogs(page: Page) {
  await openIn(page, ids.store, '/products/catalogs')
  await expect(page.getByRole('heading', { name: 'Catalogs', level: 1 })).toBeVisible({
    timeout: 15_000,
  })
}

/** Runs a price file through the import wizard the page opens, to its results. */
async function importInWizard(page: Page, file: ReturnType<typeof csv>) {
  await expect(page.getByRole('heading', { name: /import from csv/i })).toBeVisible({
    timeout: 15_000,
  })
  await page.getByRole('dialog').locator('input[type="file"]').setInputFiles(file)
  await page.getByRole('button', { name: /^continue$/i }).click()
  await expect(page.getByText('Map columns')).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /start import/i }).click()
  await expect(page.getByText(/import completed/i)).toBeVisible({ timeout: 120_000 })
  const summary = await page
    .getByText(/rows imported/i)
    .first()
    .innerText()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^close$/i })
    .click()
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 })
  return summary
}

/** The price the open catalog's spreadsheet shows for its first product. */
async function spreadsheetPrice(page: Page) {
  await card(page, 'Pricing')
    .getByRole('button', { name: /^enter prices$/i })
    .click()
  const grid = page.getByRole('dialog')
  await expect(page.getByRole('heading', { name: /^edit prices —/i })).toBeVisible({
    timeout: 15_000,
  })
  const price = grid.getByLabel(/^price for/i).first()
  await expect(price).not.toHaveValue('', { timeout: 15_000 })
  const value = await price.inputValue()
  await grid.getByRole('button', { name: /^close$/i }).click()
  await expect(grid).toBeHidden({ timeout: 15_000 })
  return value
}

test.describe('catalogs (P9, G-61)', () => {
  test('activating a catalog', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /^\/api\/v3\/admin\/catalogs\/[^/]+\/activate$/, answeredEmpty)
    const name = named('Activated catalog')
    // Spree refuses to activate a catalog nobody is assigned to, so it gets an audience first.
    const catalog = await seeded(baseURL, async (seed) => {
      const company = await seed.post<{ id: string }>('companies', {
        name: named('Activation company'),
      })
      return seed.post<{ id: string }>('catalogs', {
        name,
        assignments: [{ assignable_type: 'company', assignable_id: company.id }],
      })
    })
    await openCatalog(page, catalog.id, name)
    await expect(catalogStatus(page)).toHaveText('Inactive')
    await page.getByRole('main').getByRole('button', { name: 'Activate', exact: true }).click()
    await expect(confirmation(page).getByText('Activate this catalog?')).toBeVisible()
    await confirmation(page).getByRole('button', { name: 'Activate', exact: true }).click()
    await expect(toast(page, 'Catalog activated')).toBeVisible({ timeout: 15_000 })
    await expect(catalogStatus(page)).toHaveText('Active')
    const steps: Steps = [{ step: 'activated the inactive catalog, confirming', status: 'Active' }]

    await reload(page)
    await expect(catalogStatus(page)).toHaveText('Active', { timeout: 15_000 })
    await expect(
      page.getByRole('main').getByRole('button', { name: 'Deactivate', exact: true }),
    ).toBeVisible()
    steps.push({ step: 'reloaded', status: await catalogStatus(page).innerText() })
    await save(page, 'catalog-activated', steps, outside)
  })

  test('deactivating a catalog', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /^\/api\/v3\/admin\/catalogs\/[^/]+\/deactivate$/, answeredEmpty)
    const name = named('Deactivated catalog')
    const catalog = await seeded(baseURL, (seed) =>
      seed.post<{ id: string }>('catalogs', { name, active: true }),
    )
    await openCatalog(page, catalog.id, name)
    await expect(catalogStatus(page)).toHaveText('Active')
    await page.getByRole('main').getByRole('button', { name: 'Deactivate', exact: true }).click()
    await expect(confirmation(page).getByText('Deactivate this catalog?')).toBeVisible()
    await confirmation(page).getByRole('button', { name: 'Deactivate', exact: true }).click()
    await expect(toast(page, 'Catalog deactivated')).toBeVisible({ timeout: 15_000 })
    await expect(catalogStatus(page)).toHaveText('Inactive')
    const steps: Steps = [
      { step: 'deactivated the active catalog, confirming', status: 'Inactive' },
    ]

    await reload(page)
    await expect(catalogStatus(page)).toHaveText('Inactive', { timeout: 15_000 })
    await expect(
      page.getByRole('main').getByRole('button', { name: 'Activate', exact: true }),
    ).toBeVisible()
    steps.push({ step: 'reloaded', status: await catalogStatus(page).innerText() })
    await save(page, 'catalog-deactivated', steps, outside)
  })

  test('assigning an audience', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /^\/api\/v3\/admin\/catalogs\/[^/]+$/, without('assignments'))
    const name = named('Assigned catalog')
    const company = named('Assigned company')
    const catalog = await seeded(baseURL, async (seed) => {
      await seed.post('companies', { name: company })
      return seed.post<{ id: string }>('catalogs', { name })
    })
    await openCatalog(page, catalog.id, name)
    const audiences = card(page, 'Audiences')
    await expect(audiences.getByText('Not assigned to any audience yet')).toBeVisible()
    await audiences.getByRole('button', { name: 'Assign', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Assign this catalog')).toBeVisible()
    const audience = dialog.getByRole('combobox').last()
    await audience.click()
    await audience.fill(company)
    await page.getByRole('option', { name: company }).first().click()
    await dialog.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(audiences.getByRole('link', { name: company })).toBeVisible()
    await saveButton(page).click()
    await expect(toast(page, 'Catalog updated')).toBeVisible({ timeout: 15_000 })
    const steps: Steps = [{ step: 'assigned the company and saved', audience: company }]

    await reload(page)
    await expect(card(page, 'Audiences').getByRole('link', { name: company })).toBeVisible({
      timeout: 15_000,
    })
    await expect(card(page, 'Audiences').getByText('Not assigned to any audience yet')).toBeHidden()
    steps.push({ step: 'reloaded; the company is the audience' })
    await card(page, 'Audiences').scrollIntoViewIfNeeded()
    await save(page, 'catalog-audience-assigned', steps, outside)
  })

  test('withdrawing an audience', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /^\/api\/v3\/admin\/catalogs\/[^/]+$/, without('assignments'))
    const name = named('Withdrawn catalog')
    const company = named('Withdrawn company')
    const catalog = await seeded(baseURL, async (seed) => {
      const { id } = await seed.post<{ id: string }>('companies', { name: company })
      return seed.post<{ id: string }>('catalogs', {
        name,
        assignments: [{ assignable_type: 'company', assignable_id: id }],
      })
    })
    await openCatalog(page, catalog.id, name)
    const audiences = card(page, 'Audiences')
    await expect(audiences.getByRole('link', { name: company })).toBeVisible()
    const assigned = audiences
      .locator('div')
      .filter({ hasText: company })
      .filter({ has: page.getByRole('button') })
      .last()
    await assigned.getByRole('button', { name: 'Remove', exact: true }).click()
    // The row now offers its undo in the remove button's place. Its name is the
    // raw translation key, catalog part 2's B6, so it is recorded, not asserted.
    await expect(assigned.getByRole('button', { name: 'Remove', exact: true })).toHaveCount(0)
    const undo = await assigned.getByRole('button').getAttribute('aria-label')
    await saveButton(page).click()
    await expect(toast(page, 'Catalog updated')).toBeVisible({ timeout: 15_000 })
    const steps: Steps = [{ step: 'removed the company and saved', undo }]

    await reload(page)
    await expect(card(page, 'Audiences').getByText('Not assigned to any audience yet')).toBeVisible(
      { timeout: 15_000 },
    )
    await expect(card(page, 'Audiences').getByText(company)).toHaveCount(0)
    steps.push({ step: 'reloaded; the catalog has no audience' })
    await card(page, 'Audiences').scrollIntoViewIfNeeded()
    await save(page, 'catalog-audience-withdrawn', steps, outside)
  })

  test("importing a catalog's prices", async ({ page, baseURL }) => {
    test.setTimeout(240_000)
    const outside = await blockOutside(page)
    const name = named('Imported catalog')
    const sku = `P9-IMPORTED-${stamp}`
    const { catalog, decoy } = await seeded(baseURL, async (seed) => {
      const product = await skuProduct(seed, named('Imported product'), sku)
      const decoyList = await seed.post<{ id: string }>('price_lists', {
        name: named('Import decoy list'),
      })
      return { catalog: await fixedCatalog(seed, name, [product.id]), decoy: decoyList.id }
    })
    await sabotage(
      page,
      'POST',
      /^\/api\/v3\/admin\/imports$/,
      withBody((body) => ({ ...body, price_list_id: decoy })),
    )
    await openCatalog(page, catalog.id, name)
    await card(page, 'Pricing')
      .getByRole('button', { name: /^import$/i })
      .click()
    const summary = await importInWizard(
      page,
      prices(`p9-catalog-prices-${stamp}.csv`, sku, '17.25'),
    )
    expect(summary).toBe('1 rows imported · 1 failed')
    expect(await spreadsheetPrice(page)).toBe('17.25')
    const steps: Steps = [
      { step: "imported a price file from the catalog's Pricing card", summary },
      { step: "opened the catalog's prices", price: '17.25' },
    ]

    await reload(page)
    const price = await spreadsheetPrice(page)
    expect(price).toBe('17.25')
    steps.push({ step: "reloaded and opened the catalog's prices", price })
    await save(page, 'catalog-prices-imported', steps, outside)
  })

  test("exporting a catalog's prices", async ({ page, baseURL }) => {
    test.setTimeout(240_000)
    const outside = await blockOutside(page)
    const name = named('Exported catalog')
    const sku = `P9-EXPORTED-${stamp}`
    const { catalog, decoy } = await seeded(baseURL, async (seed) => {
      const product = await skuProduct(seed, named('Exported product'), sku)
      const owned = await fixedCatalog(seed, name, [product.id])
      await importedThroughApi(
        seed,
        'price_list_prices',
        prices(`p9-seed-${stamp}.csv`, sku, '19.50'),
        {
          price_list_id: owned.priceListId,
        },
      )
      const decoyList = await seed.post<{ id: string }>('price_lists', {
        name: named('Export decoy list'),
      })
      return { catalog: owned, decoy: decoyList.id }
    })
    await sabotage(
      page,
      'POST',
      /^\/api\/v3\/admin\/exports$/,
      withBody((body) => ({ ...body, search_params: { price_list_id_eq: decoy } })),
    )
    await openCatalog(page, catalog.id, name)
    const downloading = page.waitForEvent('download', { timeout: 120_000 })
    await card(page, 'Pricing')
      .getByRole('button', { name: /^export$/i })
      .click()
    const download = await downloading
    const text = await textOf(download)
    const line = text.split('\n').find((row) => row.startsWith(`${sku},`))
    expect(line, `a line for ${sku}`).toContain(',USD,1,19.50,')
    await expect(toast(page, /export downloaded/i)).toBeVisible({ timeout: 15_000 })
    const steps: Steps = [
      {
        step: "exported the prices from the catalog's Pricing card",
        file: download.suggestedFilename(),
        line,
      },
    ]

    await reload(page)
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible({ timeout: 15_000 })
    const held = await heldExport(baseURL, download.suggestedFilename())
    expect(held).toBe(text)
    steps.push({ step: 'reloaded; the server holds the same file under that name' })
    await save(page, 'catalog-prices-exported', steps, outside)
  })

  test('deleting a catalog', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'DELETE', /^\/api\/v3\/admin\/catalogs\/[^/]+$/, answeredEmpty)
    const name = named('Deleted catalog')
    const catalog = await seeded(baseURL, (seed) => seed.post<{ id: string }>('catalogs', { name }))
    await openCatalog(page, catalog.id, name)
    await page.getByRole('main').getByRole('button', { name: 'More actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete catalog' }).click()
    await expect(confirmation(page).getByText('Delete catalog?')).toBeVisible()
    await confirmation(page)
      .getByRole('button', { name: /^delete/i })
      .click()
    await expect(toast(page, 'Catalog deleted')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Catalogs', level: 1 })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('searchbox', { name: 'Search catalogs' }).fill(name)
    await expect(catalogRow(page, name)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [{ step: 'deleted the catalog from its page, confirming' }]

    await reload(page)
    await expect(page.getByRole('searchbox', { name: 'Search catalogs' })).toHaveValue(name)
    await page.waitForLoadState('networkidle')
    await expect(catalogRow(page, name)).toHaveCount(0)
    steps.push({ step: 'reloaded and searched for it; it is not listed' })
    await save(page, 'catalog-deleted', steps, outside)
  })

  test('searching catalogs', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    if (sabotaged) await page.route((url) => url.pathname === '/api/v3/admin/catalogs', unfiltered)
    const found = named('Juniper catalog')
    const missed = named('Rowan catalog')
    await seeded(baseURL, async (seed) => {
      await seed.post('catalogs', { name: found })
      await seed.post('catalogs', { name: missed })
    })
    await openCatalogs(page)
    await expect(catalogRow(page, missed)).toBeVisible({ timeout: 15_000 })
    await page.getByRole('searchbox', { name: 'Search catalogs' }).fill(found)
    await expect(catalogRow(page, found)).toBeVisible({ timeout: 15_000 })
    await expect(catalogRow(page, missed)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [{ step: 'searched for one catalog', shows: found }]

    await reload(page)
    await expect(page.getByRole('searchbox', { name: 'Search catalogs' })).toHaveValue(found)
    await expect(catalogRow(page, found)).toBeVisible({ timeout: 15_000 })
    await expect(catalogRow(page, missed)).toHaveCount(0)
    steps.push({ step: 'reloaded; the search and its result are kept' })
    await save(page, 'catalog-search', steps, outside)
  })
})

// --- Translations ---------------------------------------------------------

const recordRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ has: page.getByRole('button', { name, exact: true }) })
const kindPicker = (page: Page) =>
  page
    .getByRole('main')
    .getByRole('combobox')
    .filter({ hasText: /^(Products|Categories|Collections|Option types)$/ })
const translationsDialog = (page: Page) =>
  page
    .getByRole('dialog')
    .filter({ has: page.getByRole('button', { name: /^save translations$/i }) })

/** What a record's German column shows: a dash, a count of fields, or a check. */
async function germanCoverage(row: Locator) {
  const cell = row.getByRole('cell').nth(1)
  const text = (await cell.innerText()).trim()
  if (text) return text
  return (await cell.locator('[aria-label]').first().getAttribute('aria-label')) ?? ''
}

async function openTranslations(page: Page, kind?: string) {
  await openIn(page, ids.store, '/products/translations')
  await expect(page.getByText('Translation coverage')).toBeVisible({ timeout: 15_000 })
  if (kind) {
    await kindPicker(page).click()
    await page.getByRole('option', { name: kind, exact: true }).click()
    await expect(kindPicker(page)).toHaveText(kind)
  }
}

async function findRecord(page: Page, name: string) {
  await page.getByRole('searchbox', { name: 'Search…' }).fill(name)
  await expect(recordRow(page, name)).toBeVisible({ timeout: 15_000 })
  return recordRow(page, name)
}

/** Opens a record's translations and reads one German field. */
async function germanField(page: Page, name: string, field: string) {
  await recordRow(page, name).getByRole('button', { name, exact: true }).click()
  const dialog = translationsDialog(page)
  await expect(dialog.getByText('Original', { exact: true })).toBeVisible({ timeout: 15_000 })
  return dialog.getByLabel(`${field} de`, { exact: true })
}

async function closeTranslations(page: Page) {
  await translationsDialog(page)
    .getByRole('button', { name: /^close$/i })
    .click()
  await expect(translationsDialog(page)).toBeHidden({ timeout: 15_000 })
}

const recordKinds = [
  {
    kind: 'Categories',
    field: 'name',
    add: (seed: Seed, name: string) => seed.post('categories', { name }),
  },
  {
    kind: 'Collections',
    field: 'name',
    add: (seed: Seed, name: string) => seed.post('collections', { name }),
  },
  {
    kind: 'Option types',
    field: 'label',
    add: (seed: Seed, name: string) =>
      seed.post('option_types', { name: `p9-translated-${stamp}`, label: name }),
  },
]

test.describe('translations (P9, G-61)', () => {
  for (const { kind, field, add } of recordKinds) {
    test(`translating ${kind.toLowerCase()} on the translations page`, async ({
      page,
      baseURL,
    }) => {
      const outside = await blockOutside(page)
      await sabotage(
        page,
        'POST',
        /^\/api\/v3\/admin\/translations\/batch$/,
        answeredJson({ data: [] }),
      )
      const name = named(`Translated ${kind.toLowerCase()}`)
      const german = `${name} auf Deutsch`
      await seeded(baseURL, (seed) => add(seed, name))
      await openTranslations(page, kind)
      const row = await findRecord(page, name)
      expect(await germanCoverage(row)).toBe('—')
      const input = await germanField(page, name, field)
      await input.fill(german)
      await translationsDialog(page)
        .getByRole('button', { name: /^save translations$/i })
        .click()
      await expect(toast(page, 'Translations saved')).toBeVisible({ timeout: 15_000 })
      await closeTranslations(page)
      await expect.poll(() => germanCoverage(row), { timeout: 15_000 }).not.toBe('—')
      const steps: Steps = [
        { step: `chose ${kind}, found the record, entered its German ${field} and saved` },
        { step: 'closed the record', german: await germanCoverage(row) },
      ]
      const slug = kind.toLowerCase().replace(' ', '-')

      await reload(page)
      await expect(kindPicker(page)).toHaveText(kind, { timeout: 15_000 })
      const after = await findRecord(page, name)
      const coverage = await germanCoverage(after)
      expect(coverage).not.toBe('—')
      await expect(await germanField(page, name, field)).toHaveValue(german)
      steps.push({
        step: 'reloaded; the kind is kept; found and opened the record',
        german: coverage,
      })
      await save(page, `translations-${slug}`, steps, outside)
    })
  }

  test('importing translations', async ({ page, baseURL }) => {
    test.setTimeout(240_000)
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/imports\/[^/]+\/complete_mapping$/,
      withBody((body) => ({
        ...body,
        mappings: [
          ...((body.mappings as { schema_field: string }[] | undefined) ?? []).filter(
            (mapping) => mapping.schema_field !== 'name',
          ),
          { schema_field: 'name', file_column: null },
        ],
      })),
    )
    const name = named('Imported translation')
    const german = `${name} auf Deutsch`
    const product = await seeded(baseURL, (seed) =>
      seed.post<{ slug: string }>('products', { name, status: 'active' }),
    )
    await openTranslations(page)
    await page
      .getByRole('main')
      .getByRole('button', { name: /^import$/i })
      .click()
    const summary = await importInWizard(
      page,
      csv(`p9-translations-${stamp}.csv`, ['slug,locale,name', `${product.slug},de,${german}`]),
    )
    expect(summary).toBe('1 rows imported · 0 failed')
    const row = await findRecord(page, name)
    expect(await germanCoverage(row)).not.toBe('—')
    await expect(await germanField(page, name, 'name')).toHaveValue(german)
    await closeTranslations(page)
    const steps: Steps = [
      { step: 'imported a file of one German name from the translations page', summary },
      { step: 'found and opened the product', german },
    ]

    await reload(page)
    await findRecord(page, name)
    await expect(await germanField(page, name, 'name')).toHaveValue(german)
    steps.push({ step: 'reloaded; found and opened the product', german })
    await save(page, 'translations-imported', steps, outside)
  })

  test('exporting translations', async ({ page, baseURL }) => {
    test.setTimeout(180_000)
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'POST',
      /^\/api\/v3\/admin\/exports$/,
      withBody((body) => ({ ...body, search_params: { name_cont: `no such product ${stamp}` } })),
    )
    const name = named('Exported translation')
    const german = `${name} auf Deutsch`
    const product = await seeded(baseURL, (seed) =>
      seed.post<{ id: string; slug: string }>('products', { name, status: 'active' }),
    )
    await translateProduct(baseURL as string, product.id, 'de', { name: german })
    await openTranslations(page)
    await findRecord(page, name)
    await page
      .getByRole('main')
      .getByRole('button', { name: /^export$/i })
      .click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('radio', { name: /^current filter/i }).click()
    const downloading = page.waitForEvent('download', { timeout: 120_000 })
    await dialog.getByRole('button', { name: /^export$/i }).click()
    const download = await downloading
    const text = await textOf(download)
    const rows = text.trim().split('\n').slice(1)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toContain(product.slug)
    expect(rows[0]).toContain(german)
    await expect(toast(page, /export downloaded/i)).toBeVisible({ timeout: 15_000 })
    const steps: Steps = [
      {
        step: 'searched for the product and exported the current filter',
        file: download.suggestedFilename(),
        rows: rows.length,
      },
    ]

    await reload(page)
    await expect(page.getByText('Translation coverage')).toBeVisible({ timeout: 15_000 })
    expect(await heldExport(baseURL, download.suggestedFilename())).toBe(text)
    steps.push({ step: 'reloaded; the server holds the same file under that name' })
    await save(page, 'translations-exported', steps, outside)
  })
})

// --- Price lists ----------------------------------------------------------

const withoutCatalogList = process.env.P9_NO_CATALOG_LIST === '1'

const priceListStatus = (page: Page) =>
  page
    .getByRole('main')
    .getByText(/^(Draft|Active|Scheduled|Inactive)$/)
    .first()

async function openPriceList(page: Page, id: string, name: string) {
  await openIn(page, ids.store, `/products/price-lists/${id}`)
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible({ timeout: 15_000 })
}

/** Picks a day in the next month or the one after, at a time, in a date field. */
async function pickDate(
  page: Page,
  trigger: Locator,
  monthsAhead: number,
  day: string,
  time: string,
) {
  await trigger.click()
  const calendar = page.getByRole('dialog')
  for (let month = 0; month < monthsAhead; month++)
    await calendar.getByRole('button', { name: /next month/i }).click()
  await calendar
    .getByRole('gridcell')
    .filter({ hasText: new RegExp(`^${day}$`) })
    .first()
    .click()
  await calendar.locator('input[type="time"]').fill(time)
  await page.keyboard.press('Escape')
  await expect(calendar).toBeHidden()
}

const scheduleField = (page: Page, label: 'Starts' | 'Ends') =>
  card(page, 'Schedule')
    .getByRole('group')
    .filter({ has: page.getByText(label, { exact: true }) })
    .getByRole('button')
    .first()

test.describe('price lists (P9, G-61)', () => {
  test("a price list's channel rule", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /^\/api\/v3\/admin\/price_lists\/[^/]+$/, without('rules'))
    const name = named('Channel list')
    const list = await seeded(baseURL, (seed) => seed.post<{ id: string }>('price_lists', { name }))
    await openPriceList(page, list.id, name)
    const rules = card(page, 'Rules')
    await expect(rules.getByText('No rules')).toBeVisible()
    await page.getByRole('button', { name: /^add rule$/i }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^channel\b/i })
      .click()
    const editor = page.getByRole('dialog')
    await expect(editor.getByText('Sales channels')).toBeVisible()
    const channels = editor.getByRole('combobox').first()
    await channels.click()
    await channels.fill('E2E Bulk')
    await page
      .getByRole('option', { name: /E2E Bulk Channel/ })
      .first()
      .click()
    await editor.getByRole('button', { name: /^save$/i }).click()
    await expect(rules.getByText('E2E Bulk Channel')).toBeVisible()
    await saveButton(page).click()
    await expect(toast(page, 'Price list updated')).toBeVisible({ timeout: 15_000 })
    const steps: Steps = [{ step: 'added a channel rule for E2E Bulk Channel and saved' }]

    await reload(page)
    await expect(card(page, 'Rules').getByText('E2E Bulk Channel')).toBeVisible({ timeout: 15_000 })
    await expect(card(page, 'Rules').getByText('Channel', { exact: true })).toBeVisible()
    steps.push({ step: 'reloaded; the rule names the channel' })
    await save(page, 'price-list-channel-rule', steps, outside)
  })

  test("a price list's schedule", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/price_lists\/[^/]+$/,
      without('starts_at', 'ends_at'),
    )
    const name = named('Scheduled list')
    const list = await seeded(baseURL, (seed) => seed.post<{ id: string }>('price_lists', { name }))
    await openPriceList(page, list.id, name)
    await expect(scheduleField(page, 'Starts')).toHaveText('Immediately')
    await expect(scheduleField(page, 'Ends')).toHaveText('Never')
    await pickDate(page, scheduleField(page, 'Starts'), 1, '15', '09:30')
    await pickDate(page, scheduleField(page, 'Ends'), 2, '20', '18:00')
    const chosen = {
      starts: await scheduleField(page, 'Starts').innerText(),
      ends: await scheduleField(page, 'Ends').innerText(),
    }
    expect(chosen.starts).toMatch(/15.*9:30 AM/)
    expect(chosen.ends).toMatch(/20.*6:00 PM/)
    await saveButton(page).click()
    await expect(toast(page, 'Price list updated')).toBeVisible({ timeout: 15_000 })
    const steps: Steps = [{ step: 'chose a start and an end and saved', ...chosen }]

    await reload(page)
    const kept = {
      starts: await scheduleField(page, 'Starts').innerText(),
      ends: await scheduleField(page, 'Ends').innerText(),
    }
    expect(kept).toEqual(chosen)
    steps.push({ step: 'reloaded', ...kept })
    await save(page, 'price-list-schedule', steps, outside)
  })

  test('activating a price list', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /^\/api\/v3\/admin\/price_lists\/[^/]+\/activate$/, answeredEmpty)
    const name = named('Activated list')
    // Spree refuses to activate a list that would apply to nothing, so it gets a
    // rule first: a volume rule from 1,000 items, which no other test's order reaches.
    const list = await seeded(baseURL, (seed) =>
      seed.post<{ id: string }>('price_lists', {
        name,
        rules: [{ type: 'volume_rule', preferences: { min_quantity: 1000 } }],
      }),
    )
    await openPriceList(page, list.id, name)
    await expect(priceListStatus(page)).toHaveText('Draft')
    await page.getByRole('main').getByRole('button', { name: 'Activate', exact: true }).click()
    await expect(confirmation(page).getByText('Activate price list?')).toBeVisible()
    await confirmation(page).getByRole('button', { name: 'Activate', exact: true }).click()
    await expect(toast(page, 'Price list activated')).toBeVisible({ timeout: 15_000 })
    await expect(priceListStatus(page)).toHaveText('Active')
    const steps: Steps = [{ step: 'activated the draft list, confirming', status: 'Active' }]

    await reload(page)
    await expect(priceListStatus(page)).toHaveText('Active', { timeout: 15_000 })
    await expect(
      page.getByRole('main').getByRole('button', { name: 'Deactivate', exact: true }),
    ).toBeVisible()
    steps.push({ step: 'reloaded', status: await priceListStatus(page).innerText() })
    await save(page, 'price-list-activated', steps, outside)
  })

  test("the price lists' priority order", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /^\/api\/v3\/admin\/price_lists\/[^/]+$/, answeredEmpty)
    const lists = [named('First priority'), named('Second priority')]
    // A catalog that prices by hand owns a price list, which this page does not
    // list. One is added first, as the catalogs' tests above also add, so the
    // order is checked in a store that has one ahead of the lists moved (SD-25).
    // P9_NO_CATALOG_LIST=1 leaves it out, for the control run of this test alone.
    await seeded(baseURL, async (seed) => {
      if (!withoutCatalogList) await fixedCatalog(seed, named('Priority catalog'), [])
      for (const name of lists) await seed.post('price_lists', { name })
    })
    const shown = async () =>
      page.getByRole('main').getByRole('table').getByRole('button').allInnerTexts()
    const order = async () => (await shown()).filter((name) => lists.includes(name))
    await openIn(page, ids.store, '/products/price-lists')
    await expect.poll(order, { timeout: 15_000 }).toEqual(lists)
    const steps: Steps = [{ step: 'opened the price lists', order: lists }]

    await moveDownOnePlace(page, recordRow(page, lists[0]))
    const moved = [lists[1], lists[0]]
    await page.waitForLoadState('networkidle')
    await expect.soft
      .poll(order, {
        message: 'the first list below the second once the move is saved',
        timeout: 15_000,
      })
      .toEqual(moved)
    steps.push({
      step: 'moved the first list one place down with the keyboard',
      order: await order(),
      lists: (await shown()).filter((name) => name.endsWith(stamp)),
    })

    await reload(page)
    await expect.soft
      .poll(order, { message: 'the first list below the second after a reload', timeout: 15_000 })
      .toEqual(moved)
    steps.push({
      step: 'reloaded',
      order: await order(),
      lists: (await shown()).filter((name) => name.endsWith(stamp)),
    })
    await save(
      page,
      withoutCatalogList ? 'price-list-priority-control' : 'price-list-priority',
      steps,
      outside,
    )
  })
})

// --- Imports page ---------------------------------------------------------

/** A completed price import with one row imported and one failed, into its own list. */
async function completedImport(baseURL: string | undefined, label: string) {
  const fileName = `p9-${label}-${stamp}.csv`
  const sku = `P9-${label.toUpperCase()}-${stamp}`
  const file = prices(fileName, sku, '21.00')
  const created = await seeded(baseURL, async (seed) => {
    await skuProduct(seed, named(`${label} product`), sku)
    const list = await seed.post<{ id: string }>('price_lists', { name: named(`${label} list`) })
    return importedThroughApi(seed, 'price_list_prices', file, { price_list_id: list.id })
  })
  return { ...created, fileName, content: file.buffer.toString('utf8') }
}

const importRow = (page: Page, number: string) =>
  page.getByRole('row').filter({ has: page.getByRole('button', { name: number, exact: true }) })

async function findImport(page: Page, number: string) {
  await openIn(page, ids.store, '/settings/imports')
  await expect(page.getByRole('heading', { name: 'Imports', level: 1 })).toBeVisible({
    timeout: 15_000,
  })
  await page.getByRole('searchbox', { name: 'Search by number…' }).fill(number)
  await expect(importRow(page, number)).toBeVisible({ timeout: 15_000 })
  return importRow(page, number)
}

async function importAction(page: Page, number: string, action: string | RegExp) {
  await importRow(page, number).getByRole('button', { name: 'Open actions' }).click()
  await page.getByRole('menuitem', { name: action }).click()
}

test.describe('the imports page (P9, G-61)', () => {
  test("an import's results", async ({ page, baseURL }) => {
    test.setTimeout(180_000)
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    if (sabotaged)
      await page.route(
        (url) => /^\/api\/v3\/admin\/imports\/[^/]+$/.test(url.pathname),
        answeredEdited((body) => ({ ...body, completed_rows_count: 0, failed_rows_count: 0 })),
      )
    const imported = await completedImport(baseURL, 'results')
    const row = await findImport(page, imported.number)
    await expect(row).toContainText('Completed')
    await importAction(page, imported.number, 'View')
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText(/import completed/i)).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByText('1 rows imported · 1 failed')).toBeVisible()
    await expect(dialog.getByText('Failed rows', { exact: true })).toBeVisible()
    const steps: Steps = [
      {
        step: 'found the import by its number and viewed it',
        summary: '1 rows imported · 1 failed',
      },
    ]

    await reload(page)
    await expect(page.getByRole('dialog').getByText(/import completed/i)).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('dialog').getByText('1 rows imported · 1 failed')).toBeVisible()
    steps.push({ step: 'reloaded; the results open again' })
    await save(page, 'import-results', steps, outside)
  })

  test("downloading an import's original file", async ({ page, baseURL }) => {
    test.setTimeout(180_000)
    const outside = await blockOutside(page)
    await sabotage(page, 'GET', /^\/api\/v3\/admin\/imports\/[^/]+\/download$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/csv',
        headers: { 'Content-Disposition': 'attachment; filename="sabotaged.csv"' },
        body: 'sabotaged\n',
      }),
    )
    const imported = await completedImport(baseURL, 'original')
    await findImport(page, imported.number)
    const download = async () => {
      const downloading = page.waitForEvent('download', { timeout: 60_000 })
      await importAction(page, imported.number, 'Download original file')
      const file = await downloading
      return { name: file.suggestedFilename(), text: await textOf(file) }
    }
    const first = await download()
    expect(first).toEqual({ name: imported.fileName, text: imported.content })
    const steps: Steps = [{ step: 'downloaded the original file', file: first.name }]

    await reload(page)
    await expect(importRow(page, imported.number)).toBeVisible({ timeout: 15_000 })
    const again = await download()
    expect(again).toEqual(first)
    steps.push({ step: 'reloaded and downloaded it again; the same file', file: again.name })
    await save(page, 'import-original-file', steps, outside)
  })

  test('deleting an import', async ({ page, baseURL }) => {
    test.setTimeout(180_000)
    const outside = await blockOutside(page)
    await sabotage(page, 'DELETE', /^\/api\/v3\/admin\/imports\/[^/]+$/, answeredEmpty)
    const imported = await completedImport(baseURL, 'deleted')
    await findImport(page, imported.number)
    await importAction(page, imported.number, /^delete$/i)
    await expect(confirmation(page).getByText('Delete import?')).toBeVisible()
    await confirmation(page)
      .getByRole('button', { name: /^delete$/i })
      .click()
    await expect(importRow(page, imported.number)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [{ step: 'deleted the import from its row, confirming' }]

    await reload(page)
    await expect(page.getByRole('searchbox', { name: 'Search by number…' })).toHaveValue(
      imported.number,
    )
    await page.waitForLoadState('networkidle')
    await expect(importRow(page, imported.number)).toHaveCount(0)
    steps.push({ step: 'reloaded with the search kept; the import is not listed' })
    await save(page, 'import-deleted', steps, outside)
  })
})
