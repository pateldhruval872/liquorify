import { expect, type Page, test } from '@playwright/test'
import { mailTo } from './mail'
import {
  Api,
  adminSignIn,
  altered,
  blockOutside,
  card,
  dialog,
  orderOf,
  product,
  purchase,
  Record,
  run,
  type Seller,
  sabotage,
  seller,
  standIn,
  unique,
} from './marketplace-follow-up'
import type { Json } from './orders'
import { Receiver } from './receiver'

/**
 * G-105: the operator's 14 behaviours on the seller, product, order, settings
 * and report screens (work item `fb-19-batch-marketplace.md` §11.2, numbered as
 * part 1's §2.3). Each check signs in through the dashboard's sign-in form as
 * the browser tests' admin, drives the behaviour through the visible controls,
 * then asserts what the screen shows and reads the server's state back through
 * the Admin API. Its records are made by `marketplace-follow-up.ts`.
 *
 * Run against the browser-test server started with the emails gem in its
 * bundle (`emails-bundle/Gemfile`) and `LIQUORIFY_MAIL_DIR`, so the seller
 * emails are written where `mail.ts` reads them, and with the built dashboard
 * on `FIDELITY_BASE_URL` (5174 by default).
 */

let api: Api
let storeId: string
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
  storeId = await adminSignIn(page)
})
test.afterEach(async () => {
  expect(outside, 'no request left this machine').toEqual([])
})

const open = async (page: Page, path: string) => {
  await page.goto(`/${storeId}${path}`)
  await page.waitForLoadState('networkidle')
}

const sellerPage = async (page: Page, target: Seller) => {
  await open(page, `/sellers/${target.id}`)
  await expect(page.getByRole('heading', { name: target.name })).toBeVisible({ timeout: 20_000 })
  await expect(card(page, /^onboarding$/i)).toBeVisible({ timeout: 20_000 })
}

/** The status badge beside the seller's name. */
const statusReads = (page: Page, label: RegExp) =>
  expect(page.locator('main').getByText(label).first()).toBeVisible({ timeout: 20_000 })

const fromMenu = async (page: Page, item: RegExp) => {
  await page.getByRole('button', { name: /more actions/i }).click()
  await page.getByRole('menuitem', { name: item }).click()
}

const confirmIn = async (page: Page, label: RegExp) => {
  await expect(dialog(page)).toBeVisible()
  await dialog(page).getByRole('button', { name: label }).click()
  await expect(dialog(page)).toBeHidden({ timeout: 20_000 })
}

const requirementRow = (page: Page, name: string) =>
  card(page, /^onboarding$/i)
    .getByText(name, { exact: true })
    .locator('xpath=ancestor::*[.//button or .//*[@data-slot="badge"]][1]')

const serverSeller = (id: string) => api.admin('get', `sellers/${id}`)

test('1. Approving a seller with nothing outstanding', async ({ page }) => {
  const record = new Record('operator', '01-approve')
  const target = await seller(api, 'Juniper Row', 'ready_for_review')
  await sabotage(page, standIn(/\/admin\/sellers\/[^/]+\/approve$/))
  const mailBefore = mailTo(target.email).length

  await sellerPage(page, target)
  await statusReads(page, /^ready for review$/i)
  await record.shot(page, '1-ready-for-review')
  await page.getByRole('button', { name: /^approve$/i }).click()
  // No confirmation is asked when nothing is outstanding.
  await expect(dialog(page)).toBeHidden()
  await statusReads(page, /^approved$/i)
  await record.shot(page, '2-approved')

  const after = await serverSeller(target.id)
  record.note('server seller', { status: after.status })
  expect(after.status).toBe('approved')
  await expect
    .poll(
      () =>
        mailTo(target.email)
          .slice(mailBefore)
          .map((mail) => mail.subject),
      { timeout: 20_000 },
    )
    .toContainEqual(expect.stringMatching(/approved to sell/i))
  record.note(
    'mail to the contact',
    mailTo(target.email)
      .slice(mailBefore)
      .map((mail) => mail.subject),
  )
  record.save()
})

test('2. Approving with requirements outstanding', async ({ page }) => {
  const record = new Record('operator', '02-approve-override')
  // Every requirement met, then submitted, then one taken away again: the
  // seller clears its shipping box's weight, so "Shipping box" blocks.
  const target = await seller(api, 'Fennel and Oak', 'ready_for_review')
  for (const box of await api.rows('seller/package_types?limit=100', target.headers))
    if (box.default)
      await api.send('patch', `seller/package_types/${box.id}`, { weight: 0 }, target.headers)
  const onboarding = await api.admin('get', `sellers/${target.id}/onboarding`)
  const blocking = (onboarding.requirements as Json[]).filter((each) => each.blocking)
  record.note(
    'blocking before',
    blocking.map((each) => each.name),
  )
  expect(blocking.length).toBeGreaterThan(0)
  // A local receiver for the `seller.approved` event, to read what it names.
  const receiver = new Receiver(4421)
  await receiver.start()
  const endpoint = await api.admin('post', 'webhook_endpoints', {
    name: unique('Approvals'),
    url: `http://localhost:4421/hooks/${run}-${target.id}`,
    subscriptions: ['seller.approved'],
  })
  await sabotage(page, standIn(/\/admin\/sellers\/[^/]+\/approve$/))

  await sellerPage(page, target)
  await page.getByRole('button', { name: /^approve$/i }).click()
  await expect(dialog(page)).toBeVisible()
  for (const each of blocking) await expect(dialog(page)).toContainText(each.name as string)
  await record.shot(page, '1-override-asked')
  // Without the override: the dashboard sends nothing, and the seller waits.
  await dialog(page)
    .getByRole('button', { name: /cancel/i })
    .click()
  await expect(dialog(page)).toBeHidden()
  await statusReads(page, /^ready for review$/i)
  expect((await serverSeller(target.id)).status).toBe('ready_for_review')
  const refused = await api.answer('patch', `admin/sellers/${target.id}/approve`, {})
  record.note('the server, asked without the override', refused.body, refused.status)
  expect(refused.status).toBe(422)

  // With the override.
  await page.getByRole('button', { name: /^approve$/i }).click()
  await confirmIn(page, /approve anyway/i)
  await statusReads(page, /^approved$/i)
  await record.shot(page, '2-approved-with-override')
  const after = await serverSeller(target.id)
  record.note('server seller', { status: after.status })
  expect(after.status).toBe('approved')
  try {
    await expect
      .poll(() => receiver.received.length, {
        timeout: 30_000,
        message: 'the seller.approved event',
      })
      .toBeGreaterThan(0)
    const event = JSON.parse(receiver.received[0].body) as Json
    record.note('seller.approved event', event)
    const text = JSON.stringify(event)
    expect(text).toContain(target.id)
    for (const each of blocking) expect(text).toContain(each.name as string)
  } finally {
    await receiver.stop()
    await api.answer('delete', `admin/webhook_endpoints/${endpoint.id}`)
  }
  record.save()
})

test('3. Suspending a seller', async ({ page }) => {
  const record = new Record('operator', '03-suspend')
  const target = await seller(api, 'Copperline', 'approved')
  await sabotage(page, standIn(/\/admin\/sellers\/[^/]+\/suspend$/))

  await sellerPage(page, target)
  await fromMenu(page, /^suspend$/i)
  await confirmIn(page, /^suspend$/i)
  await statusReads(page, /^suspended$/i)
  await record.shot(page, '1-suspended')
  const after = await serverSeller(target.id)
  record.note('server seller', { status: after.status })
  expect(after.status).toBe('suspended')
  record.save()
})

test('4. Reinstating a suspended seller', async ({ page }) => {
  const record = new Record('operator', '04-reinstate')
  const target = await seller(api, 'Saltmarsh', 'approved')
  await api.admin('patch', `sellers/${target.id}/suspend`, {})
  await sabotage(page, standIn(/\/admin\/sellers\/[^/]+\/approve$/))

  await sellerPage(page, target)
  await statusReads(page, /^suspended$/i)
  await page.getByRole('button', { name: /^reinstate$/i }).click()
  // SD-69: reinstating asks for no confirmation when nothing is outstanding.
  if (await dialog(page).isVisible()) await dialog(page).getByRole('button').last().click()
  await statusReads(page, /^approved$/i)
  await record.shot(page, '1-reinstated')
  const after = await serverSeller(target.id)
  record.note('server seller', { status: after.status })
  expect(after.status).toBe('approved')
  record.save()
})

test('5. Rejecting a seller', async ({ page }) => {
  const record = new Record('operator', '05-reject')
  const target = await seller(api, 'Northgate', 'ready_for_review')
  const trading = await seller(api, 'Harbour Cask', 'approved')
  await sabotage(page, standIn(/\/admin\/sellers\/[^/]+\/reject$/))
  const mailBefore = mailTo(target.email).length

  await sellerPage(page, target)
  await fromMenu(page, /^reject$/i)
  await confirmIn(page, /^reject$/i)
  await statusReads(page, /^rejected$/i)
  await record.shot(page, '1-rejected')
  const after = await serverSeller(target.id)
  record.note('server seller', { status: after.status })
  expect(after.status).toBe('rejected')
  const sent = mailTo(target.email).slice(mailBefore)
  record.note(
    'mail to the seller',
    sent.map((mail) => mail.subject),
  )
  for (const mail of sent) expect(mail.html).not.toMatch(/reason/i)

  // The approved seller offers no Reject, and the server refuses it.
  await sellerPage(page, trading)
  await page.getByRole('button', { name: /more actions/i }).click()
  await expect(page.getByRole('menuitem', { name: /^reject$/i })).toHaveCount(0)
  await record.shot(page, '2-approved-offers-no-reject')
  await page.keyboard.press('Escape')
  const refused = await api.answer('patch', `admin/sellers/${trading.id}/reject`, {})
  record.note('rejecting the approved seller', refused.body, refused.status)
  expect(refused.status).toBe(422)
  expect((await serverSeller(trading.id)).status).toBe('approved')
  record.save()
})

test('6. Sending a seller back to onboarding (SD-101)', async ({ page }) => {
  const record = new Record('operator', '06-send-back')
  const target = await seller(api, 'Stonecrop', 'ready_for_review')
  await sabotage(page, standIn(/\/admin\/sellers\/[^/]+\/reopen_onboarding$/))

  await sellerPage(page, target)
  await fromMenu(page, /send back to onboarding/i)
  await expect(dialog(page)).toBeVisible()
  await record.shot(page, '1-confirm')
  // The note the seller is told to fix. The confirmation is the only control.
  const note = dialog(page).getByRole('textbox')
  const offered = await note.count()
  record.note('a field for the note in the confirmation', offered > 0)
  if (offered > 0) await note.first().fill('Upload the premises licence again, it is cut off.')
  await dialog(page)
    .getByRole('button', { name: /send back to onboarding/i })
    .click()
  await expect(dialog(page)).toBeHidden({ timeout: 20_000 })
  await statusReads(page, /^onboarding$/i)
  await record.shot(page, '2-onboarding')
  const after = await serverSeller(target.id)
  record.note('server seller', { status: after.status })
  expect(after.status).toBe('onboarding')
  // The note is kept where Spree's workflow keeps it, on the seller.
  record.note('server seller metadata', after.metadata)
  expect((after.metadata as Json | undefined)?.onboarding_reopened_note).toBe(
    'Upload the premises licence again, it is cut off.',
  )
  record.save()
})

test('7. Deciding an onboarding requirement', async ({ page }) => {
  const record = new Record('operator', '07-requirements')
  // Two requirements an operator reviews, made by this run, each answered by the seller.
  const reviewed = []
  for (const label of ['Premises licence', 'Duty registration']) {
    reviewed.push(
      await api.admin('post', 'seller_requirements', {
        type: 'operator_review',
        name: unique(label),
        required: true,
        active: true,
      }),
    )
  }
  try {
    const target = await seller(api, 'Brightwater', 'onboarding')
    for (const requirement of reviewed)
      await api.send(
        'post',
        `seller/requirements/${requirement.id}/submissions`,
        { note: `Submitted for ${requirement.name}.` },
        target.headers,
      )
    const before = await api.admin('get', `sellers/${target.id}/onboarding`)
    record.note('before', before)
    await sabotage(
      page,
      standIn(/\/admin\/sellers\/[^/]+\/requirement_submissions\/[^/]+\/(accept|reject)$/),
    )

    await sellerPage(page, target)
    const progress = card(page, /^onboarding$/i)
    const beforeDone = (before.progress as Json).done as number
    const total = (before.progress as Json).total as number
    await expect(progress).toContainText(`${beforeDone} of ${total} done`)
    await record.shot(page, '1-before')

    const [accepted, sentBack] = reviewed.map((each) => each.name as string)
    await requirementRow(page, accepted)
      .getByRole('button', { name: /^accept$/i })
      .click()
    await expect(requirementRow(page, accepted)).toContainText(/done/i, { timeout: 20_000 })

    await requirementRow(page, sentBack)
      .getByRole('button', { name: /^send back$/i })
      .click()
    await expect(dialog(page)).toBeVisible()
    const reason = dialog(page).getByRole('textbox')
    record.note('a field for the reason in the confirmation', (await reason.count()) > 0)
    if (await reason.count()) await reason.first().fill('The registration number is unreadable.')
    await dialog(page)
      .getByRole('button', { name: /^send back$/i })
      .click()
    await expect(dialog(page)).toBeHidden({ timeout: 20_000 })
    await expect(requirementRow(page, sentBack)).toContainText(/sent back/i, { timeout: 20_000 })

    await requirementRow(page, 'Shipping box').getByRole('button').last().click()
    await page.getByRole('menuitem', { name: /waive for this seller/i }).click()
    await confirmIn(page, /waive for this seller/i)
    await expect(requirementRow(page, 'Shipping box')).toContainText(/waived/i, { timeout: 20_000 })
    await expect(progress).toContainText(`${beforeDone + 2} of ${total} done`)
    await record.shot(page, '2-decided')

    const after = await api.admin('get', `sellers/${target.id}/onboarding`)
    record.note('after', after)
    const status = (name: string) =>
      (after.requirements as Json[]).find((each) => each.name === name)?.status
    expect(status(accepted)).toBe('complete')
    expect(status(sentBack)).toBe('rejected')
    expect(status('Shipping box')).toMatch(/complete|waived/)
    expect((after.progress as Json).done).toBe(beforeDone + 2)
    const submissions = await api.rows(`admin/sellers/${target.id}/requirement_submissions`)
    record.note('submissions', submissions)
  } finally {
    for (const requirement of reviewed)
      await api.answer('patch', `admin/seller_requirements/${requirement.id}`, { active: false })
  }
  record.save()
})

test("8. Approving a seller's product", async ({ page }) => {
  const record = new Record('operator', '08-product-approve')
  const owner = await seller(api, 'Kestrel Spirits', 'approved')
  const proposed = await product(api, owner, 'Navy Strength Rum')
  await sabotage(page, standIn(/\/admin\/products\/[^/]+\/approve$/))

  await open(page, `/products/${proposed.id}`)
  await expect(page.getByRole('heading', { name: proposed.name }).first()).toBeVisible({
    timeout: 20_000,
  })
  await page.getByRole('button', { name: /^approve$/i }).click()
  await confirmIn(page, /^approve$/i)
  await expect(page.getByText(/product approved/i).first()).toBeVisible({ timeout: 20_000 })
  await page.reload()
  await expect(page.getByRole('button', { name: /^approve$/i })).toHaveCount(0, { timeout: 20_000 })
  await expect(
    page
      .locator('main')
      .getByText(/^active$/i)
      .first(),
  ).toBeVisible()
  await record.shot(page, '1-approved')
  const after = await api.admin('get', `products/${proposed.id}`)
  record.note('server product', { status: after.status })
  expect(after.status).toBe('active')
  record.save()
})

test("9. Sending a seller's product back", async ({ page }) => {
  const record = new Record('operator', '09-product-send-back')
  const owner = await seller(api, 'Tidewater', 'approved')
  const proposed = await product(api, owner, 'Smoked Porter')
  const reason = `Add the bottle size and strength (${run}).`
  await sabotage(page, standIn(/\/admin\/products\/[^/]+\/reject$/))

  await open(page, `/products/${proposed.id}`)
  await expect(page.getByRole('heading', { name: proposed.name }).first()).toBeVisible({
    timeout: 20_000,
  })
  await page.getByRole('button', { name: /^send back$/i }).click()
  await page.getByRole('textbox', { name: /reason/i }).fill(reason)
  await page.getByRole('button', { name: /^send back$/i }).click()
  await expect(page.getByText(/sent back to the seller/i).first()).toBeVisible({ timeout: 20_000 })
  await page.reload()
  await expect(page.getByRole('button', { name: /edit reason/i })).toBeVisible({ timeout: 20_000 })
  await record.shot(page, '1-sent-back')
  const after = await api.admin('get', `products/${proposed.id}`)
  record.note('server product', { status: after.status })
  expect(after.status).toBe('rejected')
  const asSeller = await api.send(
    'get',
    `seller/products/${proposed.id}?expand=submission`,
    undefined,
    owner.headers,
  )
  record.note('the seller reads', asSeller)
  expect((asSeller.submission as Json | undefined)?.review_note).toBe(reason)
  record.save()
})

/** Two approved sellers, a live product each, and a guest's purchase from both. */
async function twoSellerPurchase(label: string) {
  const first = await seller(api, `${label} North`, 'approved')
  const second = await seller(api, `${label} South`, 'approved')
  const firstProduct = await product(api, first, 'Cask Rum', { approve: true })
  const secondProduct = await product(api, second, 'Sloe Gin', { approve: true, price: '28.00' })
  const bought = await purchase(api, [firstProduct.variant, secondProduct.variant])
  const firstOrder = await orderOf(api, bought.orders, first)
  const secondOrder = await orderOf(api, bought.orders, second)
  return { first, second, firstProduct, secondProduct, bought, firstOrder, secondOrder }
}

async function fulfil(orderId: string) {
  const [parcel] = await api.rows(`admin/orders/${orderId}/fulfillments`)
  await api.admin('patch', `orders/${orderId}/fulfillments/${parcel.id}/fulfill`, {
    tracking: `TRK-${run}`,
    notify_customer: false,
  })
}

/** The seller's balances, once the earning a fulfilment records has reached them. */
async function earned(owner: Seller) {
  let balances: Json[] = []
  await expect
    .poll(
      async () => {
        balances = await api.rows(`admin/sellers/${owner.id}/balances`)
        return (balances[0] as Json | undefined)?.payable
      },
      { timeout: 30_000, message: 'the earning reaches the balance' },
    )
    .toMatch(/^[1-9]/)
  return balances
}

async function addRecordFilter(page: Page, field: RegExp, value: string) {
  await page.getByRole('button', { name: /add filter/i }).click()
  await page.locator('[data-slot="filter-panel-item"]').getByText(field).click()
  await page.getByPlaceholder(/filter to…/i).fill(value)
  await page.getByRole('button', { name: value }).click()
  await page.keyboard.press('Escape')
}

const listRows = (page: Page) => page.locator('main').getByRole('row')

test('10. Filtering products and orders by seller', async ({ page }) => {
  const record = new Record('operator', '10-seller-filter')
  const bought = await twoSellerPurchase('Filter')
  const firstNumber = bought.firstOrder.number as string
  const secondNumber = bought.secondOrder.number as string
  record.note('orders', { first: firstNumber, second: secondNumber })
  // The filter's request loses its seller term, so the list is not narrowed.
  await sabotage(page, async (target) => {
    await target.route(
      (url) => /\/admin\/(products|orders)$/.test(url.pathname) && url.search.includes('seller'),
      async (route) => {
        const url = new URL(route.request().url())
        for (const key of [...url.searchParams.keys()])
          if (key.includes('seller')) url.searchParams.delete(key)
        await route.continue({ url: url.toString() })
      },
    )
  })

  await open(page, '/products')
  await addRecordFilter(page, /^seller$/i, bought.first.name)
  const checkProducts = async () => {
    await expect(listRows(page).filter({ hasText: bought.firstProduct.name })).toHaveCount(1, {
      timeout: 20_000,
    })
    await expect(listRows(page).filter({ hasText: bought.second.name })).toHaveCount(0)
    await expect(listRows(page).filter({ hasText: bought.secondProduct.name })).toHaveCount(0)
  }
  await checkProducts()
  await record.shot(page, '1-products-filtered')
  await page.reload()
  await page.waitForLoadState('networkidle')
  await checkProducts()
  await record.shot(page, '2-products-after-reload')

  await open(page, '/orders')
  await addRecordFilter(page, /^seller$/i, bought.first.name)
  const checkOrders = async () => {
    await expect(listRows(page).filter({ hasText: firstNumber })).toHaveCount(1, {
      timeout: 20_000,
    })
    await expect(listRows(page).filter({ hasText: secondNumber })).toHaveCount(0)
  }
  await checkOrders()
  await record.shot(page, '3-orders-filtered')
  await page.reload()
  await page.waitForLoadState('networkidle')
  await checkOrders()
  await record.shot(page, '4-orders-after-reload')

  const products = await api.rows(`admin/products?q[seller_id_eq]=${bought.first.id}&limit=100`)
  const orders = await api.rows(`admin/orders?q[seller_id_eq]=${bought.first.id}&limit=100`)
  record.note(
    'server products of the seller',
    products.map((each) => each.name),
  )
  record.note(
    'server orders of the seller',
    orders.map((each) => each.number),
  )
  expect(products.map((each) => each.name)).toContain(bought.firstProduct.name)
  expect(orders.map((each) => each.number)).toEqual([firstNumber])
  record.save()
})

test("11. A marketplace order's cards", async ({ page }) => {
  const record = new Record('operator', '11-order-cards')
  const rate = await api.admin('post', 'commission_rates', {
    name: unique('Spirits'),
    enabled: true,
    kind: 'percentage',
    value: '12',
  })
  try {
    const bought = await twoSellerPurchase('Cards')
    const order = bought.firstOrder
    await fulfil(order.id as string)
    const lines = await api.rows(`admin/commission_lines?q[order_id_eq]=${order.id}&limit=100`)
    const transfers = await api.rows(`admin/seller_transfers?q[order_id_eq]=${order.id}&limit=100`)
    record.note('server commission lines', lines)
    record.note('server seller transfers', transfers)
    expect(lines.length).toBeGreaterThan(0)
    expect(transfers.length).toBeGreaterThan(0)
    await sabotage(
      page,
      altered(/\/admin\/seller_transfers$/, (body) => ({ ...body, data: [] })),
    )

    await open(page, `/orders/${order.id}`)
    await expect(page.getByText(order.number as string).first()).toBeVisible({ timeout: 20_000 })
    const sellerCard = card(page, /^seller$/i)
    await expect(sellerCard).toContainText(bought.first.name, { timeout: 20_000 })
    await expect(sellerCard).toContainText(/part of a larger purchase/i)
    const commission = card(page, /^commission$/i)
    for (const line of lines)
      await expect(commission).toContainText(`$${line.total}`, { timeout: 20_000 })
    const transferCard = card(page, /^seller transfers$/i)
    for (const transfer of transfers)
      await expect(transferCard).toContainText(`$${transfer.amount}`, { timeout: 20_000 })
    await record.shot(page, '1-order-cards')
  } finally {
    await api.answer('patch', `admin/commission_rates/${rate.id}`, { enabled: false })
  }
  record.save()
})

test('12. Settling a seller by hand', async ({ page }) => {
  const record = new Record('operator', '12-settle')
  const owner = await seller(api, 'Settle', 'approved')
  await api.admin('patch', `sellers/${owner.id}`, { payouts_schedule_interval: 'manual' })
  const live = await product(api, owner, 'Barrel Gin', { approve: true })
  const bought = await purchase(api, [live.variant])
  const order = await orderOf(api, bought.orders, owner)
  await fulfil(order.id as string)
  const before = await earned(owner)
  record.note('server balance before', before)
  await sabotage(page, standIn(/\/admin\/sellers\/[^/]+\/payouts$/, 'POST'))

  await open(page, `/sellers/${owner.id}`)
  const balance = card(page, /^balance$/i)
  await expect(balance).toBeVisible({ timeout: 20_000 })
  await record.shot(page, '1-balance')
  await balance.getByRole('button', { name: /settle now/i }).click()
  await confirmIn(page, /settle now/i)
  await expect(page.getByText(/payout created/i).first()).toBeVisible({ timeout: 20_000 })
  await page.reload()
  await page.waitForLoadState('networkidle')
  await record.shot(page, '2-settled')

  const payouts = await api.rows(`admin/seller_payouts?q[seller_id_eq]=${owner.id}&limit=100`)
  const after = await api.rows(`admin/sellers/${owner.id}/balances`)
  record.note('server payouts', payouts)
  record.note('server balance after', after)
  expect(payouts).toHaveLength(1)
  expect(payouts[0].amount).toBe((before[0] as Json).payable)
  expect(payouts[0].status).toBe('pending')
  // Correction (record §1.3): the built-in provider records the payout and
  // waits to be told it went, so the balance still reads what is owed until
  // the payout is marked paid.
  expect((after[0] as Json).balance).toBe((before[0] as Json).balance)

  await open(page, `/sellers/payouts/${payouts[0].id}`)
  await page
    .getByRole('button', { name: /mark as paid/i })
    .first()
    .click()
  await expect(dialog(page)).toBeVisible()
  await dialog(page).getByRole('textbox').first().fill(`BACS-${run}`)
  await dialog(page)
    .getByRole('button', { name: /mark as paid/i })
    .click()
  await expect(dialog(page)).toBeHidden({ timeout: 20_000 })
  await open(page, `/sellers/${owner.id}`)
  await expect(card(page, /^balance$/i)).toBeVisible({ timeout: 20_000 })
  await record.shot(page, '3-paid')
  const paid = await api.admin('get', `seller_payouts/${payouts[0].id}`)
  const left = await api.rows(`admin/sellers/${owner.id}/balances`)
  record.note('server payout after marking paid', paid)
  record.note('server balance after marking paid', left)
  expect(paid.status).toBe('completed')
  expect((left[0] as Json).balance).toBe('0.00')
  await expect(card(page, /^balance$/i)).toContainText('$0.00')
  record.save()
})

test('13. Automatic approval of sellers and products', async ({ page }) => {
  const record = new Record('operator', '13-auto-approve')
  const setSwitches = async (on: boolean) => {
    await open(page, '/settings/marketplace')
    await expect(page.getByRole('heading', { name: 'Marketplace' }).first()).toBeVisible({
      timeout: 20_000,
    })
    for (const label of [
      'Approve sellers automatically',
      'Publish seller products automatically',
    ]) {
      const control = page.getByRole('switch', { name: label })
      if ((await control.getAttribute('aria-checked')) !== String(on)) await control.click()
    }
    await page.getByRole('button', { name: /^save/i }).click()
    await expect(page.getByText(/settings updated|saved/i).first()).toBeVisible({ timeout: 20_000 })
  }
  await sabotage(page, standIn(/\/admin\/store$/))
  try {
    await setSwitches(true)
    await record.shot(page, '1-switches-on')
    const store = await api.admin('get', 'store')
    record.note('server settings on', {
      auto_approve_sellers: store.auto_approve_sellers,
      auto_approve_seller_products: store.auto_approve_seller_products,
    })

    const automatic = await seller(api, 'Auto', 'met')
    await api.send('post', 'seller/onboarding/submit_for_review', {}, automatic.headers)
    const autoProduct = await product(api, automatic, 'Auto Vodka')
    await open(page, `/sellers/${automatic.id}`)
    await statusReads(page, /^approved$/i)
    await record.shot(page, '2-seller-approved-automatically')
    await open(page, `/products/${autoProduct.id}`)
    await expect(page.getByRole('heading', { name: autoProduct.name }).first()).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByRole('button', { name: /^approve$/i })).toHaveCount(0)
    await record.shot(page, '3-product-approved-automatically')
    expect((await serverSeller(automatic.id)).status).toBe('approved')
    expect((await api.admin('get', `products/${autoProduct.id}`)).status).toBe('active')

    await setSwitches(false)
    const waiting = await seller(api, 'Manual', 'met')
    await api.send('post', 'seller/onboarding/submit_for_review', {}, waiting.headers)
    const waitingProduct = await product(api, waiting, 'Manual Vodka')
    expect((await serverSeller(waiting.id)).status).toBe('ready_for_review')
    expect((await api.admin('get', `products/${waitingProduct.id}`)).status).toBe('proposed')
    await open(page, `/sellers/${waiting.id}`)
    await statusReads(page, /^ready for review$/i)
    await record.shot(page, '4-off-again-waits')
  } finally {
    await api.answer('patch', 'admin/store', {
      auto_approve_sellers: false,
      auto_approve_seller_products: false,
    })
  }
  record.save()
})

test('14. The sellers ranking and the payouts report (SD-102)', async ({ page }) => {
  const record = new Record('operator', '14-ranking-and-report')
  const owner = await seller(api, 'Ranked', 'approved')
  await api.admin('patch', `sellers/${owner.id}`, { payouts_schedule_interval: 'manual' })
  // Priced above any other sale of the run, so it ranks in the top five.
  const live = await product(api, owner, 'Reserve Whisky', { approve: true, price: '495.00' })
  const bought = await purchase(api, [live.variant])
  const order = await orderOf(api, bought.orders, owner)
  await fulfil(order.id as string)
  await earned(owner)
  await api.admin('post', `sellers/${owner.id}/payouts`, {})
  const orders = await api.rows(`admin/orders?q[seller_id_eq]=${owner.id}&limit=100`)
  const payouts = await api.rows(`admin/seller_payouts?q[seller_id_eq]=${owner.id}&limit=100`)
  record.note(
    'server orders',
    orders.map((each) => ({ number: each.number, total: each.total })),
  )
  record.note(
    'server payouts',
    payouts.map((each) => ({ amount: each.amount, status: each.status })),
  )
  await sabotage(
    page,
    altered(/\/admin\/reporting\/query$/, (body) => ({ ...body, rows: [], data: [] })),
  )

  await open(page, '')
  const tab = page.getByRole('tab', { name: 'Sellers' })
  await tab.scrollIntoViewIfNeeded()
  await tab.click()
  const rankingRow = page.locator(`a[href$="/sellers/${owner.id}"]`).filter({ hasText: owner.name })
  await expect(rankingRow).toHaveCount(1, { timeout: 20_000 })
  await rankingRow.scrollIntoViewIfNeeded()
  await record.shot(page, '1-sellers-ranking')
  record.note('ranking row', await rankingRow.textContent())
  await expect(rankingRow).toContainText(`$${order.item_total}`)
  await expect(rankingRow).toContainText(/1 unit(?!s)/)

  const reports = await api.rows('admin/reporting/saved_reports?limit=100')
  const report = reports.find((each) => each.name === 'Seller payouts') as Json
  await open(page, `/reports/${report.id}`)
  await expect(page.getByRole('heading', { name: 'Seller payouts' }).first()).toBeVisible({
    timeout: 20_000,
  })
  // The built-in report covers last month; the run's period is today.
  await page.getByRole('combobox', { name: /time range/i }).click()
  const options = page.getByRole('option')
  record.note('time ranges offered', await options.allTextContents())
  await options
    .filter({ hasText: /^today$/i })
    .first()
    .click()
  await page.waitForLoadState('networkidle')
  await record.shot(page, '2-payouts-report')
  const reportRow = listRows(page).filter({ hasText: owner.name })
  await expect(reportRow).toHaveCount(1, { timeout: 20_000 })
  record.note('report row', await reportRow.textContent())
  // Net sales are the item's price, and the seller payout what the seller earned after commission.
  await expect(reportRow).toContainText(`$${order.item_total}`)
  await expect(reportRow).toContainText(`$${payouts[0].amount}`)
  record.save()
})
