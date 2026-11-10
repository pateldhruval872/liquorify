import { readFileSync } from 'node:fs'
import { expect, type Locator, type Page, type Route, test } from '@playwright/test'
import { addRecordFilter, getCredentials, login } from '../../dashboard/e2e/helpers'
import { chequeMethods } from './orders'
import {
  answeredEmpty,
  blockOutside,
  expectFailureWhenSabotaged,
  openIn,
  recorder,
  reload,
  type Seed,
  type Steps,
  sabotage,
  sabotaged,
  seeded,
  stamp,
  withBody,
} from './p9'

/**
 * The platform batch's step P13, part A, G-97: the 14 customer behaviours
 * batch 10 captured and no browser test drove, A.1 to A.14 of the work item.
 * Each test drives the customer screens as the browser tests' admin and
 * asserts what the screen shows and, after a reload, what was kept.
 *
 * Every test first adds its own records through the Admin API, named with
 * the run's stamp, in the default store; nothing opens another store. With
 * `P13_SABOTAGE=1` each test is expected to fail, and the browser undoes the
 * change the test then looks for.
 *
 * SD-44 (a typed tax registration kind disappears from its field), SD-45
 * (setting one default address gives up the other) and SD-46 (a refused tax
 * number says only "is invalid") are checked softly, after the steps that do
 * not depend on them, so each is recorded and the rest of the test still runs.
 * A.5 fails at its last step on SD-94: a cleared note is saved as an empty
 * paragraph, so the card is blank instead of showing its empty state. A.12
 * records the filter chip the link opens with (SD-96) without judging it.
 * Checking a tax number with a registry needs a registered validator, which
 * the browser-test server has none of, so A.4 records that check as NOT_RUN.
 */

const { save } = recorder('customers', 'p13')
const store = () => getCredentials().store_id

test.beforeEach(async ({ page }) => {
  test.setTimeout(240_000)
  await login(page)
})

// --- Names and records ------------------------------------------------------

const named = (label: string) => `P13 ${label} ${stamp}`
const emailOf = (label: string) =>
  `p13-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${stamp}@example.com`

interface Customer {
  id: string
  email: string
  first_name: string
  last_name: string
}

const address = {
  first_name: 'Robin',
  last_name: 'Ashby',
  city: 'Portland',
  country_code: 'US',
  state_code: 'OR',
  postal_code: '97205',
  phone: '5035550142',
}

const streetOf = (label: string) => `${stamp} ${label} Street`

async function customer(seed: Seed, label: string, extra: object = {}) {
  return seed.post<Customer>('customers', {
    email: emailOf(label),
    first_name: 'P13',
    last_name: `${label} ${stamp}`,
    ...extra,
  })
}

async function addAddress(seed: Seed, owner: Customer, label: string, extra: object = {}) {
  return seed.post<{ id: string }>(`customers/${owner.id}/addresses`, {
    ...address,
    address1: streetOf(label),
    label,
    ...extra,
  })
}

/** A product of one variant, stocked at every location, for a test's orders. */
async function product(seed: Seed, label: string) {
  const created = await seed.post<{ id: string; default_variant_id: string }>('products', {
    name: named(label),
    status: 'active',
    prices: [{ amount: '20.00', currency: 'USD' }],
  })
  const { data } = await seed.get<{ data: { id: string }[] }>('stock_locations?limit=100')
  await seed.post('stock_levels/bulk_upsert', {
    stock_levels: data.map((location) => ({
      variant_id: created.default_variant_id,
      stock_location_id: location.id,
      count_on_hand: 50,
    })),
  })
  return created.default_variant_id
}

interface Order {
  id: string
  number: string
}

/** A placed order of the customer's, paid by cheque, or by their store credit first. */
async function placed(
  seed: Seed,
  owner: Customer,
  variantId: string,
  baseURL: string,
  options: { storeCredit?: boolean; data?: object } = {},
) {
  const order = await seed.post<Order>('orders', {
    customer_id: owner.id,
    email: owner.email,
    shipping_address: { ...address, address1: streetOf('Order') },
    billing_address: { ...address, address1: streetOf('Order') },
    items: [{ variant_id: variantId, quantity: 1 }],
    ...options.data,
  })
  if (options.storeCredit) await seed.post(`orders/${order.id}/store_credits`)
  const current = await seed.get<{ amount_due: string }>(`orders/${order.id}`)
  if (Number(current.amount_due) > 0) {
    const methods = await chequeMethods(baseURL, seed.api, seed.headers)
    await seed.post(`orders/${order.id}/payments`, {
      payment_method_id: methods.cheque,
      amount: current.amount_due,
    })
  }
  return seed.patch<Order>(`orders/${order.id}/complete`, { notify_customer: false })
}

// --- Reading the screens ----------------------------------------------------

const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog'))

const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()

const textOf = async (scope: Locator) => (await scope.innerText()).replace(/\s+/g, ' ').trim()

const fullName = (owner: Customer) => `${owner.first_name} ${owner.last_name}`

async function openCustomer(page: Page, owner: Customer) {
  await openIn(page, store(), `/customers/${owner.id}`)
  await expect(page.getByRole('heading', { name: fullName(owner) }).first()).toBeVisible({
    timeout: 15_000,
  })
}

async function editCard(page: Page, title: RegExp) {
  await card(page, title)
    .getByRole('button', { name: /^edit$/i })
    .click()
}

const addressRow = (page: Page, street: string) =>
  card(page, /^addresses/i)
    .locator('[data-slot="item"]')
    .filter({ hasText: street })

async function addressMenu(page: Page, street: string, item: RegExp) {
  await addressRow(page, street)
    .getByRole('button', { name: /open actions/i })
    .click()
  await page.getByRole('menuitem', { name: item }).click()
}

const taxCard = (page: Page) => card(page, /^tax registration/i)
const taxRow = (page: Page, value: string) =>
  taxCard(page).getByRole('listitem').filter({ hasText: value })

async function taxMenu(page: Page, value: string, item: RegExp) {
  await taxRow(page, value)
    .getByRole('button', { name: /open actions/i })
    .click()
  await page.getByRole('menuitem', { name: item }).click()
}

const creditCard = (page: Page) => card(page, /^store credit/i)
const creditRow = (page: Page, memo: string) =>
  creditCard(page).getByRole('row').filter({ hasText: memo })

async function openList(page: Page, search?: string) {
  await openIn(page, store(), '/customers')
  await expect(page.getByRole('heading', { name: /^customers$/i })).toBeVisible({
    timeout: 15_000,
  })
  if (search) await page.getByPlaceholder(/search by email or name/i).fill(search)
}

const listRow = (page: Page, text: string) => page.getByRole('row').filter({ hasText: text })
const linkTo = (page: Page, owner: Customer) =>
  page.getByRole('row').filter({ has: page.locator(`a[href$="/customers/${owner.id}"]`) })

/** Sends a list request with its search and filters left out, so it lists everything. */
const unfiltered = (route: Route) => {
  const url = new URL(route.request().url())
  for (const key of [...url.searchParams.keys()])
    if (/search|q\[|filter/i.test(key) && !/q\[s\]/.test(key)) url.searchParams.delete(key)
  return route.continue({ url: url.toString() })
}

// --- A.1: a customer's data export -----------------------------------------

test.describe("a customer's privacy and data (P13, G-97)", () => {
  test("A.1 exports a customer's data from the privacy card", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'GET', /\/customers\/[^/]+\/export$/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    )
    const steps: Steps = []
    const owner = await seeded(baseURL, async (seed) => {
      const made = await customer(seed, 'Export')
      await addAddress(seed, made, 'Home')
      await seed.post(`customers/${made.id}/store_credits`, {
        amount: '15.00',
        currency: 'USD',
        memo: named('export credit'),
      })
      await placed(seed, made, await product(seed, 'Export'), String(baseURL))
      return made
    })

    await openCustomer(page, owner)
    const download = page.waitForEvent('download', { timeout: 30_000 })
    await card(page, /^privacy and data$/i)
      .getByRole('button', { name: /export data/i })
      .click()
    const file = await download
    // The file is read here and never kept: only its sections are recorded.
    const body = JSON.parse(readFileSync(await file.path(), 'utf8')) as Record<string, unknown>
    const sections = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.length : value && typeof value === 'object' ? 'object' : value,
      ]),
    )
    steps.push({ step: 'exported the data', name: file.suggestedFilename(), sections })
    const records = (key: string) => (Array.isArray(body[key]) ? (body[key] as unknown[]) : [])
    expect((body.account as Record<string, unknown> | undefined)?.email, 'the profile').toBe(
      owner.email,
    )
    expect(records('addresses').length, 'the addresses').toBeGreaterThanOrEqual(1)
    expect(records('orders').length, 'the orders').toBeGreaterThanOrEqual(1)
    expect(records('store_credits').length, 'the store credit').toBeGreaterThanOrEqual(1)
    expect(Array.isArray(body.gift_cards), 'the gift cards section').toBe(true)
    expect(Array.isArray(body.consent_records), 'the consent records section').toBe(true)
    // Batch 10's B7: the file holds the internal note, recorded and not judged.
    steps.push({
      step: 'the internal note in the file (batch 10, B7)',
      present: 'internal_note' in ((body.account as object) ?? {}),
    })

    const requests = await seeded(baseURL, (seed) =>
      seed.get<{ data: Record<string, unknown>[] }>('data_requests?limit=100'),
    )
    const theirs = requests.data.filter((request) => request.customer_id === owner.id)
    steps.push({
      step: "the customer's data requests, read through the Admin API",
      requests: theirs.map((request) => ({ kind: request.kind, status: request.status })),
    })
    expect(
      theirs.some((request) => request.kind === 'access' && request.status === 'completed'),
      'a completed access request',
    ).toBe(true)

    await save(page, 'A.1-export', steps, outside)
    expect(outside).toEqual([])
  })

  // --- A.2: editing and deleting addresses ----------------------------------

  test('A.2 edits an address and deletes another, keeping the one a completed order used', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/customers\/[^/]+\/addresses\/[^/]+$/, answeredEmpty)
    const steps: Steps = []
    const { owner, order } = await seeded(baseURL, async (seed) => {
      const made = await customer(seed, 'Addresses')
      const home = await addAddress(seed, made, 'Home', {
        is_default_billing: true,
        is_default_shipping: true,
      })
      await addAddress(seed, made, 'Spare')
      await addAddress(seed, made, 'Old')
      const madeOrder = await placed(
        seed,
        made,
        await product(seed, 'Addresses'),
        String(baseURL),
        {
          data: {
            shipping_address: undefined,
            billing_address: undefined,
            shipping_address_id: home.id,
            billing_address_id: home.id,
          },
        },
      )
      return { owner: made, order: madeOrder }
    })

    await openCustomer(page, owner)
    const edited = `${stamp} Edited Avenue`
    await addressMenu(page, streetOf('Spare'), /^edit$/i)
    await expect(page.getByRole('heading', { name: /^edit address$/i })).toBeVisible()
    await dialog(page)
      .getByLabel(/^address$|address line 1|street/i)
      .first()
      .fill(edited)
    await dialog(page).getByLabel(/^city/i).fill('Salem')
    await dialog(page)
      .getByRole('button', { name: /^save$/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    steps.push({ step: 'edited the Spare address', street: edited, city: 'Salem' })

    await addressMenu(page, streetOf('Old'), /^delete$/i)
    await expect(page.getByText('Delete this address?')).toBeVisible()
    await dialog(page)
      .getByRole('button', { name: /^delete$/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    steps.push({ step: 'deleted the Old address' })

    await addressMenu(page, streetOf('Home'), /^delete$/i)
    await dialog(page)
      .getByRole('button', { name: /^delete$/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    steps.push({ step: 'deleted the Home address, which the completed order used' })

    await reload(page)
    const addresses = card(page, /^addresses/i)
    await expect(addresses).toBeVisible({ timeout: 15_000 })
    const after = await textOf(addresses)
    steps.push({ step: 'after a reload, the addresses card', text: after })
    await expect(addressRow(page, edited), 'the edited street').toBeVisible()
    await expect(addressRow(page, edited), 'the edited city').toContainText('Salem')
    await expect(addressRow(page, streetOf('Old')), 'the deleted address').toHaveCount(0)
    await expect(addressRow(page, streetOf('Home')), 'the address the order used').toHaveCount(0)

    await openIn(page, store(), `/orders/${order.id}`)
    await expect(page.getByRole('heading', { name: order.number })).toBeVisible({
      timeout: 15_000,
    })
    const orderText = await textOf(page.locator('main'))
    steps.push({
      step: "the completed order's page keeps its address",
      kept: orderText.includes(streetOf('Home')),
    })
    expect(orderText, "the order's address").toContain(streetOf('Home'))

    await save(page, 'A.2-addresses', steps, outside)
    expect(outside).toEqual([])
  })

  // --- A.3: default addresses from the row menu -----------------------------

  test('A.3 sets a default billing address, then a default shipping address, from the row menu', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/customers\/[^/]+\/addresses\/[^/]+$/, answeredEmpty)
    const steps: Steps = []
    const owner = await seeded(baseURL, async (seed) => {
      const made = await customer(seed, 'Defaults')
      await addAddress(seed, made, 'Studio', { is_default_shipping: true })
      await addAddress(seed, made, 'Home', { is_default_billing: true })
      return made
    })
    const studio = streetOf('Studio')
    const home = streetOf('Home')
    const badge = (street: string, kind: 'billing' | 'shipping') =>
      addressRow(page, street).getByText(new RegExp(`^default ${kind}$`, 'i'))
    const badges = async () => ({
      studio: await textOf(addressRow(page, studio)),
      home: await textOf(addressRow(page, home)),
    })

    await openCustomer(page, owner)
    await addressMenu(page, studio, /^set as default billing$/i)
    await expect(badge(studio, 'billing')).toBeVisible({ timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    await reload(page)
    await expect(addressRow(page, studio)).toBeVisible({ timeout: 15_000 })
    steps.push({ step: 'set Studio as the default billing; after a reload', rows: await badges() })
    await expect(badge(studio, 'billing'), 'Studio is the default billing').toBeVisible()
    const shippingKept = await badge(studio, 'shipping').isVisible()

    await addressMenu(page, home, /^set as default shipping$/i)
    await expect(badge(home, 'shipping')).toBeVisible({ timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    await reload(page)
    await expect(addressRow(page, home)).toBeVisible({ timeout: 15_000 })
    steps.push({ step: 'set Home as the default shipping; after a reload', rows: await badges() })
    await expect(badge(home, 'shipping'), 'Home is the default shipping').toBeVisible()
    const billingKept = await badge(studio, 'billing').isVisible()

    steps.push({ step: 'the other default stayed where it was (SD-45)', shippingKept, billingKept })
    await save(page, 'A.3-defaults', steps, outside)
    expect(outside).toEqual([])
    expect.soft(shippingKept, 'Studio keeps the default shipping (SD-45)').toBe(true)
    expect.soft(billingKept, 'Studio keeps the default billing').toBe(true)
  })

  // --- A.4: tax registrations -----------------------------------------------

  test('A.4 adds, edits and deletes a tax registration, with a refused number and a typed kind', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'POST', /\/customers\/[^/]+\/tax_identifiers$/, answeredEmpty)
    const steps: Steps = []
    const owner = await seeded(baseURL, (seed) => customer(seed, 'Tax'))
    const openSheet = async () => {
      await taxCard(page)
        .getByRole('button', { name: /add registration/i })
        .click()
      await expect(page.getByRole('heading', { name: /add tax registration/i })).toBeVisible()
    }
    const kind = () => dialog(page).getByRole('combobox', { name: /^kind/i })
    const number = () => dialog(page).getByLabel(/^number/i)

    await openCustomer(page, owner)
    // First, while the customer has no EU VAT number: one registration of a
    // kind is allowed, so a later attempt would be refused as taken instead.
    await openSheet()
    await kind().click()
    await page.getByRole('option', { name: 'EU VAT' }).click()
    await number().fill('DE12345')
    await dialog(page)
      .getByRole('button', { name: /^save$/i })
      .click()
    const refusal = dialog(page).locator('[data-slot="field-error"], [role="alert"]').first()
    await expect(refusal, 'the refusal under Number').toBeVisible({ timeout: 15_000 })
    const refusalText = await textOf(refusal)
    steps.push({ step: 'a number that fails its format was refused', message: refusalText })
    await dialog(page)
      .getByRole('button', { name: /^cancel$/i })
      .click()
    await reload(page)
    await expect(taxCard(page)).toBeVisible({ timeout: 15_000 })
    await expect(taxRow(page, 'DE12345'), 'nothing saved for the refused number').toHaveCount(0)

    await openSheet()
    await kind().click()
    await page.getByRole('option', { name: 'EU VAT' }).click()
    await number().fill('DE811907980')
    await dialog(page)
      .getByRole('button', { name: /^save$/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    await reload(page)
    await expect(taxRow(page, 'DE811907980'), 'the added registration').toBeVisible({
      timeout: 15_000,
    })
    steps.push({
      step: 'added an EU VAT number; after a reload',
      card: await textOf(taxCard(page)),
    })

    await taxMenu(page, 'DE811907980', /^edit$/i)
    await expect(page.getByRole('heading', { name: /edit tax registration/i })).toBeVisible()
    await number().fill('DE136695976')
    await dialog(page)
      .getByRole('button', { name: /^save$/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    await reload(page)
    await expect(taxRow(page, 'DE136695976'), 'the edited number').toBeVisible({
      timeout: 15_000,
    })
    await expect(taxRow(page, 'DE811907980')).toHaveCount(0)
    steps.push({ step: 'edited the number; after a reload', card: await textOf(taxCard(page)) })

    await openSheet()
    await kind().fill('nz_gst')
    await number().click()
    // The field is emptied as focus settles on Number, not at once (SD-44).
    await page.waitForTimeout(1_000)
    const typedKind = await kind().inputValue()
    steps.push({ step: 'typed the kind nz_gst and moved on', fieldReads: typedKind })
    await number().fill('123-456-789')
    await dialog(page)
      .getByRole('button', { name: /^save$/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    await reload(page)
    await expect(taxRow(page, '123-456-789'), 'the registration with the typed kind').toBeVisible({
      timeout: 15_000,
    })
    await expect(taxRow(page, '123-456-789'), 'saved as typed').toContainText('nz_gst')
    steps.push({ step: 'saved the typed kind; after a reload', card: await textOf(taxCard(page)) })

    await taxMenu(page, 'DE136695976', /^delete$/i)
    await dialog(page)
      .getByRole('button', { name: /^delete$/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    await reload(page)
    await expect(taxRow(page, '123-456-789')).toBeVisible({ timeout: 15_000 })
    await expect(taxRow(page, 'DE136695976'), 'the deleted registration').toHaveCount(0)
    steps.push({
      step: 'deleted the EU VAT number; after a reload',
      card: await textOf(taxCard(page)),
    })
    steps.push({
      step: 'checking a number with a registry',
      result: 'NOT_RUN',
      reason: 'no validator is registered on the browser-test server',
    })

    await save(page, 'A.4-tax-registrations', steps, outside)
    expect(outside).toEqual([])
    expect.soft(refusalText, 'the refusal says what is wrong (SD-46)').toMatch(/valid EU VAT/i)
    expect.soft(typedKind, 'the typed kind stays in its field (SD-44)').toBe('nz_gst')
  })

  // --- A.5: the internal note -----------------------------------------------

  test('A.5 edits the internal note, then clears it', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/api\/v3\/admin\/customers\/[^/]+$/, answeredEmpty)
    const steps: Steps = []
    const owner = await seeded(baseURL, (seed) => customer(seed, 'Note'))
    const note = card(page, /^internal note$/i)
    const editor = () => page.getByRole('textbox', { name: /internal note/i })
    const text = named('note text')

    await openCustomer(page, owner)
    await editCard(page, /^internal note$/i)
    await editor().click()
    await page.keyboard.type(text)
    await note.getByRole('button', { name: /^save$/i }).click()
    await expect(editor()).toBeHidden({ timeout: 15_000 })
    await reload(page)
    await expect(note, 'the saved note').toContainText(text, { timeout: 15_000 })
    steps.push({ step: 'wrote the note; after a reload', card: await textOf(note) })

    await editCard(page, /^internal note$/i)
    await editor().click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await note.getByRole('button', { name: /^save$/i }).click()
    await expect(editor()).toBeHidden({ timeout: 15_000 })
    await reload(page)
    await expect(note, 'the empty state').toContainText(/no internal notes/i, { timeout: 15_000 })
    steps.push({ step: 'cleared the note; after a reload', card: await textOf(note) })

    await save(page, 'A.5-note', steps, outside)
    expect(outside).toEqual([])
  })

  // --- A.6: deleting store credit --------------------------------------------

  test('A.6 deletes an unused store credit, and is refused deleting a used one', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'DELETE', /\/customers\/[^/]+\/store_credits\/[^/]+$/, answeredEmpty)
    const steps: Steps = []
    const unused = named('unused credit')
    const used = named('used credit')
    const owner = await seeded(baseURL, async (seed) => {
      const made = await customer(seed, 'Credit')
      await addAddress(seed, made, 'Home')
      await seed.post(`customers/${made.id}/store_credits`, {
        amount: '10.00',
        currency: 'USD',
        memo: used,
      })
      await placed(seed, made, await product(seed, 'Credit'), String(baseURL), {
        storeCredit: true,
      })
      await seed.post(`customers/${made.id}/store_credits`, {
        amount: '12.00',
        currency: 'USD',
        memo: unused,
      })
      return made
    })
    const deleteCredit = async (memo: string) => {
      await creditRow(page, memo).getByRole('button').last().click()
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByText('Delete this store credit?')).toBeVisible()
      await dialog(page)
        .getByRole('button', { name: /^delete$/i })
        .click()
    }

    await openCustomer(page, owner)
    await expect(creditRow(page, used)).toBeVisible({ timeout: 15_000 })
    steps.push({ step: 'the store credit card', card: await textOf(creditCard(page)) })
    await deleteCredit(unused)
    await expect(creditRow(page, unused)).toHaveCount(0, { timeout: 15_000 })
    await reload(page)
    await expect(creditRow(page, used)).toBeVisible({ timeout: 15_000 })
    await expect(creditRow(page, unused), 'the unused credit, deleted').toHaveCount(0)
    steps.push({
      step: 'deleted the unused credit; after a reload',
      card: await textOf(creditCard(page)),
    })

    await deleteCredit(used)
    const message = page.getByText(/cannot delete a store credit that has already been used/i)
    const shown = await message
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false)
    const toasts = await page
      .getByRole('region', { name: 'Notifications' })
      .innerText()
      .catch(() => '')
    steps.push({ step: 'tried to delete the used credit', messageShown: shown, toasts })
    await reload(page)
    await expect(creditRow(page, used), 'the used credit, still listed').toBeVisible({
      timeout: 15_000,
    })
    steps.push({ step: 'after a reload', card: await textOf(creditCard(page)) })

    await save(page, 'A.6-store-credit', steps, outside)
    expect(outside).toEqual([])
    expect(shown, "Spree's refusal, shown where the merchant can read it").toBe(true)
  })
})

// --- A.7 and A.8: the customer list ------------------------------------------

test.describe('the customer list (P13, G-97)', () => {
  test('A.7 removes customers from a group, and removes a tag, in bulk', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'POST', /\/customers\/bulk_remove_from_groups$/, answeredEmpty)
    const steps: Steps = []
    const groupName = named('bulk group')
    const tag = `p13-bulk-${stamp}`
    const [first, second, kept] = await seeded(baseURL, async (seed) => {
      const group = await seed.post<{ id: string }>('customer_groups', { name: groupName })
      const made: Customer[] = []
      for (const label of ['Bulk one', 'Bulk two', 'Bulk kept'])
        made.push(await customer(seed, label, { customer_group_ids: [group.id], tags: [tag] }))
      return made
    })
    const select = async () => {
      await openList(page, `p13-bulk-`)
      for (const owner of [first, second])
        await listRow(page, owner.email)
          .getByRole('checkbox', { name: /select row/i })
          .check()
      await expect(page.getByText(/2 selected/i)).toBeVisible()
    }

    await select()
    await page.getByRole('button', { name: /remove from group/i }).click()
    await expect(page.getByRole('heading', { name: /remove from groups/i })).toBeVisible()
    await dialog(page)
      .getByPlaceholder(/search customer groups/i)
      .fill(groupName)
    await page.getByRole('option', { name: groupName }).first().click()
    await dialog(page)
      .getByRole('button', { name: /^remove$/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    steps.push({ step: 'removed two customers from the group' })

    await select()
    await page.getByRole('button', { name: /^remove tags…$/i }).click()
    await expect(page.getByRole('heading', { name: /^remove tags$/i })).toBeVisible()
    const tagInput = dialog(page).getByPlaceholder(/tags/i).first()
    await tagInput.fill(tag)
    await tagInput.press('Enter')
    await dialog(page)
      .getByRole('button', { name: /^remove$/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    steps.push({ step: 'removed the tag from two customers' })

    await openList(page)
    await addRecordFilter(page, /^groups$/i, groupName)
    await expect(
      listRow(page, kept.email),
      'the customer not selected, still in the group',
    ).toBeVisible({
      timeout: 15_000,
    })
    const inGroup = await Promise.all(
      [first, second].map((owner) => listRow(page, owner.email).count()),
    )
    steps.push({ step: 'after a reload, filtered to the group', selectedStillListed: inGroup })
    for (const owner of [first, second])
      await expect(listRow(page, owner.email), `${owner.email} left the group`).toHaveCount(0)

    await openList(page)
    await page.getByRole('button', { name: /add filter/i }).click()
    await page
      .locator('[data-slot="filter-panel-item"]')
      .getByText(/^tags$/i)
      .click()
    await page.getByPlaceholder(/filter to…/i).fill(tag)
    await page.getByRole('button', { name: tag, exact: true }).click()
    await page.keyboard.press('Escape')
    await expect(listRow(page, kept.email), 'the customer not selected keeps the tag').toBeVisible({
      timeout: 15_000,
    })
    const tagged = await Promise.all(
      [first, second].map((owner) => listRow(page, owner.email).count()),
    )
    steps.push({ step: 'after a reload, filtered to the tag', selectedStillListed: tagged })
    for (const owner of [first, second])
      await expect(listRow(page, owner.email), `${owner.email} lost the tag`).toHaveCount(0)

    await save(page, 'A.7-bulk-remove', steps, outside)
    expect(outside).toEqual([])
  })

  test('A.8 filters the list by group, company, tags and erased customers', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    if (sabotaged)
      await page.route(
        (url) => url.pathname === '/api/v3/admin/customers',
        (route) => (route.request().method() === 'GET' ? unfiltered(route) : route.fallback()),
      )
    const steps: Steps = []
    const groupName = named('filter group')
    const companyName = named('filter company')
    const tag = `p13-filter-${stamp}`
    const people = await seeded(baseURL, async (seed) => {
      const group = await seed.post<{ id: string }>('customer_groups', { name: groupName })
      const grouped = await customer(seed, 'Filter grouped', { customer_group_ids: [group.id] })
      const member = await customer(seed, 'Filter member')
      const company = await seed.post<{ id: string }>('companies', { name: companyName })
      await seed.post(`companies/${company.id}/memberships`, { customer_email: member.email })
      const tagged = await customer(seed, 'Filter tagged', { tags: [tag] })
      const erased = await customer(seed, 'Filter erased')
      await seed.post(`customers/${erased.id}/anonymize`)
      return { grouped, member, tagged, erased }
    })
    const { grouped, member, tagged, erased } = people
    const listed = async () =>
      Object.fromEntries(
        await Promise.all(
          Object.entries(people).map(async ([key, owner]) => [
            key,
            await linkTo(page, owner).count(),
          ]),
        ),
      )
    const only = async (wanted: Customer, label: string) => {
      await expect(linkTo(page, wanted), `${label} lists its match`).toBeVisible({
        timeout: 15_000,
      })
      const seen = await listed()
      steps.push({ step: `filtered by ${label}`, listed: seen })
      for (const [key, owner] of Object.entries(people))
        if (owner !== wanted) expect(seen[key], `${label} leaves out ${key}`).toBe(0)
    }
    const cleared = async (label: string) => {
      await openList(page)
      await expect(linkTo(page, grouped)).toBeVisible({ timeout: 15_000 })
      const seen = await listed()
      steps.push({ step: `cleared the ${label} filter`, listed: seen })
      for (const key of ['grouped', 'member', 'tagged'])
        expect(seen[key], `cleared, ${key} is listed again`).toBe(1)
      expect(seen.erased, 'an erased customer stays out without its filter').toBe(0)
    }

    await openList(page)
    await addRecordFilter(page, /^groups$/i, groupName)
    await only(grouped, 'group')
    await cleared('group')

    await addRecordFilter(page, /^companies$/i, companyName)
    await only(member, 'company')
    await cleared('company')

    await page.getByRole('button', { name: /add filter/i }).click()
    await page
      .locator('[data-slot="filter-panel-item"]')
      .getByText(/^tags$/i)
      .click()
    await page.getByPlaceholder(/filter to…/i).fill(tag)
    await page.getByRole('button', { name: tag, exact: true }).click()
    await page.keyboard.press('Escape')
    await only(tagged, 'tags')
    await cleared('tags')

    await page.getByRole('button', { name: /add filter/i }).click()
    await page
      .locator('[data-slot="filter-panel-item"]')
      .getByText(/^erased$/i)
      .click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^erased$/i })
      .last()
      .click()
    await page.keyboard.press('Escape')
    await expect(linkTo(page, erased), 'the erased filter lists the erased customer').toBeVisible({
      timeout: 15_000,
    })
    const seen = await listed()
    steps.push({ step: 'filtered by erased', listed: seen })
    for (const key of ['grouped', 'member', 'tagged'])
      expect(seen[key], `erased leaves out ${key}`).toBe(0)

    await save(page, 'A.8-filters', steps, outside)
    expect(outside).toEqual([])
  })
})

// --- A.9 and A.10: importing and exporting the list ---------------------------

test.describe('importing and exporting customers (P13, G-97)', () => {
  test('A.9 imports a customer file through the wizard, to the end', async ({ page }) => {
    const outside = await blockOutside(page)
    // Sabotaged, the browser uploads the file without its customers.
    expectFailureWhenSabotaged()
    const steps: Steps = []
    const first = { email: emailOf('Imported one'), first: 'Noor', last: `Haddad ${stamp}` }
    const second = { email: emailOf('Imported two'), first: 'Tomas', last: `Varga ${stamp}` }
    // A row with no email, which Spree's customer row refuses ("Email is required").
    const refusedName = `Refused ${stamp}`
    const header =
      'email,first_name,last_name,phone,accepts_email_marketing,tags,company,address1,address2,city,province_code,country_code,zip'
    const rows = [
      `${first.email},${first.first},${first.last},555-0121,true,Imported,,${streetOf('Alder')},,Portland,OR,US,97204`,
      `${second.email},${second.first},${second.last},555-0122,false,Imported,Varga Studio,${streetOf('Birch')},Suite 2,Portland,OR,US,97211`,
      `,P13,${refusedName},555-0123,false,,,${streetOf('Cedar')},,Portland,OR,US,97209`,
    ]
    const file = `${[header, ...(sabotaged ? [] : rows)].join('\n')}\n`

    await openList(page)
    await page.getByRole('button', { name: /^import$/i }).click()
    await expect(page.getByRole('heading', { name: /import from csv/i })).toBeVisible()
    await dialog(page)
      .locator('input[type="file"]')
      .setInputFiles({
        name: `p13-customers-${stamp}.csv`,
        mimeType: 'text/csv',
        buffer: Buffer.from(file),
      })
    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByText('Map columns')).toBeVisible({ timeout: 15_000 })
    steps.push({ step: 'uploaded the file and reached the column mapping', rows: rows.length })
    await page.getByRole('button', { name: /start import/i }).click()
    await expect(page.getByText(/import completed/i)).toBeVisible({ timeout: 180_000 })
    const report = await textOf(dialog(page))
    steps.push({ step: 'the wizard finished', report })
    await expect(dialog(page), 'two rows imported and one refused').toContainText(
      /2 rows imported\D+1 failed/i,
    )
    await expect(dialog(page), "the refused row's reason").toContainText(/email is required/i)

    await openList(page, `p13-imported-`)
    for (const person of [first, second])
      await expect(listRow(page, person.email), `${person.email} is listed`).toBeVisible({
        timeout: 15_000,
      })
    await openList(page, refusedName)
    await expect(
      page.getByRole('row').filter({ hasText: refusedName }),
      'the refused row added no customer',
    ).toHaveCount(0)
    await openList(page, `p13-imported-`)
    await listRow(page, second.email).getByRole('link').first().click()
    await expect(
      page.getByRole('heading', { name: `${second.first} ${second.last}` }).first(),
    ).toBeVisible({
      timeout: 15_000,
    })
    const addresses = card(page, /^addresses/i)
    await expect(addresses, "the file's address").toContainText(streetOf('Birch'), {
      timeout: 15_000,
    })
    steps.push({ step: "an imported customer's addresses", card: await textOf(addresses) })

    await save(page, 'A.9-import', steps, outside)
    expect(outside).toEqual([])
  })

  test('A.10 exports the customer list', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    if (sabotaged)
      await page.route(
        (url) =>
          url.pathname.startsWith('/api/v3/admin/exports/') && url.pathname.endsWith('/download'),
        (route) => route.fulfill({ status: 200, contentType: 'text/csv', body: 'email\n' }),
      )
    const steps: Steps = []
    const owner = await seeded(baseURL, (seed) => customer(seed, 'Exported'))
    const total = await seeded(baseURL, async (seed) =>
      Number((await seed.get<{ meta: { count: number } }>('customers?limit=1')).meta.count),
    )

    await openList(page)
    await page.getByRole('button', { name: /^export$/i }).click()
    await expect(dialog(page)).toBeVisible()
    await dialog(page).getByText('All records', { exact: true }).click()
    const download = page.waitForEvent('download', { timeout: 120_000 })
    await dialog(page)
      .getByRole('button', { name: /^export$/i })
      .click()
    const file = await download
    const csv = readFileSync(await file.path(), 'utf8')
    const lines = csv.trim().split('\n')
    steps.push({
      step: 'the export downloaded when it was ready',
      name: file.suggestedFilename(),
      header: lines[0],
      customerRows: lines.length - 1,
      customersTheListCounts: total,
      holdsTheTestsCustomer: csv.includes(owner.email),
    })
    expect(csv, "the file holds the store's customers").toContain(owner.email)
    expect(lines.length - 1, 'one row for each customer the list counts').toBe(total)

    await save(page, 'A.10-list-export', steps, outside)
    expect(outside).toEqual([])
  })
})

// --- A.11 to A.14: the customer's page ----------------------------------------

test.describe("the customer's page (P13, G-97)", () => {
  test('A.11 refuses a profile and a new customer with an email another customer has', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'PATCH',
      /\/api\/v3\/admin\/customers\/[^/]+$/,
      withBody((body) => ({ ...body, email: emailOf('Unique instead') })),
    )
    const steps: Steps = []
    const [taken, other] = await seeded(baseURL, async (seed) => [
      await customer(seed, 'Taken'),
      await customer(seed, 'Other'),
    ])
    const emailError = (scope: Locator) =>
      scope
        .locator('[data-slot="field"]')
        .filter({ has: page.getByLabel(/^email/i) })
        .locator('[data-slot="field-error"], [role="alert"]')
        .first()

    await openCustomer(page, other)
    await editCard(page, /^profile$/i)
    await expect(page.getByRole('heading', { name: /^edit customer$/i })).toBeVisible()
    await dialog(page)
      .getByLabel(/^email/i)
      .fill(taken.email)
    await dialog(page)
      .getByRole('button', { name: /^save$/i })
      .click()
    await expect(
      dialog(page)
        .getByText(/has already been taken/i)
        .first(),
    ).toBeVisible({
      timeout: 15_000,
    })
    const profileRefusal = await textOf(emailError(dialog(page)))
    steps.push({ step: 'saved the profile with a taken email', underEmail: profileRefusal })
    expect(profileRefusal, 'the refusal under the email field').toMatch(
      /^(email )?has already been taken$/i,
    )
    await dialog(page)
      .getByRole('button', { name: /^cancel$/i })
      .click()
    await reload(page)
    await expect(card(page, /^profile$/i), 'the email, unchanged').toContainText(other.email, {
      timeout: 15_000,
    })

    await openList(page)
    await page.getByRole('button', { name: /new customer/i }).click()
    await dialog(page)
      .getByLabel(/^email/i)
      .fill(taken.email)
    await dialog(page)
      .getByRole('button', { name: /^create customer$/i })
      .click()
    await expect(
      dialog(page)
        .getByText(/has already been taken/i)
        .first(),
    ).toBeVisible({
      timeout: 15_000,
    })
    const newRefusal = await textOf(emailError(dialog(page)))
    steps.push({ step: 'created a customer with the taken email', underEmail: newRefusal })
    expect(newRefusal, 'the refusal under the email field').toMatch(
      /^(email )?has already been taken$/i,
    )
    await page.keyboard.press('Escape')
    await openList(page, taken.email)
    await expect(listRow(page, taken.email)).toHaveCount(1, { timeout: 15_000 })
    steps.push({ step: 'the list holds one customer with that email' })

    await save(page, 'A.11-email-taken', steps, outside)
    expect(outside).toEqual([])
  })

  test("A.12 the orders card's View all link lists only the customer's orders", async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    if (sabotaged)
      await page.route(
        (url) => url.pathname === '/api/v3/admin/orders',
        (route) => (route.request().method() === 'GET' ? unfiltered(route) : route.fallback()),
      )
    const steps: Steps = []
    const { owner, numbers, otherNumber } = await seeded(baseURL, async (seed) => {
      const variant = await product(seed, 'View all')
      const made = await customer(seed, 'Many orders')
      const placedNumbers: string[] = []
      for (let index = 0; index < 11; index++)
        placedNumbers.push((await placed(seed, made, variant, String(baseURL))).number)
      const someoneElse = await customer(seed, 'Someone else')
      const theirs = await placed(seed, someoneElse, variant, String(baseURL))
      return { owner: made, numbers: placedNumbers, otherNumber: theirs.number }
    })

    await openCustomer(page, owner)
    const orders = card(page, /^orders/i)
    await expect(orders).toContainText(numbers[10], { timeout: 15_000 })
    const shownOnCard = await orders.getByRole('row').filter({ hasText: /\d/ }).count()
    await orders.getByRole('link', { name: /view all/i }).click()
    await expect(page.getByRole('heading', { name: /^orders$/i })).toBeVisible({ timeout: 15_000 })
    await expect(
      page
        .getByRole('row')
        .filter({ hasText: numbers[0] })
        .or(page.getByRole('row').filter({ hasText: otherNumber }))
        .first(),
    ).toBeVisible({ timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    const listed = await Promise.all(
      numbers.map(
        async (number) => (await page.getByRole('row').filter({ hasText: number }).count()) > 0,
      ),
    )
    const otherListed = (await page.getByRole('row').filter({ hasText: otherNumber }).count()) > 0
    const chip = await page
      .getByRole('button', { name: /remove filter/i })
      .first()
      .locator('xpath=..')
      .innerText()
      .catch(() => '')
    steps.push({
      step: 'followed View all',
      url: new URL(page.url()).pathname,
      ordersOfTheCustomer: numbers.length,
      rowsOnTheCard: shownOnCard,
      listed: listed.filter(Boolean).length,
      anotherCustomersOrderListed: otherListed,
      filterChip: chip.replace(/\s+/g, ' ').trim(),
    })
    await save(page, 'A.12-orders-view-all', steps, outside)
    expect(listed.every(Boolean), "every one of the customer's orders is listed").toBe(true)
    expect(otherListed, "another customer's order is not listed").toBe(false)
    expect(outside).toEqual([])
  })

  test("A.13 the JSON drawer shows the customer's record", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    const owner = await seeded(baseURL, (seed) => customer(seed, 'Json'))
    if (sabotaged)
      await page.route(
        (url) => url.pathname === `/api/v3/admin/customers/${owner.id}`,
        async (route) => {
          if (route.request().method() !== 'GET') return route.fallback()
          const response = await route.fetch()
          const body = (await response.json()) as Record<string, unknown>
          await route.fulfill({ response, json: { ...body, email: 'someone-else@example.com' } })
        },
      )
    const steps: Steps = []

    await openCustomer(page, owner)
    await page.getByRole('button', { name: 'More actions' }).click()
    await page.getByRole('menuitem', { name: /view as json/i }).click()
    const drawer = dialog(page)
    await expect(drawer).toBeVisible()
    const text = await textOf(drawer)
    steps.push({
      step: 'opened the JSON drawer',
      carriesId: text.includes(owner.id),
      carriesEmail: text.includes(owner.email),
    })
    await expect(drawer, 'the prefixed id').toContainText(owner.id)
    await expect(drawer, 'the email').toContainText(owner.email)

    await save(page, 'A.13-json-drawer', steps, outside)
    expect(outside).toEqual([])
  })

  test("A.14 fills a customer field on a customer's page", async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    if (sabotaged)
      await page.route(
        (url) => /custom_field/.test(url.pathname),
        (route) =>
          ['POST', 'PATCH', 'PUT'].includes(route.request().method())
            ? answeredEmpty(route)
            : route.fallback(),
      )
    const steps: Steps = []
    const label = named('pickup day')
    const owner = await seeded(baseURL, async (seed) => {
      await seed.post('custom_field_definitions', {
        resource_type: 'customer',
        namespace: 'custom',
        key: `p13_pickup_${stamp}`,
        label,
        field_type: 'short_text',
      })
      return customer(seed, 'Field')
    })
    const value = `Saturday ${stamp}`

    await openCustomer(page, owner)
    const fields = card(page, /custom fields|additional/i)
    await expect(fields).toBeVisible({ timeout: 15_000 })
    const field = fields.getByLabel(label)
    if (await field.isVisible().catch(() => false)) {
      await field.fill(value)
      await field.press('Tab')
      steps.push({ step: 'filled the field on the card' })
    } else {
      await fields.getByRole('button', { name: /^edit$/i }).click()
      await page.getByLabel(label).fill(value)
      await page.getByRole('button', { name: /^save$/i }).click()
      steps.push({ step: "filled the field in the card's editor" })
    }
    await expect(page.getByText(value).first()).toBeVisible({ timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    await reload(page)
    const after = card(page, /custom fields|additional/i)
    await expect(after).toBeVisible({ timeout: 15_000 })
    const kept =
      (await after.getByText(value).count()) > 0 ||
      (await after
        .getByLabel(label)
        .inputValue()
        .catch(() => '')) === value
    steps.push({ step: 'after a reload, the card', card: await textOf(after), kept })
    expect(kept, 'the saved value').toBe(true)

    await save(page, 'A.14-custom-field', steps, outside)
    expect(outside).toEqual([])
  })
})
