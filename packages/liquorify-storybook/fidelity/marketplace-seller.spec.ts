import { readFileSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { linkIn, type Mail, mailTo } from './mail'
import {
  Api,
  altered,
  blockOutside,
  card,
  dialog,
  orderOf,
  PASSWORD,
  product,
  purchase,
  Record,
  run,
  SELLER_PANEL,
  type Seller,
  sabotage,
  seller,
  sellerPanelSignIn,
  shopper,
  standIn,
} from './marketplace-follow-up'
import type { Json } from './orders'

/**
 * G-114: the seller panel's 16 behaviours (work item `fb-19-batch-marketplace.md`
 * §11.3, numbered as part 2's §2.3). Each check signs in through the seller
 * panel's sign-in form as a member of a seller the operator invited and the
 * member accepted, drives the behaviour through the visible controls, then
 * asserts what the screen shows and reads the server's state back through the
 * Admin API. The order rows start from a guest's purchase from two sellers.
 *
 * Behaviours 2 and 6 assert the intended result and are expected to stay FAIL
 * while SD-72 and SD-73 are open (§11.4): they are never changed to expect the
 * defect.
 *
 * Run against the browser-test server started with the emails gem in its
 * bundle and `LIQUORIFY_MAIL_DIR`, and the built seller panel on
 * `MARKETPLACE_SELLER_URL` (5175 by default).
 */

let api: Api
let outside: string[] = []

test.use({ viewport: { width: 1280, height: 960 }, actionTimeout: 15_000 })
test.setTimeout(240_000)

test.beforeAll(async () => {
  api = await Api.open()
})
test.afterAll(async () => {
  await api?.dispose()
})
test.beforeEach(async ({ page }) => {
  outside = await blockOutside(page)
})
test.afterEach(async ({ page }, testInfo) => {
  // What the panel showed when a check did not end as expected, kept beside its result.
  if (testInfo.status !== testInfo.expectedStatus)
    writeFileSync(
      testInfo.outputPath('screen.yml'),
      await page.locator('body').ariaSnapshot().catch(String),
    )
  expect(outside, 'no request left this machine').toEqual([])
})

const label = new URL('./marketplace-label.pdf', import.meta.url).pathname
const photo = new URL('./marketplace-logo.png', import.meta.url).pathname

/** Signs in through the form and waits for the seller's own panel. */
async function signIn(page: Page, owner: Seller, password = PASSWORD) {
  await sellerPanelSignIn(page, owner.email, password)
  await expect(page).toHaveURL(new RegExp(`/${owner.id}`), { timeout: 20_000 })
}

async function visit(page: Page, owner: Seller, path: string) {
  await page.goto(`${SELLER_PANEL}/${owner.id}${path}`)
  await page.waitForLoadState('networkidle')
}

async function orderPage(page: Page, owner: Seller, order: Json) {
  await visit(page, owner, `/orders/${order.id}`)
  await expect(page.getByRole('heading', { name: order.number as string, level: 1 })).toBeVisible({
    timeout: 20_000,
  })
}

/** A seller's order from a guest's purchase that also holds another seller's item. */
async function twoSellerOrder(label: string, units = 1) {
  const owner = await seller(api, `${label} North`, 'approved')
  const other = await seller(api, `${label} South`, 'approved')
  const mine = await product(api, owner, 'Cask Rum', { approve: true })
  const theirs = await product(api, other, 'Sloe Gin', { approve: true, price: '28.00' })
  const bought = await purchase(api, [...Array(units).fill(mine.variant), theirs.variant])
  expect(bought.orders.length, 'the purchase is split between the two sellers').toBe(2)
  const order = await orderOf(api, bought.orders, owner)
  return { owner, other, mine, theirs, bought, order }
}

/** Ships the seller's parcel through the Seller API, as set-up for the post-sale rows. */
async function shipped(owner: Seller, order: Json) {
  const [parcel] = await api.rows(`seller/orders/${order.id}/fulfillments`, owner.headers)
  await api.send(
    'patch',
    `seller/orders/${order.id}/fulfillments/${parcel.id}/fulfill`,
    { tracking: `TRK${run}`, notify_customer: false },
    owner.headers,
  )
}

const parcelMenu = (page: Page) =>
  page.getByRole('button', { name: 'Actions', exact: true }).first()

const chooseFrom = async (trigger: Locator, item: RegExp | string, page: Page) => {
  await trigger.click()
  await page.getByRole('menuitem', { name: item }).click()
}

/** The dialog opened last, such as a confirmation over a form. */
const topDialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).last()

/**
 * The confirming button of an open dialog. Some of the panel's shared dialogs
 * show the admin dashboard's raw key instead of a word (SD-85), so either is accepted.
 */
const submitButton = (page: Page, word: RegExp, key: string) =>
  dialog(page).getByRole('button', {
    name: new RegExp(`^(${word.source}|${key.replaceAll('.', '\\.')})$`, 'i'),
  })

const pickOption = async (page: Page, combobox: Locator, option: RegExp | string) => {
  await combobox.click()
  await page.getByRole('option', { name: option }).first().click()
}

const serverOrder = (id: string) => api.admin('get', `orders/${id}`)
const summary = (page: Page) => card(page, /^summary$/i)
const money = (amount: unknown) => `$${amount}`

test('1. Fulfilling an order', async ({ page }) => {
  const record = new Record('seller', '01-fulfil')
  const { owner, order, bought } = await twoSellerOrder('Larch')
  await sabotage(page, standIn(/\/seller\/orders\/[^/]+\/fulfillments\/[^/]+\/fulfill$/))
  const before = mailTo(bought.email).length
  const tracking = `1Z${run.toUpperCase()}0001`

  await signIn(page, owner)
  await orderPage(page, owner, order)
  await page.getByRole('button', { name: 'Mark as fulfilled' }).click()
  await page.getByLabel('Tracking number').fill(tracking)
  const notify = page.getByRole('checkbox', { name: /send shipment notification/i })
  if (!(await notify.isChecked())) await notify.check()
  await record.shot(page, '1-fulfil-form')
  await page.getByRole('button', { name: 'Fulfill items' }).click()
  await expect(page.getByText(/^fulfilled$/i).first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(tracking).first()).toBeVisible()
  await record.shot(page, '2-fulfilled')

  const [parcel] = await api.rows(`admin/orders/${order.id}/fulfillments`)
  record.note('server fulfilment', { status: parcel.status, tracking: parcel.tracking })
  expect(parcel.status).toBe('fulfilled')
  expect(parcel.tracking).toBe(tracking)
  await expect
    .poll(
      () =>
        mailTo(bought.email)
          .slice(before)
          .map((each) => each.subject),
      { timeout: 30_000 },
    )
    .toContainEqual(expect.stringMatching(/fulfillment notification/i))
  record.note(
    'mail to the customer',
    mailTo(bought.email)
      .slice(before)
      .map((each) => each.subject),
  )
  record.save()
})

test('2. Splitting a parcel (SD-72)', async ({ page }) => {
  const record = new Record('seller', '02-split')
  const { owner, order } = await twoSellerOrder('Rowan', 2)
  const before = await serverOrder(order.id as string)
  record.note('server order before', {
    total: before.total,
    payment_total: before.payment_total,
    outstanding: before.outstanding_balance,
    payment_state: before.payment_state,
  })
  await sabotage(page, standIn(/\/fulfillments\/[^/]+\/split$/))

  await signIn(page, owner)
  await orderPage(page, owner, order)
  await expect(summary(page)).toContainText(new RegExp(`Total\\s*\\${money(before.total)}`))
  await chooseFrom(parcelMenu(page), 'Split', page)
  await page.getByLabel('Quantity to move').fill('1')
  await dialog(page).getByRole('button', { name: 'Split', exact: true }).click()
  // The split takes effect immediately, and asks first.
  await topDialog(page).getByRole('button', { name: 'Split', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Mark as fulfilled' })).toHaveCount(2, {
    timeout: 20_000,
  })
  await record.shot(page, '1-split')

  const parcels = await api.rows(`admin/orders/${order.id}/fulfillments`)
  const after = await serverOrder(order.id as string)
  record.note(
    'server parcels',
    parcels.map((each) => ({ id: each.id, items: each.fulfillment_items })),
  )
  record.note('server order after', {
    total: after.total,
    payment_total: after.payment_total,
    outstanding: after.outstanding_balance,
    payment_state: after.payment_state,
  })
  expect(parcels).toHaveLength(2)
  // The intended result: the order's total and amount due are unchanged.
  await expect(summary(page)).toContainText(new RegExp(`Total\\s*\\${money(before.total)}`))
  await expect(summary(page)).toContainText(/Outstanding balance\s*\$0\.00/)
  record.save()
  expect(after.total).toBe(before.total)
  expect(after.outstanding_balance).toBe(before.outstanding_balance)
})

test('3. Recording a delivery and uploading a label', async ({ page }) => {
  const record = new Record('seller', '03-delivery-label')
  const { owner, order } = await twoSellerOrder('Hazel')
  await sabotage(page, standIn(/\/fulfillments\/[^/]+\/(deliveries|labels)$/, 'POST'))
  const tracking = `9400${run.toUpperCase()}`
  const labelTracking = `1Z${run.toUpperCase()}0003`

  await signIn(page, owner)
  await orderPage(page, owner, order)
  await chooseFrom(parcelMenu(page), 'Add tracking', page)
  await dialog(page).getByLabel('Tracking number').fill(tracking)
  await dialog(page).getByRole('button', { name: 'Save' }).click()
  await expect(dialog(page)).toBeHidden({ timeout: 20_000 })
  await expect(page.getByText(tracking).first()).toBeVisible({ timeout: 20_000 })

  await chooseFrom(parcelMenu(page), 'Upload label', page)
  await dialog(page).locator('input[type="file"]').setInputFiles(label)
  await dialog(page).getByLabel('Tracking number').fill(labelTracking)
  await dialog(page).getByLabel('Postage cost').fill('7.25')
  await record.shot(page, '1-label-dialog')
  await submitButton(page, /upload label/, 'admin.orders.detail.fulfillments.upload_label').click()
  await expect(dialog(page)).toBeHidden({ timeout: 20_000 })
  await expect(page.getByText(/shipping label/i).first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(/cost \$7\.25/i).first()).toBeVisible()
  await record.shot(page, '2-delivery-and-label')

  const [parcel] = await api.rows(`seller/orders/${order.id}/fulfillments`, owner.headers)
  const deliveries = await api.rows(
    `seller/orders/${order.id}/fulfillments/${parcel.id}/deliveries`,
    owner.headers,
  )
  const labels = await api.rows(
    `seller/orders/${order.id}/fulfillments/${parcel.id}/labels`,
    owner.headers,
  )
  record.note('server deliveries', deliveries)
  record.note('server labels', labels)
  expect(deliveries.map((each) => each.tracking_number)).toContain(tracking)
  expect(labels).toHaveLength(1)
  expect(labels[0].tracking_number).toBe(labelTracking)
  expect(labels[0].cost).toBe('7.25')
  record.save()
})

test('4. Creating, receiving and refunding a return', async ({ page }) => {
  const record = new Record('seller', '04-return')
  const { owner, order, mine } = await twoSellerOrder('Aspen')
  await shipped(owner, order)
  await sabotage(page, standIn(/\/returns\/[^/]+\/refund$/))
  const transfersBefore = await api.rows(
    `admin/seller_transfers?q[order_id_eq]=${order.id}&limit=100`,
  )

  await signIn(page, owner)
  await orderPage(page, owner, order)
  const returns = card(page, /^returns/i)
  await returns.getByRole('button', { name: 'New return' }).click()
  await dialog(page).getByRole('spinbutton', { name: mine.name }).fill('1')
  await pickOption(page, dialog(page).getByRole('combobox', { name: 'Reason' }), /damaged/i)
  await submitButton(
    page,
    /create return|new return/,
    'admin.pages.orders.detail.returns.actions.create',
  ).click()
  await expect(dialog(page)).toBeHidden({ timeout: 20_000 })
  await expect(returns.getByText(/^requested$/i)).toBeVisible({ timeout: 20_000 })
  await chooseFrom(returns.getByRole('button', { name: 'Actions', exact: true }), 'Approve', page)
  await expect(returns.getByText(/^approved$/i)).toBeVisible({ timeout: 20_000 })
  await chooseFrom(returns.getByRole('button', { name: 'Actions', exact: true }), 'Receive', page)
  await record.shot(page, '1-receive-dialog')
  await submitButton(
    page,
    /receive items|receive/,
    'admin.pages.orders.detail.returns.actions.receive',
  ).click()
  await expect(returns.getByText(/^received$/i)).toBeVisible({ timeout: 20_000 })
  await chooseFrom(returns.getByRole('button', { name: 'Actions', exact: true }), /^refund/i, page)
  await record.shot(page, '2-refund-dialog')
  await submitButton(page, /refund/, 'admin.pages.orders.detail.returns.actions.refund').click()
  await expect(returns.getByText(/^refunded$/i)).toBeVisible({ timeout: 20_000 })
  await expect(returns.getByText(/refunded: \$32\.00/i)).toBeVisible()
  await record.shot(page, '3-refunded')

  const [made] = await api.rows(`seller/orders/${order.id}/returns`, owner.headers)
  const refunds = await api.rows(`admin/orders/${order.id}/refunds`)
  record.note('server return', made)
  record.note('server refunds', refunds)
  expect(made.status).toBe('refunded')
  expect(refunds.map((each) => each.amount)).toContain('32.00')
  let transfersAfter: Json[] = []
  await expect
    .poll(
      async () => {
        transfersAfter = await api.rows(
          `admin/seller_transfers?q[order_id_eq]=${order.id}&limit=100`,
        )
        return transfersAfter.length
      },
      { timeout: 30_000, message: 'the refund reverses part of the seller transfer' },
    )
    .toBeGreaterThan(transfersBefore.length)
  record.note('server seller transfers', { before: transfersBefore, after: transfersAfter })
  const reversal = transfersAfter.filter(
    (each) => !transfersBefore.some((old) => old.id === each.id),
  )
  expect(reversal.some((each) => String(each.amount).startsWith('-'))).toBeTruthy()
  record.save()
})

test('5. A claim', async ({ page }) => {
  const record = new Record('seller', '05-claim')
  const { owner, order, mine } = await twoSellerOrder('Willow', 2)
  await shipped(owner, order)
  await sabotage(page, standIn(/\/claims\/[^/]+\/(resolve|deny)$/))

  await signIn(page, owner)
  await orderPage(page, owner, order)
  const claims = card(page, /^claims/i)
  const newClaim = async () => {
    await claims.getByRole('button', { name: 'New claim' }).click()
    await dialog(page).getByRole('spinbutton', { name: mine.name }).fill('1')
    await pickOption(
      page,
      dialog(page).getByRole('combobox', { name: 'Reason' }),
      /arrived damaged/i,
    )
    await dialog(page).getByRole('button', { name: 'New claim' }).click()
    await expect(dialog(page)).toBeHidden({ timeout: 20_000 })
  }
  // Only a claim still open or approved has a menu, so each step has one to open.
  const claimMenu = () => claims.getByRole('button', { name: 'Actions', exact: true })

  await newClaim()
  await expect(claims.getByText(/^open$/i)).toHaveCount(1, { timeout: 20_000 })
  await chooseFrom(claimMenu(), 'Approve', page)
  await expect(claims.getByText(/^approved$/i)).toBeVisible({ timeout: 20_000 })
  await chooseFrom(claimMenu(), 'Resolve', page)
  await record.shot(page, '1-resolve-dialog')
  await submitButton(page, /resolve/, 'admin.pages.orders.detail.claims.actions.resolve').click()
  await expect(claims.getByText(/^resolved$/i)).toBeVisible({ timeout: 20_000 })

  await newClaim()
  await expect(claims.getByText(/^open$/i)).toHaveCount(1, { timeout: 20_000 })
  await chooseFrom(claimMenu(), 'Deny', page)
  await topDialog(page).getByRole('button', { name: 'Deny' }).click()
  await expect(claims.getByText(/^denied$/i)).toBeVisible({ timeout: 20_000 })
  await record.shot(page, '2-resolved-and-denied')

  const made = await api.rows(`seller/orders/${order.id}/claims`, owner.headers)
  record.note(
    'server claims',
    made.map((each) => ({ number: each.number, status: each.status })),
  )
  expect(made.map((each) => each.status).sort()).toEqual(['denied', 'resolved'])
  record.save()
})

test('6. Exchanges (SD-73)', async ({ page }) => {
  const record = new Record('seller', '06-exchange')
  const { owner, order } = await twoSellerOrder('Alder')
  const replacement = await product(api, owner, 'Cask Rum, next batch', { approve: true })
  await shipped(owner, order)
  await sabotage(
    page,
    altered(/\/seller\/orders\/[^/]+$/, (body) => ({ ...body, items: [] })),
  )

  // The failure's evidence, kept before the check looks: the Seller API's
  // answer to the exchange the intended result needs.
  const [parcel] = await api.rows(`seller/orders/${order.id}/fulfillments`, owner.headers)
  const unit = (parcel.fulfillment_items as Json[])[0]
  const refusal = await api.answer(
    'post',
    `seller/orders/${order.id}/exchanges`,
    { items: [{ fulfillment_item_id: unit.id, new_variant_id: replacement.variant, quantity: 1 }] },
    owner.headers,
  )
  record.note('the Seller API answer to an exchange', refusal.body, refusal.status)

  await signIn(page, owner)
  await orderPage(page, owner, order)
  await page.getByRole('button', { name: 'More actions' }).click()
  record.note('the order menu offers', await page.getByRole('menuitem').allTextContents())
  await page.keyboard.press('Escape')
  await record.shot(page, '1-order-page')
  record.save()
  // The intended result: an exchange started from the order page, for one
  // item, with a replacement chosen. Steps past this point stay NOT_RUN (G-112).
  const start = page
    .getByRole('button', { name: /exchange/i })
    .or(page.getByRole('menuitem', { name: /exchange/i }))
  await expect(start.first(), 'the order page offers to start an exchange').toBeVisible({
    timeout: 10_000,
  })
  await start.first().click()
  await expect(card(page, /^exchanges/i)).toBeVisible({ timeout: 20_000 })
  const exchanges = await api.rows(`seller/orders/${order.id}/exchanges`, owner.headers)
  expect(exchanges).toHaveLength(1)
})

test('7. Cancelling an order', async ({ page }) => {
  const record = new Record('seller', '07-cancel')
  const { owner, order } = await twoSellerOrder('Linden')
  await sabotage(page, standIn(/\/seller\/orders\/[^/]+\/cancel$/))
  const net = (rows: Json[]) => rows.reduce((total, each) => total + Number(each.amount), 0)
  const transfersBefore = await api.rows(
    `admin/seller_transfers?q[order_id_eq]=${order.id}&limit=100`,
  )
  const [balanceBefore] = await api.rows(`admin/sellers/${owner.id}/balances`)
  record.note('before', { transfers: transfersBefore, balance: balanceBefore })
  const note = `Customer asked to cancel ${run}`

  await signIn(page, owner)
  await orderPage(page, owner, order)
  await chooseFrom(page.getByRole('button', { name: 'More actions' }), 'Cancel order', page)
  await pickOption(
    page,
    dialog(page).getByRole('combobox', { name: 'Reason' }),
    'Customer changed their mind',
  )
  await dialog(page).getByLabel('Note').fill(note)
  await dialog(page)
    .getByRole('checkbox', { name: /refund the customer/i })
    .check()
  await record.shot(page, '1-cancel-dialog')
  await dialog(page).getByRole('button', { name: 'Cancel order' }).click()
  await expect(dialog(page)).toBeHidden({ timeout: 20_000 })
  await expect(
    page
      .locator('main')
      .getByText(/^canceled$/i)
      .first(),
  ).toBeVisible({ timeout: 20_000 })
  await expect(
    page
      .locator('main')
      .getByText(/customer changed their mind/i)
      .first(),
  ).toBeVisible()
  await record.shot(page, '2-canceled')

  const after = await serverOrder(order.id as string)
  record.note('server order', {
    status: after.status,
    cancel_reason_name: after.cancel_reason_name,
    cancel_note: after.cancel_note,
  })
  expect(after.status).toBe('canceled')
  expect(after.cancel_reason_name).toBe('Customer changed their mind')
  expect(after.cancel_note).toBe(note)
  let transfersAfter: Json[] = []
  await expect
    .poll(
      async () => {
        transfersAfter = await api.rows(
          `admin/seller_transfers?q[order_id_eq]=${order.id}&limit=100`,
        )
        return net(transfersAfter)
      },
      { timeout: 30_000, message: "the order's seller transfers net to nothing" },
    )
    .toBe(0)
  const [balanceAfter] = await api.rows(`admin/sellers/${owner.id}/balances`)
  record.note('after', { transfers: transfersAfter, balance: balanceAfter })
  expect(Number(balanceAfter?.payable ?? 0)).toBeCloseTo(
    Number(balanceBefore?.payable ?? 0) - net(transfersBefore),
    2,
  )
  record.save()
})

test("8. An order's instructions, note and address", async ({ page }) => {
  const record = new Record('seller', '08-notes-address')
  const { owner, order } = await twoSellerOrder('Sorrel')
  await sabotage(page, standIn(/\/seller\/orders\/[^/]+\/(notes|address)$/))
  const instructions = `Leave with the concierge ${run}`
  const internal = `Gift wrap requested ${run}`
  const street = `${run.length + 40} Harbour Street`

  await signIn(page, owner)
  await orderPage(page, owner, order)
  const instructionsCard = card(page, /^special instructions$/i)
  await instructionsCard.getByRole('button', { name: 'Edit' }).click()
  await instructionsCard.getByRole('textbox').fill(instructions)
  await instructionsCard.getByRole('button', { name: 'Save' }).click()
  await expect(instructionsCard.getByText(instructions)).toBeVisible({ timeout: 20_000 })
  const noteCard = card(page, /^internal note$/i)
  await noteCard.getByRole('button', { name: 'Edit' }).click()
  await noteCard.getByRole('textbox').fill(internal)
  await noteCard.getByRole('button', { name: 'Save' }).click()
  await expect(noteCard.getByText(internal)).toBeVisible({ timeout: 20_000 })
  await chooseFrom(
    card(page, /^customer$/i).getByRole('button', { name: 'Actions', exact: true }),
    'Edit Shipping Address',
    page,
  )
  await dialog(page).getByLabel('Address', { exact: true }).fill(street)
  await dialog(page).getByRole('button', { name: 'Save' }).click()
  await expect(dialog(page)).toBeHidden({ timeout: 20_000 })

  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(card(page, /^special instructions$/i).getByText(instructions)).toBeVisible({
    timeout: 20_000,
  })
  await expect(card(page, /^internal note$/i).getByText(internal)).toBeVisible()
  await expect(card(page, /^customer$/i).getByText(street)).toBeVisible()
  await record.shot(page, '1-after-reload')

  const after = await api.admin('get', `orders/${order.id}?expand=shipping_address`)
  const address = after.shipping_address as Json
  record.note('server order', {
    customer_note: after.customer_note,
    internal_note: after.internal_note,
    shipping_address: address,
    keys: Object.keys(after),
  })
  expect(after.customer_note).toBe(instructions)
  expect(after.internal_note).toBe(internal)
  expect(address?.address1).toBe(street)
  record.save()
})

test('9. Taking a product down and archiving it', async ({ page }) => {
  const record = new Record('seller', '09-take-down-archive')
  const owner = await seller(api, 'Thistle', 'approved')
  const live = await product(api, owner, 'Malt', { approve: true })
  const storefront = await shopper(api)
  const offered = await api.answer('get', `store/products/${live.id}`, undefined, storefront)
  record.note('storefront before', { status: offered.status })
  expect(offered.status).toBe(200)
  await sabotage(page, standIn(/\/seller\/products\/[^/]+\/(draft|archive)$/))

  await signIn(page, owner)
  await visit(page, owner, `/products/${live.id}`)
  await expect(page.getByRole('heading', { name: live.name, level: 1 })).toBeVisible({
    timeout: 20_000,
  })
  await page.getByRole('button', { name: 'Take down' }).click()
  await topDialog(page).getByRole('button', { name: 'Take down' }).click()
  await expect(
    page
      .locator('main')
      .getByText(/^draft$/i)
      .first(),
  ).toBeVisible({ timeout: 20_000 })
  await record.shot(page, '1-taken-down')
  expect((await api.admin('get', `products/${live.id}`)).status).toBe('draft')
  await page.getByRole('button', { name: 'Archive' }).click()
  await topDialog(page).getByRole('button', { name: 'Archive' }).click()
  await expect(
    page
      .locator('main')
      .getByText(/^archived$/i)
      .first(),
  ).toBeVisible({ timeout: 20_000 })
  await record.shot(page, '2-archived')

  const after = await api.admin('get', `products/${live.id}`)
  const gone = await api.answer('get', `store/products/${live.id}`, undefined, storefront)
  record.note('server product', { status: after.status })
  record.note('storefront after', { status: gone.status })
  expect(after.status).toBe('archived')
  expect(gone.status).toBe(404)
  record.save()
})

test('10. Importing and exporting products', async ({ page }, testInfo) => {
  const record = new Record('seller', '10-import-export')
  const owner = await seller(api, 'Bramble', 'approved')
  const other = await seller(api, 'Quince', 'approved')
  const theirs = await product(api, other, 'Perry')
  const rows = ['Pot Still Gin', 'Barrel Rye'].map((name, index) => ({
    slug: `${run}-import-${index + 1}`,
    sku: `IMP-${run}-${index + 1}`,
    name: `${owner.name} ${name}`,
    price: '41.00',
  }))
  const file = testInfo.outputPath('products.csv')
  writeFileSync(
    file,
    `slug,sku,name,price\n${rows.map((row) => `${row.slug},${row.sku},${row.name},${row.price}`).join('\n')}\n`,
  )
  await sabotage(page, standIn(/\/seller\/imports(\/[^/]+)?(\/[a-z_]+)?$/, 'POST'))

  await signIn(page, owner)
  await visit(page, owner, '/products')
  await page.getByRole('button', { name: 'Import' }).click()
  await dialog(page).locator('input[type="file"]').setInputFiles(file)
  await dialog(page).getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText(/map columns/i).first()).toBeVisible({ timeout: 20_000 })
  await record.shot(page, '1-mapping')
  await page.getByRole('button', { name: /start import/i }).click()
  await expect(page.getByText(/import completed/i).first()).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText(/2 rows imported · 0 failed/i).first()).toBeVisible()
  await record.shot(page, '2-imported')

  const mine = await api.rows('seller/products?limit=100', owner.headers)
  const theirsNow = await api.rows('seller/products?limit=100', other.headers)
  record.note(
    'seller products',
    mine.map((each) => each.name),
  )
  for (const row of rows) {
    expect(mine.map((each) => each.name)).toContain(row.name)
    expect(theirsNow.map((each) => each.name)).not.toContain(row.name)
  }

  await visit(page, owner, '/products')
  await page.getByRole('button', { name: 'Export' }).click()
  await dialog(page)
    .getByRole('radio', { name: /^all records/i })
    .check()
  const download = page.waitForEvent('download', { timeout: 60_000 })
  await dialog(page).getByRole('button', { name: 'Export' }).click()
  const csv = readFileSync(await (await download).path(), 'utf8')
  record.note('export holds', csv.split('\n').length - 1)
  for (const row of rows) expect(csv).toContain(row.name)
  expect(csv).not.toContain(theirs.name)
  expect(csv).not.toContain(other.name)
  record.save()
})

test("11. The profile's addresses and tax registration (SD-103)", async ({ page }) => {
  const record = new Record('seller', '11-profile')
  const owner = await seller(api, 'Juniper Hill', 'approved')
  await sabotage(page, standIn(/\/seller\/(profile|tax_identifiers)$/, 'PATCH'))
  const billingStreet = `${run.length + 10} Cooper Lane`
  const returnsStreet = `${run.length + 20} Dock Road`

  record.note(
    'server stock locations before',
    await api.rows('seller/stock_locations?limit=100', owner.headers),
  )
  await signIn(page, owner)
  await visit(page, owner, '/profile')
  await record.shot(page, '0-profile-before')
  // The fourth Edit on the page is the billing address's: name, contact, business details, billing.
  await page.getByRole('button', { name: 'Edit', exact: true }).nth(3).click()
  await expect(dialog(page)).toHaveAccessibleName('Billing address')
  await dialog(page).getByLabel('Address', { exact: true }).fill(billingStreet)
  await dialog(page).getByRole('button', { name: 'Save' }).click()
  await expect(dialog(page)).toBeHidden({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Add address' }).click()
  await expect(dialog(page)).toHaveAccessibleName('Returns address')
  await dialog(page).getByLabel('Company').fill(owner.name)
  await dialog(page).getByLabel('Address', { exact: true }).fill(returnsStreet)
  await dialog(page).getByLabel('City').fill('Portland')
  await pickOption(page, dialog(page).getByRole('combobox', { name: 'State / Province' }), 'Oregon')
  await dialog(page).getByLabel('Postal code').fill('97209')
  await dialog(page).getByLabel('Phone').fill('5035550142')
  await dialog(page).getByRole('button', { name: 'Save' }).click()
  await expect(dialog(page)).toBeHidden({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Add registration' }).click()
  await dialog(page).getByRole('combobox', { name: 'Kind' }).fill('us_ein')
  await page
    .getByRole('option', { name: /US EIN|us_ein/i })
    .first()
    .click()
  await dialog(page).getByLabel('Number').fill('12-3456789')
  await dialog(page).getByRole('button', { name: 'Save' }).click()
  await expect(dialog(page)).toBeHidden({ timeout: 20_000 })

  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(billingStreet)).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(returnsStreet)).toBeVisible()
  await expect(page.getByText('12-3456789')).toBeVisible()
  await record.shot(page, '1-after-reload')

  const profile = await api.send('get', 'seller/profile', undefined, owner.headers)
  const identifiers = await api.rows('seller/tax_identifiers', owner.headers)
  const operatorView = await api.admin('get', `sellers/${owner.id}`)
  record.note('server profile', {
    billing: (profile.billing_address as Json)?.address1,
    returns: (profile.returns_address as Json)?.address1,
  })
  record.note('server tax identifiers', identifiers)
  record.note(
    'server stock locations after',
    await api.rows('seller/stock_locations?limit=100', owner.headers),
  )
  expect((profile.billing_address as Json)?.address1).toBe(billingStreet)
  expect((profile.returns_address as Json)?.address1).toBe(returnsStreet)
  expect(identifiers.map((each) => each.value ?? each.number)).toContain('12-3456789')
  expect(operatorView.id).toBe(owner.id)
  record.save()
})

test('12. The account dialog', async ({ page }) => {
  const record = new Record('seller', '12-account')
  const owner = await seller(api, 'Meadowsweet', 'approved')
  await sabotage(page, standIn(/\/seller\/me$/))
  const firstName = `Ilse${run}`

  await signIn(page, owner)
  await page.getByRole('button', { name: 'User menu' }).click()
  await page.getByRole('menuitem', { name: 'Edit Profile' }).click()
  await dialog(page).locator('input[type="file"]').setInputFiles(photo)
  await dialog(page).getByLabel('First name').fill(firstName)
  await pickOption(page, dialog(page).getByRole('combobox', { name: 'Language' }), 'Deutsch')
  await record.shot(page, '1-account-dialog')
  await dialog(page).getByRole('button', { name: 'Save' }).click()
  await expect(dialog(page)).toBeHidden({ timeout: 20_000 })

  await page.reload()
  await page.waitForLoadState('networkidle')
  const userMenu = page.getByRole('button', { name: /user menu|benutzermenü/i })
  await expect(userMenu).toContainText(firstName, { timeout: 20_000 })
  await userMenu.click()
  await expect(page.getByRole('menuitem', { name: /abmelden/i })).toBeVisible()
  await page.keyboard.press('Escape')
  await record.shot(page, '2-after-reload')

  const me = await api.send('get', 'seller/me', undefined, owner.headers)
  const user = me.user as Json
  record.note('server member', {
    first_name: user.first_name,
    locale: user.selected_locale,
    avatar_url: user.avatar_url,
  })
  expect(user.first_name).toBe(firstName)
  expect(user.selected_locale).toBe('de')
  expect(user.avatar_url).toBeTruthy()
  // The photo shows beside the member's name, on the menu's own button.
  await expect(userMenu.locator('img').first()).toBeVisible({ timeout: 20_000 })
  record.save()
})

test('13. Switching between two sellers', async ({ page }) => {
  const record = new Record('seller', '13-switch')
  const { owner: first, order: firstOrder, mine: firstProduct } = await twoSellerOrder('Birch')
  const second = await seller(api, 'Cedar', 'approved', { member: first.email })
  const secondProduct = await product(api, second, 'Amaro', { approve: true })
  const secondOrder = await orderOf(
    api,
    (await purchase(api, [secondProduct.variant])).orders,
    second,
  )
  // The member's sellers as served, with the second left out.
  await sabotage(
    page,
    altered(/\/seller\/me$/, (body) => ({
      ...body,
      sellers: (body.sellers as Json[]).filter((each) => each.id !== second.id),
    })),
  )

  await sellerPanelSignIn(page, first.email)
  await expect(
    page
      .getByText('Choose a seller')
      .or(page.getByRole('button', { name: 'Switch seller' }))
      .first(),
  ).toBeVisible({
    timeout: 20_000,
  })
  if (await page.getByText('Choose a seller').isVisible())
    await page.getByRole('link', { name: first.name }).click()
  await expect(page).toHaveURL(new RegExp(`/${first.id}`), { timeout: 20_000 })
  await chooseFrom(page.getByRole('button', { name: 'Switch seller' }), second.name, page)
  await expect(page).toHaveURL(new RegExp(`/${second.id}`), { timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Switch seller' })).toContainText(second.name)

  await visit(page, second, '/orders')
  await expect(page.getByText(secondOrder.number as string)).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(firstOrder.number as string, { exact: true })).toHaveCount(0)
  await record.shot(page, '1-second-orders')
  await visit(page, second, '/products')
  await expect(page.getByText(secondProduct.name)).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(firstProduct.name)).toHaveCount(0)
  await record.shot(page, '2-second-products')

  const secondHeaders = { ...first.headers, 'X-Spree-Seller-Id': second.id }
  const orders = await api.rows('seller/orders?limit=100', secondHeaders)
  record.note(
    'server orders as the second seller',
    orders.map((each) => each.number),
  )
  expect(orders.map((each) => each.id)).toContain(secondOrder.id)
  expect(orders.map((each) => each.id)).not.toContain(firstOrder.id)
  record.save()
})

test('14. Submitting for review', async ({ page }) => {
  const record = new Record('seller', '14-submit')
  const owner = await seller(api, 'Yarrow', 'met', { terms: false })
  await sabotage(page, standIn(/\/seller\/onboarding\/submit_for_review$/, 'POST'))

  await signIn(page, owner)
  await visit(page, owner, '/onboarding')
  const submit = page.getByRole('button', { name: 'Submit for review' })
  await expect(submit).toBeDisabled({ timeout: 20_000 })
  await record.shot(page, '1-one-left')
  await page.getByRole('button', { name: /^accept the terms$/i }).click()
  await expect(submit).toBeEnabled({ timeout: 20_000 })
  await submit.click()
  await expect(page.getByText(/sent for review/i).first()).toBeVisible({ timeout: 20_000 })
  await visit(page, owner, '/profile')
  await expect(page.getByText(/ready.for.review/i).first()).toBeVisible({ timeout: 20_000 })
  await record.shot(page, '2-ready-for-review')

  const after = await api.admin('get', `sellers/${owner.id}`)
  record.note('server seller', { status: after.status })
  expect(after.status).toBe('ready_for_review')
  record.save()
})

test('15. Choosing a new password', async ({ page }) => {
  const record = new Record('seller', '15-password')
  const owner = await seller(api, 'Saffron', 'approved')
  const fresh = `fidelity-new-${run}`
  const before = mailTo(owner.email).length
  await sabotage(page, standIn(/\/seller\/auth\/password_resets\/[^/]+$/))

  await page.goto(`${SELLER_PANEL}/login`)
  await page.getByRole('link', { name: /forgot your password/i }).click()
  await page.getByLabel('Email').fill(owner.email)
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByText('Check your email')).toBeVisible({ timeout: 20_000 })
  // The approval mail is sent by a job and may land after the request, so the reset is found by subject.
  const resetMail = () =>
    mailTo(owner.email)
      .slice(before)
      .find((each) => /password reset/i.test(each.subject))
  await expect.poll(() => resetMail()?.subject, { timeout: 30_000 }).toMatch(/password reset/i)
  const mail = resetMail() as Mail
  record.note('reset mail', mail.subject)
  const link = linkIn(mail, /reset-password/)
  const target = `${SELLER_PANEL}${link.pathname}${link.search}`

  await page.goto(target)
  await page.getByLabel('New password', { exact: true }).fill(fresh)
  await page.getByLabel('Confirm new password').fill(fresh)
  await page.getByRole('button', { name: 'Change password' }).click()
  await expect(page).toHaveURL(new RegExp(`/${owner.id}|/login`), { timeout: 20_000 })
  await record.shot(page, '1-after-reset')

  await page.context().clearCookies()
  await page.evaluate(() => window.localStorage.clear())
  await sellerPanelSignIn(page, owner.email, PASSWORD)
  await expect(page.getByText(/did not match a seller account/i)).toBeVisible({ timeout: 20_000 })
  await signIn(page, owner, fresh)
  await record.shot(page, '2-signed-in-with-new')

  await page.context().clearCookies()
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(target)
  await page.getByLabel('New password', { exact: true }).fill(`${fresh}-again`)
  await page.getByLabel('Confirm new password').fill(`${fresh}-again`)
  await page.getByRole('button', { name: 'Change password' }).click()
  await expect(page.getByText(/that link could not be used/i)).toBeVisible({ timeout: 20_000 })
  await record.shot(page, '3-link-used-twice')

  const oldAnswer = await api.answer(
    'post',
    'seller/auth/login',
    { email: owner.email, password: PASSWORD },
    {},
  )
  const newAnswer = await api.answer(
    'post',
    'seller/auth/login',
    { email: owner.email, password: fresh },
    {},
  )
  record.note('server sign-in', { old: oldAnswer.status, new: newAnswer.status })
  expect(oldAnswer.status).toBe(401)
  expect(newAnswer.status).toBe(200)
  record.save()
})

test('16. A store staff member at sign-in', async ({ page }) => {
  const record = new Record('seller', '16-staff')
  await sabotage(page, async (target) => {
    await target.route(
      (url) => url.pathname.endsWith('/seller/auth/login'),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'stand-in',
            refresh_token: 'stand-in',
            user: { email: 'admin@example.com' },
          }),
        }),
    )
  })

  await sellerPanelSignIn(page, 'admin@example.com', 'spree123')
  await expect(
    page.getByText(/did not match a seller account|does not run a seller on this marketplace/i),
  ).toBeVisible({ timeout: 20_000 })
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('navigation')).toHaveCount(0)
  await record.shot(page, '1-refused')

  const answer = await api.answer(
    'post',
    'seller/auth/login',
    { email: 'admin@example.com', password: 'spree123' },
    {},
  )
  record.note('server sign-in', answer.body, answer.status)
  expect(answer.status).toBeGreaterThanOrEqual(400)
  record.save()
})
