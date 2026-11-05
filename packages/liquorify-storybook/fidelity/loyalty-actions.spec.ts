import { readFileSync } from 'node:fs'
import { expect, type Page, type Route, test } from '@playwright/test'
import {
  escapeRegex,
  FIXTURE_PROMO_SKU,
  getCredentials,
  login,
  narrowQuickFilter,
  sortList,
} from '../../dashboard/e2e/helpers'
import {
  blockOutside,
  expectFailureWhenSabotaged,
  openIn,
  pickDate,
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
 * The platform batch's step P9, G-84: the promotion, gift card and store
 * credit behaviours part 3 of the catalog and pricing batch captured but no
 * browser test drives, as browser tests, apart from the three that need a
 * narrower role, which are P10's. Each drives the dashboard as the browser
 * tests' admin and asserts what the screen shows and, after a reload, what was
 * kept. A list's search or filter is kept in its address, so a reload shows
 * the same narrowed list again.
 *
 * Start Spree's browser-test server and the built dashboard as
 * `compare.spec.ts` describes; Spree's sample data is not needed. Each test
 * adds the records it opens through the Admin API first, named with the run's
 * stamp: promotions, customers, gift cards, store credits, and orders for the
 * browser tests' fixture product, placed and paid with a gift card or store
 * credit, for the used codes, cards and credits. Nothing is written to the
 * database directly. With `P9_SABOTAGE=1` each test undoes the change it looks
 * for (see p9.ts).
 *
 * Three tests answer a request themselves, because the state cannot be reached
 * otherwise: a promotion that fails to load, and a credit's history that is
 * empty or fails to load. They show how the screen handles that answer, not
 * that the server gives it.
 */

const { snap, save } = recorder('loyalty')

const named = (name: string) => `P9 ${name} ${stamp}`
const upper = (text: string) => text.toUpperCase()

let store: string

test.beforeEach(async ({ page }) => {
  test.setTimeout(150_000)
  store = getCredentials().store_id
  await login(page)
})

// --- Shared ---------------------------------------------------------------

const main = (page: Page) => page.getByRole('main')
const dialog = (page: Page) => page.getByRole('dialog')

const address = {
  first_name: 'Pat',
  last_name: 'Nine',
  address1: '1 Main St',
  city: 'Los Angeles',
  country_code: 'US',
  state_code: 'CA',
  postal_code: '90001',
  phone: '5555555555',
}

interface Customer {
  id: string
  email: string
}

async function customer(seed: Seed, label: string): Promise<Customer> {
  const email = `p9-${label}-${stamp}@example.com`
  const { id } = await seed.post<{ id: string }>('customers', {
    email,
    first_name: 'P9',
    last_name: label,
  })
  return { id, email }
}

/**
 * Places an order for one of the fixture product for a customer, with a code
 * applied when one is given, and pays it with `pay`: a gift card or the
 * customer's store credit.
 */
async function placedOrder(
  seed: Seed,
  customerId: string,
  pay: (orderId: string) => Promise<unknown>,
  code?: string,
) {
  const variants = await seed.get<{ data: { id: string }[] }>(
    `variants?q[sku_eq]=${FIXTURE_PROMO_SKU}`,
  )
  const order = await seed.post<{ id: string; number: string }>('orders', {
    customer_id: customerId,
    items: [{ variant_id: variants.data[0].id, quantity: 1 }],
    shipping_address: address,
    billing_address: address,
  })
  if (code) await seed.post(`orders/${order.id}/discount_codes`, { code })
  await pay(order.id)
  await seed.patch(`orders/${order.id}/complete`)
  return order
}

/** Sends a list request with its search or filter left out, so it lists everything. */
const unfiltered = (route: Route) => {
  const url = new URL(route.request().url())
  for (const key of [...url.searchParams.keys()])
    if (/search|q\[|filter/i.test(key)) url.searchParams.delete(key)
  return route.continue({ url: url.toString() })
}

/** Sends a list request with its sort left out, so it comes in the list's own order. */
const unsorted = (route: Route) => {
  const url = new URL(route.request().url())
  for (const key of [...url.searchParams.keys()])
    if (/sort|dir|q\[s\]/i.test(key)) url.searchParams.delete(key)
  return route.continue({ url: url.toString() })
}

/** Answers a read with Spree's own answer, edited. */
const edited =
  (edit: (body: Record<string, unknown>) => Record<string, unknown>) => async (route: Route) => {
    const response = await route.fetch()
    await route.fulfill({ response, json: edit(await response.json()) })
  }

/** Breaks a list or record answer's records with `change`, whatever its shape. */
const eachRecord =
  (change: (record: Record<string, unknown>) => Record<string, unknown>) =>
  (body: Record<string, unknown>) =>
    Array.isArray(body.data)
      ? { ...body, data: (body.data as Record<string, unknown>[]).map(change) }
      : change(body)

/** Reads a list in the browser while a sabotaged run hands its requests to `undo`. */
async function sabotageList(page: Page, path: RegExp, undo: (route: Route) => Promise<unknown>) {
  expectFailureWhenSabotaged()
  if (sabotaged)
    await page.route(
      (url) => path.test(url.pathname),
      (route) => (route.request().method() === 'GET' ? undo(route) : route.fallback()),
    )
}

/** A number as a person reads it, so "100.0" and "100" compare equal. */
const plain = (value: string) => value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')

/** Closes an open sheet, so a reload starts from the list. */
async function closeSheet(page: Page) {
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toHaveCount(0, { timeout: 15_000 })
}

const rowWith = (page: Page, text: string) =>
  main(page)
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: new RegExp(`^${escapeRegex(text)}(\\s|$)`) }) })

/** Adds a filter on records by searching for one and ticking it by its whole label. */
async function filterTo(page: Page, field: RegExp, value: string) {
  await page.getByRole('button', { name: /add filter/i }).click()
  await page.locator('[data-slot="filter-panel-item"]').getByText(field).click()
  await page.getByPlaceholder(/filter to…/i).fill(value)
  await page.getByRole('button', { name: value, exact: true }).click()
  await page.keyboard.press('Escape')
}

/** Adds a filter whose values are listed, by ticking one. */
async function filterByListed(page: Page, field: RegExp, value: RegExp) {
  await page.getByRole('button', { name: /add filter/i }).click()
  await page.locator('[data-slot="filter-panel-item"]').getByText(field).click()
  await page.getByRole('button', { name: value }).last().click()
  await page.keyboard.press('Escape')
}

// --- Promotions -----------------------------------------------------------

interface Promotion {
  id: string
  name: string
}

async function promotion(seed: Seed, label: string, data: object = {}): Promise<Promotion> {
  const name = named(label)
  const { id } = await seed.post<{ id: string }>('promotions', {
    name,
    kind: 'automatic',
    ...data,
  })
  return { id, name }
}

async function openPromotion(page: Page, { id, name }: Promotion) {
  await openIn(page, store, `/promotions/${id}`)
  await expect(main(page).getByRole('heading', { name, level: 1 })).toBeVisible({
    timeout: 15_000,
  })
}

async function openNewPromotion(page: Page) {
  await openIn(page, store, '/promotions/new')
  await expect(page.locator('#name')).toBeVisible({ timeout: 15_000 })
}

const savePromotion = async (page: Page) => {
  await main(page)
    .getByRole('button', { name: /^save$/i })
    .click()
  await expect(toast(page, /promotion saved/i)).toBeVisible({ timeout: 15_000 })
}

const scheduleField = (page: Page, label: 'Starts' | 'Expires') =>
  main(page)
    .getByRole('group')
    .filter({ has: page.getByText(label, { exact: true }) })
    .getByRole('button')
    .first()

const usageLimit = (page: Page) => page.locator('#usage_limit')

async function addRule(page: Page, label: RegExp) {
  await page.getByRole('button', { name: /^add rule$/i }).click()
  await dialog(page).getByRole('button', { name: label }).click()
  await expect(dialog(page).getByRole('button', { name: /^(save|add)$/i })).toBeVisible()
}

async function addAction(page: Page, label: RegExp) {
  await page.getByRole('button', { name: /^add action$/i }).click()
  await dialog(page).getByRole('button', { name: label }).click()
  await expect(page.locator('#calculator-type')).toBeEnabled({ timeout: 10_000 })
}

const saveEditor = async (page: Page) => {
  await dialog(page)
    .getByRole('button', { name: /^(save|add)$/i })
    .click()
  await expect(dialog(page)).toBeHidden()
}

/** Picks a result in the editor's search box. */
async function pickInEditor(page: Page, search: string, option: RegExp) {
  const picker = dialog(page).getByRole('combobox').last()
  await picker.click()
  await picker.fill(search)
  await page.getByRole('option', { name: option }).first().click()
}

async function chooseCalculator(page: Page, calculator: RegExp) {
  await page.locator('#calculator-type').click()
  await page.getByRole('option', { name: calculator }).click()
}

/** What a saved action's editor shows in its number fields, by label. */
async function numberFields(page: Page) {
  const fields = dialog(page).getByRole('spinbutton')
  const shown: [string, string][] = []
  for (const field of await fields.all()) {
    const label = await field.evaluate(
      (element) => (element as HTMLInputElement).labels?.[0]?.innerText ?? element.id,
    )
    shown.push([label.trim(), plain(await field.inputValue())])
  }
  return shown
}

const ruleButton = (page: Page, name: RegExp) => main(page).getByRole('button', { name })

/** A sabotaged save that leaves the promotion's rules or actions out. */
const withoutRulesOrActions = (key: 'rules' | 'actions') =>
  withBody((body) => ({ ...body, [key]: [] }))

test.describe('promotions (P9, G-84)', () => {
  test('a promotion with a typed code', async ({ page }) => {
    const outside = await blockOutside(page)
    const code = upper(`P9TYPED${stamp}`)
    const decoy = upper(`P9DECOY${stamp}`)
    await sabotage(
      page,
      'POST',
      /^\/api\/v3\/admin\/promotions$/,
      withBody((body) => ({ ...body, code: decoy })),
    )
    const name = named('Typed code')
    await openNewPromotion(page)
    await page.locator('#name').fill(name)
    await page.getByLabel('Code', { exact: true }).fill(code)
    await page.getByRole('button', { name: /^create promotion$/i }).click()
    await expect(main(page).getByRole('heading', { name, level: 1 })).toBeVisible({
      timeout: 15_000,
    })
    await expect(main(page).getByText(/^single coupon code/i)).toBeVisible()
    await expect(main(page).locator('code').first()).toHaveText(new RegExp(`^${code}$`, 'i'))
    const steps: Steps = [{ step: 'typed a code and created the promotion', code }]

    await reload(page)
    await expect(main(page).locator('code').first()).toHaveText(new RegExp(`^${code}$`, 'i'), {
      timeout: 15_000,
    })
    steps.push({ step: 'reloaded', shown: await main(page).locator('code').first().innerText() })
    await save(page, 'promotion-typed-code', steps, outside)
  })

  test('a promotion with a generated code', async ({ page }) => {
    const outside = await blockOutside(page)
    const decoy = upper(`P9DECOY${stamp}`)
    await sabotage(
      page,
      'POST',
      /^\/api\/v3\/admin\/promotions$/,
      withBody((body) => ({ ...body, code: decoy })),
    )
    const name = named('Generated code')
    await openNewPromotion(page)
    await page.locator('#name').fill(name)
    const field = page.getByLabel('Code', { exact: true })
    await expect(field).toHaveValue('')
    await main(page)
      .getByRole('button', { name: /^generate$/i })
      .click()
    await expect(field).not.toHaveValue('')
    const code = await field.inputValue()
    await page.getByRole('button', { name: /^create promotion$/i }).click()
    await expect(main(page).getByRole('heading', { name, level: 1 })).toBeVisible({
      timeout: 15_000,
    })
    await expect(main(page).locator('code').first()).toHaveText(
      new RegExp(`^${escapeRegex(code)}$`, 'i'),
    )
    const steps: Steps = [{ step: 'generated a code and created the promotion', code }]

    await reload(page)
    await expect(main(page).locator('code').first()).toHaveText(
      new RegExp(`^${escapeRegex(code)}$`, 'i'),
      { timeout: 15_000 },
    )
    steps.push({ step: 'reloaded', shown: await main(page).locator('code').first().innerText() })
    await save(page, 'promotion-generated-code', steps, outside)
  })

  test('a promotion with a batch of codes', async ({ page }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'POST',
      /^\/api\/v3\/admin\/promotions$/,
      withBody((body) => ({ ...body, number_of_codes: 3 })),
    )
    const name = named('Batch of codes')
    const prefix = upper(`P9B${stamp}`)
    await openNewPromotion(page)
    await page.locator('#name').fill(name)
    await page.getByRole('switch', { name: 'Generate a batch of unique codes' }).click()
    await page.locator('#number_of_codes').fill('60')
    await page.locator('#code_prefix').fill(prefix)
    await page.getByRole('button', { name: /^create promotion$/i }).click()
    await expect(main(page).getByRole('heading', { name, level: 1 })).toBeVisible({
      timeout: 15_000,
    })
    const described = `Multi-code coupon (60 codes with prefix "${prefix}")`
    await expect(main(page).getByText(described)).toBeVisible()
    const steps: Steps = [{ step: 'asked for 60 codes with a prefix and created it', described }]

    await reload(page)
    await expect(main(page).getByText(described)).toBeVisible({ timeout: 15_000 })
    await main(page)
      .getByRole('button', { name: /^show codes$/i })
      .click()
    await expect(dialog(page).getByText(/^60 auto-generated codes/)).toBeVisible({
      timeout: 15_000,
    })
    const codes = await dialog(page).locator('tbody code').allInnerTexts()
    expect(codes.length).toBeGreaterThan(0)
    for (const code of codes) expect(upper(code).startsWith(prefix), code).toBe(true)
    steps.push({ step: 'reloaded and opened the codes', firstPage: codes.length, prefix })
    await save(page, 'promotion-batch-of-codes', steps, outside)
  })

  test('the codes sheet: used and unused codes, its pages and its export', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotageList(
      page,
      /^\/api\/v3\/admin\/promotions\/[^/]+\/coupon_codes$/,
      edited(eachRecord((record) => ({ ...record, state: 'unused', order_id: null }))),
    )
    const prefix = `p9u${stamp}`.slice(0, 10)
    const { found, used, order } = await seeded(baseURL, async (seed) => {
      const found = await promotion(seed, 'Codes sheet', {
        kind: 'coupon_code',
        multi_codes: true,
        number_of_codes: 60,
        code_prefix: prefix,
        actions: [
          {
            type: 'create_adjustment',
            calculator: { type: 'flat_rate', preferences: { amount: '1.00' } },
          },
        ],
      })
      const codes = await seed.get<{ data: { code: string }[] }>(
        `promotions/${found.id}/coupon_codes?limit=1`,
      )
      const used = codes.data[0].code
      const shopper = await customer(seed, 'coupon')
      await seed.post(`customers/${shopper.id}/store_credits`, {
        amount: '50.00',
        currency: 'USD',
      })
      const order = await placedOrder(
        seed,
        shopper.id,
        (orderId) => seed.post(`orders/${orderId}/store_credits`),
        used,
      )
      return { found, used, order }
    })
    const status = (code: string) =>
      dialog(page).getByRole('row').filter({ hasText: code }).getByRole('cell').last()
    const openCodes = async () => {
      await main(page)
        .getByRole('button', { name: /^show codes$/i })
        .click()
      await expect(dialog(page).getByText(/^60 auto-generated codes/)).toBeVisible({
        timeout: 15_000,
      })
      await expect(dialog(page).locator('tbody tr').first()).toBeVisible({ timeout: 15_000 })
    }
    await openPromotion(page, found)
    await openCodes()
    await expect(status(used)).toHaveText('Used')
    const firstPage = await dialog(page).locator('tbody code').allInnerTexts()
    const firstStates = await dialog(page).locator('tbody tr td:last-child').allInnerTexts()
    expect(firstStates.filter((state) => state === 'Used')).toHaveLength(1)
    await expect(dialog(page).getByText('Page 1 of 2')).toBeVisible()
    await dialog(page).getByRole('button', { name: 'Next' }).click()
    await expect(dialog(page).getByText('Page 2 of 2')).toBeVisible({ timeout: 15_000 })
    const secondPage = await dialog(page).locator('tbody code').allInnerTexts()
    const secondStates = await dialog(page).locator('tbody tr td:last-child').allInnerTexts()
    expect(new Set([...firstPage, ...secondPage]).size).toBe(60)
    expect(secondStates.every((state) => state === 'Unused')).toBe(true)
    const steps: Steps = [
      {
        step: 'opened the codes and turned to the second page',
        used,
        firstPage: { codes: firstPage.length, used: 1 },
        secondPage: { codes: secondPage.length },
      },
    ]

    const downloading = page.waitForEvent('download', { timeout: 60_000 })
    await dialog(page)
      .getByRole('button', { name: /export csv/i })
      .click()
    const download = await downloading
    const lines = readFileSync(await download.path(), 'utf8')
      .trim()
      .split('\n')
    const usedLine = lines.find((line) => line.toLowerCase().startsWith(`${used.toLowerCase()},`))
    expect(lines).toHaveLength(61)
    expect(usedLine).toContain(`,used,`)
    expect(usedLine).toContain(`,${order.number},`)
    expect(lines.filter((line) => line.includes(',unused,'))).toHaveLength(59)
    steps.push({
      step: 'exported the codes',
      file: download.suggestedFilename(),
      header: lines[0],
      lines: lines.length - 1,
      usedLine,
    })

    await reload(page)
    await openCodes()
    await expect(status(used)).toHaveText('Used', { timeout: 15_000 })
    steps.push({
      step: 'reloaded and opened the codes again',
      used: await status(used).innerText(),
    })
    await save(page, 'promotion-codes-sheet', steps, outside)
  })

  test('a usage limit', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/promotions\/[^/]+$/,
      withBody((body) => ({ ...body, usage_limit: null })),
    )
    const found = await seeded(baseURL, (seed) => promotion(seed, 'Usage limit'))
    await openPromotion(page, found)
    await expect(usageLimit(page)).toHaveValue('')
    await usageLimit(page).fill('25')
    await savePromotion(page)
    const steps: Steps = [{ step: 'set a usage limit of 25 and saved' }]

    await reload(page)
    await expect(usageLimit(page)).toHaveValue('25', { timeout: 15_000 })
    steps.push({ step: 'reloaded', limit: await usageLimit(page).inputValue() })
    await usageLimit(page).scrollIntoViewIfNeeded()
    await save(page, 'promotion-usage-limit', steps, outside)
  })

  test('a usage limit below one is refused', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    const found = await seeded(baseURL, (seed) =>
      promotion(seed, 'Limit below one', { usage_limit: 10 }),
    )
    await openPromotion(page, found)
    await expect(usageLimit(page)).toHaveValue('10')
    // A sabotaged run types a limit the browser accepts, so nothing is refused.
    await usageLimit(page).fill(sabotaged ? '5' : '0')
    await main(page)
      .getByRole('button', { name: /^save$/i })
      .click()
    const message = () =>
      usageLimit(page).evaluate((element) => (element as HTMLInputElement).validationMessage)
    await expect.poll(message).toMatch(/greater than or equal to 1/)
    await expect(toast(page, /promotion saved/i)).toHaveCount(0)
    const steps: Steps = [
      {
        step: 'typed a usage limit of 0 and pressed Save',
        refusal: await message(),
        note: "The browser's own number check refuses it, in its own bubble (B11)",
      },
    ]
    await usageLimit(page).scrollIntoViewIfNeeded()
    await snap(page, 'promotion-usage-limit-below-one-refused')

    await reload(page)
    await expect(usageLimit(page)).toHaveValue('10', { timeout: 15_000 })
    steps.push({ step: 'reloaded; the limit is unchanged', limit: '10' })
    await usageLimit(page).scrollIntoViewIfNeeded()
    await save(page, 'promotion-usage-limit-below-one', steps, outside)
  })

  test("a promotion's schedule", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/promotions\/[^/]+$/,
      withBody((body) => {
        const { starts_at: _starts, expires_at: _expires, ...rest } = body
        return rest
      }),
    )
    const found = await seeded(baseURL, (seed) => promotion(seed, 'Schedule'))
    await openPromotion(page, found)
    await expect(scheduleField(page, 'Expires')).toHaveText('No expiry')
    await pickDate(page, scheduleField(page, 'Starts'), 1, '15', '09:30')
    await pickDate(page, scheduleField(page, 'Expires'), 2, '20', '18:00')
    const chosen = {
      starts: await scheduleField(page, 'Starts').innerText(),
      expires: await scheduleField(page, 'Expires').innerText(),
    }
    expect(chosen.starts).toMatch(/15th.*9:30 AM/)
    expect(chosen.expires).toMatch(/20th.*6:00 PM/)
    await savePromotion(page)
    const steps: Steps = [{ step: 'chose a start and an expiry and saved', ...chosen }]

    await reload(page)
    const kept = {
      starts: await scheduleField(page, 'Starts').innerText(),
      expires: await scheduleField(page, 'Expires').innerText(),
    }
    expect(kept).toEqual(chosen)
    steps.push({ step: 'reloaded', ...kept })
    await scheduleField(page, 'Expires').scrollIntoViewIfNeeded()
    await save(page, 'promotion-schedule', steps, outside)
  })

  test('an expiry before the start is refused', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    const found = await seeded(baseURL, (seed) => promotion(seed, 'Expiry before start'))
    await openPromotion(page, found)
    const startedAt = await scheduleField(page, 'Starts').innerText()
    await pickDate(page, scheduleField(page, 'Starts'), 1, '15', '09:30')
    // A sabotaged run picks an expiry after the start, so nothing is refused.
    await pickDate(page, scheduleField(page, 'Expires'), 1, sabotaged ? '20' : '10', '09:30')
    await main(page)
      .getByRole('button', { name: /^save$/i })
      .click()
    const refusal = main(page)
      .getByRole('group')
      .filter({ has: page.getByText('Expires', { exact: true }) })
      .getByRole('alert')
    await expect(refusal).toHaveText('Expiry must be after the start date')
    await expect(toast(page, /promotion saved/i)).toHaveCount(0)
    const steps: Steps = [
      {
        step: 'chose an expiry five days before the start and pressed Save',
        starts: await scheduleField(page, 'Starts').innerText(),
        expires: await scheduleField(page, 'Expires').innerText(),
        refusal: await refusal.innerText(),
      },
    ]
    await refusal.scrollIntoViewIfNeeded()
    await snap(page, 'promotion-expiry-before-start-refused')

    await reload(page)
    await expect(scheduleField(page, 'Expires')).toHaveText('No expiry', { timeout: 15_000 })
    await expect(scheduleField(page, 'Starts')).toHaveText(startedAt)
    steps.push({
      step: 'reloaded; the schedule is unchanged',
      starts: startedAt,
      expires: 'No expiry',
    })
    await scheduleField(page, 'Expires').scrollIntoViewIfNeeded()
    await save(page, 'promotion-expiry-before-start', steps, outside)
  })

  test('the option value rule', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/promotions\/[^/]+$/,
      withoutRulesOrActions('rules'),
    )
    const colour = named('Colour')
    const red = named('Red')
    const found = await seeded(baseURL, async (seed) => {
      await seed.post('option_types', {
        name: `p9-colour-${stamp}`,
        label: colour,
        option_values: [
          { name: `p9-red-${stamp}`, label: red },
          { name: `p9-blue-${stamp}`, label: named('Blue') },
        ],
      })
      return promotion(seed, 'Option value rule')
    })
    await openPromotion(page, found)
    await addRule(page, /^option value\(s\)/i)
    await pickInEditor(page, red, new RegExp(escapeRegex(red)))
    await expect(dialog(page).getByText(`${colour}: ${red}`, { exact: true })).toBeVisible()
    await saveEditor(page)
    const summary = new RegExp(`^Option Value\\(s\\) ${escapeRegex(`${colour}: ${red}`)}$`)
    await expect(ruleButton(page, summary)).toBeVisible()
    await savePromotion(page)
    const steps: Steps = [
      { step: 'added an option value rule for one value and saved', value: red },
    ]

    await reload(page)
    await expect(ruleButton(page, summary)).toBeVisible({ timeout: 15_000 })
    steps.push({ step: 'reloaded', rule: await ruleButton(page, summary).innerText() })
    await save(page, 'promotion-rule-option-value', steps, outside)
  })

  for (const [label, test_name, file] of [
    [/^only logged in customers/i, 'the signed-in rule', 'promotion-rule-signed-in'],
    [/^one use per user/i, 'the one-use-per-customer rule', 'promotion-rule-one-use-per-user'],
  ] as const) {
    test(test_name, async ({ page, baseURL }) => {
      const outside = await blockOutside(page)
      await sabotage(
        page,
        'PATCH',
        /^\/api\/v3\/admin\/promotions\/[^/]+$/,
        withoutRulesOrActions('rules'),
      )
      const found = await seeded(baseURL, (seed) => promotion(seed, test_name))
      await openPromotion(page, found)
      await addRule(page, label)
      await saveEditor(page)
      const rule = ruleButton(page, label)
      await expect(rule).toBeVisible()
      await savePromotion(page)
      const steps: Steps = [{ step: 'added the rule and saved', rule: await rule.innerText() }]

      await reload(page)
      await expect(rule).toBeVisible({ timeout: 15_000 })
      steps.push({ step: 'reloaded', rule: await rule.innerText() })
      await save(page, file, steps, outside)
    })
  }

  test('the match policy: any rule may match', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/promotions\/[^/]+$/,
      withBody((body) => ({ ...body, match_policy: 'all' })),
    )
    const found = await seeded(baseURL, (seed) =>
      promotion(seed, 'Match policy', {
        rules: [{ type: 'customer_logged_in' }, { type: 'first_order' }],
      }),
    )
    const policy = page.locator('#match_policy')
    await openPromotion(page, found)
    await expect(policy).toHaveText('All rules must match')
    await policy.click()
    await page.getByRole('option', { name: 'Any rule may match' }).click()
    await expect(main(page).getByText(/Any rule may match\.$/)).toBeVisible()
    await savePromotion(page)
    const steps: Steps = [{ step: 'chose "Any rule may match" for two rules and saved' }]

    await reload(page)
    await expect(policy).toHaveText('Any rule may match', { timeout: 15_000 })
    steps.push({ step: 'reloaded', policy: await policy.innerText() })
    await save(page, 'promotion-match-policy-any', steps, outside)
  })

  test("a product rule's own policy: none of these products", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/promotions\/[^/]+$/,
      withBody((body) => ({
        ...body,
        rules: ((body.rules as Record<string, unknown>[]) ?? []).map((rule) => ({
          ...rule,
          preferences: { ...(rule.preferences as object), match_policy: 'any' },
        })),
      })),
    )
    const found = await seeded(baseURL, (seed) => promotion(seed, 'Product rule policy'))
    const none = () => dialog(page).getByRole('radio', { name: /^none of these products/i })
    await openPromotion(page, found)
    await addRule(page, /^product\(s\)/i)
    await none().check()
    await pickInEditor(page, 'E2E Promo Product', /E2E Promo Product/)
    await expect(none()).toBeChecked()
    await saveEditor(page)
    const rule = ruleButton(page, /^Product\(s\) E2E Promo Product$/)
    await expect(rule).toBeVisible()
    await savePromotion(page)
    const steps: Steps = [
      { step: 'added a product rule for none of the fixture product and saved' },
    ]

    await reload(page)
    await rule.click()
    await expect(dialog(page).getByText('E2E Promo Product', { exact: true })).toBeVisible({
      timeout: 15_000,
    })
    await expect(none()).toBeChecked()
    steps.push({
      step: "reloaded and opened the rule's editor",
      policy: 'None of these products',
      product: 'E2E Promo Product',
    })
    await save(page, 'promotion-rule-product-none', steps, outside)
  })

  const calculators = [
    {
      title: 'the flexible rate calculator',
      file: 'promotion-calculator-flexi-rate',
      action: /^create whole-order adjustment/i,
      calculator: /^flexi rate$/i,
      fill: async (page: Page) => {
        await dialog(page).getByLabel('First Item Cost').fill('10')
        await dialog(page).getByLabel('Additional Item Cost').fill('5')
        await dialog(page).getByLabel('Max Items').fill('3')
      },
      summary: /Flexi Rate · \$10\.00, \$5\.00, Max items: 3$/,
      kept: [
        ['First Item Cost', '10'],
        ['Additional Item Cost', '5'],
        ['Max Items', '3'],
      ],
    },
    {
      title: 'the tiered flat rate calculator',
      file: 'promotion-calculator-tiered-flat-rate',
      action: /^create whole-order adjustment/i,
      calculator: /^tiered flat rate$/i,
      fill: async (page: Page) => {
        for (const [tier, [total, discount]] of [
          ['100', '15'],
          ['250', '40'],
        ].entries()) {
          await dialog(page)
            .getByRole('button', { name: /^add tier$/i })
            .click()
          await dialog(page)
            .getByLabel(/^order total/i)
            .nth(tier)
            .fill(total)
          await dialog(page)
            .getByLabel(/^discount$/i)
            .nth(tier)
            .fill(discount)
        }
        await dialog(page).getByLabel('Base Amount').fill('5')
      },
      summary: /Tiered Flat Rate · Tiers: 2, \$5\.00$/,
      kept: [
        ['Order total ≥', '100'],
        ['Discount', '15'],
        ['Order total ≥', '250'],
        ['Discount', '40'],
        ['Base Amount', '5'],
      ],
    },
    {
      title: 'the percent per item calculator',
      file: 'promotion-calculator-percent-per-item',
      action: /^create per-line-item adjustment/i,
      calculator: /^percent per line item$/i,
      fill: async (page: Page) => {
        await dialog(page).getByRole('spinbutton').first().fill('15')
      },
      summary: /Percent Per Line Item · 15(\.0)?%$/,
      kept: [['Percent', '15']],
    },
  ] as const

  for (const { title, file, action, calculator, fill, summary, kept } of calculators) {
    test(title, async ({ page, baseURL }) => {
      const outside = await blockOutside(page)
      await sabotage(
        page,
        'PATCH',
        /^\/api\/v3\/admin\/promotions\/[^/]+$/,
        withoutRulesOrActions('actions'),
      )
      const found = await seeded(baseURL, (seed) => promotion(seed, title))
      await openPromotion(page, found)
      await addAction(page, action)
      await chooseCalculator(page, calculator)
      await fill(page)
      await saveEditor(page)
      const saved = ruleButton(page, summary)
      await expect(saved).toBeVisible()
      await savePromotion(page)
      const steps: Steps = [
        {
          step: 'added the action with this calculator and saved',
          summary: await saved.innerText(),
        },
      ]

      await reload(page)
      await expect(saved).toBeVisible({ timeout: 15_000 })
      await saved.click()
      await expect(page.locator('#calculator-type')).toHaveText(calculator, { timeout: 15_000 })
      const shown = await numberFields(page)
      const values = shown.map(([, value]) => value)
      expect(values).toEqual(kept.map(([, value]) => value))
      steps.push({
        step: "reloaded and opened the action's editor",
        summary: summary.source,
        fields: shown,
      })
      await save(page, file, steps, outside)
    })
  }

  test('a save refused on a saved promotion', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    const found = await seeded(baseURL, (seed) => promotion(seed, 'Save refused'))
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/promotions\/[^/]+$/,
      withBody((body) => ({ ...body, name: found.name })),
    )
    await openPromotion(page, found)
    await page.locator('#name').fill('   ')
    await main(page)
      .getByRole('button', { name: /^save$/i })
      .click()
    const refusal = main(page)
      .getByText(/can't be blank/i)
      .first()
    await expect(refusal).toBeVisible({ timeout: 15_000 })
    await expect(toast(page, /promotion saved/i)).toHaveCount(0)
    const steps: Steps = [
      {
        step: 'replaced the name with spaces and pressed Save',
        refusal: await refusal.innerText(),
      },
    ]
    await snap(page, 'promotion-save-refused-message')

    await reload(page)
    await expect(page.locator('#name')).toHaveValue(found.name, { timeout: 15_000 })
    steps.push({ step: 'reloaded; the name is unchanged', name: found.name })
    await save(page, 'promotion-save-refused', steps, outside)
  })

  test('searching promotions', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(page, /^\/api\/v3\/admin\/promotions$/, unfiltered)
    const { found, missed } = await seeded(baseURL, async (seed) => ({
      found: await promotion(seed, 'Juniper promotion'),
      missed: await promotion(seed, 'Rowan promotion'),
    }))
    const search = page.getByRole('searchbox', { name: /search by name/i })
    await openIn(page, store, '/promotions')
    await expect(rowWith(page, missed.name)).toBeVisible({ timeout: 15_000 })
    await search.fill(found.name)
    await expect(rowWith(page, found.name)).toBeVisible({ timeout: 15_000 })
    await expect(rowWith(page, missed.name)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [{ step: 'searched for one promotion', shows: found.name }]

    await reload(page)
    await expect(search).toHaveValue(found.name)
    await expect(rowWith(page, found.name)).toBeVisible({ timeout: 15_000 })
    await expect(rowWith(page, missed.name)).toHaveCount(0)
    steps.push({ step: 'reloaded; the search and its result are kept' })
    await save(page, 'promotion-search', steps, outside)
  })

  test('filtering promotions by start and expiry', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(page, /^\/api\/v3\/admin\/promotions$/, unfiltered)
    const day = 24 * 60 * 60 * 1000
    const at = (days: number) => new Date(Date.now() + days * day).toISOString()
    const today = new Date().toISOString().slice(0, 10)
    const shown = await seeded(baseURL, async (seed) => ({
      running: await promotion(seed, 'Window running', { starts_at: at(-3), expires_at: at(30) }),
      notStarted: await promotion(seed, 'Window not started', {
        starts_at: at(10),
        expires_at: at(40),
      }),
      expired: await promotion(seed, 'Window expired', { starts_at: at(-30), expires_at: at(-2) }),
    }))
    // The filter panel offers neither Starts nor Expires (part 3's B4), so the
    // filters are written into the list's address as the panel writes others.
    await openIn(page, store, '/promotions')
    await page.getByRole('button', { name: /add filter/i }).click()
    const offered = await page.locator('[data-slot="filter-panel-item"]').allInnerTexts()
    await page.keyboard.press('Escape')
    const filters = [
      { id: 'p9-starts', field: 'starts_at', operator: 'lteq', value: today },
      { id: 'p9-expires', field: 'expires_at', operator: 'gteq', value: today },
    ]
    const search = encodeURIComponent(`Window`)
    await openIn(
      page,
      store,
      `/promotions?page=1&search=${search}&filters=${encodeURIComponent(JSON.stringify(filters))}`,
    )
    await expect(rowWith(page, shown.running.name)).toBeVisible({ timeout: 15_000 })
    await expect(rowWith(page, shown.notStarted.name)).toHaveCount(0, { timeout: 15_000 })
    await expect(rowWith(page, shown.expired.name)).toHaveCount(0)
    const steps: Steps = [
      {
        step: 'opened the list filtered to promotions started by today and expiring from today',
        filterPanelOffers: offered,
        shows: shown.running.name,
        hides: [shown.notStarted.name, shown.expired.name],
      },
    ]

    await reload(page)
    await expect(rowWith(page, shown.running.name)).toBeVisible({ timeout: 15_000 })
    await expect(rowWith(page, shown.notStarted.name)).toHaveCount(0)
    await expect(rowWith(page, shown.expired.name)).toHaveCount(0)
    steps.push({ step: 'reloaded; the filters and their result are kept' })
    await save(page, 'promotion-filter-start-and-expiry', steps, outside)
  })

  test('sorting promotions', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(page, /^\/api\/v3\/admin\/promotions$/, unsorted)
    const day = 24 * 60 * 60 * 1000
    const at = (days: number) => new Date(Date.now() + days * day).toISOString()
    const names = await seeded(baseURL, async (seed) => [
      (await promotion(seed, 'Sorted A', { starts_at: at(-3) })).name,
      (await promotion(seed, 'Sorted B', { starts_at: at(-1) })).name,
      (await promotion(seed, 'Sorted C', { starts_at: at(-2) })).name,
    ])
    const order = async () =>
      (await main(page).getByRole('table').getByRole('button').allInnerTexts()).filter((name) =>
        names.includes(name),
      )
    await openIn(page, store, `/promotions?search=${encodeURIComponent(`Sorted`)}`)
    await expect.poll(order, { timeout: 15_000 }).toHaveLength(3)
    await sortList(page, /^starts$/i, 'ascending')
    const ascending = [names[0], names[2], names[1]]
    await expect.poll(order, { timeout: 15_000 }).toEqual(ascending)
    const steps: Steps = [{ step: 'sorted by Starts, ascending', order: await order() }]

    await reload(page)
    await expect.poll(order, { timeout: 15_000 }).toEqual(ascending)
    steps.push({ step: 'reloaded; the sort is kept', order: await order() })
    await save(page, 'promotion-sort', steps, outside)
  })

  test('a promotion page that cannot load', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    const found = await seeded(baseURL, (seed) => promotion(seed, 'Failing to load'))
    // The promotion's request is answered with a server error. A sabotaged run
    // leaves it alone, so the page loads and shows no failure.
    if (!sabotaged)
      await page.route(
        (url) => url.pathname === `/api/v3/admin/promotions/${found.id}`,
        (route) =>
          route.request().method() === 'GET'
            ? route.fulfill({ status: 500, json: { error: { message: 'P9 server error' } } })
            : route.fallback(),
      )
    await openIn(page, store, `/promotions/${found.id}`)
    const failure = main(page)
      .getByRole('alert')
      .or(main(page).getByText(/could not|couldn't|failed|went wrong|try again/i))
      .first()
    await expect
      .soft(failure, 'a message that the promotion could not be loaded')
      .toBeVisible({ timeout: 20_000 })
    await expect
      .soft(main(page).getByText(/^Loading…$/), 'the page no longer reading "Loading…"')
      .toHaveCount(0)
    const steps: Steps = [
      {
        step: 'opened a promotion whose request is answered with a server error',
        answered: sabotaged ? "Spree's own answer" : 500,
        shows: (await main(page).innerText()).slice(0, 200),
      },
    ]
    await save(page, 'promotion-failing-to-load', steps, outside)
  })
})

// --- Gift cards -----------------------------------------------------------

interface GiftCard {
  id: string
  code: string
}

async function giftCard(seed: Seed, code: string, data: object = {}): Promise<GiftCard> {
  const { id } = await seed.post<{ id: string }>('gift_cards', {
    code,
    amount: '30.00',
    currency: 'USD',
    ...data,
  })
  return { id, code: upper(code) }
}

/** A $100 card of a customer's, $19.99 of which paid for an order. */
async function partlyRedeemed(seed: Seed, code: string, label: string) {
  const owner = await customer(seed, label)
  const card = await giftCard(seed, code, { amount: '100.00', customer_id: owner.id })
  await placedOrder(seed, owner.id, (orderId) =>
    seed.post(`orders/${orderId}/gift_cards`, { code }),
  )
  return { card, owner }
}

const giftCardRow = (page: Page, code: string) => rowWith(page, upper(code))

async function openGiftCards(page: Page, search?: string) {
  await openIn(page, store, '/loyalty/gift-cards')
  await expect(page.getByRole('heading', { name: 'Gift Cards', level: 1 })).toBeVisible({
    timeout: 15_000,
  })
  if (search) await page.getByPlaceholder(/search by code/i).fill(search)
}

async function openGiftCard(page: Page, code: string) {
  await giftCardRow(page, code)
    .getByRole('button', { name: new RegExp(`^${escapeRegex(upper(code))}`) })
    .click()
  await expect(dialog(page).getByRole('heading', { name: upper(code) })).toBeVisible({
    timeout: 15_000,
  })
  await expect(dialog(page).getByText(/^Usage/)).toBeVisible({ timeout: 15_000 })
}

const giftCardsPath = /^\/api\/v3\/admin\/gift_cards$/

/** The cards the list shows whose codes start with `prefix`. */
const listedCodes = async (page: Page, prefix: string) =>
  (await main(page).getByRole('table').getByRole('button').allInnerTexts())
    .map((text) => text.split('\n')[0].trim())
    .filter((code) => code.startsWith(upper(prefix)))

test.describe('gift cards (P9, G-84)', () => {
  test('filtering gift cards by status', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(page, giftCardsPath, unfiltered)
    const prefix = `P9-STATUS-${stamp}`
    const { active, partly } = await seeded(baseURL, async (seed) => ({
      active: await giftCard(seed, `${prefix}-ACTIVE`),
      partly: (await partlyRedeemed(seed, `${prefix}-PARTLY`, 'status')).card,
    }))
    await openGiftCards(page, prefix)
    await expect(giftCardRow(page, active.code)).toBeVisible({ timeout: 15_000 })
    await expect(giftCardRow(page, partly.code)).toBeVisible()
    await narrowQuickFilter(page, /^status/i, /^partially redeemed$/i)
    await expect(giftCardRow(page, active.code)).toHaveCount(0, { timeout: 15_000 })
    await expect(giftCardRow(page, partly.code)).toContainText('Partially redeemed')
    const steps: Steps = [{ step: 'narrowed the status to Partially redeemed', shows: partly.code }]

    await reload(page)
    await expect(giftCardRow(page, partly.code)).toBeVisible({ timeout: 15_000 })
    await expect(giftCardRow(page, active.code)).toHaveCount(0)
    steps.push({ step: 'reloaded; the filter and its result are kept' })
    await save(page, 'gift-card-filter-status', steps, outside)
  })

  test('filtering gift cards by currency', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(page, giftCardsPath, unfiltered)
    const prefix = `P9-CURRENCY-${stamp}`
    const { dollars, euros } = await seeded(baseURL, async (seed) => ({
      dollars: await giftCard(seed, `${prefix}-USD`),
      euros: await giftCard(seed, `${prefix}-EUR`, { currency: 'EUR' }),
    }))
    await openGiftCards(page, prefix)
    await expect(giftCardRow(page, dollars.code)).toBeVisible({ timeout: 15_000 })
    await filterByListed(page, /^currency$/i, /^EUR/)
    await expect(giftCardRow(page, euros.code)).toBeVisible({ timeout: 15_000 })
    await expect(giftCardRow(page, dollars.code)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [{ step: 'filtered to euros', shows: euros.code, hides: dollars.code }]

    await reload(page)
    await expect(giftCardRow(page, euros.code)).toBeVisible({ timeout: 15_000 })
    await expect(giftCardRow(page, dollars.code)).toHaveCount(0)
    steps.push({ step: 'reloaded; the filter and its result are kept' })
    await save(page, 'gift-card-filter-currency', steps, outside)
  })

  test('filtering gift cards by batch', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(page, giftCardsPath, unfiltered)
    const prefix = `P9BATCH${stamp}`
    const single = await seeded(baseURL, async (seed) => {
      await seed.post('gift_card_batches', {
        prefix,
        amount: '10.00',
        codes_count: 2,
        currency: 'USD',
      })
      return giftCard(seed, `${prefix}-SINGLE`)
    })
    await openGiftCards(page, prefix)
    await expect(giftCardRow(page, single.code)).toBeVisible({ timeout: 15_000 })
    await expect.poll(() => listedCodes(page, prefix), { timeout: 15_000 }).toHaveLength(3)
    await filterTo(page, /^batch$/i, prefix)
    await expect(giftCardRow(page, single.code)).toHaveCount(0, { timeout: 15_000 })
    await expect.poll(() => listedCodes(page, prefix), { timeout: 15_000 }).toHaveLength(2)
    const steps: Steps = [
      { step: 'filtered to the batch', shows: await listedCodes(page, prefix), hides: single.code },
    ]

    await reload(page)
    await expect.poll(() => listedCodes(page, prefix), { timeout: 15_000 }).toHaveLength(2)
    await expect(giftCardRow(page, single.code)).toHaveCount(0)
    steps.push({ step: 'reloaded; the filter and its result are kept' })
    await save(page, 'gift-card-filter-batch', steps, outside)
  })

  test('filtering gift cards by customer', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(page, giftCardsPath, unfiltered)
    const prefix = `P9-CUSTOMER-${stamp}`
    const { kept, other, owner } = await seeded(baseURL, async (seed) => {
      const owner = await customer(seed, 'card-owner')
      const someone = await customer(seed, 'card-other')
      return {
        owner,
        kept: await giftCard(seed, `${prefix}-KEPT`, { customer_id: owner.id }),
        other: await giftCard(seed, `${prefix}-OTHER`, { customer_id: someone.id }),
      }
    })
    await openGiftCards(page, prefix)
    await expect(giftCardRow(page, other.code)).toBeVisible({ timeout: 15_000 })
    await filterTo(page, /^customer$/i, owner.email)
    await expect(giftCardRow(page, kept.code)).toBeVisible({ timeout: 15_000 })
    await expect(giftCardRow(page, other.code)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [
      { step: "filtered to one customer's cards", customer: owner.email, shows: kept.code },
    ]

    await reload(page)
    await expect(giftCardRow(page, kept.code)).toBeVisible({ timeout: 15_000 })
    await expect(giftCardRow(page, other.code)).toHaveCount(0)
    steps.push({ step: 'reloaded; the filter and its result are kept' })
    await save(page, 'gift-card-filter-customer', steps, outside)
  })

  test('searching gift cards', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(page, giftCardsPath, unfiltered)
    const { found, missed } = await seeded(baseURL, async (seed) => ({
      found: await giftCard(seed, `P9-JUNIPER-${stamp}`),
      missed: await giftCard(seed, `P9-ROWAN-${stamp}`),
    }))
    const search = page.getByPlaceholder(/search by code/i)
    await openGiftCards(page)
    await search.fill(found.code)
    await expect(giftCardRow(page, found.code)).toBeVisible({ timeout: 15_000 })
    await expect(giftCardRow(page, missed.code)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [{ step: 'searched for one code', shows: found.code }]

    await reload(page)
    await expect(search).toHaveValue(found.code)
    await expect(giftCardRow(page, found.code)).toBeVisible({ timeout: 15_000 })
    await expect(giftCardRow(page, missed.code)).toHaveCount(0)
    steps.push({ step: 'reloaded; the search and its result are kept' })
    await save(page, 'gift-card-search', steps, outside)
  })

  test('an expired gift card', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(
      page,
      /^\/api\/v3\/admin\/gift_cards(\/[^/]+)?$/,
      edited(
        eachRecord((record) => ({
          ...record,
          status: 'active',
          expired: false,
          active: true,
          expires_at: '2099-12-31',
        })),
      ),
    )
    const card = await seeded(baseURL, (seed) =>
      giftCard(seed, `P9-LAPSED-${stamp}`, { expires_at: '2026-10-01' }),
    )
    await openGiftCards(page, card.code)
    const row = giftCardRow(page, card.code)
    await expect(row).toBeVisible({ timeout: 15_000 })
    await expect(row.getByRole('cell').nth(1)).toHaveText('Expired')
    const steps: Steps = [
      {
        step: 'listed a card that expired on 1 October 2026',
        status: await row.getByRole('cell').nth(1).innerText(),
        expires: await row.getByRole('cell').nth(5).innerText(),
      },
    ]

    await reload(page)
    await expect(row.getByRole('cell').nth(1)).toHaveText('Expired', { timeout: 15_000 })
    await openGiftCard(page, card.code)
    await expect(dialog(page).getByRole('button', { name: /^October 1st, 2026/ })).toBeVisible()
    steps.push({
      step: 'reloaded and opened the card',
      expires: 'October 1st, 2026',
      status: 'Expired',
    })
    await save(page, 'gift-card-expired', steps, outside)
  })

  test("a partly redeemed gift card's sheet", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(
      page,
      /^\/api\/v3\/admin\/gift_cards(\/[^/]+)?$/,
      edited(
        eachRecord((record) => ({ ...record, amount_used: '0.00', amount_remaining: '100.00' })),
      ),
    )
    const { card, owner } = await seeded(baseURL, (seed) =>
      partlyRedeemed(seed, `P9-PARTLY-${stamp}`, 'partly'),
    )
    const usage = () => dialog(page).getByText('Usage', { exact: true }).locator('..')
    const checkSheet = async () => {
      await expect(usage()).toContainText(/Amount\s*\$100\.00/)
      await expect(usage()).toContainText(/Used\s*\$19\.99/)
      await expect(usage()).toContainText(/Remaining\s*\$80\.01/)
      await expect(dialog(page).getByRole('spinbutton', { name: 'Amount' })).toBeDisabled()
    }
    await openGiftCards(page, card.code)
    await openGiftCard(page, card.code)
    await checkSheet()
    const steps: Steps = [
      {
        step: 'opened a $100.00 card $19.99 of which paid for an order',
        usage: await usage().innerText(),
      },
    ]

    await closeSheet(page)
    await reload(page)
    await openGiftCard(page, card.code)
    await checkSheet()
    const customerField = dialog(page)
      .getByRole('group')
      .filter({ hasText: /^Customer/ })
    steps.push({
      step: 'reloaded and opened the card again',
      usage: await usage().innerText(),
      customerShown: await customerField.innerText(),
    })
    // Whose card it is: the sheet should name the customer the list names.
    await expect
      .soft(customerField, "the sheet names the card's customer by email")
      .toContainText(owner.email)
    await save(page, 'gift-card-partly-redeemed-sheet', steps, outside)
  })

  test('a gift card without a customer is given one', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /^\/api\/v3\/admin\/gift_cards\/[^/]+$/,
      withBody((body) => ({ ...body, customer_id: null })),
    )
    const { card, owner } = await seeded(baseURL, async (seed) => ({
      card: await giftCard(seed, `P9-BARE-${stamp}`),
      owner: await customer(seed, 'new-owner'),
    }))
    await openGiftCards(page, card.code)
    await expect(giftCardRow(page, card.code)).not.toContainText('@', { timeout: 15_000 })
    await openGiftCard(page, card.code)
    const picker = dialog(page).getByRole('combobox', { name: /search customers/i })
    await expect(picker).toHaveValue('')
    await picker.click()
    await picker.fill(owner.email)
    await page.getByRole('option', { name: owner.email }).click()
    await dialog(page)
      .getByRole('button', { name: /^save$/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    const steps: Steps = [
      { step: 'chose a customer for a card that had none and saved', customer: owner.email },
    ]

    await reload(page)
    await expect(giftCardRow(page, card.code)).toContainText(owner.email, { timeout: 15_000 })
    await openGiftCard(page, card.code)
    await expect(picker).toHaveValue(owner.email, { timeout: 15_000 })
    steps.push({
      step: 'reloaded; the list and the sheet name the customer',
      customer: owner.email,
    })
    await save(page, 'gift-card-customer-added', steps, outside)
  })

  test('issuing a batch of gift cards with a prefix', async ({ page }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'POST',
      /^\/api\/v3\/admin\/gift_card_batches$/,
      withBody((body) => ({ ...body, codes_count: 1 })),
    )
    const prefix = `P9ISSUED${stamp}`
    await openGiftCards(page)
    await page.getByRole('button', { name: /new gift card/i }).click()
    await expect(page.getByRole('heading', { name: /new gift card/i })).toBeVisible()
    await page.locator('#quantity').fill('3')
    await page.locator('#code').fill(prefix)
    await page.locator('#amount').fill('20.00')
    await page.getByRole('button', { name: /create 3 gift cards/i }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    await page.getByPlaceholder(/search by code/i).fill(prefix)
    // The batch's cards are generated after the batch is saved.
    await expect(async () => {
      await reload(page)
      expect(await listedCodes(page, prefix)).toHaveLength(3)
    }).toPass({ timeout: 60_000 })
    const steps: Steps = [
      { step: 'issued three $20.00 cards with a prefix', codes: await listedCodes(page, prefix) },
    ]

    await filterTo(page, /^batch$/i, prefix)
    await expect.poll(() => listedCodes(page, prefix), { timeout: 15_000 }).toHaveLength(3)
    await reload(page)
    await expect.poll(() => listedCodes(page, prefix), { timeout: 15_000 }).toHaveLength(3)
    steps.push({
      step: 'filtered to the batch and reloaded',
      codes: await listedCodes(page, prefix),
    })
    await save(page, 'gift-card-batch-issued', steps, outside)
  })
})

// --- Store credits --------------------------------------------------------

const storeCreditsPath = /^\/api\/v3\/admin\/store_credits$/

async function openStoreCredits(page: Page, search?: string) {
  await openIn(page, store, '/loyalty/store-credits')
  await expect(page.getByRole('heading', { name: 'Store Credits', level: 1 })).toBeVisible({
    timeout: 15_000,
  })
  if (search) await page.getByRole('searchbox').fill(search)
}

const creditRow = (page: Page, email: string) => rowWith(page, email)

async function credit(seed: Seed, owner: Customer, data: object = {}) {
  return seed.post<{ id: string }>(`customers/${owner.id}/store_credits`, {
    amount: '50.00',
    currency: 'USD',
    memo: `P9 credit ${stamp}`,
    ...data,
  })
}

/** A customer's credit of `amount`, $19.99 of which paid for an order. */
async function usedCredit(seed: Seed, label: string, amount = '50.00') {
  const owner = await customer(seed, label)
  const created = await credit(seed, owner, { amount, memo: `P9 ${label} ${stamp}` })
  await placedOrder(seed, owner.id, (orderId) => seed.post(`orders/${orderId}/store_credits`))
  return { owner, credit: created }
}

async function openCredit(page: Page, label: string) {
  await rowWith(page, label).getByRole('button').first().click()
  await expect(dialog(page).getByRole('heading', { name: /^ledger$/i })).toBeVisible({
    timeout: 15_000,
  })
}

const ledger = (page: Page) => dialog(page).getByRole('list')
const definition = (page: Page, term: string) =>
  dialog(page)
    .locator('dt', { hasText: new RegExp(`^${term}$`) })
    .locator('xpath=following-sibling::dd[1]')

test.describe('store credits (P9, G-84)', () => {
  test('filtering store credits by standing', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(page, storeCreditsPath, unfiltered)
    const { open, spent } = await seeded(baseURL, async (seed) => {
      const open = await customer(seed, 'standing-open')
      await credit(seed, open)
      return { open, spent: (await usedCredit(seed, 'standing-spent', '19.99')).owner }
    })
    await openStoreCredits(page)
    await expect(creditRow(page, spent.email)).toBeVisible({ timeout: 15_000 })
    await expect(creditRow(page, spent.email)).toContainText('$0.00')
    await narrowQuickFilter(page, /^standing/i, /^outstanding$/i)
    await expect(creditRow(page, open.email)).toBeVisible({ timeout: 15_000 })
    await expect(creditRow(page, spent.email)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [
      { step: 'narrowed the standing to Outstanding', shows: open.email, hides: spent.email },
    ]

    await reload(page)
    await expect(creditRow(page, open.email)).toBeVisible({ timeout: 15_000 })
    await expect(creditRow(page, spent.email)).toHaveCount(0)
    steps.push({ step: 'reloaded; the filter and its result are kept' })
    await save(page, 'store-credit-filter-standing', steps, outside)
  })

  test('filtering store credits by origin', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(page, storeCreditsPath, unfiltered)
    const { byHand, fromCard } = await seeded(baseURL, async (seed) => {
      const byHand = await customer(seed, 'origin-hand')
      await credit(seed, byHand)
      return {
        byHand,
        fromCard: (await partlyRedeemed(seed, `P9-ORIGIN-${stamp}`, 'origin-card')).owner,
      }
    })
    await openStoreCredits(page)
    await expect(creditRow(page, fromCard.email)).toContainText('Gift card', { timeout: 15_000 })
    await expect(creditRow(page, byHand.email)).toContainText('Issued by hand')
    await filterByListed(page, /^origin$/i, /^gift card$/i)
    await expect(creditRow(page, fromCard.email)).toBeVisible({ timeout: 15_000 })
    await expect(creditRow(page, byHand.email)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [
      { step: 'filtered to credits from a gift card', shows: fromCard.email, hides: byHand.email },
    ]

    await reload(page)
    await expect(creditRow(page, fromCard.email)).toBeVisible({ timeout: 15_000 })
    await expect(creditRow(page, byHand.email)).toHaveCount(0)
    steps.push({ step: 'reloaded; the filter and its result are kept' })
    await save(page, 'store-credit-filter-origin', steps, outside)
  })

  test('filtering store credits by who issued them', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(page, storeCreditsPath, unfiltered)
    const { byHand, fromCard } = await seeded(baseURL, async (seed) => {
      const byHand = await customer(seed, 'issuer-hand')
      await credit(seed, byHand)
      return {
        byHand,
        fromCard: (await partlyRedeemed(seed, `P9-ISSUER-${stamp}`, 'issuer-card')).owner,
      }
    })
    await openStoreCredits(page)
    await expect(creditRow(page, fromCard.email)).toBeVisible({ timeout: 15_000 })
    await filterTo(page, /^issued by$/i, 'admin@example.com')
    await expect(creditRow(page, byHand.email)).toBeVisible({ timeout: 15_000 })
    await expect(creditRow(page, fromCard.email)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [
      {
        step: 'filtered to credits the admin issued',
        shows: byHand.email,
        hides: `${fromCard.email}, whose credit came from a gift card`,
      },
    ]

    await reload(page)
    await expect(creditRow(page, byHand.email)).toBeVisible({ timeout: 15_000 })
    await expect(creditRow(page, fromCard.email)).toHaveCount(0)
    steps.push({ step: 'reloaded; the filter and its result are kept' })
    await save(page, 'store-credit-filter-issuer', steps, outside)
  })

  test('filtering store credits by customer', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(page, storeCreditsPath, unfiltered)
    const { kept, other } = await seeded(baseURL, async (seed) => {
      const kept = await customer(seed, 'credit-owner')
      const other = await customer(seed, 'credit-other')
      await credit(seed, kept)
      await credit(seed, other)
      return { kept, other }
    })
    await openStoreCredits(page)
    await expect(creditRow(page, other.email)).toBeVisible({ timeout: 15_000 })
    await filterTo(page, /^customer$/i, kept.email)
    await expect(creditRow(page, kept.email)).toBeVisible({ timeout: 15_000 })
    await expect(creditRow(page, other.email)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [{ step: "filtered to one customer's credits", shows: kept.email }]

    await reload(page)
    await expect(creditRow(page, kept.email)).toBeVisible({ timeout: 15_000 })
    await expect(creditRow(page, other.email)).toHaveCount(0)
    steps.push({ step: 'reloaded; the filter and its result are kept' })
    await save(page, 'store-credit-filter-customer', steps, outside)
  })

  test('filtering store credits by currency', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(page, storeCreditsPath, unfiltered)
    const { dollars, euros } = await seeded(baseURL, async (seed) => {
      const dollars = await customer(seed, 'credit-usd')
      const euros = await customer(seed, 'credit-eur')
      await credit(seed, dollars)
      await credit(seed, euros, { currency: 'EUR' })
      return { dollars, euros }
    })
    await openStoreCredits(page)
    await expect(creditRow(page, dollars.email)).toBeVisible({ timeout: 15_000 })
    await filterByListed(page, /^currency$/i, /^EUR/)
    await expect(creditRow(page, euros.email)).toContainText('EUR', { timeout: 15_000 })
    await expect(creditRow(page, dollars.email)).toHaveCount(0, { timeout: 15_000 })
    const steps: Steps = [{ step: 'filtered to euros', shows: euros.email, hides: dollars.email }]

    await reload(page)
    await expect(creditRow(page, euros.email)).toBeVisible({ timeout: 15_000 })
    await expect(creditRow(page, dollars.email)).toHaveCount(0)
    steps.push({ step: 'reloaded; the filter and its result are kept' })
    await save(page, 'store-credit-filter-currency', steps, outside)
  })

  test("a credit's history", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(
      page,
      /^\/api\/v3\/admin\/store_credits\/[^/]+\/events$/,
      edited((body) => ({ ...body, data: [] })),
    )
    const { owner } = await seeded(baseURL, (seed) => usedCredit(seed, 'history'))
    const checkSheet = async () => {
      await expect(ledger(page).getByRole('listitem').first()).toContainText(/^Used\s*\$19\.99/, {
        timeout: 15_000,
      })
      await expect(ledger(page).getByRole('listitem').last()).toContainText(/^Added\s*\$50\.00/)
      await expect(definition(page, 'Used')).toHaveText('$19.99')
      await expect(definition(page, 'Remaining')).toHaveText('$30.01')
    }
    await openStoreCredits(page)
    await openCredit(page, owner.email)
    await checkSheet()
    const steps: Steps = [
      {
        step: 'opened a $50.00 credit $19.99 of which paid for an order',
        ledger: await ledger(page).getByRole('listitem').allInnerTexts(),
      },
    ]

    await closeSheet(page)
    await reload(page)
    await openCredit(page, owner.email)
    await checkSheet()
    steps.push({
      step: 'reloaded and opened the credit again',
      ledger: await ledger(page).getByRole('listitem').allInnerTexts(),
    })
    await save(page, 'store-credit-history', steps, outside)
  })

  for (const [title, file, answer, message] of [
    [
      "a credit's history when it is empty",
      'store-credit-history-empty',
      (route: Route) =>
        route.fulfill({ json: { data: [], meta: { count: 0, page: 1, pages: 1 } } }),
      'No movements recorded yet.',
    ],
    [
      "a credit's history that cannot load",
      'store-credit-history-failing',
      (route: Route) =>
        route.fulfill({ status: 500, json: { error: { message: 'P9 server error' } } }),
      'Could not load the ledger.',
    ],
  ] as const) {
    test(title, async ({ page, baseURL }) => {
      const outside = await blockOutside(page)
      expectFailureWhenSabotaged()
      // The history's request is answered here. A sabotaged run leaves it to
      // Spree, which answers with the credit's one entry.
      if (!sabotaged)
        await page.route(
          (url) => /^\/api\/v3\/admin\/store_credits\/[^/]+\/events$/.test(url.pathname),
          answer,
        )
      const owner = await seeded(baseURL, async (seed) => {
        const owner = await customer(seed, file.replace('store-credit-', ''))
        await credit(seed, owner)
        return owner
      })
      await openStoreCredits(page)
      await openCredit(page, owner.email)
      await expect(dialog(page).getByText(message)).toBeVisible({ timeout: 20_000 })
      await expect(definition(page, 'Remaining')).toHaveText('$50.00')
      const steps: Steps = [
        {
          step: "opened a credit whose history's request is answered here",
          answered: file.endsWith('empty') ? 'no entries' : 500,
          shows: message,
        },
      ]
      await save(page, file, steps, outside)
    })
  }

  test("an erased shopper's credit", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(
      page,
      /^\/api\/v3\/admin\/store_credits(\/[^/]+)?$/,
      edited(
        eachRecord((record) => ({
          ...record,
          customer: record.customer && { ...(record.customer as object), anonymized: false },
        })),
      ),
    )
    const memo = `P9 erased ${stamp}`
    const owner = await seeded(baseURL, async (seed) => {
      const owner = await customer(seed, 'erased')
      await credit(seed, owner, { amount: '15.00', memo })
      await seed.post(`customers/${owner.id}/anonymize`)
      return owner
    })
    const erasedRow = main(page)
      .getByRole('row')
      .filter({ has: page.getByRole('button', { name: '—', exact: true }) })
      .filter({ hasText: '$15.00' })
    await openStoreCredits(page)
    await expect(erasedRow.first()).toBeVisible({ timeout: 15_000 })
    await expect(main(page).getByText(owner.email)).toHaveCount(0)
    await expect(main(page).getByText(/@invalid/)).toHaveCount(0)
    await expect(erasedRow.first().getByRole('cell').nth(3)).toHaveText('$15.00')
    const steps: Steps = [
      {
        step: 'listed the credit of a shopper whose data was then erased',
        row: await erasedRow.first().innerText(),
      },
    ]

    await reload(page)
    await expect(erasedRow.first()).toBeVisible({ timeout: 15_000 })
    await erasedRow.first().getByRole('button').first().click()
    await expect(dialog(page).getByRole('heading', { name: /^ledger$/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(dialog(page).getByRole('heading', { level: 2 })).toHaveText('—')
    await expect(definition(page, 'Remaining')).toHaveText('$15.00')
    await expect(dialog(page).getByText(memo)).toHaveCount(0)
    await expect(dialog(page).getByText(owner.email)).toHaveCount(0)
    steps.push({
      step: 'reloaded and opened the credit',
      title: '—',
      remaining: '$15.00',
      memo: await definition(page, 'Memo').innerText(),
      note: 'The credit and its balance are kept, its memo is cleared and the shopper is not named (B17, B18)',
    })
    await save(page, 'store-credit-erased-shopper', steps, outside)
  })

  async function startIssuing(page: Page, owner: Customer, amount: string, memo: string) {
    await openStoreCredits(page)
    await page.getByRole('button', { name: /issue store credit/i }).click()
    const picker = dialog(page).getByRole('combobox').first()
    await picker.click()
    await picker.fill(owner.email)
    await page.getByRole('option', { name: owner.email }).click()
    await dialog(page)
      .getByRole('textbox', { name: /^amount$/i })
      .fill(amount)
    await dialog(page)
      .getByRole('textbox', { name: /^memo$/i })
      .fill(memo)
    await dialog(page)
      .getByRole('button', { name: /^issue store credit$/i })
      .click()
  }

  test('issuing an amount of zero is refused', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    const memo = `P9 zero ${stamp}`
    const owner = await seeded(baseURL, (seed) => customer(seed, 'zero'))
    // A sabotaged run types an amount the dialog accepts, so nothing is refused.
    await startIssuing(page, owner, sabotaged ? '12.00' : '0', memo)
    const refusal = dialog(page).getByRole('alert')
    await expect(refusal).toHaveText('Amount must be greater than 0')
    await expect(dialog(page).getByRole('textbox', { name: /^amount$/i })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    const steps: Steps = [
      { step: 'chose a customer, typed 0 and pressed Issue', refusal: await refusal.innerText() },
    ]
    await snap(page, 'store-credit-issue-zero-refused')

    await reload(page)
    await page.getByRole('searchbox').fill(memo)
    await expect(page.getByText(/^no results$|try adjusting your search/i).first()).toBeVisible({
      timeout: 15_000,
    })
    steps.push({ step: 'reloaded and searched for its memo; no credit was issued', memo })
    await save(page, 'store-credit-issue-zero', steps, outside)
  })

  test('issuing an amount Spree refuses', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'POST',
      /^\/api\/v3\/admin\/customers\/[^/]+\/store_credits$/,
      withBody((body) => ({ ...body, amount: '12.35' })),
    )
    const memo = `P9 decimals ${stamp}`
    const owner = await seeded(baseURL, (seed) => customer(seed, 'decimals'))
    await startIssuing(page, owner, '12.345', memo)
    const refusal = dialog(page)
      .getByRole('alert')
      .filter({ hasText: 'amount has more than 2 decimal places' })
    await expect(refusal).toBeVisible({ timeout: 15_000 })
    const steps: Steps = [
      {
        step: 'chose a customer, typed 12.345 and pressed Issue',
        refusal: await refusal.innerText(),
      },
    ]
    await snap(page, 'store-credit-issue-refused-by-spree-message')

    await reload(page)
    await page.getByRole('searchbox').fill(memo)
    await expect(page.getByText(/^no results$|try adjusting your search/i).first()).toBeVisible({
      timeout: 15_000,
    })
    steps.push({ step: 'reloaded and searched for its memo; no credit was issued', memo })
    await save(page, 'store-credit-issue-refused-by-spree', steps, outside)
  })

  test("a used credit's amount cannot be changed", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotageList(
      page,
      /^\/api\/v3\/admin\/store_credits(\/[^/]+)?$/,
      edited(eachRecord((record) => ({ ...record, amount_used: '0.00' }))),
    )
    const { owner } = await seeded(baseURL, (seed) => usedCredit(seed, 'locked'))
    const memo = `P9 locked memo changed ${stamp}`
    const editor = () => page.getByRole('dialog', { name: 'Edit store credit' })
    await openStoreCredits(page)
    await openCredit(page, owner.email)
    await dialog(page)
      .getByRole('button', { name: /^edit$/i })
      .click()
    await expect(editor().getByText('Used balance cannot be edited.')).toBeVisible()
    await expect(editor().getByRole('textbox', { name: /^amount$/i })).toBeDisabled()
    await expect(editor().getByRole('textbox', { name: /^amount$/i })).toHaveValue('50.00')
    await editor()
      .getByRole('textbox', { name: /^memo$/i })
      .fill(memo)
    await snap(page, 'store-credit-used-amount-locked-editor')
    await editor()
      .getByRole('button', { name: /^save$/i })
      .click()
    await expect(editor()).toBeHidden({ timeout: 15_000 })
    const steps: Steps = [
      {
        step: "opened a used credit's editor; its amount is locked, and its memo was changed and saved",
        memo,
      },
    ]

    await closeSheet(page)
    await reload(page)
    await openCredit(page, owner.email)
    await expect(definition(page, 'Memo')).toHaveText(memo, { timeout: 15_000 })
    await expect(definition(page, 'Amount')).toHaveText('$50.00')
    steps.push({ step: 'reloaded and opened the credit', memo, amount: '$50.00' })
    await save(page, 'store-credit-used-amount-locked', steps, outside)
  })
})
