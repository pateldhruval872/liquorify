import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Frame, type FrameLocator, type Page, test } from '@playwright/test'
import { ratedProduct, removeWebhookEndpoints, type Stripe, stripe, stripeMethod } from './p4'
import { revision, seeded, stamp } from './p9'
import { methodsFor } from './p11-orders'

/**
 * The platform batch's step P4, part 2: Stripe on the storefront (checks 4.6
 * to 4.10 of the work item), against Stripe's test mode.
 *
 * The storefront is built for production against the provider server and
 * served on port 3001 (`STOREFRONT_URL`), with that server's publishable key
 * and Stripe's test publishable key, so its payment form is Stripe's own.
 * The server's Stripe settings carry placeholder keys, which the environment's
 * proxy replaces. The scripts drive the storefront the way a shopper does, as
 * the storefront's own checkout test does, and keep its waits for hydration
 * and for Stripe's form remounting.
 *
 * Results go to `results/p4/storefront-stripe/`. Keys are never written out.
 */

const storefront = process.env.STOREFRONT_URL ?? 'http://localhost:3001'
const base = `${storefront}/us/en`
const results = new URL('./results/p4/storefront-stripe/', import.meta.url).pathname
const label = 'Storefront'
const ground = methodsFor(`P4 ${label}`).ground
const PASSWORD = 'p4-Storefront-123!'
let stripeApi: Stripe
let methodId: string
let methodName: string
let productSlug: string

function save(name: string, data: object) {
  mkdirSync(results, { recursive: true })
  writeFileSync(
    `${results}${name}.json`,
    `${JSON.stringify({ revision, stamp, ...data }, null, 2)}\n`,
  )
}

async function snap(page: Page, name: string) {
  mkdirSync(results, { recursive: true })
  await page.screenshot({ path: `${results}${name}.png`, fullPage: true })
}

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')


test.beforeAll(async ({ baseURL }) => {
  stripeApi = await stripe()
  const seededShop = await seeded(baseURL, async (seed) => {
    const method = await stripeMethod(seed, label)
    const shop = await ratedProduct(seed, label, baseURL as string)
    const product = await seed.get<{ slug: string }>(`products/${shop.product.productId}`)
    return { method, slug: product.slug }
  })
  methodId = seededShop.method.id
  methodName = seededShop.method.name
  productSlug = seededShop.slug
})

test.afterAll(async ({ baseURL }) => {
  const removed = await removeWebhookEndpoints(stripeApi, methodId)
  await seeded(baseURL, (seed) =>
    seed.api.delete(`/api/v3/admin/payment_methods/${methodId}`, { headers: seed.headers }),
  )
  save('clean-up', { removedWebhookEndpoints: removed.length, paymentMethods: 1 })
  await stripeApi.dispose()
})

/** Adds the run's product to the cart from its page and opens checkout. */
async function toCheckout(page: Page) {
  await page.goto(`${base}/products/${productSlug}`)
  const addToCart = page.getByRole('button', { name: /add to cart/i })
  await expect(addToCart).toBeEnabled({ timeout: 30_000 })
  const cartButton = page.getByRole('button', { name: /open cart/i })
  const drawerCheckout = page.getByRole('dialog').getByRole('link', { name: /^checkout$/i })
  let href: string | null = null
  await expect(async () => {
    if (!(await drawerCheckout.count())) {
      const badge = (await cartButton.textContent({ timeout: 3_000 })) ?? ''
      if (/\d/.test(badge)) await cartButton.click({ timeout: 3_000 })
      else await addToCart.click({ timeout: 3_000 })
    }
    await expect(drawerCheckout).toBeVisible({ timeout: 5_000 })
    href = await drawerCheckout.getAttribute('href', { timeout: 3_000 })
    if (!href) throw new Error('the drawer’s checkout link has no address')
  }).toPass({ timeout: 45_000 })
  await page.goto(new URL(href as unknown as string, storefront).toString())
}

/** Fills the shipping address, chooses Ground and then Stripe. */
async function addressAndRate(page: Page, email?: string) {
  const emailField = page.getByPlaceholder(/email address/i)
  if (email) {
    await expect(emailField).toHaveCount(1, { timeout: 20_000 })
    await emailField.fill(email)
  }
  await page.getByLabel(/country/i).selectOption({ label: 'United States' })
  await page
    .getByLabel(/first name/i)
    .first()
    .fill('River')
  await page
    .getByLabel(/last name/i)
    .first()
    .fill('Okafor')
  await page
    .getByLabel(/^address$/i)
    .first()
    .fill('214 Larkspur Lane')
  await page.getByLabel(/city/i).first().fill('Portland')
  await page
    .getByLabel(/zip|postal/i)
    .first()
    .fill('97205')
  await page.getByLabel(/phone/i).first().fill('5035550142')
  await page.getByLabel(/state/i).first().selectOption({ label: 'Oregon' })
  await page.getByRole('heading', { name: /shipping method/i }).click()
  const rate = page.getByRole('radio', { name: new RegExp(escaped(ground)) })
  await expect(rate).toBeVisible({ timeout: 30_000 })
  await rate.check()
  const stripeChoice = page.getByRole('radio', { name: methodName })
  await expect(stripeChoice).toBeVisible({ timeout: 30_000 })
  await stripeChoice.check()
}

async function cardFrame(page: Page): Promise<FrameLocator> {
  const frames = page.locator('iframe[title="Secure payment input frame"]')
  for (let index = 0; index < (await frames.count()); index++) {
    const frame = frames.nth(index).contentFrame()
    if (await frame.getByRole('textbox', { name: 'Card number' }).count()) return frame
  }
  throw new Error('Stripe’s card form has not rendered yet')
}

/** Fills Stripe's card form, accepting only values that survive a remount. */
async function fillCard(page: Page, number: string) {
  await expect(async () => {
    const frame = await cardFrame(page)
    const cardNumber = frame.getByRole('textbox', { name: 'Card number' })
    await cardNumber.fill(number, { timeout: 10_000 })
    const expiry = frame.getByPlaceholder('MM / YY')
    await expiry.fill('12 / 30', { timeout: 10_000 })
    const cvc = frame.getByRole('textbox', { name: 'Security code' })
    await cvc.fill('123', { timeout: 10_000 })
    const zip = frame.getByRole('textbox', { name: /zip code/i })
    if (await zip.count()) await zip.fill('97205', { timeout: 10_000 })
    await page.waitForTimeout(1_500)
    await expect(cardNumber).toHaveValue(new RegExp(number.slice(-4)), { timeout: 2_000 })
    await expect(cvc).toHaveValue('123', { timeout: 2_000 })
  }).toPass({ timeout: 60_000 })
}

const payNow = (page: Page) => page.getByRole('button', { name: /pay now|place order/i })

/**
 * Agrees to the policies and pays, until `answered` sees Stripe's answer. As
 * in the storefront's own test, the payment form can remount between the fill
 * and the click and empty itself, so the fill is checked again and the click
 * repeated while nothing has answered.
 */
async function agreeAndPay(page: Page, number: string, answered: () => Promise<boolean>) {
  const agree = page.getByRole('checkbox', { name: /i agree/i })
  if ((await agree.count()) && !(await agree.isChecked())) await agree.check()
  const settled = async () => (await answered()) || (await refused(page)) !== null
  await expect(async () => {
    if (await settled()) return
    await fillCard(page, number)
    await payNow(page).click({ timeout: 10_000 })
    await expect.poll(settled, { timeout: 30_000 }).toBe(true)
  }).toPass({ timeout: 180_000, intervals: [1_000] })
}

/**
 * Stripe's refusal of the browser's own request, as the payment form shows it.
 * The environment's proxy puts the secret key on every request to Stripe,
 * the browser's too, and Stripe refuses a parameter only a publishable key may
 * send. Recorded so a run that meets it says so.
 */
async function refused(page: Page): Promise<string | null> {
  const message = page.getByText(/Received unknown parameter/).first()
  return (await message.isVisible()) ? (await message.innerText()).trim() : null
}

const placed = (page: Page) => async () => /\/order-placed\//.test(page.url())

/** The frame holding Stripe's test 3-D Secure page, if it has opened. */
async function challengeFrame(page: Page): Promise<Frame | undefined> {
  for (const frame of page.frames()) {
    if (
      await frame
        .locator('#test-source-authorize-3ds')
        .count()
        .catch(() => 0)
    )
      return frame
  }
  return undefined
}

async function orderPlaced(page: Page) {
  await page.waitForURL(/\/order-placed\//, { timeout: 90_000 })
  await expect(page.getByText(/order #/i)).toBeVisible({ timeout: 30_000 })
}

async function failed(page: Page, name: string, work: () => Promise<void>) {
  try {
    await work()
  } catch (error) {
    await snap(page, `${name}-failed`).catch(() => undefined)
    throw error
  }
}

test('4.6 paying with 4242 places the order, paid by card', async ({ page }) => {
  test.setTimeout(300_000)
  await failed(page, '4.6', async () => {
    await toCheckout(page)
    await addressAndRate(page, `p4-sf-46-${stamp}@example.com`)
    await fillCard(page, '4242424242424242')
    const frameShown =
      (await page.locator('iframe[title="Secure payment input frame"]').count()) > 0
    await snap(page, '4.6-payment-form')
    await agreeAndPay(page, '4242424242424242', placed(page))
    const refusal = await refused(page)
    if (!refusal) await orderPlaced(page)
    const paidByCard = !refusal && (await page.getByText(/4242/).first().isVisible())
    await snap(page, '4.6-order-placed')
    save('4.6', {
      refusedByStripe: refusal,
      frameShown,
      url: page.url().replace(storefront, ''),
      paidByCard,
    })
    expect(frameShown, "Stripe's payment form in its frame").toBe(true)
    expect(refusal, "Stripe accepts the browser's payment").toBeNull()
    expect(paidByCard, 'the order placed page shows the card it was paid by').toBe(true)
  })
})

test('4.7 a declined card stays on the payment step', async ({ page }) => {
  test.setTimeout(300_000)
  await failed(page, '4.7', async () => {
    await toCheckout(page)
    await addressAndRate(page, `p4-sf-47-${stamp}@example.com`)
    const declinedOnPage = page.getByText(/declined/i).first()
    const declined = async () => {
      if (await declinedOnPage.isVisible()) return true
      const frame = await cardFrame(page).catch(() => undefined)
      return frame
        ? frame
            .getByText(/declined/i)
            .first()
            .isVisible()
        : false
    }
    const shown = await agreeAndPay(
      page,
      '4000000000000002',
      async () => (await declined()) || (await placed(page)()),
    )
      .then(declined)
      .catch(() => false)
    const message = (await declinedOnPage.isVisible())
      ? (await declinedOnPage.innerText()).slice(0, 200)
      : null
    await snap(page, '4.7-declined')
    const url = page.url().replace(storefront, '')
    save('4.7', { refusedByStripe: await refused(page), declineShown: shown, message, url })
    expect(shown, "Stripe's decline message").toBe(true)
    expect(url, 'still on checkout').toMatch(/\/checkout\//)
    await expect(payNow(page)).toBeVisible()
  })
})

test('4.8 a 3-D Secure check, completed and then failed', async ({ page }) => {
  test.setTimeout(480_000)
  const seen: Record<string, unknown> = {}
  const confirmPage: string[] = []
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame() && /\/confirm-payment\//.test(frame.url()))
      confirmPage.push(frame.url().replace(storefront, '').split('?')[0])
  })
  const opened = async () => (await challengeFrame(page)) !== undefined

  await failed(page, '4.8', async () => {
    await toCheckout(page)
    await addressAndRate(page, `p4-sf-48a-${stamp}@example.com`)
    await agreeAndPay(page, '4000002500003155', opened)
    await snap(page, '4.8-check-opened')
    const refusal = await refused(page)
    if (refusal) save('4.8', { refusedByStripe: refusal })
    expect(refusal, "Stripe accepts the browser's payment").toBeNull()
    await (await challengeFrame(page))?.locator('#test-source-authorize-3ds').click()
    const completedPlaced = await page
      .waitForURL(/\/order-placed\//, { timeout: 90_000 })
      .then(() => true)
      .catch(() => false)
    seen.completed = {
      confirmPage,
      placed: completedPlaced,
      url: page.url().replace(storefront, ''),
    }
    await snap(page, '4.8-completed')

    await page.context().clearCookies()
    await toCheckout(page)
    await addressAndRate(page, `p4-sf-48b-${stamp}@example.com`)
    await agreeAndPay(page, '4000002500003155', opened)
    await (await challengeFrame(page))?.locator('#test-source-fail-3ds').click()
    const error = page.getByText(/authenticat|unable|error|declined/i).first()
    const errorShown = await error
      .waitFor({ state: 'visible', timeout: 60_000 })
      .then(() => true)
      .catch(() => false)
    await snap(page, '4.8-failed-check')
    seen.failed = {
      errorShown,
      error: errorShown ? (await error.innerText()).slice(0, 200) : null,
      url: page.url().replace(storefront, '').split('?')[0],
    }
    save('4.8', { refusedByStripe: await refused(page), ...seen })
    expect(completedPlaced, 'completing the check places the order').toBe(true)
    expect(errorShown, 'failing the check shows the error').toBe(true)
    expect((seen.failed as { url: string }).url, 'back on checkout').toMatch(/\/checkout\//)
  })
})

test('4.9 the express checkout area', async ({ page }) => {
  test.setTimeout(240_000)
  const offered: string[] = []
  page.on('console', (message) => {
    if (message.text().includes('[ExpressCheckout] availablePaymentMethods'))
      offered.push(message.text())
  })
  await toCheckout(page)
  await page.waitForTimeout(10_000)
  const expressFrames = await page
    .locator('iframe[src*="express-checkout"], iframe[name*="express"], iframe[title*="xpress"]')
    .count()
  await snap(page, '4.9-express-checkout')
  save('4.9', { availablePaymentMethods: offered, expressFrames })
  // If headless Chromium offers no wallet and no Link, no button can render
  // and the check is BLOCKED; it fails here with that recorded.
  expect(expressFrames, 'a Stripe express checkout button').toBeGreaterThan(0)
})

test('4.10 a signed-in shopper saves a card, sees it listed, then removes it', async ({ page }) => {
  test.setTimeout(360_000)
  const email = `p4-sf-410-${stamp}@example.com`
  await page.goto(`${base}/account/register`)
  const create = page.getByRole('button', { name: 'Create Account' })
  await expect(create).toBeVisible({ timeout: 30_000 })
  await page.waitForTimeout(2_000)
  await page.getByRole('textbox', { name: 'First name' }).fill('River')
  await page.getByRole('textbox', { name: 'Last name' }).fill('Okafor')
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD)
  await page.getByRole('textbox', { name: 'Confirm Password' }).fill(PASSWORD)
  await page.getByRole('checkbox', { name: /i agree/i }).check()
  await create.click()
  await expect(page.getByRole('heading', { name: 'Account Overview' })).toBeVisible({
    timeout: 30_000,
  })

  await toCheckout(page)
  await addressAndRate(page)
  await agreeAndPay(page, '4242424242424242', placed(page))
  const refusal = await refused(page)
  if (refusal) {
    await snap(page, '4.10-refused')
    save('4.10', { refusedByStripe: refusal })
  }
  expect(refusal, "Stripe accepts the browser's payment").toBeNull()
  await orderPlaced(page)

  await page.goto(`${base}/account/credit-cards`)
  const listed = page.getByText(/ending in 4242/)
  const cardShown = await listed
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 })
    .then(() => true)
    .catch(() => false)
  const cardText = cardShown ? await listed.first().innerText() : null
  await snap(page, '4.10-cards-listed')

  let confirmationShown = false
  let goneAfterReload = false
  if (cardShown) {
    await page.getByRole('button', { name: 'Remove', exact: true }).first().click()
    const confirm = page.getByRole('alertdialog')
    confirmationShown = await confirm
      .getByText('Remove payment method?')
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false)
    await snap(page, '4.10-remove-confirmation')
    await confirm.getByRole('button', { name: 'Remove', exact: true }).click()
    await expect(confirm).toBeHidden({ timeout: 15_000 })
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Payment Methods' })).toBeVisible({
      timeout: 30_000,
    })
    goneAfterReload = (await page.getByText(/ending in 4242/).count()) === 0
    await snap(page, '4.10-after-reload')
  }

  save('4.10', { refusedByStripe: null, cardShown, cardText, confirmationShown, goneAfterReload })
  expect(cardShown, 'the card listed with its last four digits').toBe(true)
  expect(cardText, 'listed with its brand (SD-1 if not)').toMatch(
    /^(Visa|Mastercard|American Express|Discover)/i,
  )
  expect(confirmationShown, 'the removal asks for confirmation').toBe(true)
  expect(goneAfterReload, 'gone after a reload').toBe(true)
})
