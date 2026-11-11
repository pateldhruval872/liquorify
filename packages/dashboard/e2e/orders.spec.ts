import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, type Page, test } from '@playwright/test'
import {
  adminRequest,
  FIXTURE_BOGUS_GATEWAY,
  FIXTURE_BOGUS_ORDER_EMAIL,
  FIXTURE_BOGUS_TRANSACTION_ID,
  FIXTURE_PROMO_PRODUCT,
  fillAddressForm,
  login,
} from './helpers'

// A PNG is in the PO document allowlist, so the shared fixture works and no
// new binary ships with the suite.
const FIXTURE_PO_DOCUMENT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures/test-image.png',
)

const ORDERS_PATH = (storeId: string) => `/${storeId}/orders`
const DRAFTS_PATH = (storeId: string) => `/${storeId}/orders/drafts`
const NEW_ORDER_PATH = (storeId: string) => `/${storeId}/orders/new`
const CTA = /new order/i

// Both orders/ and orders/drafts wrap the CTA in <Button asChild><Link/></Button>,
// so the rendered DOM element is an <a> — getByRole('link') matches it.
async function gotoOrdersIndex(page: Page, path: string) {
  await page.goto(path)
  await expect(page.getByRole('link', { name: CTA })).toBeVisible({ timeout: 15_000 })
}

test.describe('orders', () => {
  test('lists completed orders with the New Order CTA', async ({ page }) => {
    const creds = await login(page)
    await gotoOrdersIndex(page, ORDERS_PATH(creds.store_id))
  })

  test('New Order CTA on the orders list navigates to the new-order page', async ({ page }) => {
    const creds = await login(page)
    await gotoOrdersIndex(page, ORDERS_PATH(creds.store_id))

    await page.getByRole('link', { name: CTA }).click()
    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/new$`), { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: CTA })).toBeVisible()
  })
})

test.describe('draft orders', () => {
  test('lists drafts with the New Order CTA', async ({ page }) => {
    const creds = await login(page)
    await gotoOrdersIndex(page, DRAFTS_PATH(creds.store_id))
  })

  // Regression: the drafts page rendered the CTA as a bare <Button> with no
  // <Link>, so clicking did nothing. Confirms the navigation now matches the
  // completed-orders list.
  test('New Order CTA on the drafts list navigates to the new-order page', async ({ page }) => {
    const creds = await login(page)
    await gotoOrdersIndex(page, DRAFTS_PATH(creds.store_id))

    await page.getByRole('link', { name: CTA }).click()
    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/new$`), { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: CTA })).toBeVisible()
  })
})

async function fillNewOrderForm(page: Page, email: string) {
  // Skip the customer combobox and use the email-only path — the form
  // accepts either, and an email-only payload is the minimum the backend
  // service needs (no addresses required for a draft).
  await page.locator('#order-email').fill(email)

  // Variant typeahead is a combobox: results are `role="option"`, so they are
  // reachable by keyboard as well as click.
  await page.getByPlaceholder(/search variant/i).fill(FIXTURE_PROMO_PRODUCT)
  await page
    .getByRole('option', { name: new RegExp(FIXTURE_PROMO_PRODUCT, 'i') })
    .first()
    .click()
}

test.describe('new order', () => {
  test('creates a draft order with email + variant and lands on the detail page', async ({
    page,
  }) => {
    const creds = await login(page)
    await page.goto(NEW_ORDER_PATH(creds.store_id))
    await expect(page.getByRole('heading', { name: CTA })).toBeVisible({ timeout: 15_000 })

    const email = `e2e-order-${Date.now()}@example.com`
    await fillNewOrderForm(page, email)

    // Submit button shares the "New Order" label with the back-button on the
    // sidebar; scope by type=submit so the locator is unambiguous.
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/or_[^/]+$`), {
      timeout: 15_000,
    })
  })

  // The motivating case for this form: a purchase order arrives by email and
  // the merchant keys the order in, reference and paperwork together.
  test('carries a PO number and its document onto the created order', async ({ page }) => {
    const creds = await login(page)
    await page.goto(NEW_ORDER_PATH(creds.store_id))
    await expect(page.getByRole('heading', { name: CTA })).toBeVisible({ timeout: 15_000 })

    const email = `e2e-po-${Date.now()}@example.com`
    const poNumber = `PO-${Date.now()}`
    await fillNewOrderForm(page, email)

    await page.locator('#po-number').fill(poNumber)
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_PO_DOCUMENT)

    // Wait for the upload itself, not for the filename — the field shows the
    // name the moment the file is picked, while the signed id it saves does
    // not exist until the upload resolves. Submit is disabled meanwhile, so
    // the button coming back is the real signal.
    const submit = page.locator('button[type="submit"]')
    await expect(page.getByText(/uploading/i)).toBeHidden({ timeout: 30_000 })
    await expect(submit).toBeEnabled({ timeout: 30_000 })

    await submit.click()

    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/or_[^/]+$`), {
      timeout: 15_000,
    })

    const poCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.locator('[data-slot="card-title"]', { hasText: /^Purchase order$/ }) })
    await expect(poCard.getByText(poNumber)).toBeVisible({ timeout: 15_000 })
    await expect(poCard.getByRole('button', { name: /test-image\.png/i })).toBeVisible()
  })

  test('newly-created draft shows up in the drafts list', async ({ page }) => {
    const creds = await login(page)
    await page.goto(NEW_ORDER_PATH(creds.store_id))
    await expect(page.getByRole('heading', { name: CTA })).toBeVisible({ timeout: 15_000 })

    const email = `e2e-drafts-${Date.now()}@example.com`
    await fillNewOrderForm(page, email)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/or_[^/]+$`), {
      timeout: 15_000,
    })

    // Pull the order number from the H1 (PageHeader renders it as a top-level
    // heading on the order detail page) so we can find the matching row.
    const heading = await page.getByRole('heading', { level: 1 }).first().textContent()
    const numberMatch = heading?.match(/R\d+/)
    expect(numberMatch).toBeTruthy()
    const number = numberMatch?.[0] as string

    await page.goto(DRAFTS_PATH(creds.store_id))
    await expect(page.getByText(`#${number}`)).toBeVisible({ timeout: 15_000 })
  })

  test('deletes a draft order from its actions menu', async ({ page }) => {
    const creds = await login(page)
    await page.goto(NEW_ORDER_PATH(creds.store_id))
    await expect(page.getByRole('heading', { name: CTA })).toBeVisible({ timeout: 15_000 })

    const email = `e2e-draft-delete-${Date.now()}@example.com`
    await fillNewOrderForm(page, email)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/or_[^/]+$`), {
      timeout: 15_000,
    })

    const heading = await page.getByRole('heading', { level: 1 }).first().textContent()
    const number = heading?.match(/R\d+/)?.[0] as string
    expect(number).toBeTruthy()

    await page.getByRole('button', { name: /more actions/i }).click()
    await expect(page.getByRole('menuitem', { name: /cancel order/i })).toHaveCount(0)
    await page.getByRole('menuitem', { name: /^delete$/i }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^delete$/i })
      .click()

    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/drafts`), {
      timeout: 15_000,
    })
    // Wait for the list itself before reading absence, so an empty page mid-load
    // cannot pass for a deleted draft.
    await expect(page.getByRole('link', { name: CTA })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(`#${number}`)).toHaveCount(0)
  })

  test("gives a gift card's balance back when the draft it was applied to is deleted", async ({
    page,
  }) => {
    const creds = await login(page)
    const code = `E2E-DRAFT-CARD-${Date.now()}`
    await adminRequest(page, creds, 'post', '/gift_cards', {
      code,
      amount: '1.00',
      currency: 'USD',
    })

    await page.goto(NEW_ORDER_PATH(creds.store_id))
    await expect(page.getByRole('heading', { name: CTA })).toBeVisible({ timeout: 15_000 })
    await fillNewOrderForm(page, `e2e-draft-card-${Date.now()}@example.com`)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/or_[^/]+$`), {
      timeout: 15_000,
    })

    const discounts = page
      .locator('[data-slot="card"]')
      .filter({
        has: page.locator('[data-slot="card-title"]', { hasText: /^discounts & credit$/i }),
      })
      .first()
    await discounts
      .getByRole('button', { name: /^apply$/i })
      .last()
      .click()
    await page.getByRole('dialog').locator('#gift-card-code').fill(code)
    await page.getByRole('dialog').getByRole('button', { name: /^add$/i }).click()
    await expect(discounts.getByText(new RegExp(code, 'i'))).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /more actions/i }).click()
    await page.getByRole('menuitem', { name: /^delete$/i }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^delete$/i })
      .click()
    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/drafts`), {
      timeout: 15_000,
    })

    // Columns read Amount, Used, Remaining: nothing used, the whole dollar left.
    await page.goto(`/${creds.store_id}/loyalty/gift-cards`)
    await page
      .getByPlaceholder(/search/i)
      .first()
      .fill(code)
    const row = page.getByRole('row').filter({ hasText: new RegExp(code, 'i') })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await expect(row).toContainText(/\$1\.00.*\$0\.00.*\$1\.00/)
  })
})

test.describe('order gift cards', () => {
  test('says why a gift card code was refused, then applies a valid one', async ({ page }) => {
    const creds = await login(page)
    const stamp = Date.now()
    const euroCode = `E2E-EURO-CARD-${stamp}`
    const validCode = `E2E-VALID-CARD-${stamp}`
    await adminRequest(page, creds, 'post', '/gift_cards', {
      code: euroCode,
      amount: '1.00',
      currency: 'EUR',
    })
    await adminRequest(page, creds, 'post', '/gift_cards', {
      code: validCode,
      amount: '1.00',
      currency: 'USD',
    })

    await page.goto(NEW_ORDER_PATH(creds.store_id))
    await expect(page.getByRole('heading', { name: CTA })).toBeVisible({ timeout: 15_000 })
    await fillNewOrderForm(page, `e2e-card-refused-${stamp}@example.com`)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/or_[^/]+$`), {
      timeout: 15_000,
    })

    const discounts = page
      .locator('[data-slot="card"]')
      .filter({
        has: page.locator('[data-slot="card-title"]', { hasText: /^discounts & credit$/i }),
      })
      .first()
    await discounts
      .getByRole('button', { name: /^apply$/i })
      .last()
      .click()
    const dialog = page.getByRole('dialog')

    await dialog.locator('#gift-card-code').fill(`E2E-NO-SUCH-CARD-${stamp}`)
    await dialog.getByRole('button', { name: /^add$/i }).click()
    await expect(dialog.getByRole('alert')).toHaveText('The Gift Card was not found.')

    await dialog.locator('#gift-card-code').fill(euroCode)
    await dialog.getByRole('button', { name: /^add$/i }).click()
    await expect(dialog.getByRole('alert')).toHaveText(
      'Gift Card cannot be applied with current currency.',
    )

    await dialog.locator('#gift-card-code').fill(validCode)
    await dialog.getByRole('button', { name: /^add$/i }).click()
    await expect(dialog).toHaveCount(0)
    await expect(discounts.getByText(new RegExp(validCode, 'i'))).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('order summary', () => {
  test('counts a promotion once beside a fee, so the rows add up to the total', async ({
    page,
  }) => {
    const creds = await login(page)
    const stamp = Date.now()
    const code = `e2esummary${stamp}`
    await adminRequest(page, creds, 'post', '/promotions', {
      name: `E2E summary promotion ${stamp}`,
      kind: 'coupon_code',
      code,
      starts_at: new Date(stamp - 86_400_000).toISOString(),
      actions: [
        {
          type: 'create_adjustment',
          calculator: { type: 'flat_rate', preferences: { amount: '6.00' } },
        },
      ],
    })

    await page.goto(NEW_ORDER_PATH(creds.store_id))
    await expect(page.getByRole('heading', { name: CTA })).toBeVisible({ timeout: 15_000 })
    await fillNewOrderForm(page, `e2e-summary-${stamp}@example.com`)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/or_[^/]+$`), {
      timeout: 15_000,
    })

    const cardTitled = (title: RegExp) =>
      page
        .locator('[data-slot="card"]')
        .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
        .first()

    const discounts = cardTitled(/^discounts & credit$/i)
    await discounts
      .getByRole('button', { name: /^apply$/i })
      .first()
      .click()
    await page.getByRole('dialog').locator('#coupon-code').fill(code)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^apply$/i })
      .click()
    await expect(discounts.getByText(code)).toBeVisible({ timeout: 15_000 })

    const fees = cardTitled(/^fees$/i)
    await fees.getByRole('button', { name: /add fee/i }).click()
    await page
      .getByRole('dialog')
      .getByLabel(/^label$/i)
      .fill('E2E gift wrap')
    await page
      .getByRole('dialog')
      .getByLabel(/^amount$/i)
      .fill('4.50')
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^add fee$/i })
      .click()
    await expect(fees.getByText('E2E gift wrap')).toBeVisible({ timeout: 15_000 })

    const summary = cardTitled(/^summary$/i)
    const row = (label: string) =>
      summary
        .locator('div')
        .filter({ has: page.getByText(label, { exact: true }) })
        .last()
    await expect(row('Promotions')).toContainText('-$6.00')
    // Adjustments holds only what has no row of its own: here, the fee.
    await expect(row('Adjustments')).toContainText('$4.50')
    await expect(row('Adjustments')).not.toContainText('-$1.50')
  })
})

test.describe('order editing', () => {
  // Editing is a detour from the order, so saving hands the merchant back the
  // view that shows what the edit did rather than leaving them on the form.
  test('returns to the order view after saving', async ({ page }) => {
    const creds = await login(page)
    await page.goto(NEW_ORDER_PATH(creds.store_id))
    await expect(page.getByRole('heading', { name: CTA })).toBeVisible({ timeout: 15_000 })

    await fillNewOrderForm(page, `e2e-order-edit-${Date.now()}@example.com`)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/or_[^/]+$`), {
      timeout: 15_000,
    })

    const orderUrl = page.url()
    await page.goto(`${orderUrl}/edit`)
    await expect(page.getByRole('heading', { name: /edit order/i })).toBeVisible({
      timeout: 15_000,
    })

    // Changing a quantity is the smallest edit that dirties the form.
    const quantity = page.locator('input[type="number"]').first()
    await expect(quantity).toBeVisible({ timeout: 15_000 })
    await quantity.fill('2')

    await page.getByRole('button', { name: /^save$/i }).click()

    await expect(page).toHaveURL(orderUrl, { timeout: 15_000 })
  })

  // Draft orders take a negotiated unit price: editing it stamps the line
  // manual server-side, and coming back to the form shows the marker with
  // the reset-to-catalog action beside it.
  test('sets a negotiated unit price on a draft order line', async ({ page }) => {
    const creds = await login(page)
    await page.goto(NEW_ORDER_PATH(creds.store_id))
    await expect(page.getByRole('heading', { name: CTA })).toBeVisible({ timeout: 15_000 })

    await fillNewOrderForm(page, `e2e-order-price-${Date.now()}@example.com`)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/or_[^/]+$`), {
      timeout: 15_000,
    })

    const orderUrl = page.url()
    await page.goto(`${orderUrl}/edit`)
    await expect(page.getByRole('heading', { name: /edit order/i })).toBeVisible({
      timeout: 15_000,
    })

    const price = page.getByLabel(/unit price for/i).first()
    await expect(price).toBeVisible({ timeout: 15_000 })
    await price.fill('7.20')

    await page.getByRole('button', { name: /^save$/i }).click()
    await expect(page).toHaveURL(orderUrl, { timeout: 15_000 })

    await page.goto(`${orderUrl}/edit`)
    await expect(page.getByLabel(/unit price for/i).first()).toHaveValue(/^7\.20?$/, {
      timeout: 15_000,
    })
    await expect(page.getByText(/^negotiated$/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /reset .* to catalog price/i })).toBeVisible()
  })
})

test.describe('order addresses', () => {
  // Regression: the dashboard sent `shipping_address` while the API permitted
  // only `ship_address`, so the request succeeded and the address never
  // changed. Asserting on the rendered card is what catches that — the
  // mutation itself resolved happily throughout.
  test('saves an edited shipping address onto the order', async ({ page }) => {
    const creds = await login(page)
    await page.goto(NEW_ORDER_PATH(creds.store_id))
    await expect(page.getByRole('heading', { name: CTA })).toBeVisible({ timeout: 15_000 })

    await fillNewOrderForm(page, `e2e-order-address-${Date.now()}@example.com`)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/orders/or_[^/]+$`), {
      timeout: 15_000,
    })

    // Several cards on the order page carry an Actions menu, so reach the
    // customer card's through the heading that names it.
    const customerCard = page.locator('[data-slot="card"]').filter({
      has: page.locator('[data-slot="card-title"]', { hasText: /^Customer$/ }),
    })
    await customerCard.getByRole('button', { name: /actions/i }).click()
    await page.getByRole('menuitem', { name: /edit shipping address/i }).click()

    // Named, because the country and state comboboxes inside the sheet are
    // themselves dialogs.
    const dialog = page.getByRole('dialog', { name: /edit shipping address/i })
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    const street = `${Date.now()} Vine Street`
    await fillAddressForm(page, {
      firstName: 'Ada',
      lastName: 'Lovelace',
      address1: street,
      city: 'Brooklyn',
      postalCode: '11201',
      phone: '555-0142',
      country: 'United States',
      state: 'New York',
    })

    await dialog.getByRole('button', { name: /^save$/i }).click()

    await expect(dialog).toBeHidden({ timeout: 15_000 })
    await expect(page.getByText(street)).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('order tags', () => {
  async function createDraft(page: Page, storeId: string, email: string) {
    await page.goto(NEW_ORDER_PATH(storeId))
    await expect(page.getByRole('heading', { name: CTA })).toBeVisible({ timeout: 15_000 })
    await fillNewOrderForm(page, email)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(new RegExp(`/${storeId}/orders/or_[^/]+$`), { timeout: 15_000 })
  }

  function tagsCard(page: Page) {
    return page
      .locator('[data-slot="card"]')
      .filter({ has: page.locator('[data-slot="card-title"]', { hasText: /^tags$/i }) })
  }

  // The order tag vocabulary is fetched by its short name (`order`); a tag
  // saved on one order is offered as an existing tag on the next.
  test('tags an order and offers the tag on another order', async ({ page }) => {
    const creds = await login(page)
    const suffix = Date.now()
    const tagName = `e2e-order-tag-${suffix}`

    await createDraft(page, creds.store_id, `e2e-order-tag-a-${suffix}@example.com`)
    await tagsCard(page)
      .getByRole('button', { name: /^edit$/i })
      .click()
    const input = tagsCard(page).getByPlaceholder(/type to add tags/i)
    await input.fill(tagName)
    await input.press('Enter')
    await tagsCard(page)
      .getByRole('button', { name: /^save$/i })
      .click()
    await expect(tagsCard(page).getByText(tagName, { exact: true })).toBeVisible({
      timeout: 15_000,
    })
    await expect(tagsCard(page).getByPlaceholder(/type to add tags/i)).toHaveCount(0)

    await createDraft(page, creds.store_id, `e2e-order-tag-b-${suffix}@example.com`)
    await tagsCard(page)
      .getByRole('button', { name: /^edit$/i })
      .click()
    await tagsCard(page)
      .getByPlaceholder(/type to add tags/i)
      .fill(tagName)
    await expect(page.getByRole('option', { name: tagName, exact: true })).toBeVisible({
      timeout: 15_000,
    })
  })
})

test.describe('order payments', () => {
  test("links a card payment to its page at the gateway's dashboard", async ({ page }) => {
    const creds = await login(page)
    const orders = await adminRequest<{ data: { id: string }[] }>(
      page,
      { ...creds, store_id: creds.comma_store_id },
      'get',
      `/orders?q[email_eq]=${encodeURIComponent(FIXTURE_BOGUS_ORDER_EMAIL)}`,
    )
    await page.goto(`/${creds.comma_store_id}/orders/${orders.data[0].id}`)

    await page
      .locator('tr')
      .filter({ hasText: FIXTURE_BOGUS_GATEWAY })
      .getByRole('button', { name: /^actions$/i })
      .click({ timeout: 15_000 })

    const link = page.getByRole('menuitem', { name: `View at ${FIXTURE_BOGUS_GATEWAY}` })
    await expect(link).toHaveAttribute(
      'href',
      `https://dashboard.bogus.example/payments/${FIXTURE_BOGUS_TRANSACTION_ID}`,
    )
    await expect(link).toHaveAttribute('target', '_blank')
  })

  test("shows a card payment's checks and captures", async ({ page }) => {
    const creds = await login(page)
    const orders = await adminRequest<{ data: { id: string }[] }>(
      page,
      { ...creds, store_id: creds.comma_store_id },
      'get',
      `/orders?q[email_eq]=${encodeURIComponent(FIXTURE_BOGUS_ORDER_EMAIL)}`,
    )
    await page.goto(`/${creds.comma_store_id}/orders/${orders.data[0].id}`)

    const row = page.locator('tr').filter({ hasText: FIXTURE_BOGUS_GATEWAY })
    await expect(row.getByText('Failed card checks')).toBeVisible({ timeout: 15_000 })

    await row.getByRole('button', { name: /^actions$/i }).click()
    await page.getByRole('menuitem', { name: 'View details' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText(FIXTURE_BOGUS_TRANSACTION_ID)).toBeVisible()
    await expect(dialog.getByText('Did not pass')).toHaveCount(2)
    await expect(dialog.getByText('CVV does not match')).toBeVisible()
    await expect(dialog.getByRole('row').filter({ hasText: '€10.00' })).toBeVisible()
  })
})
