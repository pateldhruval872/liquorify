import { mkdirSync, writeFileSync } from 'node:fs'
import {
  type APIRequestContext,
  expect,
  type Page,
  type Route,
  request,
  test,
} from '@playwright/test'
import {
  addRecordFilter,
  clickBulkAction,
  getCredentials,
  login,
  openRowMenu,
  rowButton,
} from '../../dashboard/e2e/helpers'
import { animationsFinished } from './animations'
import { fixture } from './catalog'
import { admin } from './staff'

/**
 * The platform batch's step P8: browser tests for the catalog behaviours that
 * part 1 of the catalog and pricing batch captured but no browser test drives
 * (G-57). Each drives the dashboard as the browser tests' admin, asserts what
 * the screen shows and, after a reload, what was kept.
 *
 * Start Spree's browser-test server and the built dashboard as
 * `compare.spec.ts` describes; the Storybook and the seller panel are not
 * needed. The records each test opens are added first through the Admin API,
 * named with this run's stamp so a second run on the same server finds its own.
 * Each test blocks every request that would leave the local servers and
 * records it.
 *
 * With `CATALOG_SABOTAGE=1`, each test first makes the browser undo, in the
 * request it sends, the change the test then looks for: a filter dropped from
 * the list request, a product left out of the bulk request, a field or an order
 * left out of a save, a delete never sent. Each test is then expected to fail,
 * and the run passes only if every one does, which shows each assertion fails
 * when what it checks does not happen.
 *
 * Results go to `results/catalog-behaviours/` (or `catalog-behaviours-checks/`
 * when sabotaged): one JSON file and one screenshot for each test, with what
 * each step showed and the revision from `FIDELITY_REVISION`.
 */

const sabotaged = process.env.CATALOG_SABOTAGE === '1'
const results = new URL(
  sabotaged ? './results/catalog-behaviours-checks/' : './results/catalog-behaviours/',
  import.meta.url,
).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const stamp = process.env.CATALOG_STAMP ?? Date.now().toString(36)

/** Spree's own answer when a product type that products use is deleted. */
const productTypeInUse = 'Cannot delete record because dependent products exist'

const named = (name: string) => `P8 ${name} ${stamp}`

const names = {
  channel: named('Channel'),
  usedType: named('Spirits'),
  renamedType: named('Liqueurs'),
  newTypeName: named('Cordials'),
  unusedType: named('Unused type'),
  tag: `p8-tag-${stamp}`,
  collection: named('Collection'),
  optionTypes: {
    pointer: `p8-size-pointer-${stamp}`,
    keyboardOne: `p8-size-keys-one-${stamp}`,
    keyboardThree: `p8-size-keys-three-${stamp}`,
  },
  libraryFile: `p8-in-use-${stamp}.png`,
  libraryAlt: named('in-use picture'),
  products: {
    all: named('Amber'),
    channelOnly: named('Birch'),
    typeOnly: named('Cedar'),
    tagOnly: named('Dune'),
    none: named('Elm'),
    chosenFirst: named('Fir'),
    chosenSecond: named('Gorse'),
    notChosen: named('Hazel'),
    search: named('Ivy'),
    usesFile: named('Juniper'),
    keepsFile: named('Kestrel'),
  },
}

const sizes = ['small', 'medium', 'large', 'xlarge']

interface Records {
  storeId: string
  channel: string
  usedType: string
  renamedType: string
  unusedType: string
  collection: string
  products: Record<keyof typeof names.products, string>
  keptFile: { alt: string; filename: string }
}

let records: Records

type Headers = Record<string, string>

async function json<T>(response: Awaited<ReturnType<APIRequestContext['get']>>) {
  expect(response.ok(), await response.text()).toBeTruthy()
  return (await response.json()) as T
}

async function upload(api: APIRequestContext, headers: Headers, filename: string) {
  const bytes = fixture('product-clay.png')
  const created = await json<{ signed_id: string }>(
    await api.post('/api/v3/admin/files', {
      headers,
      multipart: {
        filename,
        content_type: 'image/png',
        byte_size: String(bytes.length),
        visibility: 'public',
        file: { name: filename, mimeType: 'image/png', buffer: bytes },
      },
    }),
  )
  return created.signed_id
}

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

async function save(page: Page, name: string, steps: Record<string, unknown>[], outside: string[]) {
  mkdirSync(results, { recursive: true })
  await animationsFinished(page)
  await page.screenshot({ path: `${results}${name}.png` })
  writeFileSync(
    `${results}${name}.json`,
    `${JSON.stringify({ test: name, revision, stamp, sabotaged, steps, outside }, null, 2)}\n`,
  )
}

/**
 * In a sabotaged run, marks the test as expected to fail and hands each
 * matching request to `undo`, which sends it without the change the test then
 * looks for.
 */
async function sabotage(
  page: Page,
  method: string,
  path: RegExp,
  undo: (route: Route) => Promise<unknown>,
) {
  test.fail(sabotaged, 'Sabotaged: the change this test looks for is undone in the browser')
  if (!sabotaged) return
  await page.route(
    (url) => path.test(url.pathname),
    (route) => (route.request().method() === method ? undo(route) : route.continue()),
  )
}

/** Sends a JSON request on with `edit` applied to its body. */
const withBody =
  (edit: (body: Record<string, unknown>) => Record<string, unknown>) => (route: Route) =>
    route.continue({ postData: JSON.stringify(edit(route.request().postDataJSON() ?? {})) })

const openStore = async (page: Page, path = '') => {
  await page.goto(`/${records.storeId}${path}`)
  await page.waitForLoadState('networkidle')
}

const reload = async (page: Page) => {
  await page.reload()
  await page.waitForLoadState('networkidle')
}

// --- The product list ------------------------------------------------------

const range = (page: Page) => page.getByText(/^\d+–\d+ of \d+$/)
const listed = (page: Page) => page.locator('tbody tr td:nth-child(2)').allInnerTexts()

async function openProducts(page: Page) {
  await openStore(page, '/products')
  await expect(page.getByRole('button', { name: /add product/i })).toBeVisible({
    timeout: 15_000,
  })
  await expect(range(page)).toBeVisible({ timeout: 15_000 })
}

/**
 * Filters the product list by one related record, then clears the filter:
 * the list shows exactly `matching` while filtered, after a reload too, and
 * the whole catalog again once cleared.
 */
async function filterAndClear(
  page: Page,
  name: string,
  field: RegExp,
  value: string,
  matching: string[],
  predicate: RegExp,
) {
  const outside = await blockOutside(page)
  await sabotage(page, 'GET', /^\/api\/v3\/admin\/products$/, (route) => {
    const url = new URL(route.request().url())
    for (const key of [...url.searchParams.keys()])
      if (predicate.test(key)) url.searchParams.delete(key)
    return route.continue({ url: url.toString() })
  })
  await login(page)
  await openProducts(page)
  const whole = await range(page).innerText()
  const steps: Record<string, unknown>[] = [{ step: 'opened the product list', range: whole }]

  await addRecordFilter(page, field, value)
  const remove = page.getByRole('button', { name: 'Remove filter' })
  const chip = remove.locator('xpath=..')
  await expect(chip).toContainText('is any of')
  await expect(chip).toContainText(value)
  await expect(range(page)).toHaveText(`1–${matching.length} of ${matching.length}`, {
    timeout: 15_000,
  })
  await expect.poll(async () => (await listed(page)).sort()).toEqual([...matching].sort())
  steps.push({
    step: `filtered by ${value}`,
    chip: (await chip.innerText()).replace(/\s+/g, ' '),
    range: await range(page).innerText(),
    listed: await listed(page),
  })

  await reload(page)
  await expect(chip).toContainText(value, { timeout: 15_000 })
  await expect(range(page)).toHaveText(`1–${matching.length} of ${matching.length}`, {
    timeout: 15_000,
  })
  await expect.poll(async () => (await listed(page)).sort()).toEqual([...matching].sort())
  steps.push({ step: 'reloaded; still filtered', listed: await listed(page) })

  await remove.click()
  await expect(remove).toHaveCount(0)
  await expect(range(page)).toHaveText(whole, { timeout: 15_000 })
  await reload(page)
  await expect(range(page)).toHaveText(whole, { timeout: 15_000 })
  await expect(remove).toHaveCount(0)
  steps.push({ step: 'cleared the filter, then reloaded', range: await range(page).innerText() })

  await save(page, name, steps, outside)
}

// --- Setting up ------------------------------------------------------------

test.beforeAll(async ({ baseURL }) => {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const post = <T>(path: string, data: object) =>
      api.post(`/api/v3/admin/${path}`, { headers, data }).then((res) => json<T>(res))

    const channel = await post<{ id: string }>('channels', {
      name: names.channel,
      code: `p8-${stamp}`,
    })
    const usedType = await post<{ id: string }>('product_types', { name: names.usedType })
    const renamedType = await post<{ id: string }>('product_types', { name: names.renamedType })
    const unusedType = await post<{ id: string }>('product_types', { name: names.unusedType })
    const collection = await post<{ id: string }>('collections', { name: names.collection })
    for (const name of Object.values(names.optionTypes))
      await post('option_types', {
        name,
        label: named('Size'),
        option_values: sizes.map((value, index) => ({
          name: value,
          label: value.toUpperCase(),
          position: index + 1,
        })),
      })

    const product = async (name: string, extra: object = {}) =>
      (
        await post<{ id: string }>('products', {
          name,
          status: 'active',
          prices: [{ amount: '12.00', currency: 'USD' }],
          ...extra,
        })
      ).id
    const onChannel = { product_publications: [{ channel_id: channel.id }] }
    const ofType = { product_type_id: usedType.id }
    const tagged = { tags: [names.tag] }
    const picture = (filename: string, alt: string) =>
      upload(api, headers, filename).then((signed_id) => ({ media: [{ signed_id, alt }] }))

    const keptAlt = named('kept picture')
    const keptFilename = `p8-kept-${stamp}.png`
    records = {
      storeId: getCredentials().store_id,
      channel: channel.id,
      usedType: usedType.id,
      renamedType: renamedType.id,
      unusedType: unusedType.id,
      collection: collection.id,
      products: {
        all: await product(names.products.all, { ...onChannel, ...ofType, ...tagged }),
        channelOnly: await product(names.products.channelOnly, onChannel),
        typeOnly: await product(names.products.typeOnly, ofType),
        tagOnly: await product(names.products.tagOnly, tagged),
        none: await product(names.products.none),
        chosenFirst: await product(names.products.chosenFirst),
        chosenSecond: await product(names.products.chosenSecond),
        notChosen: await product(names.products.notChosen),
        search: await product(names.products.search),
        usesFile: await product(
          names.products.usesFile,
          await picture(names.libraryFile, names.libraryAlt),
        ),
        keepsFile: await product(names.products.keepsFile, await picture(keptFilename, keptAlt)),
      },
      keptFile: { alt: keptAlt, filename: keptFilename },
    }
  } finally {
    await api.dispose()
  }
})

// --- 1. The product list's filters ------------------------------------------

test('filters: a channel lists only its products, and clearing lists them all again', async ({
  page,
}) => {
  await filterAndClear(
    page,
    'filter-by-channel',
    /^sales channels$/i,
    names.channel,
    [names.products.all, names.products.channelOnly],
    /^q\[channels_id/,
  )
})

test('filters: a product type lists only its products, and clearing lists them all again', async ({
  page,
}) => {
  await filterAndClear(
    page,
    'filter-by-product-type',
    /^product type$/i,
    names.usedType,
    [names.products.all, names.products.typeOnly],
    /^q\[product_type_id/,
  )
})

test('filters: a tag lists only its products, and clearing lists them all again', async ({
  page,
}) => {
  await filterAndClear(
    page,
    'filter-by-tag',
    /^tags$/i,
    names.tag,
    [names.products.all, names.products.tagOnly],
    /^q\[tags/,
  )
})

// --- 2. Adding to collections in bulk ---------------------------------------

test('bulk actions: products chosen on the list are added to a collection, and stay in it', async ({
  page,
}) => {
  const outside = await blockOutside(page)
  await sabotage(
    page,
    'POST',
    /\/products\/bulk_add_to_collections$/,
    withBody((body) => ({ ...body, ids: (body.ids as string[]).slice(0, 1) })),
  )
  await login(page)
  await openProducts(page)
  await page.getByPlaceholder(/^search…$/i).fill(stamp)
  const row = (name: string) => page.locator('tr').filter({ hasText: name })
  for (const name of [names.products.chosenFirst, names.products.chosenSecond])
    await row(name)
      .getByRole('checkbox', { name: /select row/i })
      .check()
  await expect(page.getByText(/^2 selected$/)).toBeVisible()
  const steps: Record<string, unknown>[] = [
    {
      step: 'chose two products',
      chosen: [names.products.chosenFirst, names.products.chosenSecond],
    },
  ]

  await clickBulkAction(page, /^add to collections/i)
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Add to collections' })).toBeVisible()
  await dialog.getByRole('combobox').fill(names.collection)
  await page.getByRole('option', { name: names.collection }).click()
  await dialog.getByRole('button', { name: /^add$/i }).click()
  await expect(page.getByText('Products added to the collections')).toBeVisible({
    timeout: 15_000,
  })
  steps.push({ step: `added them to ${names.collection}` })

  await openStore(page, `/products/collections/${records.collection}`)
  await reload(page)
  const products = page
    .locator('[data-slot="card"]')
    .filter({ hasText: names.products.chosenFirst })
  for (const name of [names.products.chosenFirst, names.products.chosenSecond])
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('link', { name: names.products.notChosen, exact: true })).toHaveCount(
    0,
  )
  steps.push({
    step: 'opened the collection and reloaded it',
    products: await products.getByRole('link').allInnerTexts(),
  })

  await save(page, 'bulk-add-to-collection', steps, outside)
})

// --- 3. The search engine card ----------------------------------------------

test('search engine card: a new slug, meta title and meta description are kept after a reload', async ({
  page,
}) => {
  const outside = await blockOutside(page)
  await sabotage(
    page,
    'PATCH',
    /^\/api\/v3\/admin\/products\/prod_[^/]+$/,
    withBody((body) => {
      const { slug: _slug, meta_title: _title, meta_description: _description, ...rest } = body
      return rest
    }),
  )
  const values = {
    slug: `p8-ivy-${stamp}`,
    title: `Ivy, poured by hand ${stamp}`,
    description: `A description for search engines, written in P8 run ${stamp}.`,
  }
  await login(page)
  await openStore(page, `/products/${records.products.search}`)
  const slug = page.locator('#product-slug')
  const title = page.locator('#product-meta-title')
  const description = page.locator('#product-meta-description')
  await expect(slug).toBeVisible({ timeout: 15_000 })
  const steps: Record<string, unknown>[] = [
    {
      step: 'opened the product',
      slug: await slug.inputValue(),
      metaTitle: await title.inputValue(),
      metaDescription: await description.inputValue(),
    },
  ]

  await slug.fill(values.slug)
  await title.fill(values.title)
  await description.fill(values.description)
  await page.getByRole('button', { name: /save product/i }).click()
  await expect(page.getByText(/product saved/i)).toBeVisible({ timeout: 15_000 })
  steps.push({ step: 'changed all three and saved', ...values })

  await reload(page)
  await expect(slug).toHaveValue(values.slug, { timeout: 15_000 })
  await expect(title).toHaveValue(values.title)
  await expect(description).toHaveValue(values.description)
  await expect(page.getByText(`example.com/products/${values.slug}`)).toBeVisible()
  steps.push({
    step: 'reloaded',
    slug: await slug.inputValue(),
    metaTitle: await title.inputValue(),
    metaDescription: await description.inputValue(),
  })

  await slug.scrollIntoViewIfNeeded()
  await save(page, 'search-engine-card', steps, outside)
})

// --- 4. Product types --------------------------------------------------------

const typeRow = (page: Page, name: string) => page.locator('tbody tr').filter({ hasText: name })

async function openProductTypes(page: Page) {
  await openStore(page, '/settings/product-types')
  await expect(page.getByRole('button', { name: /add product type/i })).toBeVisible({
    timeout: 15_000,
  })
}

async function confirmDeleteType(page: Page, name: string) {
  await openRowMenu(page, name)
  await page.getByRole('menuitem', { name: /^delete$/i }).click()
  const confirm = page.getByRole('dialog')
  await expect(confirm.getByRole('heading', { name: 'Delete product type' })).toBeVisible()
  await confirm.getByRole('button', { name: /^delete$/i }).click()
  await expect(confirm).toBeHidden()
}

test('product types: renaming one keeps the new name after a reload', async ({ page }) => {
  const outside = await blockOutside(page)
  await sabotage(
    page,
    'PATCH',
    /^\/api\/v3\/admin\/product_types\/[^/]+$/,
    withBody((body) => {
      const { name: _name, ...rest } = body
      return rest
    }),
  )
  await login(page)
  await openProductTypes(page)
  await page.getByText(names.renamedType, { exact: true }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('heading', { name: 'Edit product type' })).toBeVisible()
  await expect(sheet.locator('#name')).toHaveValue(names.renamedType, { timeout: 15_000 })
  await sheet.locator('#name').fill(names.newTypeName)
  await sheet.getByRole('button', { name: /^save$/i }).click()
  await expect(page.getByText('Product type updated')).toBeVisible({ timeout: 15_000 })
  const steps: Record<string, unknown>[] = [
    { step: 'renamed it and saved', from: names.renamedType, to: names.newTypeName },
  ]

  await openProductTypes(page)
  await reload(page)
  await expect(typeRow(page, names.newTypeName)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(names.renamedType, { exact: true })).toHaveCount(0)
  await page.getByText(names.newTypeName, { exact: true }).click()
  await expect(page.getByRole('dialog').locator('#name')).toHaveValue(names.newTypeName, {
    timeout: 15_000,
  })
  steps.push({
    step: 'reloaded the list and opened it again',
    name: await page.getByRole('dialog').locator('#name').inputValue(),
  })

  await save(page, 'product-type-renamed', steps, outside)
})

test('product types: deleting one that no product uses removes it', async ({ page }) => {
  const outside = await blockOutside(page)
  await sabotage(page, 'DELETE', /^\/api\/v3\/admin\/product_types\/[^/]+$/, (route) =>
    route.fulfill({ status: 204 }),
  )
  await login(page)
  await openProductTypes(page)
  await expect(typeRow(page, names.unusedType)).toBeVisible({ timeout: 15_000 })
  await confirmDeleteType(page, names.unusedType)
  await expect(page.getByText('Product type deleted')).toBeVisible({ timeout: 15_000 })
  const steps: Record<string, unknown>[] = [{ step: `deleted ${names.unusedType}` }]

  await reload(page)
  await expect(page.getByRole('button', { name: /add product type/i })).toBeVisible({
    timeout: 15_000,
  })
  await expect(typeRow(page, names.usedType)).toBeVisible({ timeout: 15_000 })
  await expect(typeRow(page, names.unusedType)).toHaveCount(0)
  steps.push({
    step: 'reloaded',
    listed: await page.locator('tbody tr td:first-child').allInnerTexts(),
  })

  await save(page, 'product-type-deleted', steps, outside)
})

test("product types: deleting one that products use is refused with Spree's message, and it stays", async ({
  page,
}) => {
  const outside = await blockOutside(page)
  // Sabotaged, the list after the reload leaves the type out, as if the delete had gone through.
  await sabotage(page, 'GET', /^\/api\/v3\/admin\/product_types$/, async (route) => {
    const response = await route.fetch()
    const body = (await response.json()) as { data: { id: string }[]; meta?: object }
    await route.fulfill({
      response,
      json: { ...body, data: body.data.filter((type) => type.id !== records.usedType) },
    })
  })
  await login(page)
  await openProductTypes(page)
  await expect(typeRow(page, names.usedType)).toBeVisible({ timeout: 15_000 })
  const answer = page.waitForResponse(
    (res) =>
      res.request().method() === 'DELETE' &&
      res.url().includes(`/product_types/${records.usedType}`),
  )
  await confirmDeleteType(page, names.usedType)
  const server = await answer
  const steps: Record<string, unknown>[] = [
    {
      step: `confirmed deleting ${names.usedType}, which two products use`,
      serverStatus: server.status(),
      serverMessage: ((await server.json()) as { error?: { message?: string } }).error?.message,
    },
  ]

  // Kept soft so the run still checks, and records, that the type stays.
  await expect
    .soft(page.getByText(productTypeInUse), "Spree's refusal is shown")
    .toBeVisible({ timeout: 5_000 })
  steps.push({
    step: 'looked for the refusal',
    shown: await page.getByText(productTypeInUse).isVisible(),
    toasts: await page.locator('[role="status"][data-type]').allInnerTexts(),
  })
  await animationsFinished(page)
  mkdirSync(results, { recursive: true })
  await page.screenshot({ path: `${results}product-type-delete-refused-after-confirming.png` })

  await reload(page)
  await expect(typeRow(page, names.usedType)).toBeVisible({ timeout: 15_000 })
  steps.push({
    step: 'reloaded; the type is still listed',
    row: await typeRow(page, names.usedType).innerText(),
  })

  await save(page, 'product-type-delete-refused', steps, outside)
})

// --- 5. Option values --------------------------------------------------------

async function openOptionType(page: Page, name: string) {
  await openStore(page, '/products/options')
  await rowButton(page, name).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('heading', { name })).toBeVisible({
    timeout: 15_000,
  })
  return sheet
}

/** The values in the order the sheet shows them; the first "Internal name" is the type's own. */
const shownOrder = async (page: Page) =>
  (
    await page
      .getByRole('dialog')
      .locator('tbody tr')
      .getByLabel('Internal name')
      .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value))
  ).filter(Boolean)

const undoReorder = withBody((body) => ({
  ...body,
  option_values: [...((body.option_values as { name: string }[]) ?? [])]
    .sort((a, b) => sizes.indexOf(a.name) - sizes.indexOf(b.name))
    .map((value, index) => ({ ...value, position: index + 1 })),
}))

async function saveAndReopen(page: Page, name: string, steps: Record<string, unknown>[]) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^save$/i })
    .click()
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 })
  steps.push({ step: 'saved' })
  await reload(page)
  await openOptionType(page, name)
}

test('option values: an order made with the pointer is kept after a reload', async ({ page }) => {
  const outside = await blockOutside(page)
  await sabotage(page, 'PATCH', /^\/api\/v3\/admin\/option_types\/[^/]+$/, undoReorder)
  await login(page)
  const sheet = await openOptionType(page, names.optionTypes.pointer)
  const before = await shownOrder(page)
  const steps: Record<string, unknown>[] = [{ step: 'opened the option type', order: before }]

  const grips = sheet.getByRole('button', { name: 'Drag to reorder' })
  const from = await grips.nth(0).boundingBox()
  const to = await grips.nth(2).boundingBox()
  if (!from || !to) throw new Error('The value rows have no grips to drag')
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(from.x + from.width / 2, to.y + to.height / 2 + 4, { steps: 12 })
  await page.mouse.up()
  const expected = [before[1], before[2], before[0], before[3]]
  await expect.poll(() => shownOrder(page)).toEqual(expected)
  steps.push({ step: 'dragged the first value below the third', order: await shownOrder(page) })

  await saveAndReopen(page, names.optionTypes.pointer, steps)
  await expect.poll(() => shownOrder(page), { timeout: 15_000 }).toEqual(expected)
  steps.push({ step: 'reloaded and opened it again', order: await shownOrder(page) })

  await save(page, 'option-values-pointer', steps, outside)
})

/**
 * Moves one value with the keyboard: Space picks it up, the arrow key is
 * pressed `presses` times, and Space drops it. dnd-kit announces each step in
 * the sheet's live region; a press that moves nothing changes nothing to wait
 * for, so each step is given the same time, from the pick-up on.
 */
async function keyboardMove(
  page: Page,
  index: number,
  key: 'ArrowUp' | 'ArrowDown',
  presses: number,
) {
  const grips = page.getByRole('dialog').getByRole('button', { name: 'Drag to reorder' })
  const announced = page.locator('[id^="DndLiveRegion"]', { hasText: /draggable item/i }).first()
  const overArea = async () => (await announced.innerText()).match(/droppable area (\S+?)\.?$/)?.[1]
  await grips.nth(index).focus()
  await page.keyboard.press('Space')
  // Picking a value up announces it over its own place.
  await expect(announced).toContainText('was moved over')
  const places = [await overArea()]
  for (let press = 0; press < presses; press++) {
    await page.waitForTimeout(500)
    await page.keyboard.press(key)
    await page.waitForTimeout(500)
    places.push(await overArea())
  }
  await page.keyboard.press('Space')
  await expect(announced).toContainText('was dropped')
  // The places the value was announced over, the one it was picked up from included.
  return new Set(places).size
}

test('option values: a value moved one place with the keyboard keeps it after a reload', async ({
  page,
}) => {
  const outside = await blockOutside(page)
  await sabotage(page, 'PATCH', /^\/api\/v3\/admin\/option_types\/[^/]+$/, undoReorder)
  await login(page)
  await openOptionType(page, names.optionTypes.keyboardOne)
  const before = await shownOrder(page)
  const steps: Record<string, unknown>[] = [{ step: 'opened the option type', order: before }]

  const places = await keyboardMove(page, 0, 'ArrowDown', 1)
  const expected = [before[1], before[0], before[2], before[3]]
  await expect.poll(() => shownOrder(page)).toEqual(expected)
  steps.push({
    step: 'picked up the first value with Space, pressed ArrowDown once and dropped it with Space',
    placesAnnounced: places,
    order: await shownOrder(page),
  })

  await saveAndReopen(page, names.optionTypes.keyboardOne, steps)
  await expect.poll(() => shownOrder(page), { timeout: 15_000 }).toEqual(expected)
  steps.push({ step: 'reloaded and opened it again', order: await shownOrder(page) })

  await save(page, 'option-values-keyboard-one-place', steps, outside)
})

test('option values: a value moved three places in one keyboard pick-up keeps them after a reload', async ({
  page,
}) => {
  const outside = await blockOutside(page)
  await sabotage(page, 'PATCH', /^\/api\/v3\/admin\/option_types\/[^/]+$/, undoReorder)
  await login(page)
  await openOptionType(page, names.optionTypes.keyboardThree)
  const before = await shownOrder(page)
  const steps: Record<string, unknown>[] = [{ step: 'opened the option type', order: before }]

  const places = await keyboardMove(page, 3, 'ArrowUp', 3)
  // Settled once the drop has been applied, whether or not the value moved.
  await page.waitForTimeout(500)
  const moved = await shownOrder(page)
  steps.push({
    step: 'picked up the last value with Space, pressed ArrowUp three times and dropped it with Space',
    placesAnnounced: places,
    order: moved,
  })
  // Kept soft so the run still saves, and records, whatever order the keyboard made.
  expect
    .soft(moved, 'three presses of ArrowUp take the last value to the top')
    .toEqual([before[3], before[0], before[1], before[2]])

  // Save stays disabled while the order is unchanged, so there is then nothing to save.
  if (moved.join() === before.join()) {
    steps.push({ step: 'nothing moved, so there was nothing to save' })
  } else {
    await saveAndReopen(page, names.optionTypes.keyboardThree, steps)
    await expect.poll(() => shownOrder(page), { timeout: 15_000 }).toEqual(moved)
    steps.push({ step: 'reloaded and opened it again', order: await shownOrder(page) })
  }

  await save(page, 'option-values-keyboard-three-places', steps, outside)
})

// --- 6. A library file in use -------------------------------------------------

async function openLibraryFile(page: Page, filename: string, alt: string) {
  await openStore(page, '/products/media')
  await expect(page.getByRole('heading', { name: /^media$/i })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('searchbox').fill(filename)
  const tile = page.getByRole('listitem').filter({ hasText: alt }).getByRole('button')
  await expect(tile).toBeVisible({ timeout: 15_000 })
  await tile.click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('heading', { name: filename })).toBeVisible({ timeout: 15_000 })
  return sheet
}

/** Closes the file's panel and asks to delete it from its tile's menu, the library's only delete. */
async function askToDelete(page: Page, alt: string) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^cancel$/i })
    .click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await page
    .getByRole('listitem')
    .filter({ hasText: alt })
    .getByRole('button')
    .click({ button: 'right' })
  await page.getByRole('menuitem', { name: /^delete$/i }).click()
  const confirm = page.getByRole('dialog').or(page.getByRole('alertdialog'))
  await expect(confirm.getByRole('heading', { name: 'Delete this file?' })).toBeVisible()
  await expect(confirm.getByText(`Deleting “${alt}” removes it from your library`)).toBeVisible()
  return confirm
}

test('library file in use: the library names where it is used, and the delete warns before anything goes', async ({
  page,
}) => {
  const outside = await blockOutside(page)
  // Sabotaged, the library and the product answer as if the file had gone.
  await sabotage(page, 'GET', /^\/api\/v3\/admin\/(media|products\/prod_[^/]+\/media)$/, (route) =>
    route.fulfill({
      json: { data: [], meta: { count: 0, page: 1, pages: 1, limit: 25, from: 0, to: 0 } },
    }),
  )
  const { alt, filename } = records.keptFile
  await login(page)
  const sheet = await openLibraryFile(page, filename, alt)
  const usedIn = sheet.getByRole('link', { name: names.products.keepsFile })
  await expect(usedIn).toBeVisible({ timeout: 15_000 })
  const steps: Record<string, unknown>[] = [
    { step: 'opened the file', usedIn: await usedIn.innerText() },
  ]

  const confirm = await askToDelete(page, alt)
  const warning = confirm.getByText(/removes it from your library and from the 1 place using it/)
  await expect(warning).toBeVisible()
  steps.push({ step: 'asked to delete it', warning: await warning.innerText() })
  await animationsFinished(page)
  mkdirSync(results, { recursive: true })
  await page.screenshot({ path: `${results}library-file-in-use-warning.png` })
  await confirm.getByRole('button', { name: /^cancel$/i }).click()
  await expect(confirm).toBeHidden()
  steps.push({ step: 'cancelled' })

  await openStore(page, '/products/media')
  await reload(page)
  await page.getByRole('searchbox').fill(filename)
  await expect(page.getByRole('listitem').filter({ hasText: alt })).toBeVisible({ timeout: 15_000 })
  await openStore(page, `/products/${records.products.keepsFile}`)
  await reload(page)
  await expect(page.getByRole('img', { name: alt })).toBeVisible({ timeout: 15_000 })
  steps.push({ step: 'reloaded the library and the product; the file is on both' })

  await save(page, 'library-file-in-use-warning', steps, outside)
})

test('library file in use: confirming the delete removes it from the library and from the product', async ({
  page,
}) => {
  const outside = await blockOutside(page)
  // Sabotaged, the delete is answered in the browser and never reaches the server.
  await sabotage(page, 'DELETE', /^\/api\/v3\/admin\/media\/[^/]+$/, (route) =>
    route.fulfill({ status: 204 }),
  )
  await login(page)
  const sheet = await openLibraryFile(page, names.libraryFile, names.libraryAlt)
  const usedIn = sheet.getByRole('link', { name: names.products.usesFile })
  await expect(usedIn).toBeVisible({ timeout: 15_000 })
  const steps: Record<string, unknown>[] = [
    { step: 'opened the file', usedIn: await usedIn.innerText() },
  ]

  const confirm = await askToDelete(page, names.libraryAlt)
  await expect(confirm.getByText(/and from the 1 place using it/)).toBeVisible()
  const sent = page.waitForRequest(
    (req) => req.method() === 'DELETE' && /\/api\/v3\/admin\/media\/[^/?]+/.test(req.url()),
  )
  await confirm.getByRole('button', { name: /^delete$/i }).click()
  const deleted = await sent
  await expect(page.getByText('File deleted')).toBeVisible({ timeout: 15_000 })
  steps.push({
    step: 'confirmed the delete',
    sent: new URL(deleted.url()).search,
    serverStatus: (await deleted.response())?.status() ?? null,
    toast: 'File deleted',
  })

  await openStore(page, '/products/media')
  await reload(page)
  await page.getByRole('searchbox').fill(names.libraryFile)
  await expect(page.getByText('No files match your filters.')).toBeVisible({ timeout: 15_000 })
  await openStore(page, `/products/${records.products.usesFile}`)
  await reload(page)
  await expect(page.getByRole('heading', { name: names.products.usesFile })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.locator('#product-slug')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('img', { name: names.libraryAlt })).toHaveCount(0)
  steps.push({ step: 'reloaded the library and the product; the file is on neither' })

  await save(page, 'library-file-in-use-deleted', steps, outside)
})
