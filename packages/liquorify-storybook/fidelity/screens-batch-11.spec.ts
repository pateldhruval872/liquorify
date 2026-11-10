import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, type Page, request, test } from '@playwright/test'
import { login, searchList } from '../../dashboard/e2e/helpers'
import { seedOrders } from './orders'
import {
  type AdminCredentials,
  admin,
  PASSWORD,
  roles,
  type Seeded,
  seed,
  teammates,
} from './staff'

/**
 * Captures batch 11's screens (home figures, reports and email templates) in
 * each state the work item maps (§2.1), and each of its eight permission
 * variants (§2.2). It gathers evidence for a person to review and passes
 * whenever it can capture a screen; it compares nothing.
 *
 * Two servers are used. The home page, the reports and the email settings
 * are captured on the browser-test server, as `compare.spec.ts` describes,
 * with Spree's sample catalog loaded and batch 8's orders added
 * (`orders.ts`). That server does not load the emails gem, so it lists no
 * email templates (§2.7); the templates and the editor are captured on the
 * emails gem's own test app, started by `emails-stack.spec.ts`, with the same
 * built dashboard served on `FIDELITY_EMAILS_URL` (5175 by default) and
 * pointed at it. Before the first capture the script adds the staff and roles
 * (`staff.ts`) to both servers, and a saved report to the first.
 *
 * No capture saves a change: each dialog and confirmation is captured open
 * and left unanswered. The states that need a saved change (a draft, a
 * publish, versions, a test email, a report export) are captured by the
 * flows' own scripts. Each capture is saved as
 * `results/screens/<screen ID>/<state>/<variant>-<theme>.png` with a `.json`
 * that records how the state was reached. A state reached by answering a
 * request in the browser says so in `intercepted`, and claims nothing about
 * the server.
 */

const results = new URL('./results/screens/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const emailsURL = process.env.FIDELITY_EMAILS_URL ?? 'http://localhost:5175'
const emailsApp = new URL('./results/tmp/emails-app.json', import.meta.url).pathname

type Variant =
  | 'admin'
  | 'support'
  | 'merchandiser'
  | 'analyst'
  | 'reportBuilder'
  | 'storeSettings'
  | 'emailEditor'
  | 'emailViewer'

let seeded: Seeded
let emailsSeeded: Seeded
let emailsAdmin: AdminCredentials
let savedReportId: string
let builtInReportId: string
/** What the server answers a query the builder never sends. */
let refusal: { status: number; body: Record<string, unknown> }
const hourOverAYear = {
  metrics: ['orders'],
  dimensions: [{ name: 'completed_at', grain: 'hour' }],
  time_range: { preset: 'last_12_months' },
}

interface Capture {
  screen: string
  state: string
  variant: Variant
  /** Captured on the emails gem's test app rather than the browser-test server. */
  emails?: true
  /** How the state was reached when the browser answered or held a request, for the record. */
  intercepted?: string
  /** Captured at a phone's width instead of the desktop's. */
  phone?: true
  /** Captured down the whole page, for a page taller than the window. */
  fullPage?: true
  reach: (page: Page) => Promise<unknown>
}

const phone = { width: 390, height: 844 }

const storeOf = (item: Pick<Capture, 'emails'>) =>
  item.emails ? emailsSeeded.storeId : seeded.storeId

async function signIn(page: Page, item: Capture) {
  const base = item.emails ? emailsURL : ''
  if (item.variant === 'admin' && !item.emails) {
    await login(page)
    return
  }
  const email = item.variant === 'admin' ? emailsAdmin.admin_email : teammates[item.variant].email
  const password = item.variant === 'admin' ? emailsAdmin.admin_password : PASSWORD
  const res = await page.request.post(`${base}/api/v3/admin/auth/login`, {
    data: { email, password },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto(`${base}/`)
  await expect(page).toHaveURL(new RegExp(`/${storeOf(item)}`), { timeout: 15_000 })
}

/** Pages holding a request unanswered, whose network never goes quiet. */
const holding = new WeakSet<Page>()

/** Opens a page of the store the capture is on. */
const opener = (item: Pick<Capture, 'emails'>) => async (page: Page, path: string) => {
  await page.goto(`${item.emails ? emailsURL : ''}/${storeOf(item)}${path}`)
  if (!holding.has(page)) await page.waitForLoadState('networkidle')
}
const openStore = opener({})
const openEmails = opener({ emails: true })

async function settle(page: Page) {
  try {
    await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0, { timeout: 20_000 })
    return true
  } catch {
    return false
  }
}

const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog'))

/** Answers a request with an error, as a server failing would. */
const failing = (page: Page, matches: (url: URL) => boolean, method = 'GET') =>
  page.route(matches, (route) =>
    route.request().method() === method
      ? route.fulfill({
          status: 500,
          json: { error: { code: 'internal_error', message: 'Internal server error' } },
        })
      : route.fallback(),
  )

/** Holds a request unanswered, so the screen stays loading. */
const held = (page: Page, matches: (url: URL) => boolean, method = 'GET') => {
  holding.add(page)
  return page.route(matches, (route) =>
    route.request().method() === method ? new Promise<void>(() => {}) : route.fallback(),
  )
}

const at = (path: string) => (url: URL) => url.pathname === `/api/v3/admin/${path}`

/** The real answer to a request, changed before the page reads it. */
const answered = (
  page: Page,
  matches: (url: URL) => boolean,
  change: (body: Record<string, unknown>) => Record<string, unknown>,
) =>
  page.route(matches, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    const response = await route.fetch()
    await route.fulfill({ response, json: change(await response.json()) })
  })

const directVisit = (
  screen: string,
  variant: Variant,
  path: () => string,
  emails?: true,
): Capture => ({
  screen,
  state: 'direct-visit',
  variant,
  emails,
  reach: async (page) => {
    await opener({ emails })(page, path())
    await expect(
      page
        .getByRole('heading')
        .or(page.getByRole('button', { name: /try again/i }))
        .or(page.getByText(/permission/i))
        .first(),
    ).toBeVisible({ timeout: 30_000 })
  },
})

// DA-HOME-01 Home

const home = (page: Page) => openStore(page, '')
const homeLoaded = async (page: Page) => {
  await home(page)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Operations', { exact: true })).toBeVisible({ timeout: 20_000 })
}
const toolbarSelect = (page: Page, text: RegExp) =>
  page.getByRole('combobox').filter({ hasText: text }).first()
const datePicker = (page: Page) => page.getByRole('button', { name: /Last 30 days|–/ }).first()

const homeCaptures: Capture[] = [
  ...(['admin', 'analyst', 'reportBuilder'] as const).map(
    (variant): Capture => ({
      screen: 'DA-HOME-01',
      state: 'figures',
      variant,
      fullPage: true,
      reach: homeLoaded,
    }),
  ),
  {
    screen: 'DA-HOME-01',
    state: 'figures',
    variant: 'admin',
    phone: true,
    fullPage: true,
    reach: homeLoaded,
  },
  ...['Orders', 'Average order value', 'Units sold', 'Customers'].map(
    (tile): Capture => ({
      screen: 'DA-HOME-01',
      state: `tile-${tile.toLowerCase().replaceAll(' ', '-')}`,
      variant: 'admin',
      reach: async (page) => {
        await homeLoaded(page)
        await page.getByRole('button', { name: new RegExp(`^${tile}`) }).click()
        await page.mouse.move(0, 0)
      },
    }),
  ),
  {
    screen: 'DA-HOME-01',
    state: 'one-currency',
    variant: 'admin',
    intercepted: "The store's answer lists USD alone among its supported currencies",
    reach: async (page) => {
      await answered(page, at('store'), (body) => ({ ...body, supported_currencies: ['USD'] }))
      await homeLoaded(page)
    },
  },
  {
    screen: 'DA-HOME-01',
    state: 'currency-eur',
    variant: 'admin',
    reach: async (page) => {
      await homeLoaded(page)
      await toolbarSelect(page, /^USD/).click()
      await page.getByRole('option', { name: /EUR/ }).click()
      await settle(page)
    },
  },
  {
    screen: 'DA-HOME-01',
    state: 'channel',
    variant: 'admin',
    fullPage: true,
    reach: async (page) => {
      await homeLoaded(page)
      await toolbarSelect(page, /All channels/).click()
      await page.getByRole('option', { name: 'Online Store' }).click()
      await settle(page)
    },
  },
  {
    screen: 'DA-HOME-01',
    state: 'date-picker-open',
    variant: 'admin',
    reach: async (page) => {
      await homeLoaded(page)
      await datePicker(page).click()
      await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible()
    },
  },
  {
    screen: 'DA-HOME-01',
    state: 'preset',
    variant: 'admin',
    reach: async (page) => {
      await homeLoaded(page)
      await datePicker(page).click()
      await page.getByRole('button', { name: 'Last 7 days' }).click()
      await expect(page.getByRole('button', { name: /Last 7 days/ }).first()).toBeVisible()
      await settle(page)
    },
  },
  {
    screen: 'DA-HOME-01',
    state: 'custom-range',
    variant: 'admin',
    reach: async (page) => {
      await homeLoaded(page)
      await datePicker(page).click()
      await page.getByRole('button', { name: /November 2nd, 2026/ }).click()
      await page.getByRole('button', { name: 'Apply' }).click()
      await settle(page)
    },
  },
  {
    screen: 'DA-HOME-01',
    state: 'no-data',
    variant: 'admin',
    fullPage: true,
    reach: async (page) => {
      await homeLoaded(page)
      await datePicker(page).click()
      // From a complete range a day before its start becomes the start, and
      // the next day after it the end: 1 to 5 October, before any order.
      await page
        .getByRole('button', { name: /October 1st, 2026/ })
        .last()
        .click()
      await page
        .getByRole('button', { name: /October 5th, 2026/ })
        .last()
        .click()
      await page.getByRole('button', { name: 'Apply' }).click()
      await settle(page)
    },
  },
  ...['Customers', 'Categories', 'Companies', 'Sellers'].map(
    (tab): Capture => ({
      screen: 'DA-HOME-01',
      state: `rankings-${tab.toLowerCase()}`,
      variant: 'admin',
      reach: async (page) => {
        await homeLoaded(page)
        const rankings = page
          .locator('[data-slot="card"]')
          .filter({ hasText: 'Top performers in the selected period.' })
        await rankings.getByRole('tab', { name: tab }).click()
        await settle(page)
        await rankings.evaluate((element) => element.scrollIntoView({ block: 'start' }))
      },
    }),
  ),
  {
    screen: 'DA-HOME-01',
    state: 'operations-failed',
    variant: 'admin',
    intercepted: 'The counters request is answered with a server error',
    reach: async (page) => {
      await failing(page, at('dashboard/counters'))
      await homeLoaded(page)
    },
  },
  {
    screen: 'DA-HOME-01',
    state: 'operations-none-visible',
    variant: 'admin',
    intercepted: 'The counters answer has its counters taken out',
    reach: async (page) => {
      await answered(page, at('dashboard/counters'), (body) => ({ ...body, counters: [] }))
      await homeLoaded(page)
    },
  },
  {
    screen: 'DA-HOME-01',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The reporting query is held unanswered',
    reach: async (page) => {
      await held(page, at('reporting/query'), 'POST')
      await home(page)
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    },
  },
  {
    screen: 'DA-HOME-01',
    state: 'failed',
    variant: 'admin',
    intercepted: 'The reporting query is answered with a server error',
    reach: async (page) => {
      await failing(page, at('reporting/query'), 'POST')
      await home(page)
      await expect(page.getByText('Internal server error')).toBeVisible({ timeout: 30_000 })
    },
  },
  ...(['support', 'merchandiser'] as const).map(
    (variant): Capture => ({
      screen: 'DA-HOME-01',
      state: 'unavailable',
      variant,
      reach: async (page) => {
        await home(page)
        await expect(page.getByText('Reports are unavailable for your role')).toBeVisible({
          timeout: 30_000,
        })
      },
    }),
  ),
]

// DA-RPT-01 to DA-RPT-03 Reports

const reports = async (page: Page) => {
  await openStore(page, '/reports')
  await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 15_000 })
}

const openReport = async (page: Page, id: string) => {
  await openStore(page, `/reports/${id}`)
  await expect(page.getByText('Report settings')).toBeVisible({ timeout: 15_000 })
  await settle(page)
}

const reportMenu = async (page: Page) => {
  await page
    .getByRole('button', { name: /more actions|actions/i })
    .last()
    .click()
}

/**
 * A query for the new report page's `?query=`. The router reads each search
 * value as JSON, and the page wants the query as a string, so the JSON is
 * encoded again, as the page's own links write it.
 */
const searchString = (query: Record<string, unknown>) =>
  encodeURIComponent(JSON.stringify(JSON.stringify(query)))

const newReport = (query?: Record<string, unknown>) => async (page: Page) => {
  await openStore(page, `/reports/new${query ? `?query=${searchString(query)}` : ''}`)
  await expect(page.getByText('Report settings')).toBeVisible({ timeout: 15_000 })
  await settle(page)
}

const builder = (page: Page) =>
  page.locator('[data-slot="card"]').filter({ hasText: 'Report settings' }).first()

const listCaptures: Capture[] = [
  ...(['admin', 'analyst', 'reportBuilder'] as const).map(
    (variant): Capture => ({
      screen: 'DA-RPT-01',
      state: 'listed',
      variant,
      fullPage: true,
      reach: reports,
    }),
  ),
  {
    screen: 'DA-RPT-01',
    state: 'searched',
    variant: 'admin',
    reach: async (page) => {
      await reports(page)
      await searchList(page, /search reports/i, 'payments')
      await expect(page.getByRole('row').filter({ hasText: 'First-time' })).toBeHidden({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-RPT-01',
    state: 'sorted',
    variant: 'admin',
    reach: async (page) => {
      await reports(page)
      await page.getByRole('button', { name: 'Sort' }).click()
      await page.getByRole('menuitemradio', { name: 'Name' }).click()
      await page.keyboard.press('Escape')
      await settle(page)
    },
  },
  {
    screen: 'DA-RPT-01',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await reports(page)
      await page
        .getByRole('row')
        .filter({ hasText: 'Fidelity weekly sales' })
        .getByRole('button')
        .last()
        .click()
      await page.getByRole('menuitem', { name: 'Delete' }).click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-RPT-01',
    state: 'built-in-only',
    variant: 'admin',
    intercepted: 'The saved reports answer keeps the built-in reports alone',
    reach: async (page) => {
      await answered(page, at('reporting/saved_reports'), (body) => {
        const data = (body.data as { seeded: boolean }[]).filter((report) => report.seeded)
        return { ...body, data, meta: { ...(body.meta as object), count: data.length } }
      })
      await reports(page)
    },
  },
  directVisit('DA-RPT-01', 'support', () => '/reports'),
  directVisit('DA-RPT-01', 'merchandiser', () => '/reports'),
]

const builderCaptures: Capture[] = [
  {
    screen: 'DA-RPT-02',
    state: 'empty',
    variant: 'admin',
    fullPage: true,
    reach: newReport(),
  },
  {
    screen: 'DA-RPT-02',
    state: 'time-series',
    variant: 'admin',
    fullPage: true,
    reach: async (page) => {
      await newReport()(page)
      await builder(page).getByRole('checkbox', { name: 'Total sales' }).check()
      await builder(page).getByRole('checkbox', { name: 'Orders', exact: true }).check()
      await settle(page)
    },
  },
  {
    screen: 'DA-RPT-02',
    state: 'another-group',
    variant: 'admin',
    fullPage: true,
    reach: async (page) => {
      await newReport({ metrics: ['total_sales', 'orders'] })(page)
      await builder(page).getByRole('checkbox', { name: 'Payments received' }).check()
      await settle(page)
    },
  },
  ...(['week', 'month', 'hour'] as const).map(
    (grain): Capture => ({
      screen: 'DA-RPT-02',
      state: `grain-${grain}`,
      variant: 'admin',
      fullPage: true,
      reach: newReport({
        metrics: ['total_sales', 'orders'],
        dimensions: [{ name: 'completed_at', grain }],
        time_range: { preset: grain === 'hour' ? 'today' : 'last_90_days' },
      }),
    }),
  ),
  ...(['payment_status', 'channel'] as const).map(
    (dimension): Capture => ({
      screen: 'DA-RPT-02',
      state: `grouped-${dimension.replace('_', '-')}`,
      variant: 'admin',
      fullPage: true,
      reach: newReport({
        metrics: ['total_sales', 'orders'],
        dimensions: [dimension],
        time_range: { preset: 'last_30_days' },
        sort: '-total_sales',
        limit: 10,
      }),
    }),
  ),
  {
    screen: 'DA-RPT-02',
    state: 'compared',
    variant: 'admin',
    fullPage: true,
    reach: newReport({
      metrics: ['total_sales', 'orders'],
      dimensions: [{ name: 'completed_at', grain: 'day' }],
      time_range: { preset: 'last_7_days' },
      compare: 'previous_period',
    }),
  },
  {
    screen: 'DA-RPT-02',
    state: 'filter-added',
    variant: 'admin',
    fullPage: true,
    reach: async (page) => {
      await newReport({
        metrics: ['total_sales', 'orders'],
        time_range: { preset: 'last_30_days' },
      })(page)
      await builder(page).getByRole('button', { name: 'Add filter' }).click()
      await page.getByRole('menuitem', { name: 'Payment status' }).click()
      await builder(page).getByRole('checkbox', { name: 'Paid', exact: true }).check()
      await settle(page)
    },
  },
  {
    screen: 'DA-RPT-02',
    state: 'totals-only',
    variant: 'admin',
    reach: newReport({
      metrics: ['total_sales', 'orders', 'average_order_value', 'units_sold', 'customers'],
      time_range: { preset: 'last_30_days' },
    }),
  },
  {
    screen: 'DA-RPT-02',
    state: 'no-data',
    variant: 'admin',
    reach: newReport({
      metrics: ['total_sales', 'orders'],
      dimensions: ['channel'],
      time_range: { since: '2026-10-01', until: '2026-10-05' },
      sort: '-total_sales',
    }),
  },
  {
    // The builder offers only the grains a range allows, so it never sends a
    // query the server refuses: handed one, it keeps the grain in its select
    // and asks for days.
    screen: 'DA-RPT-02',
    state: 'grain-not-offered',
    variant: 'admin',
    reach: newReport(hourOverAYear),
  },
  {
    screen: 'DA-RPT-02',
    state: 'refused',
    variant: 'admin',
    intercepted:
      "The reporting query is answered with the server's own refusal of an hour grain over twelve months",
    reach: async (page) => {
      await page.route(at('reporting/query'), (route) =>
        route.request().method() === 'POST'
          ? route.fulfill({ status: refusal.status, json: refusal.body })
          : route.fallback(),
      )
      await newReport(hourOverAYear)(page)
      await expect(page.getByText('Could not load this report')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-RPT-02',
    state: 'save-dialog',
    variant: 'admin',
    reach: async (page) => {
      await newReport({ metrics: ['total_sales', 'orders'] })(page)
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-RPT-02',
    state: 'save-refused',
    variant: 'admin',
    reach: async (page) => {
      await newReport({ metrics: ['total_sales', 'orders'] })(page)
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await dialog(page).getByRole('textbox', { name: 'Name' }).fill('Failed payments')
      await dialog(page).getByRole('button', { name: 'Save' }).click()
      await expect(dialog(page).getByText('Name has already been taken')).toBeVisible({
        timeout: 15_000,
      })
      await page.mouse.move(0, 0)
    },
  },
  {
    screen: 'DA-RPT-02',
    state: 'save-name-missing',
    variant: 'admin',
    reach: async (page) => {
      await newReport({ metrics: ['total_sales', 'orders'] })(page)
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await dialog(page).getByRole('button', { name: 'Save' }).click()
      await expect(dialog(page).getByRole('textbox', { name: 'Name' })).toHaveAttribute(
        'aria-invalid',
        'true',
      )
    },
  },
  {
    screen: 'DA-RPT-02',
    state: 'direct-visit',
    variant: 'analyst',
    reach: newReport({ metrics: ['total_sales', 'orders'] }),
  },
  {
    // The page offers Save to a role without write on reports; the server refuses it.
    screen: 'DA-RPT-02',
    state: 'save-refused-by-server',
    variant: 'analyst',
    reach: async (page) => {
      await newReport({ metrics: ['total_sales', 'orders'] })(page)
      await page.getByRole('button', { name: 'Save', exact: true }).click()
      await dialog(page).getByRole('textbox', { name: 'Name' }).fill('Analyst weekly sales')
      await dialog(page).getByRole('button', { name: 'Save' }).click()
      await expect(page.getByText(/permission|denied|not allowed/i).first()).toBeVisible({
        timeout: 15_000,
      })
      await page.mouse.move(0, 0)
    },
  },
]

const reportCaptures: Capture[] = [
  ...(['admin', 'analyst', 'reportBuilder'] as const).flatMap((variant): Capture[] => [
    {
      screen: 'DA-RPT-03',
      state: 'built-in',
      variant,
      fullPage: true,
      reach: (page) => openReport(page, builtInReportId),
    },
    {
      screen: 'DA-RPT-03',
      state: 'saved',
      variant,
      fullPage: true,
      reach: (page) => openReport(page, savedReportId),
    },
  ]),
  ...(['admin', 'reportBuilder'] as const).flatMap((variant): Capture[] => [
    {
      screen: 'DA-RPT-03',
      state: 'saved-menu',
      variant,
      reach: async (page) => {
        await openReport(page, savedReportId)
        await reportMenu(page)
        await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeVisible()
      },
    },
    {
      screen: 'DA-RPT-03',
      state: 'built-in-menu',
      variant,
      reach: async (page) => {
        await openReport(page, builtInReportId)
        await reportMenu(page)
        await expect(page.getByRole('menu')).toBeVisible()
      },
    },
  ]),
  {
    screen: 'DA-RPT-03',
    state: 'unsaved',
    variant: 'admin',
    reach: async (page) => {
      await openReport(page, savedReportId)
      await builder(page).getByRole('checkbox', { name: 'Units sold' }).check()
      await settle(page)
    },
  },
  ...(
    [
      ['rename', 'Rename'],
      ['copy', 'Save a copy'],
      ['delete-confirmation', 'Delete'],
    ] as const
  ).map(
    ([state, item]): Capture => ({
      screen: 'DA-RPT-03',
      state,
      variant: 'admin',
      reach: async (page) => {
        await openReport(page, savedReportId)
        await reportMenu(page)
        await page.getByRole('menuitem', { name: item }).click()
        await expect(dialog(page)).toBeVisible()
      },
    }),
  ),
  {
    screen: 'DA-RPT-03',
    state: 'built-in-copy',
    variant: 'admin',
    reach: async (page) => {
      await openReport(page, builtInReportId)
      await page.getByRole('button', { name: 'Save a copy' }).click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-RPT-03',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The saved report request is held unanswered',
    reach: async (page) => {
      await held(page, at(`reporting/saved_reports/${savedReportId}`))
      await openStore(page, `/reports/${savedReportId}`)
    },
  },
  {
    screen: 'DA-RPT-03',
    state: 'failed',
    variant: 'admin',
    intercepted: 'The saved report request is answered with a server error',
    reach: async (page) => {
      await failing(page, at(`reporting/saved_reports/${savedReportId}`))
      await openStore(page, `/reports/${savedReportId}`)
      await page.waitForTimeout(8_000)
    },
  },
  directVisit('DA-RPT-03', 'support', () => `/reports/${savedReportId}`),
]

// DA-SET-03 to DA-SET-05 Emails

const emailSettings = async (page: Page) => {
  await openStore(page, '/settings/emails')
  await expect(page.getByText('Email addresses').first()).toBeVisible({ timeout: 15_000 })
  await settle(page)
}

const settingsCaptures: Capture[] = [
  ...(['admin', 'storeSettings', 'emailEditor', 'emailViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-03',
      state: 'settings',
      variant,
      fullPage: true,
      reach: emailSettings,
    }),
  ),
  {
    screen: 'DA-SET-03',
    state: 'turned-off',
    variant: 'admin',
    fullPage: true,
    reach: async (page) => {
      await emailSettings(page)
      await page.getByRole('switch').first().click()
    },
  },
  {
    screen: 'DA-SET-03',
    state: 'invalid-sender',
    variant: 'admin',
    // The field is an email field, so the browser's own check stops the save
    // with a message of its own, which a screenshot does not show; the page
    // shows no message of its own.
    reach: async (page) => {
      await emailSettings(page)
      const sender = page.locator('#store-mail-from-address')
      await sender.fill('not-an-address')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect
        .poll(() => sender.evaluate((input) => (input as HTMLInputElement).validity.valid))
        .toBe(false)
      await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
    },
  },
  {
    screen: 'DA-SET-03',
    state: 'colours-changed',
    variant: 'admin',
    fullPage: true,
    reach: async (page) => {
      await emailSettings(page)
      const branding = page.locator('[data-slot="card"]').filter({ hasText: 'Branding' }).first()
      await branding.evaluate((element) => element.scrollIntoView({ block: 'start' }))
      const colour = branding.getByRole('textbox').first()
      await colour.fill('#7A2E3B')
      await colour.press('Tab')
    },
  },
  {
    screen: 'DA-SET-03',
    state: 'loading',
    variant: 'admin',
    intercepted: "The store's answer is held unanswered",
    reach: async (page) => {
      await held(page, at('store'))
      await openStore(page, '/settings/emails')
    },
  },
  {
    screen: 'DA-SET-03',
    state: 'failed',
    variant: 'admin',
    intercepted: "The store's answer is a server error",
    reach: async (page) => {
      await failing(page, at('store'))
      await openStore(page, '/settings/emails')
      await page.waitForTimeout(8_000)
    },
  },
]

const templateList = (emails?: true) => async (page: Page) => {
  await opener({ emails })(page, '/settings/emails/templates')
  await expect(page.getByRole('tab', { name: 'Templates' })).toBeVisible({ timeout: 15_000 })
  await settle(page)
}

const templatesCaptures: Capture[] = [
  {
    screen: 'DA-SET-04',
    state: 'empty',
    variant: 'admin',
    reach: templateList(),
  },
  ...(['admin', 'emailEditor', 'emailViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-04',
      state: 'listed',
      variant,
      emails: true,
      fullPage: true,
      reach: templateList(true),
    }),
  ),
  {
    screen: 'DA-SET-04',
    state: 'loading',
    variant: 'admin',
    emails: true,
    intercepted: 'The templates request is held unanswered',
    reach: async (page) => {
      await held(page, at('email_templates'))
      await openEmails(page, '/settings/emails/templates')
    },
  },
  {
    screen: 'DA-SET-04',
    state: 'failed',
    variant: 'admin',
    emails: true,
    intercepted: 'The templates request is answered with a server error',
    reach: async (page) => {
      await failing(page, at('email_templates'))
      await openEmails(page, '/settings/emails/templates')
      await page.waitForTimeout(8_000)
    },
  },
  directVisit('DA-SET-04', 'storeSettings', () => '/settings/emails/templates', true),
]

const template = (id: string) => async (page: Page) => {
  await openEmails(page, `/settings/emails/templates/${id}`)
  await expect(page.getByRole('textbox', { name: 'Template code' })).toBeVisible({
    timeout: 15_000,
  })
  // A role that may only read templates gets no preview, and a sentence saying
  // why; so does an email whose kind of record the store has none of, such as
  // a marketplace order group in a store with one seller.
  await expect(
    page
      .getByText(/^Subject: /)
      .or(page.getByText(/^Previews are rendered for people/))
      .or(page.getByText(/^There is no .* to preview this email with yet\./)),
  ).toBeVisible({ timeout: 15_000 })
}

const reset = 'spree.customer_mailer.password_reset_email'
const confirmation = 'spree.order_mailer.confirm_email'
const layout = 'layouts.spree.base_mailer'

const editor = (page: Page) => page.getByRole('textbox', { name: 'Template code' })
const previewCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({ hasText: 'Preview' }).first()

const editorCaptures: Capture[] = [
  ...(['admin', 'emailEditor', 'emailViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-05',
      state: 'default',
      variant,
      emails: true,
      fullPage: true,
      reach: template(reset),
    }),
  ),
  ...(
    [
      ['order-confirmation', confirmation],
      ['layout', layout],
      // The other nine editable customer emails, each in the editor's preview.
      ['email-order-canceled', 'spree.order_mailer.cancel_email'],
      ['email-payment-link', 'spree.order_mailer.payment_link_email'],
      ['email-order-group-confirmation', 'spree.order_group_mailer.confirm_email'],
      ['email-fulfilled', 'spree.fulfillment_mailer.fulfilled_email'],
      ['email-return-refunded', 'spree.return_mailer.refunded_email'],
      ['email-files-ready', 'spree.digital_asset_mailer.files_ready_email'],
      ['email-data-export', 'spree.customer_mailer.data_export_email'],
      ['email-newsletter-confirmation', 'spree.newsletter_mailer.email_confirmation'],
      ['email-company-invitation', 'spree.company_mailer.invitation_email'],
    ] as const
  ).map(
    ([state, id]): Capture => ({
      screen: 'DA-SET-05',
      state,
      variant: 'admin',
      emails: true,
      fullPage: true,
      reach: template(id),
    }),
  ),
  {
    screen: 'DA-SET-05',
    state: 'edited',
    variant: 'admin',
    emails: true,
    reach: async (page) => {
      await template(reset)(page)
      await editor(page).click()
      await page.keyboard.press('ControlOrMeta+End')
      await page.keyboard.type('\n<mj-text>Questions? Reply to this email.</mj-text>')
      await expect(page.getByText('Unsaved changes')).toBeVisible()
      await page.mouse.move(0, 0)
    },
  },
  {
    screen: 'DA-SET-05',
    state: 'leave-confirmation',
    variant: 'admin',
    emails: true,
    reach: async (page) => {
      await template(reset)(page)
      await editor(page).click()
      await page.keyboard.press('ControlOrMeta+End')
      await page.keyboard.type('\n<mj-text>Questions? Reply to this email.</mj-text>')
      await page.getByRole('button', { name: 'Back' }).click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-05',
    state: 'problems',
    variant: 'admin',
    emails: true,
    reach: async (page) => {
      await template(reset)(page)
      await editor(page).click()
      await page.keyboard.press('ControlOrMeta+End')
      // Inserted whole, so the editor does not close the braces as it would for typing.
      await page.keyboard.insertText('\n{{ name }')
      await expect(page.getByText('This template does not render')).toBeVisible({
        timeout: 15_000,
      })
      await page.mouse.move(0, 0)
    },
  },
  {
    screen: 'DA-SET-05',
    state: 'preview-text',
    variant: 'admin',
    emails: true,
    reach: async (page) => {
      await template(reset)(page)
      await previewCard(page).getByRole('tab', { name: 'Plain text' }).click()
      await page.mouse.move(0, 0)
    },
  },
  {
    screen: 'DA-SET-05',
    state: 'preview-phone',
    variant: 'admin',
    emails: true,
    reach: async (page) => {
      await template(reset)(page)
      await previewCard(page).getByRole('button', { name: 'Mobile width' }).click()
      await page.mouse.move(0, 0)
    },
  },
  {
    screen: 'DA-SET-05',
    state: 'choosing-record',
    variant: 'admin',
    emails: true,
    reach: async (page) => {
      await template(confirmation)(page)
      await previewCard(page).getByRole('combobox', { name: 'Preview with record' }).click()
      await expect(page.getByRole('option', { name: /R1002/ })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-05',
    state: 'chosen-record',
    variant: 'admin',
    emails: true,
    reach: async (page) => {
      await template(confirmation)(page)
      await previewCard(page).getByRole('combobox', { name: 'Preview with record' }).click()
      await page.getByRole('option', { name: /R1002/ }).click()
      await expect(page.getByText(/^Subject: .*R1002/)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-05',
    state: 'preview-unavailable',
    variant: 'admin',
    emails: true,
    intercepted: 'The preview request is answered with a server error',
    reach: async (page) => {
      await failing(page, (url) => url.pathname.endsWith('/preview'), 'POST')
      await openEmails(page, `/settings/emails/templates/${reset}`)
      // The card shows the server's own message in place of the preview.
      await expect(previewCard(page).getByText('Internal server error')).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SET-05',
    state: 'variable-inserted',
    variant: 'admin',
    emails: true,
    reach: async (page) => {
      await template(confirmation)(page)
      await page.getByRole('button', { name: /order\.total/ }).click()
      await expect(page.getByText('Unsaved changes')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-05',
    state: 'menu',
    variant: 'admin',
    emails: true,
    reach: async (page) => {
      await template(reset)(page)
      await page
        .getByRole('button', { name: /more actions|actions/i })
        .last()
        .click()
      await expect(page.getByRole('menu')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-05',
    state: 'history-empty',
    variant: 'admin',
    emails: true,
    reach: async (page) => {
      await template(reset)(page)
      await page
        .getByRole('button', { name: /more actions|actions/i })
        .last()
        .click()
      await page.getByRole('menuitem', { name: 'History' }).click()
      await expect(page.getByText('Nothing has been published yet.')).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SET-05',
    state: 'loading',
    variant: 'admin',
    emails: true,
    intercepted: 'The template request is held unanswered',
    reach: async (page) => {
      await held(page, at(`email_templates/${reset}`))
      await openEmails(page, `/settings/emails/templates/${reset}`)
    },
  },
  {
    screen: 'DA-SET-05',
    state: 'failed',
    variant: 'admin',
    emails: true,
    intercepted: 'The template request is answered with a server error',
    reach: async (page) => {
      await failing(page, at(`email_templates/${reset}`))
      await openEmails(page, `/settings/emails/templates/${reset}`)
      await page.waitForTimeout(8_000)
    },
  },
  directVisit('DA-SET-05', 'storeSettings', () => `/settings/emails/templates/${reset}`, true),
  directVisit('DA-SET-05', 'admin', () => `/settings/emails/templates/${reset}`),
]

const captures = [
  ...homeCaptures,
  ...listCaptures,
  ...builderCaptures,
  ...reportCaptures,
  ...settingsCaptures,
  ...templatesCaptures,
  ...editorCaptures,
]

test.beforeAll(async ({ baseURL: configured }) => {
  test.setTimeout(600_000)
  const baseURL = configured ?? 'http://localhost:5174'
  seeded = await seed(baseURL)
  await seedOrders(baseURL)
  emailsAdmin = JSON.parse(readFileSync(emailsApp, 'utf8')) as AdminCredentials
  emailsSeeded = await seed(emailsURL, emailsAdmin)

  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const list = (await (
      await api.get('/api/v3/admin/reporting/saved_reports?limit=100', { headers })
    ).json()) as { data: { id: string; name: string; seeded: boolean }[] }
    const refused = await api.post('/api/v3/admin/reporting/query', {
      headers,
      data: hourOverAYear,
    })
    refusal = { status: refused.status(), body: await refused.json() }
    expect(refusal.status, 'the server refuses an hour grain over twelve months').toBe(422)
    builtInReportId = list.data.find((report) => report.name === 'Failed payments')?.id as string
    expect(builtInReportId, 'the built-in Failed payments report is listed').toBeTruthy()
    const saved = list.data.find((report) => report.name === 'Fidelity weekly sales')
    if (saved) {
      savedReportId = saved.id
    } else {
      const created = await api.post('/api/v3/admin/reporting/saved_reports', {
        headers,
        data: {
          name: 'Fidelity weekly sales',
          description: 'Sales and orders by week, compared with the weeks before.',
          query: {
            metrics: ['total_sales', 'orders'],
            dimensions: [{ name: 'completed_at', grain: 'week' }],
            time_range: { preset: 'last_90_days' },
            compare: 'previous_period',
          },
        },
      })
      expect(created.status(), await created.text()).toBe(201)
      savedReportId = ((await created.json()) as { id: string }).id
    }
  } finally {
    await api.dispose()
  }
})

test.use({ viewport: { width: 1280, height: 960 } })

async function blockOutside(page: Page): Promise<string[]> {
  const outside: string[] = []
  await page.context().route(
    (url) =>
      !['data:', 'blob:', 'about:'].includes(url.protocol) &&
      !['localhost', '127.0.0.1'].includes(url.hostname),
    (route) => {
      outside.push(route.request().url())
      return route.abort()
    },
  )
  return outside
}

async function save(
  page: Page,
  item: Capture,
  theme: 'light' | 'dark',
  settled: boolean | null,
  outside: string[],
) {
  const folder = `${results}${item.screen}/${item.state}/`
  const name = `${item.variant}${item.phone ? '-phone' : ''}-${theme}`
  mkdirSync(folder, { recursive: true })
  const window = page.viewportSize()
  if (item.fullPage && window) {
    // The page scrolls inside the shell, not the document, so a full-page
    // screenshot would stop at the window: the window grows to the page instead.
    const hidden = await page.evaluate(() =>
      Math.max(
        0,
        ...[...document.querySelectorAll('*')]
          .filter((element) => /(auto|scroll)/.test(getComputedStyle(element).overflowY))
          .map((element) => element.scrollHeight - element.clientHeight),
      ),
    )
    if (hidden > 0) {
      await page.setViewportSize({ width: window.width, height: window.height + hidden })
      await page.waitForTimeout(300)
    }
  }
  const captured = page.viewportSize()
  await page.screenshot({ path: `${folder}${name}.png`, fullPage: item.fullPage ?? false })
  const path = new URL(page.url())
  writeFileSync(
    `${folder}${name}.json`,
    JSON.stringify(
      {
        screen: item.screen,
        state: item.state,
        variant: item.variant,
        role: item.variant === 'admin' ? null : roles[teammates[item.variant].role],
        server: item.emails ? 'emails gem test app' : 'browser-test server',
        theme,
        revision,
        path: path.pathname.replace(storeOf(item), '<store>'),
        viewport: window,
        fullPage: item.fullPage ?? false,
        capturedHeight: captured?.height ?? null,
        intercepted: item.intercepted ?? null,
        settled,
        outside,
      },
      null,
      2,
    ),
  )
}

for (const theme of ['light', 'dark'] as const) {
  for (const item of captures) {
    const label = `${item.screen} ${item.state} ${item.variant}${item.phone ? ' phone' : ''} ${theme}`
    test(label, async ({ page }) => {
      if (item.phone) await page.setViewportSize(phone)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      await signIn(page, item)
      await item.reach(page)
      const holds = holding.has(page)
      const settled = holds ? null : await settle(page)
      await page.waitForTimeout(holds ? 1500 : 400)
      await save(page, item, theme, settled, outside)
    })
  }
}
