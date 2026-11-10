import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, type Page, type Request, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { MAIL_DIR, mailTo, nextMail } from './mail'

/**
 * Batch 11's scripted checks on Spree's browser-test server (criteria 15 and
 * 16): FL-22, a report built, saved, renamed, exported and deleted, with
 * EM-S-05 read where the server writes its mail and the downloaded file
 * compared with the report on screen; and the §2.4 rows the browser-test
 * server holds: the home page's total sales and orders for a range and a
 * channel, a report's figures, each against the completed orders the Admin
 * API lists for the same range, channel and currency, and each operations
 * count against the list its link opens.
 *
 * Start the stack as for mail.spec.ts: the browser-test server with
 * `LIQUORIFY_MAIL_DIR`, the built dashboard on port 5174, and run
 * screens-batch-11.spec.ts first, which adds the orders. The report the script
 * saves is deleted at its end; the export stays in the store's history. The
 * script reads the page's own reporting requests, to learn the range and
 * channel it asked for, and changes none.
 */

const RESULTS = new URL('./results/fl-22/', import.meta.url)
const NAME = 'FL-22 sales by channel'
const RENAMED = 'FL-22 sales by channel, renamed'

function record(name: string, facts: unknown) {
  mkdirSync(RESULTS, { recursive: true })
  writeFileSync(new URL(name, RESULTS), `${JSON.stringify(facts, null, 2)}\n`)
}

const shot = (page: Page, name: string) =>
  page.screenshot({ path: new URL(`${name}.png`, RESULTS).pathname, fullPage: true })

/** An amount as shown or sent ("$6,214.22", "6214.22"), in minor units. */
function minor(text: string): bigint {
  const clean = text.replace(/[^0-9.-]/g, '')
  const negative = clean.startsWith('-')
  const [whole = '0', fraction = ''] = clean.replace('-', '').split('.')
  const value = BigInt(whole || '0') * 100n + BigInt(`${fraction}00`.slice(0, 2))
  return negative ? -value : value
}
const shown = (value: bigint) =>
  `${value < 0n ? '-' : ''}${(value < 0n ? -value : value) / 100n}.${`${(value < 0n ? -value : value) % 100n}`.padStart(2, '0')}`

interface Order {
  id: string
  number: string
  channel_id: string | null
  currency: string
  status: string
  total: string
  completed_at: string | null
}

async function read<T>(api: APIRequestContext, headers: Record<string, string>, path: string) {
  const response = await api.get(`/api/v3/admin${path}`, { headers })
  expect(response.status(), `GET ${path}`).toBe(200)
  return (await response.json()) as T
}

async function completedOrders(api: APIRequestContext, headers: Record<string, string>) {
  const orders: (Order & { refunded: bigint })[] = []
  for (let page = 1; ; page++) {
    const body = await read<{ data: Order[]; meta: { pages: number } }>(
      api,
      headers,
      `/orders?limit=100&page=${page}&q%5Bcompleted_at_not_null%5D=1`,
    )
    for (const order of body.data) {
      const refunds = await read<{ data: { amount: string }[] }>(
        api,
        headers,
        `/orders/${order.id}/refunds?limit=100`,
      )
      orders.push({
        ...order,
        refunded: refunds.data.reduce((sum, refund) => sum + minor(refund.amount), 0n),
      })
    }
    if (page >= body.meta.pages) return orders
  }
}

/**
 * What the Admin API's orders add up to for a range, channel and currency, as
 * Spree's reporting defines total sales and orders: completed, not canceled,
 * the order totals less what was refunded.
 */
function expected(
  orders: (Order & { refunded: bigint })[],
  scope: { since: string; until: string; currency: string; channel?: string },
) {
  const since = Date.parse(scope.since)
  const until = Date.parse(scope.until)
  const counted = orders.filter(
    (order) =>
      order.completed_at !== null &&
      order.status !== 'canceled' &&
      order.currency === scope.currency &&
      (!scope.channel || order.channel_id === scope.channel) &&
      Date.parse(order.completed_at) >= since &&
      Date.parse(order.completed_at) <= until,
  )
  return {
    orders: counted.length,
    total_sales: shown(
      counted.reduce((sum, order) => sum + minor(order.total) - order.refunded, 0n),
    ),
    numbers: counted.map((order) => order.number),
  }
}

/** A date the page sent, as the instant its day starts or ends in the store's zone (UTC here). */
const dayStart = (date: string) => (date.length === 10 ? `${date}T00:00:00Z` : date)
const dayEnd = (date: string) => (date.length === 10 ? `${date}T23:59:59Z` : date)

/** The report table's rows on screen, header first, as their cells' text. */
async function tableOnScreen(page: Page) {
  const table = page.getByTestId('report-table')
  await expect(table).toBeVisible({ timeout: 20_000 })
  return table.getByRole('row').evaluateAll((rows) =>
    rows.map((row) =>
      // A cell can carry a second line under its value (a comparison or a
      // marker), so only the first line is the value itself.
      [...row.querySelectorAll('th, td')].map((cell) =>
        (cell as HTMLElement).innerText.trim().split('\n')[0].trim(),
      ),
    ),
  )
}

/** Splits a CSV Spree wrote (quoted where a value needs it, rows ending CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < text.length; index++) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"'
        index++
      } else if (character === '"') quoted = false
      else cell += character
    } else if (character === '"') quoted = true
    else if (character === ',') {
      row.push(cell)
      cell = ''
    } else if (character === '\n') {
      row.push(cell.replace(/\r$/, ''))
      rows.push(row)
      row = []
      cell = ''
    } else cell += character
  }
  if (cell || row.length > 0) rows.push([...row, cell])
  return rows
}

const reportingRequest = (page: Page, matches: (body: Record<string, unknown>) => boolean) =>
  page.waitForRequest((request: Request) => {
    if (!request.url().endsWith('/api/v3/admin/reporting/query')) return false
    try {
      return matches(request.postDataJSON() as Record<string, unknown>)
    } catch {
      return false
    }
  })

test.describe('Batch 11 scripted checks', () => {
  test.skip(!MAIL_DIR, 'Start the stack with LIQUORIFY_MAIL_DIR (see mail.spec.ts)')
  test.use({ viewport: { width: 1280, height: 960 }, acceptDownloads: true })

  test('FL-22: a report built, saved, renamed, exported and deleted', async ({ page }) => {
    test.setTimeout(600_000)
    mkdirSync(RESULTS, { recursive: true })
    const session = await login(page)
    const api = page.request
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      'X-Spree-Store-Id': session.store_id,
    }
    const masked = (url: string) => new URL(url).pathname.replace(session.store_id, '<store>')
    const steps: Record<string, unknown> = {}

    // A run stopped partway leaves its report behind, and the names must be free.
    const leftovers = await read<{ data: { id: string; name: string }[] }>(
      api,
      headers,
      '/reporting/saved_reports?limit=100',
    )
    for (const report of leftovers.data.filter((item) => [NAME, RENAMED].includes(item.name))) {
      await api.delete(`/api/v3/admin/reporting/saved_reports/${report.id}`, { headers })
    }

    // Build: two metrics, grouped by sales channel, over the last four weeks.
    await page.goto(`/${session.store_id}/reports/new`)
    const builder = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Report settings' })
      .first()
    await expect(builder).toBeVisible({ timeout: 15_000 })
    await builder.getByRole('checkbox', { name: 'Total sales' }).check()
    await builder.getByRole('checkbox', { name: 'Orders', exact: true }).check()
    // A new report already covers the last four weeks, so choosing the
    // grouping is what sends the query this step reads.
    await expect(builder.getByRole('combobox', { name: 'Time range' })).toHaveText(/Last 4 weeks/)
    const answered = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/v3/admin/reporting/query') &&
        (response.request().postData() ?? '').includes('last_4_weeks') &&
        (response.request().postData() ?? '').includes('channel'),
    )
    await builder.getByRole('combobox', { name: 'Group by' }).click()
    await page.getByRole('option', { name: 'Sales channel', exact: true }).click()
    const result = (await (await answered).json()) as {
      meta: { currency: string; time_range: { since: string; until: string } }
    }
    const built = await tableOnScreen(page)
    await shot(page, '1-built')
    steps.built = { table: built, range: result.meta.time_range, currency: result.meta.currency }

    // The figures on screen against the orders the Admin API lists.
    const orders = await completedOrders(api, headers)
    const channels = (
      await read<{ data: { id: string; name: string }[] }>(api, headers, '/channels?limit=100')
    ).data
    const scope = { ...result.meta.time_range, currency: result.meta.currency }
    const byChannel = channels
      .map((channel) => ({
        channel: channel.name,
        ...expected(orders, { ...scope, channel: channel.id }),
      }))
      .filter((row) => row.orders > 0)
    const header = built[0]
    const at = (row: string[], column: string) => row[header.indexOf(column)] ?? ''
    const screenRows = built
      .slice(1)
      .filter((row) => at(row, 'Sales channel') !== 'Total')
      .map((row) => ({
        channel: at(row, 'Sales channel'),
        total_sales: shown(minor(at(row, 'Total sales'))),
        orders: Number(at(row, 'Orders')),
      }))
    const totalRow = built.find((row) => at(row, 'Sales channel') === 'Total') ?? []
    const all = expected(orders, scope)
    steps.figures = {
      screen: { rows: screenRows, total: totalRow },
      admin_api: { rows: byChannel, total: all },
    }
    expect(screenRows).toEqual(
      byChannel.map(({ channel, total_sales, orders: count }) => ({
        channel,
        total_sales,
        orders: count,
      })),
    )
    expect(shown(minor(at(totalRow, 'Total sales')))).toBe(all.total_sales)
    expect(Number(at(totalRow, 'Orders'))).toBe(all.orders)

    // Save.
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    const saveDialog = page.getByRole('dialog')
    await saveDialog.getByRole('textbox', { name: 'Name' }).fill(NAME)
    await shot(page, '2-save-dialog')
    await saveDialog.getByRole('button', { name: 'Save' }).click()
    await expect(page).toHaveURL(/\/reports\/sq_/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: NAME })).toBeVisible({ timeout: 15_000 })
    const reportId = new URL(page.url()).pathname.split('/').pop() as string
    await shot(page, '3-saved')
    const savedThroughApi = await read<{ name: string; query: unknown }>(
      api,
      headers,
      `/reporting/saved_reports/${reportId}`,
    )
    steps.saved = { path: masked(page.url()), admin_api: savedThroughApi }
    expect(savedThroughApi.name).toBe(NAME)

    // Rename.
    await page
      .getByRole('button', { name: /more actions|actions/i })
      .last()
      .click()
    await page.getByRole('menuitem', { name: 'Rename' }).click()
    const renameDialog = page.getByRole('dialog')
    await renameDialog.getByRole('textbox', { name: 'Name' }).fill(RENAMED)
    await renameDialog.getByRole('button', { name: /save|rename/i }).click()
    await expect(page.getByRole('heading', { name: RENAMED })).toBeVisible({ timeout: 15_000 })
    await shot(page, '4-renamed')
    const renamedThroughApi = await read<{ name: string }>(
      api,
      headers,
      `/reporting/saved_reports/${reportId}`,
    )
    steps.renamed = { admin_api_name: renamedThroughApi.name }
    expect(renamedThroughApi.name).toBe(RENAMED)

    // Export CSV: the download, its toast, and EM-S-05 as sent.
    const before = mailTo(session.admin_email).length
    const downloading = page.waitForEvent('download', { timeout: 180_000 })
    const started = Date.now()
    await page.getByRole('button', { name: 'Export CSV' }).click()
    const download = await downloading
    const downloaded = new URL(`export-${download.suggestedFilename()}`, RESULTS).pathname
    await download.saveAs(downloaded)
    await expect(page.getByText('Export downloaded')).toBeVisible({ timeout: 15_000 })
    await shot(page, '5-exported')
    const file = readFileSync(downloaded, 'utf8').replace(/^﻿/, '')
    const csv = parseCsv(file).filter((row) => !(row.length === 1 && row[0] === ''))
    const screenTable = await tableOnScreen(page)
    // The rank and the comparison with the previous period are screen-only
    // columns; the file carries the figures. Which columns were left out is
    // recorded with the step.
    const screenOnly = screenTable[0]
      .map((column, index) => (column === '#' || column === 'Change' ? index : -1))
      .filter((index) => index >= 0)
    const screenWithoutRank = screenTable.map((row) =>
      row.filter((_, index) => !screenOnly.includes(index)),
    )
    steps.exported = {
      file: download.suggestedFilename(),
      seconds: Math.round((Date.now() - started) / 1000),
      csv,
      screen: screenTable,
      screen_only_columns: screenOnly.map((index) => screenTable[0][index]),
    }
    // The file reads like the screen: the same columns, rows and total, the
    // amounts in the file plain where the screen formats them.
    expect(csv[0]).toEqual(screenWithoutRank[0])
    expect(
      csv.slice(1).map((row) => [row[0], shown(minor(row[1])), row[2]]),
      'the file against the screen',
    ).toEqual(screenWithoutRank.slice(1).map((row) => [row[0], shown(minor(row[1])), row[2]]))

    // The email promises a link to the file. The report page sends its
    // export with no results link, so the email carries no button: only the
    // store's home page and the support address (a candidate existing defect).
    const mail = await nextMail(session.admin_email, before)
    writeFileSync(
      new URL('em-s-05.html', RESULTS),
      mail.html.replaceAll(session.store_id, '<store>'),
    )
    const links = [...mail.html.matchAll(/href="([^"]+)"/g)].map((match) =>
      match[1].replaceAll('&amp;', '&'),
    )
    steps.email = {
      subject: mail.subject,
      seconds: Math.round((Date.now() - started) / 1000),
      promises_link: /use the link below/i.test(mail.html),
      links: [...new Set(links)],
    }
    expect(
      links.filter((href) => href.includes('/exports') || href.includes(session.store_id)),
    ).toEqual([])
    await page.setContent(mail.html)
    await shot(page, '6-export-email')

    // The built-in Sales by channel report, read the same way.
    const builtIns = await read<{ data: { id: string; name: string }[] }>(
      api,
      headers,
      '/reporting/saved_reports?limit=100',
    )
    const salesByChannel = builtIns.data.find((report) => report.name === 'Sales by channel')
    expect(salesByChannel).toBeTruthy()
    await page.goto(`/${session.store_id}/reports/${salesByChannel?.id}`)
    const builtIn = await tableOnScreen(page)
    await shot(page, '7-built-in-sales-by-channel')
    const builtInHeader = builtIn[0]
    const cell = (row: string[], column: string) => row[builtInHeader.indexOf(column)] ?? ''
    const builtInRows = builtIn
      .slice(1)
      .filter((row) => cell(row, 'Sales channel') !== 'Total')
      .map((row) => ({
        channel: cell(row, 'Sales channel'),
        total_sales: shown(minor(cell(row, 'Total sales'))),
        orders: Number(cell(row, 'Orders')),
      }))
    steps.built_in = { name: 'Sales by channel', rows: builtInRows }
    expect(builtInRows).toEqual(screenRows)

    // Delete the saved report.
    await page.goto(`/${session.store_id}/reports/${reportId}`)
    await expect(page.getByRole('heading', { name: RENAMED })).toBeVisible({ timeout: 15_000 })
    await page
      .getByRole('button', { name: /more actions|actions/i })
      .last()
      .click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    const confirm = page.getByRole('alertdialog').or(page.getByRole('dialog')).first()
    await expect(confirm.getByRole('button', { name: 'Delete' })).toBeVisible()
    await shot(page, '8-delete-confirmation')
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(page).toHaveURL(new RegExp(`/${session.store_id}/reports(\\?.*)?$`), {
      timeout: 15_000,
    })
    await expect(page.getByRole('row').filter({ hasText: RENAMED })).toHaveCount(0)
    await shot(page, '9-deleted')
    const gone = await api.get(`/api/v3/admin/reporting/saved_reports/${reportId}`, { headers })
    steps.deleted = { admin_api_status: gone.status() }
    expect(gone.status()).toBe(404)

    record('fl-22.json', steps)
  })

  test('§2.4: the home page figures and operations counts', async ({ page }) => {
    test.setTimeout(600_000)
    mkdirSync(RESULTS, { recursive: true })
    const session = await login(page)
    const api = page.request
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      'X-Spree-Store-Id': session.store_id,
    }
    const orders = await completedOrders(api, headers)
    const channels = (
      await read<{ data: { id: string; name: string }[] }>(api, headers, '/channels?limit=100')
    ).data
    const isChart = (body: Record<string, unknown>) =>
      Array.isArray(body.metrics) &&
      body.metrics.includes('total_sales') &&
      body.metrics.includes('customers')
    const tile = async (label: string) => {
      const text = await page.getByRole('button', { name: new RegExp(`^${label}`) }).innerText()
      return text.split('\n').map((line) => line.trim())[1] ?? ''
    }

    const figures: unknown[] = []
    const check = async (name: string, choose: () => Promise<void>) => {
      const sent = reportingRequest(page, isChart)
      await choose()
      const body = (await sent).postDataJSON() as {
        time_range: { since: string; until: string }
        filters?: { dimension: string; value: string }[]
        currency?: string
      }
      await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0, {
        timeout: 20_000,
      })
      await page.waitForTimeout(500)
      const channel = body.filters?.find((filter) => filter.dimension === 'channel')?.value
      const want = expected(orders, {
        since: dayStart(body.time_range.since),
        until: dayEnd(body.time_range.until),
        currency: body.currency ?? 'USD',
        channel,
      })
      const screen = {
        total_sales: shown(minor(await tile('Total sales'))),
        orders: Number((await tile('Orders')).replace(/[^0-9]/g, '')),
      }
      await shot(page, `home-${name}`)
      figures.push({
        name,
        sent: { ...body, filters: body.filters },
        channel: channels.find((item) => item.id === channel)?.name ?? 'All channels',
        screen,
        admin_api: want,
      })
      expect(screen, name).toEqual({ total_sales: want.total_sales, orders: want.orders })
    }

    await check('all-channels-last-30-days', async () => {
      await page.goto(`/${session.store_id}`)
    })
    for (const channel of channels.filter((item) =>
      ['Online Store', 'Wholesale'].includes(item.name),
    )) {
      await check(`channel-${channel.name.toLowerCase().replace(/\s+/g, '-')}`, async () => {
        await page
          .getByRole('combobox')
          .filter({ hasText: /channel|Online Store|Wholesale/ })
          .first()
          .click()
        await page.getByRole('option', { name: channel.name, exact: true }).click()
      })
    }
    await check('all-channels-last-7-days', async () => {
      await page
        .getByRole('combobox')
        .filter({ hasText: /Online Store|Wholesale/ })
        .first()
        .click()
      await page.getByRole('option', { name: 'All channels' }).click()
      await page.waitForTimeout(500)
      await page
        .getByRole('button', { name: /Last 30 days/ })
        .first()
        .click()
      await page.getByRole('button', { name: 'Last 7 days' }).click()
    })
    record('home-figures.json', figures)

    // Each operations count against the list its link opens.
    await page.goto(`/${session.store_id}`)
    const operations = page.locator('[data-slot="card"]').filter({ hasText: 'Operations' }).first()
    await expect(operations.getByRole('link').first()).toBeVisible({ timeout: 20_000 })
    const rows = await operations.getByRole('link').evaluateAll((links) =>
      links.map((link) => ({
        text: (link as HTMLElement).innerText.split('\n').map((line) => line.trim()),
        href: (link as HTMLAnchorElement).getAttribute('href') ?? '',
      })),
    )
    const counts: unknown[] = []
    for (const row of rows) {
      const label = row.text[0]
      const value = Number(row.text.find((line) => /^\d[\d,]*$/.test(line))?.replace(/,/g, ''))
      await page.goto(row.href)
      await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0, {
        timeout: 20_000,
      })
      await page.waitForTimeout(800)
      const range = await page
        .getByText(/^\d+–\d+ of \d+$/)
        .first()
        .textContent({ timeout: 3_000 })
        .catch(() => null)
      const listed = range ? Number(range.split(' of ')[1]) : 0
      const slug = label.toLowerCase().replace(/\s+/g, '-')
      await shot(page, `count-${slug}`)
      counts.push({
        label,
        count: value,
        list: decodeURIComponent(row.href).replace(session.store_id, '<store>'),
        listed,
        empty_state: range === null,
        matches: listed === value,
      })
    }
    record('operations-counts.json', counts)
    // "Payments to collect" counts placed orders that are not canceled, but its
    // link filters on payment status alone, so a canceled order that collected
    // nothing is listed too. Recorded as a candidate existing defect; any other
    // counter that disagrees with its list fails the check.
    expect(
      counts
        .filter((count) => !(count as { matches: boolean }).matches)
        .map((count) => (count as { label: string }).label),
    ).toEqual(['Payments to collect'])
  })
})
