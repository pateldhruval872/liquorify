import { expect, type Locator, type Page, test } from '@playwright/test'
import { getCredentials, login, narrowQuickFilter } from '../../dashboard/e2e/helpers'
import {
  answeredEmpty,
  blockOutside,
  confirmation,
  openIn,
  recorder,
  reload,
  type Seed,
  type Steps,
  sabotage,
  seeded,
} from './p9'
import {
  card,
  dialog,
  named,
  type Order,
  onHand,
  openInventory,
  openOrder,
  placed,
  product,
  rated,
  shipped,
  summary,
  unitsOf,
} from './p11-orders'

/**
 * The platform batch's step P11, part 3, G-92: what happens after the sale,
 * as browser tests (actions 3.10 and 3.12 to 3.14 of the work item; the
 * fulfilment actions are in `fulfilment-actions.spec.ts`). Each drives the
 * order page's Returns, Exchanges and Claims cards, or their lists, as the
 * browser tests' admin, and asserts what the screen shows after a reload.
 *
 * Every test first adds its own records through the Admin API, named with the
 * run's stamp: a product whose delivery profile quotes flat-rate methods, a
 * customer with default addresses, and a placed order paid by cheque and
 * shipped, so no provider is called. Refunds go back to that cheque payment.
 * With `P11_SABOTAGE=1` each test is expected to fail, and the browser undoes
 * the change the test then looks for.
 *
 * SD-37 (the exchange and claim cancel confirmations name a return), SD-35
 * (the claim's card shows the amount claimed) and SD-71 (a replacement for
 * part of a line, stocked at more than one location, is refused as out of
 * stock) are checked last, softly, so each is recorded when several fail. The
 * other replacements are stocked at one location so their steps still run.
 */

const { snap, save } = recorder('after-sale', 'p11')

test.beforeEach(async ({ page }) => {
  test.setTimeout(180_000)
  await login(page)
})

const locations = { shop: 'Shop location', destination: 'E2E Destination Warehouse' }

// --- Records each test starts from -----------------------------------------

interface Reason {
  id: string
  name: string
}

const reasonNamed = async (seed: Seed, path: string, name: string) => {
  const { data } = await seed.get<{ data: Reason[] }>(`${path}?limit=100`)
  const found = data.find((each) => each.name === name)
  expect(found, `the ${name} reason`).toBeTruthy()
  return found as Reason
}

/** A placed order of this many units of a rated product, shipped whole. */
async function shippedOrder(
  seed: Seed,
  label: string,
  baseURL: string,
  quantity: number,
  extra = {},
  stockedAt?: string,
) {
  const at = await rated(seed, label, baseURL, extra, stockedAt)
  const order = await placed(seed, at, { quantity })
  await shipped(seed, order)
  return { at, order, units: await unitsOf(seed, order) }
}

const paths = (order: Order) => ({
  returns: `orders/${order.id}/returns`,
  exchanges: `orders/${order.id}/exchanges`,
  claims: `orders/${order.id}/claims`,
})

// --- Reading the screens ---------------------------------------------------

const postSale = (page: Page, title: 'Returns' | 'Exchanges' | 'Claims') =>
  card(page, new RegExp(`^${title}`, 'i'))

/** One return, exchange or claim on its card, found by its number. */
const record = (scope: Locator, number: string) =>
  scope.locator('[data-slot="card"]').filter({ hasText: number }).last()

async function recordMenu(scope: Locator, number: string, item: string | RegExp) {
  await record(scope, number).getByRole('button', { name: 'Actions' }).click()
  await scope.page().getByRole('menuitem', { name: item }).click()
}

const textOf = async (scope: Locator) => (await scope.innerText()).replace(/\s+/g, ' ').trim()

/** The text of one record after a reload, for its status and figures. */
async function readRecord(page: Page, title: 'Returns' | 'Exchanges' | 'Claims', number: string) {
  await reload(page)
  const scope = postSale(page, title)
  await expect(scope).toContainText(number, { timeout: 15_000 })
  return textOf(record(scope, number))
}

/** Waits for the record's status, as its badge spells it, after a reload. */
async function expectStatus(
  page: Page,
  title: 'Returns' | 'Exchanges' | 'Claims',
  number: string,
  status: RegExp,
) {
  const text = await readRecord(page, title, number)
  expect(text, `${number} shows ${status}`).toMatch(status)
  return text
}

// --- 3.10: a return's steps ------------------------------------------------

test.describe('returns (P11, G-92)', () => {
  test("3.10 a return's location, partial and not resellable receipts, refund with tax, nothing owed, and cancel", async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/returns\/[^/]+\/receive$/, answeredEmpty)
    const { order, item, numbers, free } = await seeded(baseURL, async (seed) => {
      const category = await seed.post<{ id: string }>('tax_categories', {
        name: named('Return tax'),
      })
      await seed.post('tax_rates', {
        name: named('Return tax rate'),
        rate_percent: '10',
        tax_category_id: category.id,
        country_code: 'US',
        state_code: 'OR',
      })
      const made = await shippedOrder(seed, 'Return', baseURL as string, 4, {
        tax_category_id: category.id,
      })
      const [unit] = made.units
      const open = (quantity: number) =>
        seed.post<{ id: string; number: string }>(paths(made.order).returns, {
          items: [{ fulfillment_item_id: unit.id, quantity }],
        })
      const unsellable = await open(1)
      const canceled = await open(1)
      await seed.patch(`${paths(made.order).returns}/${unsellable.id}/approve`)
      // Owed nothing: a return of a unit sold for $0.00.
      const gift = await shippedOrder(seed, 'Return free', baseURL as string, 1, {
        prices: [{ amount: '0.00', currency: 'USD' }],
      })
      const nothing = await seed.post<{ id: string; number: string }>(paths(gift.order).returns, {
        items: [{ fulfillment_item_id: gift.units[0].id, quantity: 1 }],
      })
      await seed.patch(`${paths(gift.order).returns}/${nothing.id}/approve`)
      return {
        order: made.order,
        item: made.at.product,
        numbers: { unsellable: unsellable.number, canceled: canceled.number },
        free: { order: gift.order, item: gift.at.product, number: nothing.number },
      }
    })
    await openInventory(page, item.sku)
    const stockBefore = {
      shop: await onHand(page, item.name, locations.shop),
      destination: await onHand(page, item.name, locations.destination),
    }
    const steps: Steps = [{ step: 'read the stock before', stock: stockBefore }]

    // The return opened on the page, to a location chosen there.
    await openOrder(page, order)
    const returns = postSale(page, 'Returns')
    const before = await textOf(returns)
    await returns.getByRole('button', { name: 'New return' }).click()
    await dialog(page).getByRole('spinbutton', { name: item.name }).fill('2')
    await dialog(page).getByRole('combobox', { name: 'Reason' }).click()
    await page.getByRole('option', { name: 'Damaged/Defective' }).click()
    await dialog(page).getByRole('combobox', { name: 'Return to' }).click()
    await page.getByRole('option', { name: locations.destination }).click()
    await snap(page, 'return-new')
    await dialog(page).getByRole('button', { name: 'New return' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const opened = await textOf(postSale(page, 'Returns'))
    const number = [...opened.matchAll(/RET\d+/g)]
      .map((match) => match[0])
      .find((each) => !before.includes(each) && !Object.values(numbers).includes(each))
    expect(number, 'the new return is listed').toBeTruthy()
    const main = number as string
    let shown = await readRecord(page, 'Returns', main)
    steps.push({
      step: 'opened a return of 2 to the destination warehouse, then reloaded',
      return: shown,
    })
    expect(shown).toContain(`Returning to ${locations.destination}`)
    expect(shown).toMatch(/requested/i)

    await recordMenu(postSale(page, 'Returns'), main, 'Approve')
    shown = await expectStatus(page, 'Returns', main, /approved/i)
    steps.push({ step: 'approved it, then reloaded', return: shown })

    await recordMenu(postSale(page, 'Returns'), main, 'Receive items')
    await dialog(page).getByRole('spinbutton', { name: 'Received' }).fill('1')
    await expect(dialog(page).getByRole('switch', { name: 'Resellable' })).toBeChecked()
    await dialog(page).getByRole('button', { name: 'Receive items' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    shown = await readRecord(page, 'Returns', main)
    steps.push({ step: 'received 1 of the 2, resellable, then reloaded', return: shown })
    expect(shown, 'a partial receipt counts only what arrived').toContain('1 of 2 received')

    await recordMenu(postSale(page, 'Returns'), main, 'Refund')
    const refundDialog = await textOf(dialog(page))
    expect(refundDialog, 'the refund carries its share of tax').toContain('includes $2.00 of tax')
    await expect(dialog(page).getByRole('spinbutton', { name: 'Amount' })).toHaveValue('22.00')
    await expect(dialog(page).getByRole('combobox', { name: 'Refund to' })).toHaveText(
      /original payment/i,
    )
    await snap(page, 'return-refund')
    await dialog(page).getByRole('button', { name: 'Refund' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    shown = await expectStatus(page, 'Returns', main, /refunded/i)
    const payments = await textOf(card(page, /^payments/i))
    const refunds = await seeded(baseURL, (seed) =>
      seed.get<{ data: { amount: string; payment_id: string }[] }>(`orders/${order.id}/refunds`),
    )
    steps.push({
      step: 'refunded it to the original payment, then reloaded',
      dialog: refundDialog,
      return: shown,
      payments,
      refunds: refunds.data.map((each) => ({
        amount: each.amount,
        againstAPayment: !!each.payment_id,
      })),
    })
    expect(shown).toContain('$22.00')
    expect(refunds.data.map((each) => each.amount)).toEqual(['22.00'])
    expect(refunds.data[0].payment_id, 'the refund is recorded against the payment').toBeTruthy()

    // Not resellable.
    await recordMenu(postSale(page, 'Returns'), numbers.unsellable, 'Receive items')
    await dialog(page).getByRole('switch', { name: 'Resellable' }).click()
    await expect(dialog(page).getByRole('switch', { name: 'Resellable' })).not.toBeChecked()
    await dialog(page).getByRole('button', { name: 'Receive items' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    shown = await expectStatus(page, 'Returns', numbers.unsellable, /received/i)
    steps.push({ step: 'received another return as not resellable, then reloaded', return: shown })
    expect(shown).toContain('Not resellable')

    // Canceled.
    await recordMenu(postSale(page, 'Returns'), numbers.canceled, 'Cancel')
    await expect(confirmation(page)).toContainText('Cancel this return?')
    await confirmation(page).getByRole('button', { name: 'Cancel return' }).click()
    await expect(confirmation(page)).toBeHidden({ timeout: 15_000 })
    shown = await expectStatus(page, 'Returns', numbers.canceled, /canceled/i)
    steps.push({ step: 'canceled the third return, then reloaded', return: shown })

    await openInventory(page, item.sku)
    const stockAfter = {
      shop: await onHand(page, item.name, locations.shop),
      destination: await onHand(page, item.name, locations.destination),
    }
    steps.push({ step: 'read the stock after', stock: stockAfter })

    // Owed nothing: a unit sold for $0.00 comes back.
    await openOrder(page, free.order)
    await recordMenu(postSale(page, 'Returns'), free.number, 'Receive items')
    await dialog(page).getByRole('button', { name: 'Receive items' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    shown = await expectStatus(page, 'Returns', free.number, /received/i)
    steps.push({
      step: 'received the return of a unit sold for $0.00, then reloaded',
      return: shown,
    })
    await recordMenu(postSale(page, 'Returns'), free.number, 'Complete return')
    const completeDialog = await textOf(dialog(page))
    await snap(page, 'return-complete')
    expect(completeDialog).toContain('Nothing is owed on this return')
    await dialog(page).getByRole('button', { name: 'Complete return' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    shown = await readRecord(page, 'Returns', free.number)
    const freeRefunds = await seeded(baseURL, (seed) =>
      seed.get<{ data: { amount: string }[] }>(`orders/${free.order.id}/refunds`),
    )
    steps.push({
      step: 'completed it, then reloaded',
      dialog: completeDialog,
      return: shown,
      refunds: freeRefunds.data.map((each) => each.amount),
    })
    await save(page, 'return', steps, outside)
    expect(shown, 'the return owed nothing is closed').not.toMatch(/\breceived\b/i)
    expect(freeRefunds.data, 'no refund for the return owed nothing').toHaveLength(0)
    expect(stockAfter.destination, 'the resellable unit is restocked where it came back').toBe(
      stockBefore.destination + 1,
    )
    expect(stockAfter.shop, 'the unit not resellable adds no stock').toBe(stockBefore.shop)
  })
})

// --- 3.12: exchanges --------------------------------------------------------

test.describe('exchanges (P11, G-92)', () => {
  test('3.12 an exchange opened, approved, received and its dearer replacement shipped, and another canceled', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/exchanges\/[^/]+\/fulfill$/, answeredEmpty)
    const { order, item, dearer, other, spread } = await seeded(baseURL, async (seed) => {
      const made = await shippedOrder(seed, 'Exchange', baseURL as string, 3)
      const replacement = await product(
        seed,
        'Exchange dearer',
        '30.00',
        { delivery_profile_id: made.at.profileId },
        locations.shop,
      )
      const second = await seed.post<{ number: string }>(paths(made.order).exchanges, {
        items: [
          {
            fulfillment_item_id: made.units[0].id,
            quantity: 1,
            new_variant_id: replacement.variantId,
          },
        ],
      })
      // SD-71: a replacement stocked at every location, for 1 unit of the line.
      const everywhere = await product(seed, 'Exchange everywhere', '20.00', {
        delivery_profile_id: made.at.profileId,
      })
      const third = await seed.post<{ id: string; number: string }>(paths(made.order).exchanges, {
        items: [
          {
            fulfillment_item_id: made.units[0].id,
            quantity: 1,
            new_variant_id: everywhere.variantId,
          },
        ],
      })
      for (const step of ['approve', 'receive'])
        await seed.patch(`${paths(made.order).exchanges}/${third.id}/${step}`)
      return {
        order: made.order,
        item: made.at.product,
        dearer: replacement,
        other: second.number,
        spread: third.number,
      }
    })
    await openOrder(page, order)
    const exchanges = postSale(page, 'Exchanges')
    await exchanges.getByRole('button', { name: 'New exchange' }).click()
    await dialog(page).getByRole('spinbutton').first().fill('1')
    await dialog(page).getByRole('combobox', { name: 'Search…' }).fill(dearer.sku)
    await page.getByRole('option', { name: new RegExp(dearer.sku) }).click()
    await dialog(page).getByRole('combobox', { name: 'Reason' }).click()
    await page.getByRole('option', { name: 'Damaged/Defective' }).click()
    await snap(page, 'exchange-new')
    await dialog(page).getByRole('button', { name: 'New exchange' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
    await reload(page)
    const listed = await textOf(postSale(page, 'Exchanges'))
    const main = [...listed.matchAll(/EX\d+/g)]
      .map((match) => match[0])
      .find((each) => each !== other && each !== spread)
    expect(main, 'the new exchange is listed').toBeTruthy()
    const number = main as string
    let shown = await readRecord(page, 'Exchanges', number)
    const steps: Steps = [
      {
        step: 'opened an exchange of 1 unit for the dearer product, then reloaded',
        exchange: shown,
      },
    ]
    expect(shown).toContain(`${item.name} → ${dearer.name}`)
    expect(shown).toContain('Price difference $10.00')

    await recordMenu(postSale(page, 'Exchanges'), number, 'Approve')
    shown = await expectStatus(page, 'Exchanges', number, /approved/i)
    steps.push({ step: 'approved it, then reloaded', exchange: shown })
    await recordMenu(postSale(page, 'Exchanges'), number, 'Receive items')
    if (await dialog(page).isVisible())
      await dialog(page).getByRole('button', { name: 'Receive items' }).click()
    shown = await expectStatus(page, 'Exchanges', number, /received/i)
    steps.push({ step: 'received it, then reloaded', exchange: shown })

    await recordMenu(postSale(page, 'Exchanges'), number, 'Ship replacement')
    const balanceDue = await textOf(confirmation(page))
    expect(balanceDue, 'the confirmation says the difference is put on the order').toContain(
      'adds the difference to the order as a balance due',
    )
    await confirmation(page).getByRole('button', { name: 'Ship replacement' }).click()
    await expect(confirmation(page)).toBeHidden({ timeout: 15_000 })
    shown = await readRecord(page, 'Exchanges', number)
    const fulfilments = await textOf(card(page, /^fulfillments/i))
    const totals = await summary(page)
    steps.push({
      step: 'shipped the replacement, then reloaded',
      confirmation: balanceDue,
      exchange: shown,
      fulfilments,
      summary: totals,
    })
    expect(shown).not.toMatch(/\breceived\b/i)
    expect(fulfilments, 'the replacement ships in its own parcel').toContain(dearer.name)
    expect(totals['Outstanding balance'], 'the difference is due on the order').toBe(10)

    await recordMenu(postSale(page, 'Exchanges'), other, 'Cancel')
    const cancelText = await textOf(confirmation(page))
    await snap(page, 'exchange-cancel-confirmation')
    await confirmation(page).getByRole('button', { name: 'Cancel exchange' }).click()
    await expect(confirmation(page)).toBeHidden({ timeout: 15_000 })
    shown = await expectStatus(page, 'Exchanges', other, /canceled/i)
    steps.push({
      step: 'canceled the other exchange, then reloaded',
      confirmation: cancelText,
      exchange: shown,
    })
    // With no difference to settle, the action asks for no confirmation.
    await recordMenu(postSale(page, 'Exchanges'), spread, 'Ship replacement')
    const confirm = confirmation(page).getByRole('button', { name: 'Ship replacement' })
    if (
      await confirm.waitFor({ timeout: 3_000 }).then(
        () => true,
        () => false,
      )
    )
      await confirm.click()
    await page.waitForTimeout(2_000)
    await snap(page, 'exchange-replacement-everywhere')
    const refusal = (await page.locator('[data-sonner-toast]').allInnerTexts()).join(' ')
    const spreadShown = await readRecord(page, 'Exchanges', spread)
    steps.push({
      step: 'shipped the replacement stocked at every location, then reloaded',
      shown: refusal,
      exchange: spreadShown,
    })
    await save(page, 'exchange', steps, outside)
    // SD-71: refused as out of stock, so the exchange stays received.
    expect
      .soft(spreadShown, 'a replacement stocked at every location ships')
      .not.toMatch(/\breceived\b/i)
    // SD-37: the confirmation asks "Cancel this return?".
    expect
      .soft(cancelText, 'the cancel confirmation asks about the exchange')
      .toMatch(/Cancel this exchange\?/)
  })
})

// --- 3.13: claims -----------------------------------------------------------

test.describe('claims (P11, G-92)', () => {
  test('3.13 claims resolved by refund, by store credit and by replacement, and another canceled', async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'PATCH', /\/claims\/[^/]+\/resolve$/, answeredEmpty)
    const { order, customerId, numbers } = await seeded(baseURL, async (seed) => {
      const made = await shippedOrder(seed, 'Claim', baseURL as string, 4, {}, locations.shop)
      const reason = await reasonNamed(seed, 'claim_reasons', 'Arrived damaged')
      const open = () =>
        seed.post<{ id: string; number: string }>(paths(made.order).claims, {
          items: [{ line_item_id: made.units[0].line_item_id, quantity: 1 }],
          reason_id: reason.id,
        })
      const refund = await open()
      const credit = await open()
      const replacement = await open()
      const canceled = await open()
      for (const each of [credit, replacement])
        await seed.patch(`${paths(made.order).claims}/${each.id}/approve`)
      return {
        order: made.order,
        customerId: made.at.customer.id,
        numbers: {
          refund: refund.number,
          credit: credit.number,
          replacement: replacement.number,
          canceled: canceled.number,
        },
      }
    })
    await openOrder(page, order)
    const claims = () => postSale(page, 'Claims')
    const steps: Steps = []

    await recordMenu(claims(), numbers.refund, 'Approve')
    let shown = await expectStatus(page, 'Claims', numbers.refund, /approved/i)
    steps.push({ step: 'approved the first claim, then reloaded', claim: shown })

    async function resolve(number: string, how: string, refundTo?: string, amount?: string) {
      await recordMenu(claims(), number, /^resolve/i)
      await dialog(page).getByRole('combobox', { name: 'How to resolve' }).click()
      await page.getByRole('option', { name: how, exact: true }).click()
      if (refundTo) {
        await dialog(page).getByRole('combobox', { name: 'Refund to' }).click()
        await page.getByRole('option', { name: refundTo, exact: true }).click()
      }
      if (amount) await dialog(page).getByRole('spinbutton').first().fill(amount)
      if (how.includes('Replacement')) {
        const send = dialog(page).getByRole('switch').first()
        if (!(await send.isChecked())) await send.click()
      }
      const text = await textOf(dialog(page))
      await snap(page, `claim-resolve-${how.toLowerCase()}`)
      await dialog(page)
        .getByRole('button', { name: /^resolve/i })
        .last()
        .click()
      await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
      return text
    }

    const replacementDialog = await resolve(numbers.replacement, 'Replacement')
    const replacementShown = await expectStatus(page, 'Claims', numbers.replacement, /resolved/i)
    const fulfilments = card(page, /^fulfillments/i)
    const waiting = fulfilments
      .locator('[data-slot="card"]')
      .filter({ has: page.getByRole('button', { name: 'Mark as fulfilled' }) })
    await expect(waiting).toHaveCount(1)
    await waiting.getByRole('button', { name: 'Mark as fulfilled' }).click()
    await fulfilments.getByLabel('Tracking number').fill('1Z999AA10123456788')
    await fulfilments.getByRole('combobox', { name: 'Shipping carrier' }).click()
    await page.getByRole('option', { name: 'UPS', exact: true }).click()
    await fulfilments.getByRole('button', { name: 'Fulfill items' }).click()
    await page.waitForTimeout(1_500)
    await snap(page, 'claim-replacement-fulfilled')
    await expect(fulfilments.getByRole('button', { name: 'Fulfill items' })).toBeHidden({
      timeout: 15_000,
    })
    await reload(page)
    const shippedText = await textOf(card(page, /^fulfillments/i))
    steps.push({
      step: 'resolved the third claim with a replacement, reloaded, shipped the replacement and reloaded',
      dialog: replacementDialog,
      claim: replacementShown,
      fulfilments: shippedText,
    })
    expect(shippedText).not.toContain('Mark as fulfilled')

    const refundDialog = await resolve(numbers.refund, 'Refund', 'Original payment', '12.00')
    shown = await expectStatus(page, 'Claims', numbers.refund, /resolved/i)
    const refunds = await seeded(baseURL, (seed) =>
      seed.get<{ data: { amount: string; payment_id: string }[] }>(`orders/${order.id}/refunds`),
    )
    steps.push({
      step: 'resolved it with a $12.00 refund to the original payment, then reloaded',
      dialog: refundDialog,
      claim: shown,
      refunds: refunds.data.map((each) => ({
        amount: each.amount,
        againstAPayment: !!each.payment_id,
      })),
    })
    expect(refunds.data.map((each) => each.amount)).toEqual(['12.00'])

    const creditDialog = await resolve(numbers.credit, 'Refund', 'Store credit')
    const creditShown = await expectStatus(page, 'Claims', numbers.credit, /resolved/i)
    await openIn(page, getCredentials().store_id, `/customers/${customerId}`)
    const credit = await textOf(page.locator('main'))
    steps.push({
      step: 'resolved the second with store credit, reloaded, and opened the customer',
      dialog: creditDialog,
      claim: creditShown,
      customer: credit,
    })
    expect(credit, "the credit is on the customer's balance").toContain('Store credit $20.00')

    await openOrder(page, order)
    await recordMenu(claims(), numbers.canceled, 'Cancel')
    const cancelText = await textOf(confirmation(page))
    await snap(page, 'claim-cancel-confirmation')
    await confirmation(page).getByRole('button', { name: 'Cancel claim' }).click()
    await expect(confirmation(page)).toBeHidden({ timeout: 15_000 })
    const canceledShown = await expectStatus(page, 'Claims', numbers.canceled, /canceled/i)
    steps.push({
      step: 'canceled the fourth claim, then reloaded',
      confirmation: cancelText,
      claim: canceledShown,
    })
    const refundCard = await readRecord(page, 'Claims', numbers.refund)
    steps.push({ step: "read the refunded claim's card", claim: refundCard })
    await save(page, 'claim', steps, outside)
    // SD-35: the card shows the amount claimed, $20.00, not what the resolution paid.
    expect.soft(refundCard, "the claim's card shows what the resolution paid").toContain('$12.00')
    // SD-37: the confirmation asks "Cancel this return?".
    expect
      .soft(cancelText, 'the cancel confirmation asks about the claim')
      .toMatch(/Cancel this claim\?/)
  })
})

// --- 3.14: the lists --------------------------------------------------------

test.describe('the returns, exchanges and claims lists (P11, G-92)', () => {
  test("3.14 the returns list's search and status filter, and the exchanges and claims lists' search", async ({
    page,
    baseURL,
  }) => {
    const outside = await blockOutside(page)
    await sabotage(page, 'GET', /\/api\/v3\/admin\/(returns|exchanges|claims)$/, (route) => {
      const url = new URL(route.request().url())
      for (const key of [...url.searchParams.keys()])
        if (key.startsWith('q[')) url.searchParams.delete(key)
      return route.continue({ url: url.toString() })
    })
    const made = await seeded(baseURL, async (seed) => {
      const first = await shippedOrder(seed, 'Lists one', baseURL as string, 3)
      const second = await shippedOrder(seed, 'Lists two', baseURL as string, 3)
      const replacement = await product(seed, 'Lists swap', '20.00', {
        delivery_profile_id: first.at.profileId,
      })
      const reason = await reasonNamed(seed, 'claim_reasons', 'Arrived damaged')
      const records = []
      for (const { order, units } of [first, second]) {
        const ret = await seed.post<{ id: string; number: string }>(paths(order).returns, {
          items: [{ fulfillment_item_id: units[0].id, quantity: 1 }],
        })
        const exchange = await seed.post<{ number: string }>(paths(order).exchanges, {
          items: [
            {
              fulfillment_item_id: units[0].id,
              quantity: 1,
              new_variant_id: replacement.variantId,
            },
          ],
        })
        const claim = await seed.post<{ number: string }>(paths(order).claims, {
          items: [{ line_item_id: units[0].line_item_id, quantity: 1 }],
          reason_id: reason.id,
        })
        records.push({ order, ret, exchange: exchange.number, claim: claim.number })
      }
      await seed.patch(`${paths(records[1].order).returns}/${records[1].ret.id}/cancel`)
      return records
    })
    const [one, two] = made
    const numbersOf = (path: string) =>
      [one, two].map((each) =>
        path === 'returns' ? each.ret.number : path === 'exchanges' ? each.exchange : each.claim,
      )
    const steps: Steps = []
    const list = async (path: string, search?: string) => {
      await openIn(page, getCredentials().store_id, `/${path}`)
      await expect(page.getByRole('row').first()).toBeVisible({ timeout: 15_000 })
      if (search) await page.getByRole('searchbox', { name: 'Search by number…' }).fill(search)
    }
    const rowsText = async () => (await page.getByRole('row').allInnerTexts()).join(' ')
    const listed = (text: string, numbers: string[]) =>
      numbers.filter((each) => text.includes(each))
    /** Which of these numbers the list shows, once it shows the ones expected or 15 s pass. */
    const shown = async (numbers: string[], expected: string[]) => {
      await expect
        .poll(async () => listed(await rowsText(), numbers), { timeout: 15_000 })
        .toEqual(expected)
        .catch(() => undefined)
      return listed(await rowsText(), numbers)
    }

    for (const path of ['returns', 'exchanges', 'claims']) {
      const numbers = numbersOf(path)
      await list(path, numbers[0])
      const searched = await shown(numbers, [numbers[0]])
      await snap(page, `${path}-searched`)
      await list(path)
      const cleared = await shown(numbers, numbers)
      steps.push({
        step: `searched the ${path} list for the first record's number, then cleared it`,
        searched,
        cleared,
      })
      expect(searched, `the ${path} search lists only the record searched for`).toEqual([
        numbers[0],
      ])
      expect(cleared, `cleared, the ${path} list lists both`).toEqual(numbers)
    }

    const returns = [one.ret.number, two.ret.number]
    await list('returns')
    await narrowQuickFilter(page, /^status/i, /^canceled$/i)
    const filtered = await shown(returns, [two.ret.number])
    await snap(page, 'returns-filtered')
    await list('returns')
    const cleared = await shown(returns, returns)
    steps.push({
      step: 'kept only the Canceled status, then opened the list again',
      filtered,
      cleared,
    })
    await save(page, 'lists', steps, outside)
    expect(filtered, 'the status filter lists only the canceled return').toEqual([two.ret.number])
    expect(cleared).toEqual(returns)
  })
})
