import { mkdirSync, writeFileSync } from 'node:fs'
import { type Browser, expect, type Page, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { linkIn, MAIL_DIR, mailTo, nextMail } from './mail'

const DASHBOARD = 'http://localhost:5174'
const RESULTS = new URL('./results/mail/', import.meta.url)

/**
 * The platform batch's mail check (P1): the staff flows' emails, read where
 * Spree's browser-test server writes them, and their links followed in the
 * browser. Spree's own browser tests stop where an email would be read.
 *
 * Start the stack (stack.spec.ts) with `LIQUORIFY_MAIL_DIR` set to an empty
 * folder and `SPREE_DASHBOARD_URL=http://localhost:5174`, Spree's own setting
 * for where the dashboard is, so the links point at the dashboard under test;
 * then the built dashboard on port 5174, as for compare.spec.ts. Each test adds
 * its own teammate, so the browser tests' admin keeps its password.
 */

function record(name: string, facts: Record<string, unknown>) {
  mkdirSync(RESULTS, { recursive: true })
  writeFileSync(new URL(`${name}.json`, RESULTS), `${JSON.stringify(facts, null, 2)}\n`)
}

// A link's token is a credential: the record keeps only where the link points.
const withoutToken = (link: URL) => `${link.origin}${link.pathname}${link.search ? '?token=…' : ''}`

async function acceptInvitation(browser: Browser, link: URL, password: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(link.href)
  await page.getByLabel(/first name/i).fill('Mail')
  await page.getByLabel(/last name/i).fill('Check')
  await page.getByLabel(/^password$/i).fill(password)
  await page.getByLabel(/confirm password/i).fill(password)
  await page.getByRole('button', { name: /create account & accept/i }).click()
  await expect(page).not.toHaveURL(/\/accept-invitation/, { timeout: 15_000 })
  await context.close()
}

async function invite(page: Page, storeId: string, email: string) {
  await page.goto(`/${storeId}/settings/staff`)
  await page.getByRole('button', { name: /invite teammate/i }).click()
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/role/i).click()
  await page.getByRole('option').first().click()
  await page.getByRole('button', { name: /send invitation/i }).click()
}

test.describe('Staff mail', () => {
  test.skip(!MAIL_DIR, 'Start the stack with LIQUORIFY_MAIL_DIR (see above)')

  test('FL-02: the invitation is mailed, its link accepts it, and the inviter is told', async ({
    page,
    browser,
  }) => {
    const creds = await login(page)
    const invitee = `p1-invitee-${Date.now()}@example.com`
    const inviterMessages = mailTo(creds.admin_email).length

    await invite(page, creds.store_id, invitee)

    const invitation = await nextMail(invitee, 0)
    expect(invitation.subject).toMatch(/invitation to join/i)
    const link = linkIn(invitation, /\/accept-invitation\//)
    expect(link.origin).toBe(DASHBOARD)

    await acceptInvitation(browser, link, 'p1-mail-password-123')

    const notice = await nextMail(creds.admin_email, inviterMessages)
    expect(notice.subject).toMatch(/has accepted your invitation/i)

    record('fl-02', {
      'EM-S-03': { to: 'the invitee', subject: invitation.subject, link: withoutToken(link) },
      'DA-AUTH-04': 'accepted through the mailed link, then left the acceptance page signed in',
      'EM-S-04': { to: 'the inviter', subject: notice.subject },
    })
  })

  test('FL-03: the reset email is mailed, its link saves a new password, which signs in', async ({
    page,
    browser,
  }) => {
    const creds = await login(page)
    const teammate = `p1-reset-${Date.now()}@example.com`
    await invite(page, creds.store_id, teammate)
    await acceptInvitation(
      browser,
      linkIn(await nextMail(teammate, 0), /\/accept-invitation\//),
      'p1-old-password-123',
    )

    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const resetPage = await context.newPage()
    await resetPage.goto(`${DASHBOARD}/login`)
    await resetPage.getByRole('link', { name: /forgot password/i }).click()
    await resetPage.getByLabel(/email/i).fill(teammate)
    await resetPage.getByRole('button', { name: /send reset link/i }).click()
    await expect(resetPage.getByText(/check your email/i)).toBeVisible({ timeout: 15_000 })

    const reset = await nextMail(teammate, 1)
    expect(reset.subject).toMatch(/password reset/i)
    const link = linkIn(reset, /\/reset-password\?/)
    expect(link.origin).toBe(DASHBOARD)

    await resetPage.goto(link.href)
    await resetPage.getByLabel(/^new password$/i).fill('p1-new-password-456')
    await resetPage.getByLabel(/confirm new password/i).fill('p1-new-password-456')
    await resetPage.getByRole('button', { name: /^reset password$/i }).click()
    await expect(resetPage).not.toHaveURL(/\/reset-password/, { timeout: 15_000 })
    await expect(resetPage).not.toHaveURL(/\/login/)
    // Signed in as the teammate whose password was reset, not anyone else.
    await expect(resetPage.getByText('Mail Check')).toBeVisible()
    mkdirSync(RESULTS, { recursive: true })
    await resetPage.screenshot({ path: new URL('da-auth-03-saved.png', RESULTS).pathname })
    await context.close()

    const signIn = await browser.newContext()
    const signInPage = await signIn.newPage()
    await signInPage.goto(`${DASHBOARD}/login`)
    await signInPage.getByLabel(/email/i).fill(teammate)
    await signInPage.getByLabel(/password/i).fill('p1-old-password-123')
    await signInPage.getByRole('button', { name: /^sign in$/i }).click()
    await expect(signInPage.getByText(/invalid email or password/i)).toBeVisible()
    await signInPage.getByLabel(/password/i).fill('p1-new-password-456')
    await signInPage.getByRole('button', { name: /^sign in$/i }).click()
    await expect(signInPage).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await signIn.close()

    record('fl-03', {
      'DA-AUTH-02': 'the request confirmed with "check your email"',
      'EM-S-01': { to: 'the teammate', subject: reset.subject, link: withoutToken(link) },
      'DA-AUTH-03':
        'the mailed link opened the page, the new password saved, and the page left signed in (da-auth-03-saved.png)',
      'DA-AUTH-01': 'the old password refused, then signed in again with the new one',
    })
  })
})
