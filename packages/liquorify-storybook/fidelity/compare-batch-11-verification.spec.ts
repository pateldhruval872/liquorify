import { expect, type Page, request, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { CONFIRMATION, EMAILS_URL, emailsAdmin, RESET } from './b11'
import { adminPage, type Case, compareCases } from './comparison'
import { admin, PASSWORD, seed, teammates } from './staff'

/**
 * Batch 11 verification, criterion 3 (work item §5): the stories the image
 * review list sends to this work item, compared with the running screens where
 * the verification's runs reach their state, as `compare-batch-11.spec.ts`
 * compares batch 11's first 30 cases. The reports are opened on the
 * browser-test server, the email templates on the emails gem's test app. The
 * comparison is diagnostic: it passes whenever it captures both sides, and a
 * person reviews the images and styles.
 *
 * Cases that need a published version publish one through the Admin API as the
 * emails app's admin and revert it afterwards. The email viewer's cases sign in
 * as the viewer role `staff.ts` adds.
 */

const storyRoot = (page: Page) => page.locator('#storybook-root > *').first()
const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).first()
const card = (page: Page, text: string | RegExp) =>
  page.locator('[data-slot="card"]').filter({ hasText: text }).first()

// The reports, on the browser-test server

const builder = (page: Page) => card(page, 'Report settings')
const reportView = (page: Page) => builder(page).locator('xpath=following-sibling::*[1]')

const newReport = async (page: Page, query?: Record<string, unknown>) => {
  await adminPage(
    page,
    `/reports/new${query ? `?query=${encodeURIComponent(JSON.stringify(JSON.stringify(query)))}` : ''}`,
  )
  await expect(builder(page)).toBeVisible({ timeout: 15_000 })
  // With no metric the page sends no query, so the report keeps its loading
  // placeholders under the builder's own message.
  if (Array.isArray(query?.metrics) && query.metrics.length === 0) {
    await expect(builder(page).getByText('Pick at least one metric.')).toBeVisible()
    return
  }
  await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0, { timeout: 20_000 })
}

const homeMetrics = ['total_sales', 'orders', 'average_order_value', 'units_sold', 'customers']
const channelQuery = {
  metrics: ['total_sales', 'orders'],
  dimensions: ['channel'],
  time_range: { preset: 'last_4_weeks' },
  sort: '-total_sales',
  limit: 50,
}
const overTime = (metrics: string[], grain: string, fields: Record<string, unknown> = {}) => ({
  metrics,
  dimensions: [{ name: 'completed_at', grain }],
  time_range: { preset: 'last_4_weeks' },
  ...fields,
})
const newReportQuery = overTime(['total_sales', 'orders'], 'day', { compare: 'previous_period' })

const view = (
  name: string,
  story: string,
  query: Record<string, unknown>,
  then?: (page: Page) => Promise<void>,
): Case => ({
  id: 'CMP-DA-G-17',
  name: `b11v-report-view-${name}`,
  story: `admin-dashboard-reporting-report-view--${story}`,
  window: { width: 1280, height: 1600 },
  screen: async (page) => {
    await newReport(page, query)
    if (then) await then(page)
    return reportView(page)
  },
  inStory: (page) => storyRoot(page).locator(':scope > *').first(),
})

const builderCase = (name: string, story: string, query: Record<string, unknown>): Case => ({
  id: 'CMP-DA-G-17',
  name: `b11v-report-builder-${name}`,
  story: `admin-dashboard-reporting-report-builder--${story}`,
  window: { width: 1280, height: 1800 },
  screen: async (page) => {
    await newReport(page, query)
    return builder(page)
  },
  inStory: (page) => card(page, 'Report settings'),
})

const builderMenu = (name: string, story: string, combobox: string): Case => ({
  id: 'CMP-DA-G-17',
  name: `b11v-report-builder-${name}`,
  story: `admin-dashboard-reporting-report-builder--${story}`,
  viewport: true,
  window: { width: 1280, height: 800 },
  screen: async (page) => {
    await newReport(page, newReportQuery)
    await builder(page).getByRole('combobox', { name: combobox }).click()
    const list = page.getByRole('listbox').first()
    await expect(list).toBeVisible()
    return list
  },
  inStory: (page) => page.getByRole('listbox').first(),
})

/** A saved report's id, made through the Admin API for a case and removed after it. */
let caseReportId = ''

const reportingCases: Case[] = [
  view('over-time', 'not-compared', overTime(['total_sales', 'orders'], 'day')),
  view(
    'five-figures',
    'five-figures',
    overTime(homeMetrics, 'day', { compare: 'previous_period' }),
  ),
  view(
    'another-figure',
    'another-figure',
    overTime(homeMetrics, 'day', { compare: 'previous_period' }),
    async (page) => {
      await reportView(page)
        .getByRole('button', { name: /^Orders/ })
        .click()
      await page.mouse.move(0, 0)
    },
  ),
  view('by-week', 'weekly', overTime(['total_sales', 'orders'], 'week')),
  view(
    'by-month',
    'monthly',
    overTime(['gross_sales', 'discounts', 'returns', 'net_sales'], 'month', {
      time_range: { preset: 'last_12_months' },
    }),
  ),
  view('by-hour', 'hourly', overTime(['orders'], 'hour', { time_range: { preset: 'today' } })),
  view(
    'no-orders',
    'no-orders',
    overTime(['total_sales', 'orders'], 'day', {
      compare: 'previous_period',
      time_range: { since: '2026-10-01', until: '2026-10-05' },
    }),
  ),
  view('totals-compared', 'totals-compared', {
    metrics: homeMetrics,
    time_range: { preset: 'last_4_weeks' },
    compare: 'previous_period',
  }),
  view('ranked-compared', 'ranked-compared', { ...channelQuery, compare: 'previous_period' }),
  view('by-customer', 'customers', { ...channelQuery, dimensions: ['customer'] }),
  view('by-payment-status', 'payment-status', { ...channelQuery, dimensions: ['payment_status'] }),
  builderCase('no-metric', 'no-metric', { ...newReportQuery, metrics: [] }),
  builderCase('grouped-by-product', 'grouped-by-product', {
    ...channelQuery,
    metrics: ['net_sales', 'units_sold'],
    dimensions: ['product'],
    sort: '-net_sales',
  }),
  builderCase('not-compared', 'not-compared', { ...newReportQuery, compare: undefined }),
  builderMenu('choosing-group', 'choosing-group', 'Group by'),
  builderMenu('choosing-grain', 'choosing-grain', 'Interval'),
  builderMenu('choosing-range', 'choosing-range', 'Time range'),
  {
    id: 'CMP-DA-G-17',
    name: 'b11v-report-builder-adding-filter',
    story: 'admin-dashboard-reporting-report-builder--adding-filter',
    viewport: true,
    window: { width: 1280, height: 800 },
    screen: async (page) => {
      await newReport(page, newReportQuery)
      await builder(page).getByRole('button', { name: 'Add filter' }).click()
      const menu = page.getByRole('menu').first()
      await expect(menu.getByRole('menuitem', { name: 'Payment status' })).toBeVisible()
      return menu
    },
    inStory: (page) => page.getByRole('menu').first(),
  },
  {
    id: 'CMP-DA-G-17',
    name: 'b11v-save-report-dialog-copy',
    story: 'admin-dashboard-reporting-save-report-dialog--copy',
    viewport: true,
    window: { width: 1280, height: 800 },
    screen: async (page) => {
      const session = await login(page)
      const list = (await (
        await page.request.get('/api/v3/admin/reporting/saved_reports?limit=100', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'X-Spree-Store-Id': session.store_id,
          },
        })
      ).json()) as { data: { id: string; name: string; seeded: boolean }[] }
      const builtIn = list.data.find(
        (report) => report.seeded && report.name === 'Sales by channel',
      )
      await page.goto(`/${session.store_id}/reports/${builtIn?.id}`)
      await page.getByRole('button', { name: 'Save a copy' }).click()
      await expect(dialog(page)).toBeVisible()
      return dialog(page)
    },
    inStory: dialog,
  },
  {
    id: 'CMP-DA-G-17',
    name: 'b11v-save-report-dialog-rename',
    story: 'admin-dashboard-reporting-save-report-dialog--rename',
    viewport: true,
    window: { width: 1280, height: 800 },
    screen: async (page) => {
      const session = await login(page)
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        'X-Spree-Store-Id': session.store_id,
      }
      const created = await page.request.post('/api/v3/admin/reporting/saved_reports', {
        headers,
        data: {
          name: `Weekend sales ${Date.now()}`,
          query: overTime(['total_sales', 'orders'], 'week'),
        },
      })
      expect(created.status(), await created.text()).toBe(201)
      caseReportId = ((await created.json()) as { id: string }).id
      await page.goto(`/${session.store_id}/reports/${caseReportId}`)
      await page
        .getByRole('button', { name: /more actions|actions/i })
        .last()
        .click()
      await page.getByRole('menuitem', { name: 'Rename' }).click()
      await expect(dialog(page)).toBeVisible()
      return dialog(page)
    },
    inStory: dialog,
    after: async () => {
      if (!caseReportId) return
      const api = await request.newContext({
        baseURL: process.env.FIDELITY_BASE_URL ?? 'http://localhost:5174',
      })
      const { headers } = await admin(api)
      await api.delete(`/api/v3/admin/reporting/saved_reports/${caseReportId}`, { headers })
      await api.dispose()
      caseReportId = ''
    },
  },
  {
    id: 'CMP-DUI-P-19',
    name: 'b11v-date-range-picker-custom-range',
    story: 'dashboard-ui-primitives-date-range-picker--custom-range',
    screen: async (page) => {
      await adminPage(page, '')
      await expect(page.getByText('Operations', { exact: true })).toBeVisible({ timeout: 20_000 })
      await page
        .getByRole('button', { name: /Last 30 days/ })
        .first()
        .click()
      // One click on a day of the current month moves the range's start
      // there (B5); the end stays today.
      const start = new Date()
      start.setUTCDate(Math.max(1, start.getUTCDate() - 5))
      await page
        .getByRole('button', {
          name: new RegExp(
            `${start.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })} ${start.getUTCDate()}(st|nd|rd|th), ${start.getUTCFullYear()}`,
          ),
        })
        .last()
        .click()
      await page.getByRole('button', { name: 'Apply' }).click()
      await page.mouse.move(0, 0)
      return page.getByRole('button', { name: /–/ }).first()
    },
    inStory: (page) => page.getByRole('button', { name: /–/ }).first(),
  },
  {
    id: 'CMP-DA-G-17',
    name: 'b11v-report-builder-another-family',
    story: 'admin-dashboard-reporting-report-builder--another-family',
    window: { width: 1280, height: 1800 },
    screen: async (page) => {
      await newReport(page, newReportQuery)
      await builder(page).getByRole('checkbox', { name: 'Payments received' }).click()
      await expect(builder(page).getByRole('checkbox', { name: 'Total sales' })).not.toBeChecked()
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
      await page.mouse.move(0, 0)
      return builder(page)
    },
    inStory: (page) => card(page, 'Report settings'),
  },
  builderCase('custom-range', 'custom-range', {
    ...newReportQuery,
    time_range: { since: '2026-09-07', until: '2026-09-20' },
  }),
  builderCase('filtered', 'filtered', {
    ...overTime(['total_sales', 'orders'], 'day'),
    // The story adds a channel; one payment status filter reaches the
    // same filter rows.
    filters: [{ dimension: 'payment_status', op: 'in', value: ['paid', 'partially_refunded'] }],
  }),
  ...(
    [
      ['new-report', 'new-report', newReportQuery],
      ['ranking', 'ranking', channelQuery],
    ] as const
  ).map(
    ([name, story, query]): Case => ({
      id: 'CMP-DA-G-17',
      name: `b11v-report-workspace-${name}`,
      story: `admin-dashboard-reporting-report-workspace--${story}`,
      window: { width: 1280, height: 1800 },
      screen: async (page) => {
        await newReport(page, query)
        return builder(page).locator('xpath=..')
      },
      inStory: (page) => storyRoot(page).locator(':scope > *').first(),
    }),
  ),
  ...(
    [
      ['this-period', 'this-period', overTime(['total_sales', 'orders'], 'day')],
      [
        'no-figures',
        'no-figures',
        overTime(['total_sales', 'orders'], 'day', {
          compare: 'previous_period',
          time_range: { since: '2026-10-01', until: '2026-10-05' },
        }),
      ],
      ['tooltip', 'tooltip', newReportQuery],
    ] as const
  ).map(
    ([name, story, query]): Case => ({
      id: 'CMP-DUI-P-10',
      name: `b11v-chart-${name}`,
      story: `dashboard-ui-primitives-chart--${story}`,
      screen: async (page) => {
        await newReport(page, query)
        const chart = reportView(page).locator('[data-slot="chart"]').first()
        if (name === 'tooltip') {
          const box = await chart.boundingBox()
          if (box) await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2)
          await expect(page.locator('.recharts-tooltip-wrapper').first()).toBeVisible()
        }
        return chart
      },
      inStory: (page) => page.locator('[data-slot="chart"]').first(),
    }),
  ),
]

// The email templates, on the emails gem's test app

const LAYOUT = 'layouts.spree.base_mailer'

const emailsPage = async (page: Page, path: string, as?: 'emailViewer') => {
  const creds = emailsAdmin()
  const email = as ? teammates[as].email : creds.admin_email
  const password = as ? PASSWORD : creds.admin_password
  const res = await page.request.post(`${EMAILS_URL}/api/v3/admin/auth/login`, {
    data: { email, password },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto(`${EMAILS_URL}/${creds.store_id}${path}`)
  await page.waitForLoadState('networkidle')
}

const template = async (page: Page, id: string, as?: 'emailViewer') => {
  await emailsPage(page, `/settings/emails/templates/${id}`, as)
  await expect(page.getByRole('textbox', { name: 'Template code' })).toBeVisible({
    timeout: 15_000,
  })
}

/** The emails app's admin, for publishing a version through the Admin API. */
async function emailsApi() {
  const creds = emailsAdmin()
  const api = await request.newContext({ baseURL: EMAILS_URL })
  const login = await api.post('/api/v3/admin/auth/login', {
    data: { email: creds.admin_email, password: creds.admin_password },
  })
  const token = ((await login.json()) as { token: string }).token
  return {
    api,
    headers: { Authorization: `Bearer ${token}`, 'X-Spree-Store-Id': creds.store_id },
  }
}

/** Publishes two versions of the password reset, so its history has an earlier one to restore. */
async function publishTwice() {
  const { api, headers } = await emailsApi()
  await seed(EMAILS_URL, emailsAdmin())
  const current = (await (
    await api.get(`/api/v3/admin/email_templates/${RESET}?language=en`, { headers })
  ).json()) as { default_subject: string; default_body: string }
  for (const suffix of [' (first)', ' (second)']) {
    const draft = await api.put(`/api/v3/admin/email_templates/${RESET}/draft`, {
      headers,
      data: {
        language: 'en',
        subject: `${current.default_subject}${suffix}`,
        body: current.default_body,
      },
    })
    expect(draft.status(), await draft.text()).toBe(200)
    const published = await api.post(`/api/v3/admin/email_templates/${RESET}/publication`, {
      headers,
      data: { language: 'en' },
    })
    expect(published.status(), await published.text()).toBe(201)
  }
  await api.dispose()
}

async function revert() {
  const { api, headers } = await emailsApi()
  await api.delete(`/api/v3/admin/email_templates/${RESET}?language=en`, { headers })
  await api.dispose()
}

const openHistory = async (page: Page) => {
  await page
    .getByRole('button', { name: /more actions|actions/i })
    .last()
    .click()
  await page.getByRole('menuitem', { name: 'History' }).click()
  await expect(dialog(page).getByText('Latest')).toBeVisible({ timeout: 15_000 })
  await page.mouse.move(0, 0)
}

const previewCard = (page: Page) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText('Preview', { exact: true }) })
    .first()
const variablesCard = (page: Page) => card(page, 'Data this email can show.')

const emailCases: Case[] = [
  {
    id: 'CMP-DA-G-08',
    name: 'b11v-history-sheet-versions',
    story: 'admin-dashboard-email-templates-history-sheet--versions',
    viewport: true,
    window: { width: 1280, height: 800 },
    screen: async (page) => {
      await publishTwice()
      await template(page, RESET)
      await openHistory(page)
      return dialog(page)
    },
    inStory: dialog,
    after: revert,
  },
  {
    id: 'CMP-DA-G-08',
    name: 'b11v-history-sheet-restoring',
    story: 'admin-dashboard-email-templates-history-sheet--restoring',
    viewport: true,
    window: { width: 1280, height: 800 },
    screen: async (page) => {
      await publishTwice()
      await template(page, RESET)
      await openHistory(page)
      await dialog(page).getByRole('button', { name: 'Restore' }).nth(1).click()
      const confirmation = page.getByRole('alertdialog').or(page.getByRole('dialog')).last()
      await expect(confirmation.getByText('Restore this version?')).toBeVisible()
      return confirmation
    },
    inStory: (page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).last(),
    after: revert,
  },
  {
    id: 'CMP-DA-G-08',
    name: 'b11v-history-sheet-read-only',
    story: 'admin-dashboard-email-templates-history-sheet--read-only',
    viewport: true,
    window: { width: 1280, height: 800 },
    screen: async (page) => {
      await publishTwice()
      await template(page, RESET, 'emailViewer')
      await openHistory(page)
      return dialog(page)
    },
    inStory: dialog,
    after: revert,
  },
  {
    id: 'CMP-DA-G-08',
    name: 'b11v-variables-card-read-only',
    story: 'admin-dashboard-email-templates-variables-card--read-only',
    window: { width: 1280, height: 1200 },
    screen: async (page) => {
      await seed(EMAILS_URL, emailsAdmin())
      await template(page, RESET, 'emailViewer')
      return variablesCard(page)
    },
    inStory: (page) => storyRoot(page).locator('[data-slot="card"]').first(),
  },
  {
    id: 'CMP-DA-G-08',
    name: 'b11v-variables-card-inserting',
    story: 'admin-dashboard-email-templates-variables-card--inserting',
    window: { width: 1280, height: 1200 },
    screen: async (page) => {
      await template(page, CONFIRMATION)
      await page.getByRole('button', { name: 'Insert order.total' }).hover()
      return variablesCard(page)
    },
    inStory: (page) => storyRoot(page).locator('[data-slot="card"]').first(),
  },
  {
    id: 'CMP-DA-G-08',
    name: 'b11v-preview-card-needs-permission',
    story: 'admin-dashboard-email-templates-preview-card--needs-permission',
    window: { width: 1280, height: 1200 },
    screen: async (page) => {
      await template(page, RESET, 'emailViewer')
      await expect(page.getByText(/^Previews are rendered for people/)).toBeVisible({
        timeout: 15_000,
      })
      return previewCard(page)
    },
    inStory: (page) => storyRoot(page).locator('[data-slot="card"]').first(),
  },
  {
    id: 'CMP-DUI-P-12',
    name: 'b11v-code-editor-read-only',
    story: 'dashboard-ui-primitives-code-editor--read-only',
    window: { width: 1280, height: 1200 },
    screen: async (page) => {
      await template(page, RESET, 'emailViewer')
      return page.locator('.cm-editor').first()
    },
    inStory: (page) => page.locator('.cm-editor').first(),
  },
  {
    id: 'CMP-DA-G-08',
    name: 'b11v-conflict-dialog',
    story: 'admin-dashboard-email-templates-conflict-dialog--saved-first',
    viewport: true,
    window: { width: 1280, height: 800 },
    screen: async (page) => {
      await template(page, RESET)
      const subject = page.getByRole('textbox', { name: 'Subject', exact: true })
      await subject.click()
      await page.keyboard.press('End')
      await page.keyboard.type(' first')
      await page.getByRole('button', { name: 'Save draft' }).click()
      await expect(page.getByText('Draft saved')).toBeVisible({ timeout: 15_000 })
      await subject.click()
      await page.keyboard.press('End')
      await page.keyboard.type(' mine')
      const { api, headers } = await emailsApi()
      const current = (await (
        await api.get(`/api/v3/admin/email_templates/${RESET}?language=en`, { headers })
      ).json()) as { draft: { lock_version: number; body: string; subject: string } }
      await api.put(`/api/v3/admin/email_templates/${RESET}/draft`, {
        headers,
        data: {
          language: 'en',
          subject: `${current.draft.subject} theirs`,
          body: current.draft.body,
          lock_version: current.draft.lock_version,
        },
      })
      await api.dispose()
      await page.getByRole('button', { name: 'Save draft' }).click()
      const conflict = page.getByRole('alertdialog').or(page.getByRole('dialog')).last()
      await expect(conflict.getByText('Someone else saved this draft')).toBeVisible({
        timeout: 15_000,
      })
      await page.mouse.move(0, 0)
      return conflict
    },
    inStory: (page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).last(),
    after: revert,
  },
  ...(
    [
      ['desktop', 'desktop', undefined],
      ['phone', 'phone', 'Mobile width'],
      ['plain-text', 'plain-text', 'Plain text'],
    ] as const
  ).map(
    ([name, story, control]): Case => ({
      id: 'CMP-DA-G-08',
      name: `b11v-email-preview-frame-${name}`,
      story: `admin-dashboard-email-templates-email-preview-frame--${story}`,
      window: { width: 1280, height: 1200 },
      screen: async (page) => {
        await template(page, RESET)
        const card = previewCard(page)
        await expect(card.locator('iframe')).toBeVisible({ timeout: 15_000 })
        if (control === 'Plain text') await card.getByRole('tab', { name: control }).click()
        if (control === 'Mobile width') await card.getByRole('button', { name: control }).click()
        await page.mouse.move(0, 0)
        return control === 'Plain text'
          ? card.locator('pre').first()
          : card.locator('iframe').locator('xpath=..')
      },
      inStory: (page) => storyRoot(page).locator(':scope > *').first(),
    }),
  ),
  {
    id: 'CMP-DUI-P-12',
    name: 'b11v-code-editor-problem',
    story: 'dashboard-ui-primitives-code-editor--problem',
    window: { width: 1280, height: 1200 },
    screen: async (page) => {
      await template(page, RESET)
      await page.getByRole('textbox', { name: 'Template code' }).click()
      await page.keyboard.press('ControlOrMeta+End')
      await page.keyboard.insertText('\n{{ name }')
      await expect(
        page.getByRole('alert').filter({ hasText: 'This template does not render' }),
      ).toBeVisible({ timeout: 15_000 })
      await page.mouse.move(0, 0)
      return page.locator('.cm-editor').first()
    },
    inStory: (page) => page.locator('.cm-editor').first(),
  },
  {
    id: 'CMP-DUI-P-12',
    name: 'b11v-code-editor-suggesting-fields',
    story: 'dashboard-ui-primitives-code-editor--suggesting-fields',
    viewport: true,
    window: { width: 1280, height: 800 },
    screen: async (page) => {
      await template(page, RESET)
      await page.getByRole('textbox', { name: 'Template code' }).click()
      await page.keyboard.press('ControlOrMeta+End')
      await page.keyboard.type('\nHi {{ customer.')
      const list = page.getByRole('listbox').first()
      await expect(list).toBeVisible()
      return list
    },
    inStory: (page) => page.getByRole('listbox').first(),
  },
  {
    // A layout that does not render breaks every email it wraps, so saving
    // one lists each email's problem. The draft is reverted after the case.
    id: 'CMP-DA-G-08',
    name: 'b11v-problems-alert-in-several-emails',
    story: 'admin-dashboard-email-templates-problems-alert--in-several-emails',
    screen: async (page) => {
      await template(page, LAYOUT)
      await page.getByRole('textbox', { name: 'Template code' }).click()
      await page.keyboard.press('ControlOrMeta+End')
      await page.keyboard.insertText("\n{{ 'x' | monee }}")
      await page.getByRole('button', { name: 'Save draft' }).click()
      const alert = page.getByRole('alert').filter({ hasText: 'This template does not render' })
      await expect(alert).toBeVisible({ timeout: 15_000 })
      return alert
    },
    inStory: (page) => page.getByRole('alert').first(),
    after: async () => {
      const { api, headers } = await emailsApi()
      await api.delete(`/api/v3/admin/email_templates/${LAYOUT}?language=en`, { headers })
      await api.dispose()
    },
  },
]

test.use({ viewport: { width: 1280, height: 960 } })

compareCases([...reportingCases, ...emailCases])
