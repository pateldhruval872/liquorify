import { randomUUID } from 'node:crypto'
import { expect, type Page, request, test } from '@playwright/test'
import {
  blockOutside,
  CONFIRMATION,
  confirmDialog,
  EMAILS_SERVER,
  EMAILS_URL,
  emailsAdmin,
  expectedToFail,
  nextSent,
  RESET,
  record,
  sabotaged,
  sentTo,
  shot,
} from './b11'
import { seed } from './staff'

/**
 * Batch 11 verification, behaviours 1 to 9 of G-100 (work item §3 and §7):
 * the email template editor and the templates list, driven on the emails gem's
 * test app through the built dashboard served on `FIDELITY_EMAILS_URL`, as
 * `fl-18.spec.ts` drives them. Start that app with `emails-stack.spec.ts` and
 * `LIQUORIFY_MAIL_DIR`, and run this file with the same `LIQUORIFY_MAIL_DIR`.
 *
 * The tests run in order, because behaviours 2 to 7 follow one template
 * through a draft, a test email, two publications, a restore, a conflict and a
 * revert. The password reset template starts and ends as Spree's default. Each
 * reset email is requested through the Store API for a customer the run
 * registers, and read from the mail folder.
 */

const MAIL_DIR = process.env.LIQUORIFY_MAIL_DIR ?? ''
const stamp = Date.now()
const FIRST = { subject: ` (B11 ${stamp})`, text: `B11 first change ${stamp}` }
const SECOND = { text: `B11 second change ${stamp}` }
const TYPED = `B11 unsaved text ${stamp}`

const creds = () => emailsAdmin()
const templatePath = (id: string) => `/${creds().store_id}/settings/emails/templates/${id}`
const listPath = () => `/${creds().store_id}/settings/emails/templates`

let headers: Record<string, string>
let publishable: string
let customer: string
let defaultSubject: string

async function adminApi<T>(method: 'get' | 'put' | 'delete', path: string, data?: object) {
  const api = await request.newContext()
  try {
    const response = await api[method](`${EMAILS_URL}/api/v3/admin${path}`, { headers, data })
    const text = await response.text()
    expect(response.ok(), `${method.toUpperCase()} ${path}: ${response.status()} ${text}`).toBe(
      true,
    )
    return (text ? JSON.parse(text) : {}) as T
  } finally {
    await api.dispose()
  }
}

/** Requests a password reset through the Store API and returns the email it sent. */
async function resetEmail() {
  const already = sentTo(MAIL_DIR, customer).length
  const api = await request.newContext()
  try {
    const response = await api.post(`${EMAILS_SERVER}/api/v3/store/password_resets`, {
      headers: { 'X-Spree-API-Key': publishable },
      data: { email: customer, redirect_url: 'http://localhost/us/en/account/reset-password' },
    })
    expect(response.status()).toBe(202)
  } finally {
    await api.dispose()
  }
  return nextSent(MAIL_DIR, customer, already)
}

async function signIn(page: Page) {
  await blockOutside(page)
  const signedIn = await page.request.post(`${EMAILS_URL}/api/v3/admin/auth/login`, {
    data: { email: creds().admin_email, password: creds().admin_password },
  })
  expect(signedIn.ok(), await signedIn.text()).toBe(true)
  await page.goto(`${EMAILS_URL}/`)
  await expect(page).toHaveURL(new RegExp(`/${creds().store_id}`), { timeout: 15_000 })
}

const subjectBox = (page: Page) => page.getByRole('textbox', { name: 'Subject', exact: true })
const codeBox = (page: Page) => page.getByRole('textbox', { name: 'Template code' })
const menu = (page: Page) =>
  page
    .getByRole('button', { name: /more actions|actions/i })
    .last()
    .click()
const draftBadge = (page: Page) =>
  page.getByText('Draft — customers receive the published version', { exact: true })

async function openTemplate(page: Page, id = RESET) {
  await page.goto(`${EMAILS_URL}${templatePath(id)}`)
  await expect(subjectBox(page)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/^Subject: /)).toBeVisible({ timeout: 15_000 })
}

/** Adds the change to the end of the template's code, as a person typing would. */
async function appendSection(page: Page, text: string) {
  await codeBox(page).click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.insertText(
    `\n<mj-section><mj-column><mj-text>${text}</mj-text></mj-column></mj-section>`,
  )
}

async function discardDraftIfAny(page: Page) {
  if (!(await draftBadge(page).isVisible())) return
  await menu(page)
  await page.getByRole('menuitem', { name: 'Discard draft' }).click()
  await confirmDialog(page).getByRole('button', { name: 'Discard draft' }).click()
  await expect(page.getByText('Draft discarded')).toBeVisible({ timeout: 15_000 })
}

test.describe.configure({ mode: 'serial' })
test.use({ viewport: { width: 1280, height: 960 }, baseURL: EMAILS_URL })

test.describe('Batch 11 verification: the email template editor (behaviours 1 to 9)', () => {
  test.skip(!MAIL_DIR, 'Run with the LIQUORIFY_MAIL_DIR the emails app writes to')

  test.beforeAll(async () => {
    test.setTimeout(300_000)
    await seed(EMAILS_URL, creds())
    const api = await request.newContext()
    try {
      const login = await api.post(`${EMAILS_URL}/api/v3/admin/auth/login`, {
        data: { email: creds().admin_email, password: creds().admin_password },
      })
      const token = ((await login.json()) as { token: string }).token
      headers = { Authorization: `Bearer ${token}`, 'X-Spree-Store-Id': creds().store_id }
      // A run stopped partway can leave its change published; start from Spree's default.
      await api.delete(`${EMAILS_URL}/api/v3/admin/email_templates/${RESET}?language=en`, {
        headers,
      })
      const keys = (await (
        await api.get(`${EMAILS_URL}/api/v3/admin/api_keys?limit=100`, { headers })
      ).json()) as {
        data: { key_type: string; channel_id: string | null; plaintext_token: string | null }[]
      }
      publishable = keys.data.find(
        (key) => key.key_type === 'publishable' && key.channel_id === null,
      )?.plaintext_token as string
      expect(publishable, 'a publishable key for the Store API').toBeTruthy()
      customer = `b11-${stamp}@example.com`
      const password = randomUUID()
      const signUp = await api.post(`${EMAILS_SERVER}/api/v3/store/customers`, {
        headers: { 'X-Spree-API-Key': publishable },
        data: { email: customer, password, password_confirmation: password },
      })
      expect(signUp.status(), await signUp.text()).toBe(201)
    } finally {
      await api.dispose()
    }
    defaultSubject = (
      await adminApi<{ subject: string }>('get', `/email_templates/${RESET}?language=en`)
    ).subject
  })

  test.afterAll(async () => {
    if (headers && !process.env.B11_KEEP) {
      const api = await request.newContext()
      await api.delete(`${EMAILS_URL}/api/v3/admin/email_templates/${RESET}?language=en`, {
        headers,
      })
      await api.dispose()
    }
  })

  test('1. Editing a template, with the leave confirmation', async ({ page }) => {
    expectedToFail()
    await signIn(page)
    await openTemplate(page)
    await codeBox(page).click()
    await page.keyboard.press('ControlOrMeta+End')
    await page.keyboard.insertText(`\n${TYPED}`)
    await expect(
      page.getByText(sabotaged('Unsaved changes', 'Saved changes'), { exact: true }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(confirmDialog(page).getByText('Leave without saving?')).toBeVisible()
    await shot(page, '1-leave-confirmation')
    await confirmDialog(page)
      .getByRole('button', { name: /^(stay|cancel)$/i })
      .click()
    await expect(confirmDialog(page)).toBeHidden()
    await expect(codeBox(page)).toContainText(TYPED)
    const stayed = new URL(page.url()).pathname

    await page.getByRole('button', { name: 'Back' }).click()
    await confirmDialog(page).getByRole('button', { name: 'Leave' }).click()
    await expect(page).toHaveURL(new RegExp(`${listPath()}$`), { timeout: 15_000 })
    const leftTo = new URL(page.url()).pathname

    await openTemplate(page)
    await expect(page.getByText('Unsaved changes', { exact: true })).toBeHidden()
    await expect(codeBox(page)).not.toContainText(TYPED)
    await expect(subjectBox(page)).toHaveValue(defaultSubject)
    record('1-editing.json', {
      unsaved_badge: true,
      stay_kept_text: true,
      stayed_on: stayed.replace(creds().store_id, '<store>'),
      left_to: leftTo.replace(creds().store_id, '<store>'),
      reopened_without_text: true,
    })
  })

  test('2. Saving a draft, which does not reach customers', async ({ page }) => {
    expectedToFail()
    await signIn(page)
    await openTemplate(page)
    await subjectBox(page).click()
    await page.keyboard.press('End')
    await page.keyboard.type(FIRST.subject)
    await appendSection(page, FIRST.text)
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByText('Draft saved')).toBeVisible({ timeout: 15_000 })
    await expect(draftBadge(page)).toBeVisible()
    await shot(page, '2-draft-saved')
    const sent = await resetEmail()
    expect(sent.html).not.toContain(sabotaged(FIRST.text, '<'))
    expect(sent.subject).not.toContain(FIRST.subject.trim())
    record('2-draft.json', {
      badge: 'Draft — customers receive the published version',
      reset_email: { subject: sent.subject, holds_draft_text: sent.html.includes(FIRST.text) },
    })
  })

  test('3. Sending a test email', async ({ page }) => {
    expectedToFail()
    await signIn(page)
    await openTemplate(page)
    await expect(draftBadge(page)).toBeVisible()
    const before = sentTo(MAIL_DIR, creds().admin_email).length
    await menu(page)
    await page.getByRole('menuitem', { name: 'Send test email' }).click()
    await expect(page.getByText(`Test email sent to ${creds().admin_email}`)).toBeVisible({
      timeout: 15_000,
    })
    await shot(page, '3-test-sent')
    const mail = await nextSent(MAIL_DIR, creds().admin_email, before)
    // Wait for any second copy before counting.
    await page.waitForTimeout(3_000)
    expect(sentTo(MAIL_DIR, creds().admin_email).length - before).toBe(1)
    expect(mail.subject.startsWith(sabotaged('[Test]', '[Sabotaged]'))).toBe(true)
    expect(mail.html).toContain(FIRST.text)
    record('3-test-email.json', {
      to: 'the signed-in admin',
      count: 1,
      subject: mail.subject,
      holds_draft_text: true,
    })
  })

  test('4. Publishing, and the change reaching customers', async ({ page }) => {
    expectedToFail()
    await signIn(page)
    await openTemplate(page)
    await page.getByRole('button', { name: 'Publish' }).click()
    await expect(page.getByText(/^Published\./)).toBeVisible({ timeout: 15_000 })
    await expect(draftBadge(page)).toBeHidden()
    await expect(
      page.getByText('Published — what customers receive', { exact: true }),
    ).toBeVisible()
    await shot(page, '4-published')
    const sent = await resetEmail()
    expect(sent.html).toContain(sabotaged(FIRST.text, `${FIRST.text} sabotaged`))
    expect(sent.subject).toContain(FIRST.subject.trim())
    record('4-published.json', {
      draft_badge_gone: true,
      reset_email: { subject: sent.subject, holds_change: true },
    })
  })

  test('9. The templates list', async ({ page }) => {
    expectedToFail()
    await signIn(page)
    const templates = await adminApi<{ data: { id: string; kind: string }[] }>(
      'get',
      '/email_templates?language=en',
    )
    const emails = templates.data.filter((template) => template.kind === 'email')
    const layouts = templates.data.filter((template) => template.kind === 'layout')
    expect(emails).toHaveLength(sabotaged(11, 12))
    expect(layouts).toHaveLength(1)
    await page.goto(`${EMAILS_URL}${listPath()}`)
    await expect(page.getByRole('tab', { name: 'Templates' })).toBeVisible({ timeout: 15_000 })
    const links = page.locator(`a[href*="/settings/emails/templates/"]`)
    await expect(links.first()).toBeVisible({ timeout: 15_000 })
    const hrefs = await links.evaluateAll((items) =>
      items.map((item) => (item.getAttribute('href') ?? '').split('/').pop() ?? ''),
    )
    for (const template of [...emails, ...layouts]) expect(hrefs).toContain(template.id)
    const resetRow = page.locator(`a[href$="/${RESET}"]`)
    await expect(resetRow.getByText('Customized', { exact: true })).toBeVisible()
    await shot(page, '9-templates-list', true)
    const others = await links.evaluateAll((items) =>
      items
        .filter((item) => (item as HTMLElement).innerText.includes('Customized'))
        .map((item) => (item.getAttribute('href') ?? '').split('/').pop()),
    )
    await page.locator(`a[href$="/${CONFIRMATION}"]`).click()
    await expect(page).toHaveURL(new RegExp(`/templates/${CONFIRMATION.replaceAll('.', '\\.')}$`))
    await expect(codeBox(page)).toBeVisible({ timeout: 15_000 })
    record('9-templates-list.json', {
      emails: emails.map((template) => template.id),
      layouts: layouts.map((template) => template.id),
      every_one_listed: true,
      customized: others,
      opened: CONFIRMATION,
    })
  })

  test('5. The history, and restoring a version', async ({ page }) => {
    expectedToFail()
    await signIn(page)
    await openTemplate(page)
    // A second published version, so there is an earlier one to restore.
    await appendSection(page, SECOND.text)
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByText('Draft saved')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Publish' }).click()
    await expect(page.getByText(/^Published\./)).toBeVisible({ timeout: 15_000 })

    await menu(page)
    await page.getByRole('menuitem', { name: 'History' }).click()
    const history = page.getByRole('dialog', { name: 'History' })
    await expect(history.getByText('Latest')).toBeVisible({ timeout: 15_000 })
    const restoreButtons = history.getByRole('button', { name: 'Restore' })
    await expect(restoreButtons).toHaveCount(sabotaged(2, 3))
    await shot(page, '5-history')
    // Newest first: the second row is the first publication.
    await restoreButtons.nth(1).click()
    await expect(confirmDialog(page).getByText('Restore this version?')).toBeVisible()
    await shot(page, '5-restore-confirmation')
    await confirmDialog(page)
      .getByRole('button', { name: /restore/i })
      .click()
    await expect(page.getByText('Version restored into the draft')).toBeVisible({
      timeout: 15_000,
    })
    await page.keyboard.press('Escape')
    await expect(draftBadge(page)).toBeVisible({ timeout: 15_000 })
    await expect(codeBox(page)).toContainText(FIRST.text)
    await expect(codeBox(page)).not.toContainText(SECOND.text)
    await shot(page, '5-restored')
    await discardDraftIfAny(page)
    record('5-history.json', {
      versions: 2,
      latest_marked: true,
      restored: 'the first publication, into the draft',
      editor_holds_first_change: true,
      editor_holds_second_change: false,
    })
  })

  test('6. The conflict when another editor saved first', async ({ page }) => {
    expectedToFail()
    await signIn(page)
    await openTemplate(page)
    await subjectBox(page).click()
    await page.keyboard.press('End')
    await page.keyboard.type(' first')
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(page.getByText('Draft saved')).toBeVisible({ timeout: 15_000 })
    await subjectBox(page).click()
    await page.keyboard.press('End')
    await page.keyboard.type(' mine')
    const current = await adminApi<{
      draft: { lock_version: number; body: string; subject: string } | null
    }>('get', `/email_templates/${RESET}?language=en`)
    const theirs = `${current.draft?.subject} theirs`
    await adminApi('put', `/email_templates/${RESET}/draft`, {
      language: 'en',
      subject: theirs,
      body: current.draft?.body,
      lock_version: current.draft?.lock_version,
    })
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(
      page.getByText(sabotaged('Someone else saved this draft', 'Nobody else saved this draft')),
    ).toBeVisible({ timeout: 15_000 })
    await shot(page, '6-conflict')
    await page.getByRole('button', { name: 'Load their version' }).click()
    await expect(subjectBox(page)).toHaveValue(theirs, { timeout: 15_000 })
    await shot(page, '6-their-version')
    await discardDraftIfAny(page)
    record('6-conflict.json', {
      reached_by: 'a second save through the Admin API, as another editor would make',
      dialog: 'Someone else saved this draft',
      loaded_their_subject: true,
    })
  })

  test("7. Reverting to Spree's default", async ({ page }) => {
    expectedToFail()
    await signIn(page)
    await openTemplate(page)
    await menu(page)
    await page.getByRole('menuitem', { name: 'Revert to default' }).click()
    await expect(confirmDialog(page).getByText("Revert to Spree's default?")).toBeVisible()
    await shot(page, '7-revert-confirmation')
    await confirmDialog(page).getByRole('button', { name: 'Revert to default' }).click()
    await expect(page.getByText("Reverted to Spree's default")).toBeVisible({ timeout: 15_000 })
    await expect(subjectBox(page)).toHaveValue(sabotaged(defaultSubject, `${defaultSubject}!`))
    await expect(codeBox(page)).not.toContainText(FIRST.text)
    await expect(
      page.getByText("Spree's default — what customers receive", { exact: true }),
    ).toBeVisible()
    await shot(page, '7-reverted')
    const sent = await resetEmail()
    expect(sent.html).not.toContain(FIRST.text)
    expect(sent.html).not.toContain(SECOND.text)
    expect(sent.subject).not.toContain(FIRST.subject.trim())
    record('7-reverted.json', {
      editor_subject_is_default: true,
      reset_email: { subject: sent.subject, holds_a_change: false },
    })
  })

  test('8. Choosing a record for the preview, and inserting a variable', async ({ page }) => {
    expectedToFail()
    await signIn(page)
    await openTemplate(page, CONFIRMATION)
    const preview = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText('Preview', { exact: true }) })
      .first()
    await preview.getByRole('combobox', { name: 'Preview with record' }).click()
    const option = page.getByRole('option', { name: /R\d+/ }).nth(1)
    await expect(option).toBeVisible({ timeout: 15_000 })
    const number = (await option.innerText()).match(/R\d+/)?.[0] as string
    await option.click()
    await expect(
      page.getByText(new RegExp(`^Subject: .*${sabotaged(number, 'R0')}\\b`)),
    ).toBeVisible({
      timeout: 15_000,
    })
    await shot(page, '8-record-chosen')

    const tag = '{{ order.total | money }}'
    await codeBox(page).click()
    await page.keyboard.press('ControlOrMeta+Home')
    await page.getByRole('button', { name: 'Insert order.total' }).click()
    await expect(page.getByText('Unsaved changes', { exact: true })).toBeVisible()
    const code = (await codeBox(page).innerText()).trimStart()
    expect(code.startsWith(tag), `the code starts with ${tag}: ${code.slice(0, 80)}`).toBe(true)
    await shot(page, '8-variable-inserted')
    record('8-preview-and-variable.json', {
      record_chosen: number,
      subject_shows_number: true,
      inserted: tag,
      at: 'the cursor, at the start of the code',
    })
  })
})
