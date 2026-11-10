import { type APIRequestContext, expect, type Page, type Request } from '@playwright/test'

/**
 * Reading reports and the orders behind them, shared by batch 11's FL-22
 * script (`fl-22.spec.ts`) and its verification tests
 * (`b11-report-behaviours.spec.ts`).
 */

/** An amount as shown or sent ("$6,214.22", "6214.22"), in minor units. */
export function minor(text: string): bigint {
  const clean = text.replace(/[^0-9.-]/g, '')
  const negative = clean.startsWith('-')
  const [whole = '0', fraction = ''] = clean.replace('-', '').split('.')
  const value = BigInt(whole || '0') * 100n + BigInt(`${fraction}00`.slice(0, 2))
  return negative ? -value : value
}
export const shown = (value: bigint) =>
  `${value < 0n ? '-' : ''}${(value < 0n ? -value : value) / 100n}.${`${(value < 0n ? -value : value) % 100n}`.padStart(2, '0')}`

export interface Order {
  id: string
  number: string
  channel_id: string | null
  currency: string
  status: string
  total: string
  completed_at: string | null
}

export async function read<T>(
  api: APIRequestContext,
  headers: Record<string, string>,
  path: string,
) {
  const response = await api.get(`/api/v3/admin${path}`, { headers })
  expect(response.status(), `GET ${path}`).toBe(200)
  return (await response.json()) as T
}

export async function completedOrders(api: APIRequestContext, headers: Record<string, string>) {
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
export function expected(
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
export const dayStart = (date: string) => (date.length === 10 ? `${date}T00:00:00Z` : date)
export const dayEnd = (date: string) => (date.length === 10 ? `${date}T23:59:59Z` : date)

/** The report table's rows on screen, header first, as their cells' text. */
export async function tableOnScreen(page: Page) {
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
export function parseCsv(text: string): string[][] {
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

export const reportingRequest = (page: Page, matches: (body: Record<string, unknown>) => boolean) =>
  page.waitForRequest((request: Request) => {
    if (!request.url().endsWith('/api/v3/admin/reporting/query')) return false
    try {
      return matches(request.postDataJSON() as Record<string, unknown>)
    } catch {
      return false
    }
  })
