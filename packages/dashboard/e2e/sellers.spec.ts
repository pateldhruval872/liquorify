import { expect, type Page, test } from '@playwright/test'
import {
  adminRequest,
  deleteSeededRecords,
  escapeRegex,
  gotoIndex,
  invitationAcceptancePath,
  login,
  openRowMenu,
  seedRecord,
} from './helpers'

const SELLERS_PATH = (storeId: string) => `/${storeId}/sellers`
const CTA = /add seller/i

/** The seller name cell is a link to the detail page, not a sheet trigger. */
function rowLink(page: Page, name: string) {
  return page.getByRole('link', { name: new RegExp(`^${escapeRegex(name)}$`) })
}

/** Scopes an Edit button to its own card — the page has more than one. */
function cardEdit(page: Page, title: RegExp) {
  return page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText(title) })
    .getByRole('button', { name: /^edit$/i })
}

/** Creating a seller lands on its profile page. */
async function createSeller(page: Page, name: string) {
  await page.getByRole('button', { name: CTA }).click()
  await expect(page.getByRole('heading', { name: /new seller/i })).toBeVisible()

  await page.locator('#name').fill(name)
  await page.getByRole('button', { name: /create seller/i }).click()

  await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 15_000 })
}

test.describe('sellers', () => {
  test.afterEach(async ({ page }) => {
    await deleteSeededRecords(page)
  })

  test('lists sellers', async ({ page }) => {
    const creds = await login(page)
    await gotoIndex(page, SELLERS_PATH(creds.store_id), CTA)
  })

  test('back from a new seller lands on the list', async ({ page }) => {
    const creds = await login(page)
    await gotoIndex(page, SELLERS_PATH(creds.store_id), CTA)

    const name = `E2E Back Seller ${Date.now()}`
    await page.getByRole('button', { name: CTA }).click()
    await page.locator('#name').fill(name)
    await page.getByRole('button', { name: /create seller/i }).click()
    await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^back$/i }).click()
    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}/sellers(?:\\?|$)`), {
      timeout: 15_000,
    })
    await expect(page.getByRole('heading', { name: /new seller/i })).toHaveCount(0)
    await expect(rowLink(page, name)).toBeVisible({ timeout: 15_000 })
  })

  // The page is a profile you read, not a form you land in.
  test('shows the profile without dropping into an edit form', async ({ page }) => {
    const creds = await login(page)
    await gotoIndex(page, SELLERS_PATH(creds.store_id), CTA)

    const name = `E2E Seller ${Date.now()}`
    await createSeller(page, name)

    await expect(page.getByText(/^pending$/i).first()).toBeVisible()
    await expect(page.getByText(/at a glance/i)).toBeVisible()
    // Nothing is editable until an Edit button is pressed.
    await expect(page.locator('#seller-name')).toHaveCount(0)
    await expect(page.locator('#minimum_payout_amount')).toHaveCount(0)

    // Nobody has been invited yet, so inviting is the only move offered. The
    // team card offers its own Invite, so this names the header's.
    await expect(page.getByRole('button', { name: /^invite$/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /^approve$/i })).toHaveCount(0)
  })

  test('shows placeholders for details the seller has not filled in', async ({ page }) => {
    const creds = await login(page)
    await gotoIndex(page, SELLERS_PATH(creds.store_id), CTA)

    await createSeller(page, `E2E Blank Seller ${Date.now()}`)

    await expect(page.getByText(/has not written a description/i)).toBeVisible()
    await expect(page.getByText(/not provided/i).first()).toBeVisible()
  })

  test('invites someone to run the seller', async ({ page }) => {
    const creds = await login(page)
    await gotoIndex(page, SELLERS_PATH(creds.store_id), CTA)

    const name = `E2E Invite Seller ${Date.now()}`
    await createSeller(page, name)

    await page
      .getByRole('button', { name: /^invite$/i })
      .first()
      .click()
    await expect(page.getByRole('heading', { name: /invite seller/i })).toBeVisible()

    await page.locator('#invite-email').fill(`seller-${Date.now()}@example.com`)
    await page.getByRole('button', { name: /send invitation/i }).click()

    await expect(page.getByText(/^invited$/i).first()).toBeVisible({ timeout: 15_000 })
    // Re-inviting stays available; a seller waiting to accept can be chased.
    await expect(page.getByRole('button', { name: /send again/i })).toBeVisible()
  })

  test('edits the profile through its sheet', async ({ page }) => {
    const creds = await login(page)
    await gotoIndex(page, SELLERS_PATH(creds.store_id), CTA)

    const name = `E2E Profile Seller ${Date.now()}`
    await createSeller(page, name)

    await page
      .getByRole('button', { name: /^edit$/i })
      .first()
      .click()
    await expect(page.getByRole('heading', { name: /edit profile/i })).toBeVisible()

    await page.locator('#seller-contact-email').fill('updated@example.com')
    await page.getByRole('button', { name: /^save$/i }).click()

    // Back to the read view, showing the new value.
    await expect(page.getByRole('heading', { name: /edit profile/i })).toHaveCount(0, {
      timeout: 15_000,
    })
    await expect(page.getByText('updated@example.com').first()).toBeVisible({ timeout: 15_000 })
  })

  test('edits the payout settings through their own sheet', async ({ page }) => {
    const creds = await login(page)
    await gotoIndex(page, SELLERS_PATH(creds.store_id), CTA)

    const name = `E2E Payout Seller ${Date.now()}`
    await createSeller(page, name)

    await cardEdit(page, /payouts and tax/i).click()
    await expect(page.getByRole('heading', { name: /edit payouts and tax/i })).toBeVisible()

    await page.locator('#payouts_schedule_interval').click()
    await page.getByRole('option', { name: /^weekly$/i }).click()
    await page.locator('#minimum_payout_amount').fill('25.0')
    await page.getByRole('button', { name: /^save$/i }).click()

    await expect(page.getByRole('heading', { name: /edit payouts and tax/i })).toHaveCount(0, {
      timeout: 15_000,
    })
    await expect(page.getByText(/^weekly$/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('25.0')).toBeVisible()
  })

  // Each sheet sends only its own fields, so saving one must not roll back
  // what the other just wrote.
  test('saving the profile leaves the payout settings alone', async ({ page }) => {
    const creds = await login(page)
    await gotoIndex(page, SELLERS_PATH(creds.store_id), CTA)

    const name = `E2E Isolation Seller ${Date.now()}`
    await createSeller(page, name)

    await cardEdit(page, /payouts and tax/i).click()
    await page.locator('#minimum_payout_amount').fill('40.0')
    await page.getByRole('button', { name: /^save$/i }).click()
    await expect(page.getByText('40.0')).toBeVisible({ timeout: 15_000 })

    await page
      .getByRole('button', { name: /^edit$/i })
      .first()
      .click()
    await page.locator('#seller-billing-email').fill('billing@example.com')
    await page.getByRole('button', { name: /^save$/i }).click()

    await page.reload()
    await expect(page.getByText('billing@example.com').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('40.0')).toBeVisible()
  })

  test('deletes a seller from the list', async ({ page }) => {
    const creds = await login(page)
    await gotoIndex(page, SELLERS_PATH(creds.store_id), CTA)

    const name = `E2E Delete Seller ${Date.now()}`
    await createSeller(page, name)

    await page.goto(SELLERS_PATH(creds.store_id))
    await expect(rowLink(page, name)).toBeVisible({ timeout: 15_000 })

    await openRowMenu(page, name)
    await page.getByRole('menuitem', { name: /^delete$/i }).click()
    await expect(page.getByRole('heading', { name: /delete seller\?/i })).toBeVisible()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^delete$/i })
      .click()

    await expect(rowLink(page, name)).toHaveCount(0, { timeout: 15_000 })
  })

  // Reading a seller's onboarding checklist changes nothing, so a teammate
  // whose role may only read sellers sees it rather than "Loading…" for good.
  test('shows the onboarding checklist to a teammate who may only read sellers', async ({
    page,
    browser,
  }) => {
    const session = await login(page)
    const stamp = Date.now()
    const requirementName = `E2E registration ${stamp}`
    const sellerName = `E2E Onboarding Seller ${stamp}`
    const viewerEmail = `e2e-seller-viewer-${stamp}@example.com`

    await seedRecord(page, session, '/seller_requirements', {
      type: 'document',
      name: requirementName,
      required: true,
    })
    const seller = await seedRecord(page, session, '/sellers', {
      name: sellerName,
      contact_email: `e2e-onboarding-seller-${stamp}@example.com`,
    })
    const role = await seedRecord(page, session, '/roles', {
      name: `e2e_seller_viewer_${stamp}`,
      permissions: ['read_sellers'],
    })
    const invitation = await adminRequest<{ id: string }>(page, session, 'post', '/invitations', {
      email: viewerEmail,
      role_id: role.id,
    })
    const acceptancePath = await invitationAcceptancePath(
      page,
      session,
      `/api/v3/admin/invitations/${invitation.id}`,
    )

    const viewerContext = await browser.newContext()
    const viewerPage = await viewerContext.newPage()
    try {
      await viewerPage.goto(acceptancePath)
      await viewerPage.getByLabel(/first name/i).fill('Seb')
      await viewerPage.getByLabel(/last name/i).fill('Viewer')
      await viewerPage.getByLabel(/^password$/i).fill('e2e-password-123')
      await viewerPage.getByLabel(/confirm password/i).fill('e2e-password-123')
      await viewerPage.getByRole('button', { name: /create account & accept/i }).click()
      await expect(viewerPage).not.toHaveURL(/\/accept-invitation/, { timeout: 15_000 })

      await viewerPage.goto(`/${session.store_id}/sellers/${seller.id}`)
      await expect(viewerPage.getByRole('heading', { name: sellerName })).toBeVisible({
        timeout: 15_000,
      })
      await expect(viewerPage.getByText(requirementName)).toBeVisible({ timeout: 15_000 })
      await expect(viewerPage.getByText(/^loading/i)).toBeHidden()
    } finally {
      await viewerContext.close()
    }
  })
})
