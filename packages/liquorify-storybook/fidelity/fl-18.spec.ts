import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { type APIRequestContext, expect, type Page, test } from '@playwright/test'
import { MAIL_DIR } from './mail'
import type { AdminCredentials } from './staff'

/**
 * FL-18 and the email rows of §2.4 on the emails gem's test app (batch 11,
 * criteria 15 to 17), through the same built dashboard served on
 * `FIDELITY_EMAILS_URL`, as screens-batch-11.spec.ts opens it. Start that app
 * with emails-stack.spec.ts and `LIQUORIFY_MAIL_DIR`, and run this script with
 * the same `LIQUORIFY_MAIL_DIR`, after the captures and the comparison, since
 * it changes the store's email settings and its password reset template.
 *
 * The email settings are saved on DA-SET-03 and seen in the branding preview,
 * the editor's preview and a sent email. The password reset template is
 * edited, saved as a draft, sent as a test, published, seen in the email Spree
 * sends for a customer's reset through the Store API, restored from its
 * history, met in a conflict, and reverted, and the default seen again. An
 * order placed through the Admin API shows where the new order notification
 * goes, and whether customer emails still go once they are turned off. Every
 * setting is put back at the end. Reset links carry a token, which every saved
 * email has masked.
 */

const emailsURL = process.env.FIDELITY_EMAILS_URL ?? 'http://localhost:5175'
const emailsServer = process.env.FIDELITY_EMAILS_SERVER ?? 'http://localhost:3040'
const RESULTS = new URL('./results/fl-18/', import.meta.url)
const credentialsFile = new URL('./results/tmp/emails-app.json', import.meta.url).pathname
const LOGO = new URL('../../dashboard/e2e/fixtures/test-image.png', import.meta.url).pathname
const RESET = 'spree.customer_mailer.password_reset_email'

const SETTINGS = {
  sender: 'orders@fl-18.example.com',
  support: 'help@fl-18.example.com',
  notifications: 'ops@fl-18.example.com',
  accent: '#0b6e4f',
}
const CHANGE = {
  subject: ' (FL-18)',
  text: 'FL-18 published change',
}

interface Sent {
  from: string
  to: string
  subject: string
  html: string
}

function decodeQuotedPrintable(body: string) {
  const latin1 = body
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
  return Buffer.from(latin1, 'latin1').toString('utf8')
}

/** Every message the app wrote to `recipient`, with the headers this script reads. */
function sentTo(recipient: string): Sent[] {
  const file = join(MAIL_DIR, recipient)
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8')
    .split(/\r?\n(?=Date: )/)
    .filter((message) => message.trim())
    .map((message) => {
      const header = (name: string) =>
        message.match(new RegExp(`^${name}: (.*)$`, 'm'))?.[1]?.trim() ?? ''
      const htmlPart = message
        .split(/^--[^\r\n]+$/m)
        .find((part) => /^Content-Type: text\/html/im.test(part))
      const [headers = '', ...rest] = (htmlPart ?? message).split(/\r?\n\r?\n/)
      const body = rest.join('\n\n')
      return {
        from: header('From'),
        to: header('To'),
        subject: header('Subject'),
        html: /^Content-Transfer-Encoding: quoted-printable/im.test(headers)
          ? decodeQuotedPrintable(body)
          : body,
      }
    })
}

async function nextSent(recipient: string, already: number) {
  await expect.poll(() => sentTo(recipient).length, { timeout: 30_000 }).toBeGreaterThan(already)
  return sentTo(recipient)[already]
}

/** Waits long enough for a message that should not come, then counts. */
async function nothingSent(recipient: string, already: number) {
  await new Promise((resolve) => setTimeout(resolve, 10_000))
  return sentTo(recipient).length - already
}

/** A confirmation, which Spree draws as an alert dialog or a dialog over the page. */
const confirmDialog = (page: Page) =>
  page.getByRole('alertdialog').or(page.getByRole('dialog')).last()

const masked = (html: string, storeId: string) =>
  html.replace(/([?&]token=)[^"&\s]+/g, '$1…').replaceAll(storeId, '<store>')

function record(name: string, facts: unknown) {
  mkdirSync(RESULTS, { recursive: true })
  writeFileSync(new URL(name, RESULTS), `${JSON.stringify(facts, null, 2)}\n`)
}

const shot = (page: Page, name: string, fullPage = false) =>
  page.screenshot({ path: new URL(`${name}.png`, RESULTS).pathname, fullPage })

/** A sent email as a reader's mail app would draw it, outside requests blocked. */
async function drawn(page: Page, mail: Sent, name: string, storeId: string) {
  writeFileSync(new URL(`${name}.html`, RESULTS), masked(mail.html, storeId))
  const reader = await page.context().newPage()
  await reader.setViewportSize({ width: 800, height: 900 })
  await reader.setContent(masked(mail.html, storeId), { waitUntil: 'load' })
  await reader.screenshot({ path: new URL(`${name}.png`, RESULTS).pathname, fullPage: true })
  await reader.close()
}

/** What a sent email shows of the settings and the template change. */
const seen = (mail: Sent) => ({
  from: mail.from,
  subject: mail.subject,
  has_change: mail.html.includes(CHANGE.text),
  subject_has_change: mail.subject.includes(CHANGE.subject.trim()),
  shows_support_address: mail.html.includes(SETTINGS.support),
  shows_accent: mail.html.toLowerCase().includes(SETTINGS.accent),
  logo: /<img[^>]+(active_storage|rails\/)[^>]+>/.test(mail.html),
})

test.describe('FL-18', () => {
  test.skip(!MAIL_DIR, 'Run with the LIQUORIFY_MAIL_DIR the emails app writes to')
  test.use({ viewport: { width: 1280, height: 960 }, baseURL: emailsURL })

  test('FL-18: email settings and the password reset template, seen where they take effect', async ({
    page,
  }) => {
    test.setTimeout(900_000)
    mkdirSync(RESULTS, { recursive: true })
    await page.context().route(
      (url) =>
        !['data:', 'blob:', 'about:'].includes(url.protocol) &&
        !['localhost', '127.0.0.1'].includes(url.hostname),
      (route) => route.abort(),
    )
    const creds = JSON.parse(readFileSync(credentialsFile, 'utf8')) as AdminCredentials
    const signedIn = await page.request.post(`${emailsURL}/api/v3/admin/auth/login`, {
      data: { email: creds.admin_email, password: creds.admin_password },
    })
    expect(signedIn.ok(), await signedIn.text()).toBeTruthy()
    const token = ((await signedIn.json()) as { token: string }).token
    await page.goto(`${emailsURL}/`)
    await expect(page).toHaveURL(new RegExp(`/${creds.store_id}`), { timeout: 15_000 })
    const api = page.request
    const headers = { Authorization: `Bearer ${token}`, 'X-Spree-Store-Id': creds.store_id }
    const admin = async <T>(
      method: 'get' | 'post' | 'patch' | 'put' | 'delete',
      path: string,
      data?: object,
    ) => {
      const response = await api[method](`${emailsURL}/api/v3/admin${path}`, { headers, data })
      const text = await response.text()
      expect(
        response.ok(),
        `${method.toUpperCase()} ${path}: ${response.status()} ${text}`,
      ).toBeTruthy()
      return (text ? JSON.parse(text) : {}) as T
    }
    // A run stopped partway can leave its change published; start from Spree's default.
    await api.delete(`${emailsURL}/api/v3/admin/email_templates/${RESET}?language=en`, { headers })
    const storeBefore = await admin<Record<string, unknown>>('get', '/store')
    const keys = await admin<{
      data: { key_type: string; channel_id: string | null; plaintext_token: string | null }[]
    }>('get', '/api_keys?limit=100')
    const publishable = keys.data.find(
      (key) => key.key_type === 'publishable' && key.channel_id === null,
    )?.plaintext_token
    expect(publishable, 'a publishable key for the Store API').toBeTruthy()
    const store = (
      method: 'post' | 'patch',
      path: string,
      data: object,
    ): ReturnType<APIRequestContext['post']> =>
      api[method](`${emailsServer}/api/v3/store${path}`, {
        headers: { 'X-Spree-API-Key': publishable as string },
        data,
      })

    const customer = `fl-18-${Date.now()}@example.com`
    const password = randomUUID()
    const signUp = await store('post', '/customers', {
      email: customer,
      password,
      password_confirmation: password,
    })
    expect(signUp.status(), await signUp.text()).toBe(201)
    const reset = async () => {
      const already = sentTo(customer).length
      const response = await store('post', '/password_resets', {
        email: customer,
        redirect_url: 'http://localhost/us/en/account/reset-password',
      })
      expect(response.status()).toBe(202)
      return already
    }
    const facts: Record<string, unknown> = { server: 'emails gem test app' }
    const settingsPath = `/${creds.store_id}/settings/emails`
    const templatePath = `/${creds.store_id}/settings/emails/templates/${RESET}`
    const save = page.getByRole('button', { name: /^save$/i })
    const menu = () =>
      page
        .getByRole('button', { name: /more actions|actions/i })
        .last()
        .click()

    // DA-SET-03: addresses, logo and an accent colour.
    await page.goto(settingsPath)
    await expect(page.locator('#store-mail-from-address')).toBeVisible({ timeout: 15_000 })
    await page.locator('#store-mail-from-address').fill(SETTINGS.sender)
    await page.locator('#store-customer-support-email').fill(SETTINGS.support)
    await page.locator('#store-new-order-notifications-email').fill(SETTINGS.notifications)
    await page.locator('input[type="file"]').setInputFiles(LOGO)
    await expect(page.getByText(/uploading/i)).toBeHidden({ timeout: 30_000 })
    await page.locator('#store-email-accent_color').fill(SETTINGS.accent)
    await page.locator('#store-email-accent_color').blur()
    await save.click()
    await expect(save).toBeDisabled({ timeout: 15_000 })
    await page.reload()
    await expect(page.locator('#store-mail-from-address')).toHaveValue(SETTINGS.sender, {
      timeout: 15_000,
    })
    await page.waitForTimeout(1_500)
    await shot(page, 'a1-settings-saved', true)
    const storeAfter = await admin<Record<string, unknown>>('get', '/store')
    facts.settings_saved = {
      mail_from_address: storeAfter.mail_from_address,
      customer_support_email: storeAfter.customer_support_email,
      new_order_notifications_email: storeAfter.new_order_notifications_email,
      email_accent_color: storeAfter.email_accent_color,
      mailer_logo: storeAfter.mailer_logo_url ? 'attached' : null,
    }

    // The editor's preview, then a sent reset email, with the branding.
    await page.goto(templatePath)
    await expect(page.getByText(/^Subject: /)).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(2_000)
    await shot(page, 'a2-editor-preview-branded', true)
    let already = await reset()
    const branded = await nextSent(customer, already)
    await drawn(page, branded, 'a3-sent-branded', creds.store_id)
    facts.sent_branded = seen(branded)
    expect(branded.from).toContain(SETTINGS.sender)

    // DA-SET-05: the reset template edited, saved, tested, published.
    await page.goto(templatePath)
    const subject = page.getByRole('textbox', { name: 'Subject', exact: true })
    await expect(subject).toBeVisible({ timeout: 15_000 })
    await subject.click()
    await page.keyboard.press('End')
    await page.keyboard.type(CHANGE.subject)
    await page.getByRole('textbox', { name: 'Template code' }).click()
    await page.keyboard.press('ControlOrMeta+End')
    await page.keyboard.insertText(
      `\n<mj-section><mj-column><mj-text>${CHANGE.text}</mj-text></mj-column></mj-section>`,
    )
    await page.waitForTimeout(1_500)
    await shot(page, 'b1-edited', true)
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByText('Draft saved')).toBeVisible({ timeout: 15_000 })
    await shot(page, 'b2-draft-saved')

    const tests = sentTo(creds.admin_email).length
    await menu()
    await page.getByRole('menuitem', { name: 'Send test email' }).click()
    await expect(page.getByText(`Test email sent to ${creds.admin_email}`)).toBeVisible({
      timeout: 15_000,
    })
    await shot(page, 'b3-test-sent')
    const testMail = await nextSent(creds.admin_email, tests)
    await drawn(page, testMail, 'b3-test-email', creds.store_id)
    facts.test_email = { to: 'the signed-in admin', ...seen(testMail) }
    expect(testMail.subject).toContain(CHANGE.subject.trim())
    expect(testMail.html).toContain(CHANGE.text)

    // A draft does not reach customers.
    already = await reset()
    const beforePublish = await nextSent(customer, already)
    facts.sent_with_draft_only = seen(beforePublish)
    expect(beforePublish.html).not.toContain(CHANGE.text)

    await page.getByRole('button', { name: 'Publish' }).click()
    await expect(page.getByText(/^Published\./)).toBeVisible({ timeout: 15_000 })
    await shot(page, 'b4-published')
    already = await reset()
    const published = await nextSent(customer, already)
    await drawn(page, published, 'b5-sent-after-publish', creds.store_id)
    facts.sent_after_publish = seen(published)
    expect(published.subject).toContain(CHANGE.subject.trim())
    expect(published.html).toContain(CHANGE.text)

    // History and restoring a version into the draft, then discarding it.
    await menu()
    await page.getByRole('menuitem', { name: 'History' }).click()
    await expect(page.getByRole('dialog', { name: 'History' }).getByText('Latest')).toBeVisible({
      timeout: 15_000,
    })
    await shot(page, 'b6-history')
    await page.getByRole('button', { name: 'Restore' }).first().click()
    await expect(confirmDialog(page)).toBeVisible()
    await shot(page, 'b7-restore-confirmation')
    await confirmDialog(page)
      .getByRole('button', { name: /restore/i })
      .click()
    await expect(page.getByText('Version restored into the draft')).toBeVisible({ timeout: 15_000 })
    await page.keyboard.press('Escape')
    await shot(page, 'b8-restored')
    await menu()
    await page.getByRole('menuitem', { name: 'Discard draft' }).click()
    await confirmDialog(page).getByRole('button', { name: 'Discard draft' }).click()
    await expect(page.getByText('Draft discarded')).toBeVisible({ timeout: 15_000 })

    // A conflict: the draft saved elsewhere while this page holds changes.
    await subject.click()
    await page.keyboard.press('End')
    await page.keyboard.type(' first')
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByText('Draft saved')).toBeVisible({ timeout: 15_000 })
    await subject.click()
    await page.keyboard.press('End')
    await page.keyboard.type(' mine')
    const current = await admin<{
      body: string
      subject: string
      draft: { lock_version: number; body: string; subject: string } | null
    }>('get', `/email_templates/${RESET}?language=en`)
    await admin('put', `/email_templates/${RESET}/draft`, {
      language: 'en',
      subject: `${current.draft?.subject} theirs`,
      body: current.draft?.body,
      lock_version: current.draft?.lock_version,
    })
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByText('Someone else saved this draft')).toBeVisible({ timeout: 15_000 })
    await shot(page, 'b9-conflict')
    await page.getByRole('button', { name: 'Load their version' }).click()
    await expect(subject).toHaveValue(/theirs$/, { timeout: 15_000 })
    await shot(page, 'b10-their-version')
    facts.conflict = {
      reached_by: 'a second save through the Admin API, as another editor would make',
      dialog: 'Someone else saved this draft',
      loaded: await subject.inputValue(),
    }
    await menu()
    await page.getByRole('menuitem', { name: 'Discard draft' }).click()
    await confirmDialog(page).getByRole('button', { name: 'Discard draft' }).click()
    await expect(page.getByText('Draft discarded')).toBeVisible({ timeout: 15_000 })

    // Revert to Spree's default, and the default seen again.
    await menu()
    await page.getByRole('menuitem', { name: 'Revert to default' }).click()
    await expect(confirmDialog(page)).toBeVisible()
    await shot(page, 'b11-revert-confirmation')
    await confirmDialog(page).getByRole('button', { name: 'Revert to default' }).click()
    await expect(page.getByText("Reverted to Spree's default")).toBeVisible({ timeout: 15_000 })
    await shot(page, 'b12-reverted')
    already = await reset()
    const reverted = await nextSent(customer, already)
    await drawn(page, reverted, 'b13-sent-after-revert', creds.store_id)
    facts.sent_after_revert = seen(reverted)
    expect(reverted.subject).not.toContain(CHANGE.subject.trim())
    expect(reverted.html).not.toContain(CHANGE.text)

    // The new order notification address, and customer emails turned off.
    const [buyer] = (
      await admin<{ data: { id: string; email: string }[] }>(
        'get',
        `/customers?q%5Bemail_eq%5D=${encodeURIComponent('sarah.johnson@example.com')}`,
      )
    ).data
    const [variant] = (await admin<{ data: { id: string }[] }>('get', '/variants?limit=1')).data
    const check = (
      await admin<{ data: { id: string; type: string }[] }>('get', '/payment_methods')
    ).data.find((method) => method.type === 'check')
    const place = async () => {
      const order = await admin<{ id: string; number: string }>('post', '/orders', {
        customer_id: buyer.id,
        use_customer_default_address: true,
        items: [{ variant_id: variant.id, quantity: 1 }],
      })
      const due = await admin<{ amount_due: string }>('get', `/orders/${order.id}`)
      await admin('post', `/orders/${order.id}/payments`, {
        payment_method_id: check?.id,
        amount: due.amount_due,
      })
      await admin('patch', `/orders/${order.id}/complete`, { notify_customer: true })
      return order
    }
    const orderMails = {
      customer: sentTo(buyer.email).length,
      ops: sentTo(SETTINGS.notifications).length,
    }
    const first = await place()
    const notification = await nextSent(SETTINGS.notifications, orderMails.ops)
    const confirmation = await nextSent(buyer.email, orderMails.customer)
    await drawn(page, notification, 'c1-new-order-notification', creds.store_id)
    await drawn(page, confirmation, 'c2-order-confirmation-branded', creds.store_id)
    facts.order_placed = {
      order: first.number,
      notification: { to: notification.to, from: notification.from, subject: notification.subject },
      confirmation: { to: 'the customer', ...seen(confirmation) },
    }

    await page.goto(settingsPath)
    await expect(page.locator('#store-mail-from-address')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('switch', { name: /send transactional emails to customers/i }).click()
    await save.click()
    await expect(save).toBeDisabled({ timeout: 15_000 })
    await shot(page, 'c3-customer-emails-off', true)
    const offMails = {
      customer: sentTo(buyer.email).length,
      ops: sentTo(SETTINGS.notifications).length,
    }
    const second = await place()
    const offNotification = await nextSent(SETTINGS.notifications, offMails.ops)
    const customerWhileOff = await nothingSent(buyer.email, offMails.customer)
    already = await reset()
    const resetWhileOff = await nothingSent(customer, already)
    facts.customer_emails_off = {
      order: second.number,
      notification_sent: offNotification.subject,
      order_emails_to_the_customer: customerWhileOff,
      password_reset_emails_to_the_customer: resetWhileOff,
    }

    // Everything put back as it was.
    await page.getByRole('switch', { name: /send transactional emails to customers/i }).click()
    await page.locator('#store-mail-from-address').fill(String(storeBefore.mail_from_address ?? ''))
    await page
      .locator('#store-customer-support-email')
      .fill(String(storeBefore.customer_support_email ?? ''))
    await page
      .locator('#store-new-order-notifications-email')
      .fill(String(storeBefore.new_order_notifications_email ?? ''))
    await page.getByRole('button', { name: /^remove$/i }).click()
    await page.locator('#store-email-accent_color').fill('')
    await page.locator('#store-email-accent_color').blur()
    await save.click()
    await expect(save).toBeDisabled({ timeout: 15_000 })
    const restored = await admin<Record<string, unknown>>('get', '/store')
    facts.put_back = Object.fromEntries(
      [
        'mail_from_address',
        'customer_support_email',
        'new_order_notifications_email',
        'email_accent_color',
        'send_consumer_transactional_emails',
        'mailer_logo_url',
        // An empty address and no address are the same setting.
      ].map((key) => [key, (restored[key] ?? '') === (storeBefore[key] ?? '')]),
    )
    record('fl-18.json', facts)
  })
})
