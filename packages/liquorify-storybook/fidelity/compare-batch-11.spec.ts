import { readFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { adminPage, type Case, compareCases } from './comparison'
import type { AdminCredentials } from './staff'

/**
 * Batch 11's diagnostic comparison: each new reporting and email template
 * component's story beside the same component on the running screens, as
 * `compare-batch-8.spec.ts` compares batch 8's. The home page and the reports
 * are opened on the browser-test server, as `compare.spec.ts` describes; the
 * email templates on the emails gem's test app, through the same built
 * dashboard served on `FIDELITY_EMAILS_URL`, as `screens-batch-11.spec.ts`
 * opens them. Run that script first: it adds the orders, the saved report and
 * the staff these cases open. The data differs on purpose: the screens show
 * the test servers' records, the stories invented ones. Nothing a case opens
 * is saved.
 *
 * Stories with no case show states the servers cannot reach (growth up or
 * down, the compare with default dialog, the conflict dialog before the flow
 * script makes one), states only the flow scripts reach, or a role other than
 * the admin's; the image review list names each.
 */

const emailsURL = process.env.FIDELITY_EMAILS_URL ?? 'http://localhost:5175'
const emailsApp = new URL('./results/tmp/emails-app.json', import.meta.url).pathname

const storyRoot = (page: Page) => page.locator('#storybook-root > *').first()
const inColumn = (page: Page) => page.locator('[data-story-column] > *').first()
const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).first()
const card = (page: Page, text: string | RegExp) =>
  page.locator('[data-slot="card"]').filter({ hasText: text }).first()

// The home page and the reports

const home = async (page: Page) => {
  await adminPage(page, '')
  await expect(page.getByText('Operations', { exact: true })).toBeVisible({ timeout: 20_000 })
}

const builder = (page: Page) => card(page, 'Report settings')
/** The result beside the builder, in the workspace's second column. */
const reportView = (page: Page) => builder(page).locator('xpath=following-sibling::*[1]')

const newReport = async (page: Page, query?: Record<string, unknown>) => {
  await adminPage(
    page,
    `/reports/new${query ? `?query=${encodeURIComponent(JSON.stringify(JSON.stringify(query)))}` : ''}`,
  )
  await expect(builder(page)).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0, { timeout: 20_000 })
}

const channelQuery = {
  metrics: ['total_sales', 'orders'],
  dimensions: ['channel'],
  time_range: { preset: 'last_4_weeks' },
  sort: '-total_sales',
  limit: 50,
}
const hourOverAYear = {
  metrics: ['orders'],
  dimensions: [{ name: 'completed_at', grain: 'hour' }],
  time_range: { preset: 'last_12_months' },
}
const dailyCompared = {
  metrics: ['total_sales', 'orders'],
  dimensions: [{ name: 'completed_at', grain: 'day' }],
  time_range: { preset: 'last_4_weeks' },
  compare: 'previous_period',
}

const view = (name: string, story: string, query: Record<string, unknown>): Case => ({
  id: 'CMP-DA-G-17',
  name: `b11-report-view-${name}`,
  story: `admin-dashboard-reporting-report-view--${story}`,
  window: { width: 1280, height: 1600 },
  screen: async (page) => {
    await newReport(page, query)
    return reportView(page)
  },
  inStory: (page) => storyRoot(page).locator(':scope > *').first(),
})

const saveDialog = (name: string, story: string, reach: (page: Page) => Promise<void>): Case => ({
  id: 'CMP-DA-G-17',
  name: `b11-save-report-dialog-${name}`,
  story: `admin-dashboard-reporting-save-report-dialog--${story}`,
  viewport: true,
  window: { width: 1280, height: 800 },
  screen: async (page) => {
    await reach(page)
    return dialog(page)
  },
  inStory: dialog,
})

const openSave = async (page: Page) => {
  await newReport(page, dailyCompared)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog(page)).toBeVisible()
}

const reportingCases: Case[] = [
  {
    id: 'CMP-DA-G-17',
    name: 'b11-growth-badge-new',
    story: 'admin-dashboard-reporting-growth-badge--new',
    screen: async (page) => {
      await home(page)
      return page
        .getByRole('button', { name: /^Total sales/ })
        .getByText('New', { exact: true })
        .first()
    },
    inStory: (page) => page.getByText('New', { exact: true }).first(),
  },
  {
    id: 'CMP-DUI-P-10',
    name: 'b11-chart-this-period',
    story: 'dashboard-ui-primitives-chart--compared',
    screen: async (page) => {
      await home(page)
      return page.locator('[data-slot="chart"]').first()
    },
    inStory: (page) => page.locator('[data-slot="chart"]').first(),
  },
  {
    id: 'CMP-DUI-P-19',
    name: 'b11-date-range-picker-last-30-days',
    story: 'dashboard-ui-primitives-date-range-picker--last-thirty-days',
    screen: async (page) => {
      await home(page)
      return page.getByRole('button', { name: /Last 30 days/ }).first()
    },
    inStory: (page) => page.getByRole('button', { name: /Last 30 days/ }),
  },
  {
    id: 'CMP-DUI-P-19',
    name: 'b11-date-range-picker-open',
    story: 'dashboard-ui-primitives-date-range-picker--open',
    viewport: true,
    window: { width: 1280, height: 800 },
    screen: async (page) => {
      await home(page)
      await page
        .getByRole('button', { name: /Last 30 days/ })
        .first()
        .click()
      const popup = page.locator('[data-slot="popover-content"]').first()
      await expect(popup).toBeVisible()
      return popup
    },
    inStory: (page) => page.locator('[data-slot="popover-content"]').first(),
  },
  {
    id: 'CMP-DA-G-11',
    name: 'b11-earlier-channel-select-all-channels',
    story: 'admin-dashboard-orders-channel-select--all-channels',
    screen: async (page) => {
      await home(page)
      return page.getByRole('combobox').filter({ hasText: 'All channels' }).first()
    },
    inStory: (page) => page.getByRole('combobox').first(),
  },
  {
    id: 'CMP-DA-G-17',
    name: 'b11-report-builder-new-report',
    story: 'admin-dashboard-reporting-report-builder--new-report',
    window: { width: 1280, height: 1800 },
    screen: async (page) => {
      await newReport(page, dailyCompared)
      return builder(page)
    },
    inStory: (page) => card(page, 'Report settings'),
  },
  {
    id: 'CMP-DA-G-17',
    name: 'b11-report-builder-grouped-by-channel',
    story: 'admin-dashboard-reporting-report-builder--grouped-by-channel',
    window: { width: 1280, height: 1800 },
    screen: async (page) => {
      await newReport(page, channelQuery)
      return builder(page)
    },
    inStory: (page) => card(page, 'Report settings'),
  },
  view('compared', 'compared', dailyCompared),
  view('ranked', 'ranked', channelQuery),
  view('totals', 'totals', {
    metrics: ['total_sales', 'orders', 'average_order_value', 'units_sold', 'customers'],
    time_range: { preset: 'last_4_weeks' },
  }),
  view('empty', 'empty', {
    ...channelQuery,
    time_range: { since: '2026-10-01', until: '2026-10-05' },
  }),
  {
    // The builder never sends a query the server refuses, so the page's
    // request is answered with the server's own refusal of one it would.
    ...view('refused', 'refused', hourOverAYear),
    screen: async (page) => {
      const session = await login(page)
      const refused = await page.request.post('/api/v3/admin/reporting/query', {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'X-Spree-Store-Id': session.store_id,
        },
        data: hourOverAYear,
      })
      expect(refused.status()).toBe(422)
      const body = await refused.json()
      await page.route('**/api/v3/admin/reporting/query', (route) =>
        route.fulfill({ status: 422, json: body }),
      )
      await newReport(page, hourOverAYear)
      await expect(page.getByText('Could not load this report')).toBeVisible({ timeout: 15_000 })
      return reportView(page)
    },
  },
  saveDialog('save', 'save', openSave),
  saveDialog('name-missing', 'name-missing', async (page) => {
    await openSave(page)
    await dialog(page).getByRole('button', { name: 'Save' }).click()
    await expect(dialog(page).getByRole('textbox', { name: 'Name' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  }),
  saveDialog('refused', 'refused', async (page) => {
    await openSave(page)
    await dialog(page).getByRole('textbox', { name: 'Name' }).fill('Failed payments')
    await dialog(page).getByRole('button', { name: 'Save' }).click()
    await expect(dialog(page).getByText('Name has already been taken')).toBeVisible({
      timeout: 15_000,
    })
    await page.mouse.move(0, 0)
  }),
]

// The email templates, on the emails gem's test app

const emailsPage = async (page: Page, path: string) => {
  const creds = JSON.parse(readFileSync(emailsApp, 'utf8')) as AdminCredentials
  const res = await page.request.post(`${emailsURL}/api/v3/admin/auth/login`, {
    data: { email: creds.admin_email, password: creds.admin_password },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto(`${emailsURL}/${creds.store_id}${path}`)
  await page.waitForLoadState('networkidle')
}

const template = async (page: Page, id: string) => {
  await emailsPage(page, `/settings/emails/templates/${id}`)
  await expect(page.getByText(/^Subject: /)).toBeVisible({ timeout: 15_000 })
}

const reset = 'spree.customer_mailer.password_reset_email'
const confirmation = 'spree.order_mailer.confirm_email'
const layout = 'layouts.spree.base_mailer'

const previewCard = (page: Page) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText('Preview', { exact: true }) })
    .first()
const variablesCard = (page: Page) => card(page, 'Data this email can show.')
const tabs = (page: Page) => page.getByRole('tablist').first()

const templateCase = (
  name: string,
  story: string,
  id: string,
  found: (page: Page) => Locator,
  then?: (page: Page) => Promise<void>,
): Case => ({
  id: 'CMP-DA-G-08',
  name: `b11-${name}`,
  story,
  window: { width: 1280, height: 1200 },
  screen: async (page) => {
    await template(page, id)
    if (then) await then(page)
    return found(page)
  },
  inStory: (page) => storyRoot(page).locator('[data-slot="card"]').first(),
})

const emailCases: Case[] = [
  ...(
    [
      ['settings', '/settings/emails'],
      ['templates', '/settings/emails/templates'],
    ] as const
  ).map(
    ([state, path]): Case => ({
      id: 'CMP-DA-G-08',
      name: `b11-emails-tabs-${state}`,
      story: `admin-dashboard-email-templates-emails-tabs--${state}`,
      screen: async (page) => {
        await emailsPage(page, path)
        await expect(tabs(page)).toBeVisible({ timeout: 15_000 })
        return tabs(page)
      },
      inStory: tabs,
    }),
  ),
  templateCase(
    'variables-card-password-reset',
    'admin-dashboard-email-templates-variables-card--password-reset',
    reset,
    variablesCard,
  ),
  templateCase(
    'variables-card-order-confirmation',
    'admin-dashboard-email-templates-variables-card--order-confirmation',
    confirmation,
    variablesCard,
  ),
  templateCase(
    'variables-card-layout',
    'admin-dashboard-email-templates-variables-card--layout',
    layout,
    variablesCard,
  ),
  templateCase(
    'preview-card-email',
    'admin-dashboard-email-templates-preview-card--email',
    reset,
    previewCard,
  ),
  templateCase(
    'preview-card-plain-text',
    'admin-dashboard-email-templates-preview-card--plain-text',
    reset,
    previewCard,
    async (page) => {
      await previewCard(page).getByRole('tab', { name: 'Plain text' }).click()
      await page.mouse.move(0, 0)
    },
  ),
  templateCase(
    'preview-card-phone',
    'admin-dashboard-email-templates-preview-card--phone',
    reset,
    previewCard,
    async (page) => {
      await previewCard(page).getByRole('button', { name: 'Mobile width' }).click()
      await page.mouse.move(0, 0)
    },
  ),
  templateCase(
    'preview-card-order-email',
    'admin-dashboard-email-templates-preview-card--order-email',
    confirmation,
    previewCard,
  ),
  templateCase(
    'preview-card-layout',
    'admin-dashboard-email-templates-preview-card--layout',
    layout,
    previewCard,
  ),
  {
    id: 'CMP-DA-G-08',
    name: 'b11-preview-card-choosing-order',
    story: 'admin-dashboard-email-templates-preview-card--choosing-order',
    viewport: true,
    window: { width: 1280, height: 800 },
    screen: async (page) => {
      await template(page, confirmation)
      await previewCard(page).getByRole('combobox', { name: 'Preview with record' }).click()
      const list = page.getByRole('listbox').first()
      await expect(list).toBeVisible()
      return list
    },
    inStory: (page) => page.getByRole('listbox').first(),
  },
  {
    id: 'CMP-DA-G-08',
    name: 'b11-problems-alert-on-a-line',
    story: 'admin-dashboard-email-templates-problems-alert--on-a-line',
    screen: async (page) => {
      await template(page, reset)
      await page.getByRole('textbox', { name: 'Template code' }).click()
      await page.keyboard.press('ControlOrMeta+End')
      await page.keyboard.insertText('\n{{ name }')
      const alert = page.getByRole('alert').filter({ hasText: 'This template does not render' })
      await expect(alert).toBeVisible({ timeout: 15_000 })
      return alert
    },
    inStory: (page) => page.getByRole('alert').first(),
  },
  {
    id: 'CMP-DA-G-08',
    name: 'b11-history-sheet-empty',
    story: 'admin-dashboard-email-templates-history-sheet--empty',
    viewport: true,
    window: { width: 1280, height: 800 },
    screen: async (page) => {
      await template(page, reset)
      await page
        .getByRole('button', { name: /more actions|actions/i })
        .last()
        .click()
      await page.getByRole('menuitem', { name: 'History' }).click()
      await expect(page.getByText('Nothing has been published yet.')).toBeVisible({
        timeout: 15_000,
      })
      return dialog(page)
    },
    inStory: dialog,
  },
  {
    id: 'CMP-DUI-P-12',
    name: 'b11-code-editor-template',
    story: 'dashboard-ui-primitives-code-editor--template',
    window: { width: 1280, height: 1200 },
    screen: async (page) => {
      await template(page, reset)
      return page.locator('.cm-editor').first()
    },
    inStory: (page) => page.locator('.cm-editor').first(),
  },
  {
    id: 'CMP-DUI-P-12',
    name: 'b11-code-editor-suggesting-variables',
    story: 'dashboard-ui-primitives-code-editor--suggesting-variables',
    viewport: true,
    window: { width: 1280, height: 800 },
    screen: async (page) => {
      await template(page, reset)
      await page.getByRole('textbox', { name: 'Template code' }).click()
      await page.keyboard.press('ControlOrMeta+End')
      await page.keyboard.type('\nHi {{ cus')
      const list = page.getByRole('listbox').first()
      await expect(list).toBeVisible()
      return list
    },
    inStory: (page) => page.getByRole('listbox').first(),
  },
]

test.use({ viewport: { width: 1280, height: 960 } })

compareCases([...reportingCases, ...emailCases])
void inColumn
