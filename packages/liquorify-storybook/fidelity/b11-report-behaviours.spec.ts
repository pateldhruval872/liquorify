import { readFileSync } from 'node:fs'
import { expect, type Page, test } from '@playwright/test'
import { login, searchList } from '../../dashboard/e2e/helpers'
import { blockOutside, expectedToFail, nextSent, record, sabotaged, sentTo, shot } from './b11'
import { seedOrders } from './orders'
import {
  completedOrders,
  dayEnd,
  dayStart,
  expected,
  minor,
  parseCsv,
  read,
  reportingRequest,
  shown,
  tableOnScreen,
} from './reporting'
import { seed } from './staff'

/**
 * Batch 11 verification, behaviours 10 to 12 of G-100 (work item §3 and §7),
 * on Spree's browser-test server as `fl-22.spec.ts` uses it: started with
 * `LIQUORIFY_MAIL_DIR`, with Spree's sample catalog and customers, and the
 * orders `orders.ts` adds through the Admin API. Run this file with the same
 * `LIQUORIFY_MAIL_DIR`.
 *
 * Two checks are kept failing by known defects, as the work item's rules ask:
 * the export email's link to its file (SD-52) and the Payments to collect
 * count against its list (SD-51). Each is a soft check, so the rest of its
 * test still runs and the test is reported failed on that check alone.
 */

const MAIL_DIR = process.env.LIQUORIFY_MAIL_DIR ?? ''
const stamp = Date.now()
const EXPORTED = `B11 export ${stamp}`
const COPY = `B11 copy ${stamp}`

async function signIn(page: Page) {
  await blockOutside(page)
  const session = await login(page)
  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Spree-Store-Id': session.store_id,
  }
  return { session, headers }
}

async function savedReports(page: Page, headers: Record<string, string>) {
  return (
    await read<{ data: { id: string; name: string; seeded: boolean }[] }>(
      page.request,
      headers,
      '/reporting/saved_reports?limit=100',
    )
  ).data
}

async function removeReports(page: Page, headers: Record<string, string>, names: string[]) {
  for (const report of (await savedReports(page, headers)).filter((item) =>
    names.includes(item.name),
  )) {
    await page.request.delete(`/api/v3/admin/reporting/saved_reports/${report.id}`, { headers })
  }
}

/** The screen's rows without its rank and Change columns, which the file leaves out (B13). */
function withoutScreenOnly(table: string[][]) {
  const screenOnly = table[0]
    .map((column, index) => (column === '#' || column === 'Change' ? index : -1))
    .filter((index) => index >= 0)
  return table.map((row) => row.filter((_, index) => !screenOnly.includes(index)))
}

test.use({ viewport: { width: 1280, height: 960 }, acceptDownloads: true })

test.describe('Batch 11 verification: reports and the home page (behaviours 10 to 12)', () => {
  test.skip(!MAIL_DIR, 'Start the stack with LIQUORIFY_MAIL_DIR (see mail.spec.ts)')

  test.beforeAll(async ({ baseURL }) => {
    test.setTimeout(600_000)
    await seed(baseURL ?? 'http://localhost:5174')
    await seedOrders(baseURL ?? 'http://localhost:5174')
  })

  test('10. Exporting a report, and its email', async ({ page }) => {
    expectedToFail()
    test.setTimeout(300_000)
    const { session, headers } = await signIn(page)
    await removeReports(page, headers, [EXPORTED])
    const created = await page.request.post('/api/v3/admin/reporting/saved_reports', {
      headers,
      data: {
        name: EXPORTED,
        query: {
          metrics: ['total_sales', 'orders'],
          dimensions: ['channel'],
          time_range: { preset: 'last_4_weeks' },
          sort: '-total_sales',
        },
      },
    })
    expect(created.status(), await created.text()).toBe(201)
    const reportId = ((await created.json()) as { id: string }).id
    try {
      await page.goto(`/${session.store_id}/reports/${reportId}`)
      await expect(page.getByRole('heading', { name: EXPORTED })).toBeVisible({ timeout: 15_000 })
      const screen = await tableOnScreen(page)

      const before = sentTo(MAIL_DIR, session.admin_email).length
      const downloading = page.waitForEvent('download', { timeout: 180_000 })
      const started = Date.now()
      await page.getByRole('button', { name: 'Export CSV' }).click()
      const download = await downloading
      await expect(page.getByText(sabotaged('Export downloaded', 'Export refused'))).toBeVisible({
        timeout: 15_000,
      })
      await shot(page, '10-exported')
      const path = test.info().outputPath(download.suggestedFilename())
      await download.saveAs(path)
      const csv = parseCsv(readFileSync(path, 'utf8').replace(/^﻿/, '')).filter(
        (row) => !(row.length === 1 && row[0] === ''),
      )
      const onScreen = withoutScreenOnly(screen)
      expect(csv[0]).toEqual(onScreen[0])
      expect(
        csv.slice(1).map((row) => [row[0], shown(minor(row[1])), row[2]]),
        'the file against the report on screen',
      ).toEqual(onScreen.slice(1).map((row) => [row[0], shown(minor(row[1])), row[2]]))

      const mail = await nextSent(MAIL_DIR, session.admin_email, before, 60_000)
      const seconds = Math.round((Date.now() - started) / 1000)
      expect(seconds).toBeLessThanOrEqual(60)
      const links = [
        ...new Set(
          [...mail.html.matchAll(/href="([^"]+)"/g)].map((match) =>
            match[1].replaceAll('&amp;', '&'),
          ),
        ),
      ]
      record('10-export.json', {
        report: EXPORTED,
        file: download.suggestedFilename(),
        csv_rows: csv.length - 1,
        csv_matches_screen: true,
        email: { subject: mail.subject, seconds, links: links.length },
        email_links_to_file: links.some((href) => /\/exports|active_storage|download/.test(href)),
        known_defect: 'SD-52',
      })
      expect
        .soft(
          links.some((href) => /\/exports|active_storage|download/.test(href)),
          'SD-52: the export email links to the exported file',
        )
        .toBe(true)
    } finally {
      await page.request.delete(`/api/v3/admin/reporting/saved_reports/${reportId}`, { headers })
    }
  })

  test('11. Saving a copy of a built-in report, and searching and sorting the reports list', async ({
    page,
  }) => {
    expectedToFail()
    const { session, headers } = await signIn(page)
    await removeReports(page, headers, [COPY])
    const builtIn = (await savedReports(page, headers)).find(
      (report) => report.seeded && report.name === 'Sales by channel',
    )
    expect(builtIn, 'the built-in Sales by channel report').toBeTruthy()
    try {
      await page.goto(`/${session.store_id}/reports/${builtIn?.id}`)
      const builtInTable = await tableOnScreen(page)
      await page.getByRole('button', { name: 'Save a copy' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('textbox', { name: 'Name' }).fill(COPY)
      await dialog.getByRole('button', { name: 'Save' }).click()
      await expect(page).toHaveURL(/\/reports\/sq_/, { timeout: 15_000 })
      await expect(page.getByRole('heading', { name: sabotaged(COPY, `${COPY}!`) })).toBeVisible({
        timeout: 15_000,
      })
      const copyId = new URL(page.url()).pathname.split('/').pop() as string
      expect(copyId).not.toBe(builtIn?.id)
      const copyTable = await tableOnScreen(page)
      expect(withoutScreenOnly(copyTable)).toEqual(withoutScreenOnly(builtInTable))
      await shot(page, '11-copy-saved')

      await page.goto(`/${session.store_id}/reports`)
      const rows = page.locator('tbody tr')
      await expect(rows.first()).toBeVisible({ timeout: 15_000 })
      // The Name cell holds the report's name and, under it, its description.
      const listed = () =>
        page.locator('tbody tr a').evaluateAll((links) =>
          links.map((link) => ({
            name: (link.children[0] as HTMLElement | undefined)?.innerText.trim() ?? '',
            description: (link.children[1] as HTMLElement | undefined)?.innerText.trim() ?? '',
          })),
        )
      const names = async () => (await listed()).map((report) => report.name)
      await expect.poll(names, { timeout: 15_000 }).toContain(COPY)
      const all = await names()

      await searchList(page, /search reports/i, 'payments')
      await expect
        .poll(
          async () => {
            const current = await listed()
            return (
              current.length > 0 &&
              current.length < all.length &&
              current.every((report) => /payments/i.test(`${report.name} ${report.description}`))
            )
          },
          {
            timeout: 15_000,
          },
        )
        .toBe(true)
      const searched = await names()
      expect(searched.length).toBeGreaterThan(0)
      expect(searched.length).toBeLessThan(all.length)
      await shot(page, '11-searched')
      await searchList(page, /search reports/i, '')

      // Name is the list's only sortable column and its default order, so
      // the check turns the order round and back, and asserts each.
      const inNameOrder = (list: string[]) =>
        [...list].sort((first, second) =>
          first.localeCompare(second, 'en', { sensitivity: 'base' }),
        )
      const sortBy = async (direction: 'Ascending' | 'Descending') => {
        await page.getByRole('button', { name: 'Sort' }).click()
        await page.getByRole('menuitemradio', { name: 'Name' }).click()
        await page.getByRole('menuitemradio', { name: direction }).click()
        await page.keyboard.press('Escape')
      }
      await sortBy('Descending')
      await expect
        .poll(names, { timeout: 15_000 })
        .toEqual(sabotaged(inNameOrder(all).reverse(), inNameOrder(all)))
      const descending = await names()
      await sortBy('Ascending')
      await expect.poll(names, { timeout: 15_000 }).toEqual(inNameOrder(all))
      const sorted = await names()
      await shot(page, '11-sorted')
      record('11-copy-search-sort.json', {
        copied: 'Sales by channel',
        copy_figures_equal_built_in: true,
        listed: all.length,
        searched_for: 'payments',
        search_left: searched,
        sorted_by_name_descending: descending,
        sorted_by_name: sorted,
      })
    } finally {
      await removeReports(page, headers, [COPY])
    }
  })

  test("12. The home page's date range, rankings tabs and operations links", async ({ page }) => {
    expectedToFail()
    test.setTimeout(600_000)
    const { session, headers } = await signIn(page)
    const orders = await completedOrders(page.request, headers)
    const isChart = (body: Record<string, unknown>) =>
      Array.isArray(body.metrics) &&
      body.metrics.includes('total_sales') &&
      body.metrics.includes('customers')
    const tile = async (label: string) => {
      const text = await page.getByRole('button', { name: new RegExp(`^${label}`) }).innerText()
      return text.split('\n').map((line) => line.trim())[1] ?? ''
    }
    const datePicker = () => page.getByRole('button', { name: /Last \d+ days|–/ }).first()
    const ranges: unknown[] = []
    const checkRange = async (name: string, choose: () => Promise<void>) => {
      const sent = reportingRequest(page, isChart)
      await choose()
      const body = (await sent).postDataJSON() as {
        time_range: { since: string; until: string }
        currency?: string
      }
      await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0, {
        timeout: 20_000,
      })
      await page.waitForTimeout(500)
      const want = expected(orders, {
        since: dayStart(body.time_range.since),
        until: dayEnd(body.time_range.until),
        currency: body.currency ?? 'USD',
      })
      const screen = {
        total_sales: shown(minor(await tile('Total sales'))),
        orders: Number((await tile('Orders')).replace(/[^0-9]/g, '')),
      }
      await shot(page, `12-${name}`)
      ranges.push({ name, sent: body.time_range, screen, admin_api: want })
      expect(screen, name).toEqual({
        total_sales: want.total_sales,
        orders: sabotaged(want.orders, want.orders + 1),
      })
    }

    await page.goto(`/${session.store_id}`)
    await expect(page.getByText('Operations', { exact: true })).toBeVisible({ timeout: 20_000 })
    await checkRange('preset-last-7-days', async () => {
      await datePicker().click()
      await page.getByRole('button', { name: 'Last 7 days' }).click()
    })
    // A custom range: one click on a day of the complete range moves its
    // start there (B5), as batch 11's capture made it; the end stays today.
    const start = new Date()
    start.setUTCDate(Math.max(1, start.getUTCDate() - 5))
    const dayName = new RegExp(
      `${start.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })} ${start.getUTCDate()}(st|nd|rd|th), ${start.getUTCFullYear()}`,
    )
    await checkRange('custom-range', async () => {
      await datePicker().click()
      await page.getByRole('button', { name: dayName }).last().click()
      await page.getByRole('button', { name: 'Apply' }).click()
    })

    // Each rankings tab shows its rows or its empty message, never an error.
    const rankings = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Top performers in the selected period.' })
    const tabs = await rankings.getByRole('tab').allInnerTexts()
    const tabResults: unknown[] = []
    for (const name of tabs) {
      await rankings.getByRole('tab', { name }).click()
      const rowOrEmpty = rankings
        .getByText(/^1\.$/)
        .or(rankings.getByText('No data for this period yet.'))
      await expect(rowOrEmpty.first()).toBeVisible({ timeout: 20_000 })
      const shows = (await rankings.getByText(/^1\.$/).count()) > 0 ? 'its list' : 'no data'
      tabResults.push({ tab: name, shows })
      await shot(page, `12-rankings-${name.toLowerCase()}`)
    }
    expect(tabs.length).toBeGreaterThan(0)

    // Each operations count against the list its link opens.
    await page.goto(`/${session.store_id}`)
    const operations = page.locator('[data-slot="card"]').filter({ hasText: 'Operations' }).first()
    await expect(operations.getByRole('link').first()).toBeVisible({ timeout: 20_000 })
    const links = await operations.getByRole('link').evaluateAll((items) =>
      items.map((link) => ({
        text: (link as HTMLElement).innerText.split('\n').map((line) => line.trim()),
        href: (link as HTMLAnchorElement).getAttribute('href') ?? '',
      })),
    )
    const counts: { label: string; count: number; listed: number; matches: boolean }[] = []
    for (const link of links) {
      const label = link.text[0]
      const count = Number(link.text.find((line) => /^\d[\d,]*$/.test(line))?.replace(/,/g, ''))
      await page.goto(link.href)
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
      counts.push({ label, count, listed, matches: listed === count })
    }
    record('12-home.json', {
      ranges,
      rankings: tabResults,
      operations: counts.map((item) => ({
        ...item,
        known_defect: item.label === 'Payments to collect' ? 'SD-51' : null,
      })),
    })
    expect(counts.length).toBe(7)
    for (const item of counts.filter((each) => each.label !== 'Payments to collect')) {
      expect(item.listed, `${item.label}: the card against its list`).toBe(item.count)
    }
    const payments = counts.find((each) => each.label === 'Payments to collect')
    expect(payments, 'the Payments to collect link').toBeTruthy()
    expect
      .soft(payments?.listed, 'SD-51: Payments to collect against the list its link opens')
      .toBe(payments?.count)
  })
})
