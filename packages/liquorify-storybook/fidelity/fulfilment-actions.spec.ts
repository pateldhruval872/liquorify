import { expect, type Locator, type Page, type Route, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { fixture, pdf, upload } from './catalog'
import {
  answeredEmpty,
  blockOutside,
  confirmation,
  expectFailureWhenSabotaged,
  recorder,
  reload,
  type Steps,
  sabotage,
  sabotaged,
  seeded,
  stamp,
} from './p9'
import {
  card,
  dialog,
  fulfilmentsOf,
  methodsFor,
  named,
  onHand,
  openInventory,
  openOrder,
  placed,
  rated,
  shipped,
} from './p11-orders'

/**
 * The platform batch's step P11, part 3, G-92: the fulfilment and after-sale
 * actions batch 8's part 2 captured but no browser test drives, as browser
 * tests (actions 3.1 to 3.10 and 3.12 to 3.14 of the work item; 3.11 stays
 * with P4, and 3.15 is in the storefront's repository). Each drives the
 * dashboard as the browser tests' admin and asserts what the screen shows and,
 * after a reload, what was kept.
 *
 * Every test first adds its own records through the Admin API, named with the
 * run's stamp: a product stocked everywhere, whose delivery profile quotes two
 * flat-rate methods to the United States, a customer with default addresses,
 * and placed orders paid by cheque, so no provider is called. With
 * `P11_SABOTAGE=1` each test is expected to fail, and the browser undoes the
 * change the test then looks for.
 *
 * Known defects and held behaviours fail where they stand, with the checks
 * before them recorded: SD-36 (3.2, 3.7), SD-37 (3.12, 3.13), SD-35 (3.13) and
 * part 2's B11 (3.9).
 */

const { snap, save } = recorder('fulfilment', 'p11')

test.beforeEach(async ({ page }) => {
  test.setTimeout(180_000)
  await login(page)
})

// --- Records each test starts from -----------------------------------------

const locations = { shop: 'Shop location', destination: 'E2E Destination Warehouse' }

// --- Reading the screens ---------------------------------------------------

const fulfilmentsCard = (page: Page) => card(page, /^fulfillments/i)

/** The fulfilments on the order page, each its own nested card. */
const panels = (page: Page) =>
  fulfilmentsCard(page)
    .locator('[data-slot="card"]')
    .filter({
      has: page.locator('[data-slot="status-badge"]'),
    })

/** A fulfilment's own menu, beside its status. */
async function panelMenu(panel: Locator, item: string | RegExp) {
  await panel.locator('[data-slot="card-header"]').getByRole('button', { name: 'Actions' }).click()
  await panel.page().getByRole('menuitem', { name: item }).click()
}

async function statusOf(panel: Locator) {
  return ((await panel.locator('[data-slot="status-badge"]').first().innerText()) || '').trim()
}

/** What each fulfilment shows: its status, where it ships from and its text. */
async function readPanels(page: Page) {
  await expect(fulfilmentsCard(page)).toBeVisible({ timeout: 15_000 })
  const found = []
  for (const panel of await panels(page).all())
    found.push({
      status: await statusOf(panel),
      text: (await panel.innerText()).replace(/\s+/g, ' '),
    })
  return found
}

/** The units a fulfilment's line shows, from "$20.00 × 3". */
const unitsIn = (text: string) => Number((text.match(/×\s*(\d+)/) ?? ['', '0'])[1])

async function confirmWith(page: Page, name: string | RegExp) {
  await confirmation(page).getByRole('button', { name }).click()
}

/** Answers a read with `edit` applied to what the server sent. */
const answeredWith =
  (edit: (body: Record<string, unknown>) => Record<string, unknown>) => async (route: Route) => {
    const response = await route.fetch()
    await route.fulfill({ response, json: edit(await response.json()) })
  }

// --- 3.1: fulfilling -------------------------------------------------------

test.describe('fulfilling (P11, G-92)', () => {
  test('3.1 fulfilling every unit, then some units, with tracking, a carrier and the notify switch', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/fulfillments\/[^/]+\/fulfill$/, answeredEmpty)
    const { first, second, item } = await seeded(baseURL, async (seed) => {
      const at = await rated(seed, 'Fulfil', baseURL as string)
      return {
        first: await placed(seed, at, { quantity: 3 }),
        second: await placed(seed, at, { quantity: 3 }),
        item: at.product,
      }
    })
    await openInventory(page, item.sku)
    const before = await onHand(page, item.name, locations.shop)
    const steps: Steps = [{ step: 'read the stock at the shop before fulfilling', onHand: before }]

    await openOrder(page, first)
    await fulfilmentsCard(page).getByRole('button', { name: 'Mark as fulfilled' }).click()
    const form = fulfilmentsCard(page)
    await expect(form.getByLabel(/^quantity to ship of/i)).toHaveValue('3')
    await form.getByLabel('Tracking number').fill('1Z999AA10123456784')
    await form.getByRole('combobox', { name: 'Shipping carrier' }).click()
    await page.getByRole('option', { name: 'UPS', exact: true }).click()
    const notify = form.getByRole('checkbox', { name: /send shipment notification/i })
    await expect(notify).toBeChecked()
    await snap(page, 'fulfil-every-unit-form')
    await form.getByRole('button', { name: 'Fulfill items' }).click()
    await expect(form.getByRole('button', { name: 'Fulfill items' })).toBeHidden({
      timeout: 15_000,
    })
    await reload(page)
    const everyUnit = await readPanels(page)
    steps.push({
      step: 'fulfilled all 3 units with a UPS tracking number, notify on, then reloaded',
      notify: true,
      panels: everyUnit,
    })
    expect(everyUnit, 'one fulfilment').toHaveLength(1)
    expect(everyUnit[0].status, 'it shows fulfilled').toMatch(/^fulfilled$/i)
    expect(everyUnit[0].text).toContain('UPS')
    expect(everyUnit[0].text).toContain('1Z999AA10123456784')
    expect(unitsIn(everyUnit[0].text)).toBe(3)

    await openOrder(page, second)
    await fulfilmentsCard(page).getByRole('button', { name: 'Mark as fulfilled' }).click()
    await form.getByLabel(/^quantity to ship of/i).fill('2')
    await form.getByLabel('Tracking number').fill('9400111899223817630345')
    await form.getByRole('combobox', { name: 'Shipping carrier' }).click()
    await page.getByRole('option', { name: 'USPS', exact: true }).click()
    await form.getByRole('checkbox', { name: /send shipment notification/i }).uncheck()
    await snap(page, 'fulfil-some-units-form')
    await form.getByRole('button', { name: 'Fulfill items' }).click()
    await expect(form.getByRole('button', { name: 'Fulfill items' })).toBeHidden({
      timeout: 15_000,
    })
    await reload(page)
    const someUnits = await readPanels(page)
    steps.push({
      step: 'fulfilled 2 of 3 units with a USPS tracking number, notify off, then reloaded',
      notify: false,
      panels: someUnits,
    })
    const fulfilled = someUnits.filter((each) => /^fulfilled$/i.test(each.status))
    const waiting = someUnits.filter((each) => /^unfulfilled$/i.test(each.status))
    expect(fulfilled, 'one fulfilment shipped').toHaveLength(1)
    expect(unitsIn(fulfilled[0].text), 'it holds the 2 units chosen').toBe(2)
    expect(fulfilled[0].text).toContain('USPS')
    expect(fulfilled[0].text).toContain('9400111899223817630345')
    expect(waiting, 'the third unit waits in its own fulfilment').toHaveLength(1)
    expect(unitsIn(waiting[0].text)).toBe(1)

    await openInventory(page, item.sku)
    const after = await onHand(page, item.name, locations.shop)
    steps.push({ step: 'read the stock at the shop after both', onHand: after })
    await save(page, 'fulfilled', steps, outside)
    expect(after, 'the shop’s stock falls by the 5 units shipped').toBe(before - 5)
  })
})

// --- 3.2 and 3.7: canceling, and adding a fulfilment -----------------------

test.describe('canceling and adding fulfilments (P11, G-92)', () => {
  test('3.2 adding a fulfilment for units no fulfilment holds, after one is canceled', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    expectFailureWhenSabotaged()
    const order = await seeded(baseURL, async (seed) => {
      const at = await rated(seed, 'Add fulfilment', baseURL as string)
      const placedOrder = await placed(seed, at, { quantity: 2 })
      const [first] = await fulfilmentsOf(seed, placedOrder)
      await seed.patch(`orders/${placedOrder.id}/fulfillments/${first.id}/cancel`)
      return placedOrder
    })

    await openOrder(page, order)
    const shown = await readPanels(page)
    const cardText = (await fulfilmentsCard(page).innerText()).replace(/\s+/g, ' ')
    // Sabotaged, the button is looked for under a name nothing has.
    const add = fulfilmentsCard(page).getByRole('button', {
      name: sabotaged ? 'Add a fulfilment that does not exist' : 'Add fulfillment',
    })
    const offered = await add.count()
    const steps: Steps = [
      {
        step: 'opened an order of 2 units whose fulfilment was canceled',
        panels: shown,
        card: cardText,
        addFulfillmentOffered: offered > 0,
      },
    ]
    expect(shown.map((each) => each.status.toLowerCase())).toEqual(['canceled'])
    if (offered === 0) {
      await save(page, 'fulfilment-added', steps, outside)
      // SD-36: Add fulfillment is never offered for these units.
      expect(offered, 'Add fulfillment is offered for the units').toBeGreaterThan(0)
    }
    await add.click()
    await dialog(page).getByRole('button', { name: 'Create' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const after = await readPanels(page)
    steps.push({ step: 'added a fulfilment for them, then reloaded', panels: after })
    await save(page, 'fulfilment-added', steps, outside)
    const open = after.filter((each) => /^unfulfilled$/i.test(each.status))
    expect(open, 'a new fulfilment').toHaveLength(1)
    expect(unitsIn(open[0].text), 'it holds the 2 units').toBe(2)
  })

  test('3.7 canceling a fulfilment', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/fulfillments\/[^/]+\/cancel$/, answeredEmpty)
    const { order, item } = await seeded(baseURL, async (seed) => {
      const at = await rated(seed, 'Cancel fulfilment', baseURL as string)
      return { order: await placed(seed, at, { quantity: 2 }), item: at.product }
    })
    await openInventory(page, item.sku)
    const before = (await inventoryText(page, item.name)) ?? ''
    const steps: Steps = [{ step: 'read the inventory row before', row: before }]

    await openOrder(page, order)
    await panelMenu(panels(page).first(), 'Cancel')
    await expect(confirmation(page)).toContainText('Cancel this fulfillment?')
    await confirmWith(page, 'Cancel fulfillment')
    await expect(confirmation(page)).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const after = await readPanels(page)
    const cardText = (await fulfilmentsCard(page).innerText()).replace(/\s+/g, ' ')
    const offered = await fulfilmentsCard(page)
      .getByRole('button', { name: 'Add fulfillment' })
      .count()
    steps.push({
      step: 'canceled the fulfilment from its menu, then reloaded',
      panels: after,
      card: cardText,
      addFulfillmentOffered: offered > 0,
    })
    await openInventory(page, item.sku)
    const released = (await inventoryText(page, item.name)) ?? ''
    steps.push({ step: 'read the inventory row after', row: released })
    await save(page, 'fulfilment-canceled', steps, outside)
    expect(after.map((each) => each.status.toLowerCase())).toEqual(['canceled'])
    expect(released, 'its stock is released').not.toEqual(before)
    // SD-36: the canceled units are not offered to a new fulfilment.
    expect(offered, 'its units are offered to a new fulfilment').toBeGreaterThan(0)
  })
})

/** The text of the shop's row for a product on the inventory list. */
async function inventoryText(page: Page, productName: string) {
  const row = page
    .getByRole('row')
    .filter({ hasText: productName })
    .filter({ hasText: locations.shop })
  await expect(row).toBeVisible({ timeout: 15_000 })
  return (await row.innerText()).replace(/\s+/g, ' ')
}

// --- 3.3 and 3.4: tracking and deliveries ----------------------------------

const _deliveryRows = (panel: Locator) => panel.locator('a[href]').filter({ hasText: /\d{6,}/ })

async function deliveryMenu(page: Page, panel: Locator, number: string, item: string) {
  const row = panel
    .locator('div, li')
    .filter({ hasText: number })
    .filter({
      has: page.getByRole('button', { name: 'Actions' }),
    })
  await row.last().getByRole('button', { name: 'Actions' }).click()
  await page.getByRole('menuitem', { name: item }).click()
}

async function trackingDialog(page: Page, number: string, carrier: string) {
  await dialog(page).getByLabel('Tracking number').fill(number)
  await dialog(page).getByRole('combobox', { name: 'Shipping carrier' }).click()
  await page.getByRole('option', { name: carrier, exact: true }).click()
  await dialog(page).getByRole('button', { name: 'Save' }).click()
  await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
}

test.describe('tracking and deliveries (P11, G-92)', () => {
  test('3.3 adding, editing and removing tracking, before and after the parcel ships', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'POST', /\/fulfillments\/[^/]+\/deliveries$/, answeredEmpty)
    const order = await seeded(baseURL, async (seed) =>
      placed(seed, await rated(seed, 'Tracking', baseURL as string)),
    )
    const steps: Steps = []
    const numbers = {
      before: ['1Z999AA10123456784', '1Z999AA10123456785'],
      after: ['9400111899223817630345', '9400111899223817630346'],
    }

    await openOrder(page, order)
    for (const moment of ['before', 'after'] as const) {
      const [added, edited] = numbers[moment]
      const panel = panels(page).first()
      if (moment === 'before') await panelMenu(panel, 'Add tracking')
      else await panel.getByRole('button', { name: 'Add tracking' }).first().click()
      await trackingDialog(page, added, moment === 'before' ? 'UPS' : 'USPS')
      await reload(page)
      const afterAdd = (await panels(page).first().innerText()).replace(/\s+/g, ' ')
      steps.push({ step: `added tracking ${moment} shipping, then reloaded`, panel: afterAdd })
      expect(afterAdd, `the tracking added ${moment} shipping shows`).toContain(added)

      await deliveryMenu(page, panels(page).first(), added, 'Edit')
      await trackingDialog(page, edited, moment === 'before' ? 'UPS' : 'USPS')
      await reload(page)
      const afterEdit = (await panels(page).first().innerText()).replace(/\s+/g, ' ')
      steps.push({ step: `edited it ${moment} shipping, then reloaded`, panel: afterEdit })
      expect(afterEdit).toContain(edited)
      expect(afterEdit).not.toContain(added)

      await deliveryMenu(page, panels(page).first(), edited, 'Delete')
      await expect(confirmation(page)).toContainText('Remove this tracking number?')
      await confirmWith(page, 'Delete')
      await expect(confirmation(page)).toBeHidden({ timeout: 15_000 })
      await reload(page)
      const afterRemove = (await panels(page).first().innerText()).replace(/\s+/g, ' ')
      steps.push({ step: `removed it ${moment} shipping, then reloaded`, panel: afterRemove })
      expect(afterRemove).not.toContain(edited)

      if (moment === 'before') {
        await seeded(baseURL, (seed) => shipped(seed, order))
        await reload(page)
        await expect(panels(page).first().locator('[data-slot="status-badge"]')).toHaveText(
          /fulfilled/i,
        )
      }
    }
    await save(page, 'tracking', steps, outside)
  })

  test('3.4 marking a fulfilment delivered, and one of its consignments delivered', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/mark_delivered$/, answeredEmpty)
    const { whole, partly } = await seeded(baseURL, async (seed) => {
      const at = await rated(seed, 'Delivered', baseURL as string)
      const wholeOrder = await placed(seed, at)
      await shipped(seed, wholeOrder)
      const partlyOrder = await placed(seed, at)
      const fulfilment = await shipped(seed, partlyOrder)
      for (const number of ['1Z999AA10123456786', '1Z999AA10123456787'])
        await seed.post(`orders/${partlyOrder.id}/fulfillments/${fulfilment.id}/deliveries`, {
          tracking_number: number,
          carrier: 'ups',
        })
      return { whole: wholeOrder, partly: partlyOrder }
    })
    const steps: Steps = []

    await openOrder(page, whole)
    await panels(page).first().getByRole('button', { name: 'Mark as delivered' }).click()
    await expect(
      panels(page).first().getByRole('button', { name: 'Mark as delivered' }),
    ).toBeHidden({
      timeout: 15_000,
    })
    await reload(page)
    const wholePanels = await readPanels(page)
    steps.push({ step: 'marked the fulfilment delivered, then reloaded', panels: wholePanels })
    expect(wholePanels[0].status, 'the fulfilment shows delivered').toMatch(/^delivered$/i)

    await openOrder(page, partly)
    const beforeText = (await panels(page).first().innerText()).replace(/\s+/g, ' ')
    await deliveryMenu(page, panels(page).first(), '1Z999AA10123456786', 'Mark arrived')
    await page.waitForLoadState('networkidle')
    await reload(page)
    const partlyPanels = await readPanels(page)
    steps.push({
      step: 'marked one of two consignments arrived, then reloaded',
      before: beforeText,
      panels: partlyPanels,
    })
    await save(page, 'delivered', steps, outside)
    expect(beforeText).toContain('1Z999AA10123456786 Awaiting Carrier')
    expect(partlyPanels[0].text, 'that consignment shows delivered').toContain(
      '1Z999AA10123456786 Delivered',
    )
    expect(partlyPanels[0].text, 'the other is still travelling').toContain(
      '1Z999AA10123456787 Awaiting Carrier',
    )
    expect(partlyPanels[0].status, 'the fulfilment stays fulfilled').toMatch(/^fulfilled$/i)
  })
})

// --- 3.5, 3.6: editing and splitting ---------------------------------------

test.describe('editing and splitting fulfilments (P11, G-92)', () => {
  test("3.5 editing a fulfilment's origin and delivery method, with Move and re-quote", async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/orders\/[^/]+\/fulfillments\/[^/]+$/, answeredEmpty)
    const order = await seeded(baseURL, async (seed) =>
      placed(seed, await rated(seed, 'Edit fulfilment', baseURL as string)),
    )
    const methodNames = methodsFor('Edit fulfilment')
    await openOrder(page, order)
    const before = await readPanels(page)
    const steps: Steps = [{ step: 'opened the order', panels: before }]
    expect(before[0].text).toContain(methodNames.ground)
    expect(before[0].text).toContain(locations.shop)

    await panelMenu(panels(page).first(), 'Edit')
    await dialog(page).getByRole('combobox', { name: 'Ships from' }).click()
    await page.getByRole('option', { name: locations.destination }).click()
    const move = dialog(page).getByRole('button', { name: 'Move and re-quote' })
    await expect(move).toBeVisible()
    await snap(page, 'fulfilment-edit-moved')
    await move.click()
    // Moving keeps the dialog open, quoted again from the new origin, for the method.
    await expect(dialog(page).getByRole('button', { name: 'Save' })).toBeVisible({
      timeout: 15_000,
    })
    steps.push({
      step: 'chose the destination warehouse and pressed Move and re-quote',
      dialog: (await dialog(page).innerText()).replace(/\s+/g, ' '),
    })
    await dialog(page).getByRole('button', { name: 'Cancel' }).click()
    await reload(page)
    const moved = await readPanels(page)
    steps.push({ step: 'closed the dialog, then reloaded', panels: moved })
    expect(moved[0].text, 'it ships from the new origin').toContain(locations.destination)

    await panelMenu(panels(page).first(), 'Edit')
    await dialog(page).getByRole('combobox', { name: 'Delivery method' }).click()
    await page.getByRole('option', { name: new RegExp(methodNames.express) }).click()
    await dialog(page).getByRole('button', { name: 'Save' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const requoted = await readPanels(page)
    steps.push({ step: 'chose P11 Express, then reloaded', panels: requoted })
    await save(page, 'fulfilment-edited', steps, outside)
    expect(requoted[0].text).toContain(locations.destination)
    expect(requoted[0].text, 'it is carried by the new method').toContain(methodNames.express)
    expect(requoted[0].text, "Spree quotes the new method's cost").toContain('$12.00')
  })

  test('3.6 splitting a fulfilment, and a split that would empty it', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/fulfillments\/[^/]+\/split$/, answeredEmpty)
    const order = await seeded(baseURL, async (seed) =>
      placed(seed, await rated(seed, 'Split', baseURL as string), { quantity: 3 }),
    )
    await openOrder(page, order)
    await panelMenu(panels(page).first(), 'Split')
    await dialog(page).getByLabel('Quantity to move').fill('1')
    await dialog(page).getByRole('button', { name: 'Split' }).click()
    await expect(confirmation(page).last()).toContainText(
      'Move these units into a new fulfillment?',
    )
    await confirmation(page)
      .last()
      .getByRole('button', { name: /split|confirm|move/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const split = await readPanels(page)
    const steps: Steps = [
      { step: 'moved 1 of 3 units into a new fulfilment, then reloaded', panels: split },
    ]
    expect(split, 'two fulfilments').toHaveLength(2)
    expect(split.map((each) => unitsIn(each.text)).sort()).toEqual([1, 2])

    const single = panels(page)
      .filter({ hasText: /×\s*1(?!\d)/ })
      .first()
    await panelMenu(single, 'Split')
    await dialog(page).getByLabel('Quantity to move').fill('1')
    const refusal = 'Leave at least one unit behind'
    await expect(dialog(page)).toContainText(refusal)
    const splitEnabled = await dialog(page).getByRole('button', { name: 'Split' }).isEnabled()
    await snap(page, 'split-would-empty')
    steps.push({
      step: 'tried to move the only unit of the new fulfilment',
      says: (await dialog(page).getByText(refusal).innerText()).trim(),
      splitEnabled,
    })
    await page.keyboard.press('Escape')
    await reload(page)
    const after = await readPanels(page)
    steps.push({ step: 'reloaded', panels: after })
    await save(page, 'split', steps, outside)
    expect(splitEnabled, 'the split that would empty it is refused').toBe(false)
    expect(after.map((each) => unitsIn(each.text)).sort()).toEqual([1, 2])
  })
})

// --- 3.8 and 3.9: labels and the packing slip -------------------------------

test.describe('labels and the packing slip (P11, G-92)', () => {
  test('3.8 deleting an uploaded label', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'DELETE', /\/labels\/[^/]+$/, answeredEmpty)
    const fileName = `p11-label-${stamp}.pdf`
    const order = await seeded(baseURL, async (seed) => {
      const placedOrder = await placed(seed, await rated(seed, 'Label', baseURL as string))
      const [first] = await fulfilmentsOf(seed, placedOrder)
      const signedId = await upload(
        seed.api,
        seed.headers,
        fileName,
        'application/pdf',
        pdf,
        'private',
      )
      await seed.post(`orders/${placedOrder.id}/fulfillments/${first.id}/labels`, {
        file_signed_id: signedId,
        tracking_number: '1Z999AA10123456788',
        carrier: 'ups',
        cost: '7.25',
        currency: 'USD',
      })
      return placedOrder
    })
    await openOrder(page, order)
    const before = (await fulfilmentsCard(page).innerText()).replace(/\s+/g, ' ')
    const steps: Steps = [{ step: 'opened an order with an uploaded label', card: before }]
    expect(before, 'the label is shown').toMatch(/shipping label/i)

    const labelRow = fulfilmentsCard(page)
      .locator('div')
      .filter({ hasText: /shipping label/i })
      .filter({ has: page.getByRole('button', { name: 'Actions' }) })
      .last()
    await labelRow.getByRole('button', { name: 'Actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete label' }).click()
    await expect(confirmation(page)).toContainText('Delete this label?')
    await confirmWith(page, /^delete/i)
    await expect(confirmation(page)).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const after = (await fulfilmentsCard(page).innerText()).replace(/\s+/g, ' ')
    steps.push({ step: 'deleted the label from its menu, then reloaded', card: after })
    await save(page, 'label-deleted', steps, outside)
    expect(after, 'the label is gone').not.toMatch(/shipping label/i)
  })

  test('3.9 printing the packing slip', async ({ page, baseURL }) => {
    const outside = await blockOutside(page)
    await sabotage(
      page,
      'GET',
      /\/api\/v3\/admin\/orders\/[^/]+$/,
      answeredWith((body) => ({ ...body, shipping_address: null })),
    )
    const order = await seeded(baseURL, async (seed) => {
      const image = await upload(
        seed.api,
        seed.headers,
        `p11-slip-${stamp}.png`,
        'image/png',
        fixture('product-olive.png'),
      )
      const at = await rated(seed, 'Packing slip', baseURL as string, {
        media: [{ signed_id: image, alt: 'P11 packing slip product' }],
      })
      return placed(seed, at, { quantity: 2 })
    })
    await openOrder(page, order)
    const popup = page.waitForEvent('popup')
    await panelMenu(panels(page).first(), 'Print packing slip')
    const slip = await popup
    await slip.waitForLoadState()
    const text = (await slip.locator('body').innerText()).replace(/\s+/g, ' ')
    const pictures = await slip.locator('.col-thumb img').count()
    const emptyFrames = await slip.locator('.col-thumb .thumb-placeholder').count()
    const steps: Steps = [
      {
        step: 'chose Print packing slip and read the slip it opened',
        slip: text,
        pictures,
        emptyFrames,
      },
    ]
    await save(slip, 'packing-slip', steps, outside)
    expect(text, 'the slip lists the item').toContain(named('Packing slip'))
    expect(text, 'with its quantity').toContain(`${named('Packing slip')} $20.00 2 $40.00`)
    expect(text, 'and the ship-to address').toContain('214 Larkspur Lane')
    // B11, held: each picture is an empty frame.
    expect(pictures, 'the item is shown with its picture').toBe(1)
  })
})
