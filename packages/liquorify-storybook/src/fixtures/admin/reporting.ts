import type {
  ReportingDimensionValue,
  ReportingMetricValue,
  ReportingQuery,
  ReportingResult,
  ReportingRow,
  ReportingSchema,
} from '@spree/admin-sdk'
import schema from './reporting-schema.json'

/**
 * The reporting vocabulary `GET /api/v3/admin/reporting/schema` answers an
 * admin with at the pinned revision, on a store selling in US dollars and
 * euros: four families, 36 metrics and 25 dimensions.
 */
export const reportingSchema = schema as ReportingSchema

/**
 * The same vocabulary as a role that may read reports but not customers,
 * categories or products sees it: the dimensions it may not read are left out.
 */
export const narrowReportingSchema: ReportingSchema = {
  ...reportingSchema,
  dimensions: reportingSchema.dimensions.filter(
    (dimension) => !['customer', 'category', 'product', 'variant'].includes(dimension.name),
  ),
}

/**
 * Spree sends money, ratios and growth as decimal strings ("1234.50"), which
 * the SDK's types call numbers; the dashboard reads either. The fixtures send
 * what Spree sends.
 */
const decimal = (value: string) => value as unknown as number

const currencyFormats: Record<string, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  EUR: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }),
}

function growth(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? decimal('0') : null
  return decimal((((current - previous) / previous) * 100).toFixed(1))
}

/** A money figure, with the period before it when the report compares. */
export function money(amount: number, previous?: number, currency = 'USD'): ReportingMetricValue {
  return {
    value: decimal(amount.toFixed(2)),
    ...(previous !== undefined && {
      previous: decimal(previous.toFixed(2)),
      growth: growth(amount, previous),
    }),
    display: currencyFormats[currency].format(amount),
  }
}

/** A count, with the period before it when the report compares. */
export function count(value: number, previous?: number): ReportingMetricValue {
  return {
    value,
    ...(previous !== undefined && { previous, growth: growth(value, previous) }),
  }
}

/** A ratio such as gross margin, which Spree sends as the percentage a merchant reads. */
export function percent(value: number, previous?: number): ReportingMetricValue {
  return {
    value: decimal(value.toFixed(1)),
    ...(previous !== undefined && {
      previous: decimal(previous.toFixed(1)),
      growth: growth(value, previous),
    }),
  }
}

/** The five figures the home page shows, in the order its tiles show them. */
export const homeMetrics = [
  'total_sales',
  'orders',
  'average_order_value',
  'units_sold',
  'customers',
]

interface Day {
  date: string
  orders: number
  sales: number
  units: number
  customers: number
}

/** Orders and sales on each day of a period, made up so that weekends sell more. */
function days(start: string, total: number, scale = 1): Day[] {
  const first = Date.parse(`${start}T00:00:00Z`)
  return Array.from({ length: total }, (_, index) => {
    const date = new Date(first + index * 86_400_000)
    const weekend = [0, 6].includes(date.getUTCDay())
    const orders = Math.round((3 + ((index * 7) % 5) + (weekend ? 3 : 0)) * scale)
    const sales = orders * (42 + ((index * 13) % 17)) + ((index * 37) % 100) / 100
    return {
      date: date.toISOString().slice(0, 10),
      orders,
      sales,
      units: orders * 2 - (index % 3),
      customers: Math.max(orders - (index % 2), 0),
    }
  })
}

function dayMetrics(day: Day, previous: Day | undefined, metrics: string[], currency = 'USD') {
  const all: Record<string, ReportingMetricValue> = {
    total_sales: money(day.sales, previous?.sales, currency),
    orders: count(day.orders, previous?.orders),
    average_order_value: money(
      day.orders ? day.sales / day.orders : 0,
      previous ? (previous.orders ? previous.sales / previous.orders : 0) : undefined,
      currency,
    ),
    units_sold: count(day.units, previous?.units),
    customers: count(day.customers, previous?.customers),
  }
  return Object.fromEntries(metrics.map((metric) => [metric, all[metric]]))
}

function sum(list: Day[]): Day {
  return list.reduce(
    (total, day) => ({
      date: total.date,
      orders: total.orders + day.orders,
      sales: total.sales + day.sales,
      units: total.units + day.units,
      customers: total.customers + day.customers,
    }),
    { date: '', orders: 0, sales: 0, units: 0, customers: 0 },
  )
}

/**
 * The last four weeks to 1 October 2026, the instant the stories are
 * captured at, as Spree resolves `last_4_weeks`: 29 days, and the 29 before
 * them for the comparison.
 */
export const fourWeeks = { since: '2026-09-03T00:00:00Z', until: '2026-10-01T23:59:59Z' }
export const fourWeeksBefore = { since: '2026-08-05T00:00:00Z', until: '2026-09-02T23:59:59Z' }

const thisPeriod = days('2026-09-03', 29)
const periodBefore = days('2026-08-05', 29, 0.8)

interface SeriesOptions {
  metrics?: string[]
  compare?: boolean
  currency?: string
  /** Every bucket empty, as a period with no orders reads. */
  empty?: boolean
}

/** Sales per day over the last four weeks, grouped as the builder's default report asks. */
export function dailySeries({
  metrics = ['total_sales', 'orders'],
  compare = true,
  currency = 'USD',
  empty = false,
}: SeriesOptions = {}): ReportingResult {
  const current = empty
    ? thisPeriod.map((day) => ({ ...day, orders: 0, sales: 0, units: 0, customers: 0 }))
    : thisPeriod
  const before = compare ? (empty ? current : periodBefore) : undefined
  return {
    meta: {
      currency,
      time_range: fourWeeks,
      previous_time_range: compare ? fourWeeksBefore : null,
      metrics,
      dimensions: [{ name: 'completed_at', grain: 'day' }],
    },
    totals: dayMetrics(sum(current), before && sum(before), metrics, currency),
    rows: current.map((day, index) => ({
      dimensions: { completed_at: day.date },
      metrics: dayMetrics(day, before?.[index], metrics, currency),
    })),
  }
}

/** The same four weeks in weekly buckets, each starting on a Monday, as Spree groups them. */
export function weeklySeries(metrics = ['total_sales', 'orders']): ReportingResult {
  const weeks = [
    ['2026-08-31', thisPeriod.slice(0, 4)],
    ['2026-09-07', thisPeriod.slice(4, 11)],
    ['2026-09-14', thisPeriod.slice(11, 18)],
    ['2026-09-21', thisPeriod.slice(18, 25)],
    ['2026-09-28', thisPeriod.slice(25)],
  ] as const
  return {
    meta: {
      currency: 'USD',
      time_range: fourWeeks,
      previous_time_range: null,
      metrics,
      dimensions: [{ name: 'completed_at', grain: 'week' }],
    },
    totals: dayMetrics(sum(thisPeriod), undefined, metrics),
    rows: weeks.map(([date, list]) => ({
      dimensions: { completed_at: date },
      metrics: dayMetrics(sum([...list]), undefined, metrics),
    })),
  }
}

/** Twelve months of net sales, as Spree's seeded "Net sales over time" report reads by month. */
export function monthlySeries(): ReportingResult {
  const metrics = ['gross_sales', 'discounts', 'returns', 'net_sales']
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = new Date(Date.UTC(2025, 9 + index, 1)).toISOString().slice(0, 10)
    const gross = 18_000 + ((index * 2_350) % 9_000) + index * 410.5
    const discounts = gross * 0.06
    const returns = gross * (0.02 + (index % 3) * 0.01)
    return { month, gross, discounts, returns, net: gross - discounts - returns }
  })
  const totals = months.reduce(
    (total, month) => ({
      gross: total.gross + month.gross,
      discounts: total.discounts + month.discounts,
      returns: total.returns + month.returns,
      net: total.net + month.net,
    }),
    { gross: 0, discounts: 0, returns: 0, net: 0 },
  )
  const figures = (month: { gross: number; discounts: number; returns: number; net: number }) => ({
    gross_sales: money(month.gross),
    discounts: money(month.discounts),
    returns: money(month.returns),
    net_sales: money(month.net),
  })
  return {
    meta: {
      currency: 'USD',
      time_range: { since: '2025-10-01T00:00:00Z', until: '2026-10-01T23:59:59Z' },
      previous_time_range: null,
      metrics,
      dimensions: [{ name: 'completed_at', grain: 'month' }],
    },
    totals: figures(totals),
    rows: months.map((month) => ({
      dimensions: { completed_at: month.month },
      metrics: figures(month),
    })),
  }
}

/** Today's orders hour by hour, to 12:00 on 1 October 2026. */
export function hourlySeries(): ReportingResult {
  const hours = Array.from({ length: 13 }, (_, hour) => ({
    hour: `2026-10-01 ${String(hour).padStart(2, '0')}:00:00`,
    orders: hour < 7 ? hour % 2 : 2 + (hour % 4),
  }))
  const total = hours.reduce((sum, hour) => sum + hour.orders, 0)
  return {
    meta: {
      currency: 'USD',
      time_range: { since: '2026-10-01T00:00:00Z', until: '2026-10-01T23:59:59Z' },
      previous_time_range: null,
      metrics: ['orders'],
      dimensions: [{ name: 'completed_at', grain: 'hour' }],
    },
    totals: { orders: count(total) },
    rows: hours.map((hour) => ({
      dimensions: { completed_at: hour.hour },
      metrics: { orders: count(hour.orders) },
    })),
  }
}

/** The five figures alone, with no breakdown, as a report without a Group by reads. */
export function totalsOnly(compare = true): ReportingResult {
  const before = compare ? sum(periodBefore) : undefined
  return {
    meta: {
      currency: 'USD',
      time_range: fourWeeks,
      previous_time_range: compare ? fourWeeksBefore : null,
      metrics: homeMetrics,
      dimensions: [],
    },
    totals: dayMetrics(sum(thisPeriod), before, homeMetrics),
    rows: [],
  }
}

/** A lookup-backed dimension's display payload. */
export const dimension = (
  id: string | null,
  label: string,
  meta: Record<string, unknown> = {},
): ReportingDimensionValue => ({ id, label, meta })

function ranking(
  name: string,
  entries: Array<[ReportingDimensionValue, number, number, number?]>,
  compare = false,
): ReportingResult {
  const metrics = ['total_sales', 'orders']
  const rows: ReportingRow[] = entries.map(([value, sales, orders, previousSales]) => ({
    dimensions: { [name]: value },
    metrics: {
      total_sales: money(sales, compare ? (previousSales ?? 0) : undefined),
      orders: count(orders, compare ? Math.round(orders * 0.8) : undefined),
    },
  }))
  const totalSales = entries.reduce((total, entry) => total + entry[1], 0)
  const totalOrders = entries.reduce((total, entry) => total + entry[2], 0)
  const totalBefore = entries.reduce((total, entry) => total + (entry[3] ?? 0), 0)
  return {
    meta: {
      currency: 'USD',
      time_range: fourWeeks,
      previous_time_range: compare ? fourWeeksBefore : null,
      metrics,
      dimensions: [{ name }],
    },
    totals: {
      total_sales: money(totalSales, compare ? totalBefore : undefined),
      orders: count(totalOrders, compare ? Math.round(totalOrders * 0.8) : undefined),
    },
    rows,
  }
}

/** Sales by channel, ranked, as Spree's seeded "Sales by channel" report reads. */
export function channelRanking(compare = false): ReportingResult {
  return ranking(
    'channel',
    [
      [dimension('ch_3Kd9Lp2W', 'Online Store', { code: 'online' }), 6_418.4, 121, 5_210.75],
      [dimension('ch_8Vn4Qs6T', 'Wholesale', { code: 'wholesale' }), 2_980, 14, 3_310.2],
      [dimension('ch_5Bx7Hj1M', 'Pop-up market', { code: 'pop-up-market' }), 412.5, 9, 0],
    ],
    compare,
  )
}

/** The store's best customers, each named with their email beneath, and one guest known by email only. */
export function customerRanking(): ReportingResult {
  return ranking('customer', [
    [dimension('cus_6Hj9Kl2P', 'Maya Okafor', { email: 'maya.okafor@example.com' }), 1_284.6, 9],
    [dimension('cus_2Df5Gh8J', 'Tomás Rivera', { email: 'tomas.rivera@example.com' }), 860.25, 6],
    [dimension(null, 'lena.bauer@example.com', { email: 'lena.bauer@example.com' }), 412, 2],
    [dimension('cus_9Qw3Er6T', 'Priya Natarajan', { email: 'priya@example.com' }), 238.9, 3],
  ])
}

/**
 * The same 144 orders as the channel ranking, by payment status, each status
 * read by its label, as Spree hydrates them.
 */
export function paymentStatusBreakdown(): ReportingResult {
  return ranking('payment_status', [
    [dimension(null, 'Paid'), 8_604.15, 131],
    [dimension(null, 'Partially refunded'), 742.3, 6],
    [dimension(null, 'Authorized'), 391.5, 5],
    [dimension(null, 'Unassigned'), 72.95, 2],
  ])
}

/** A breakdown with no orders in the period. */
export function emptyRanking(): ReportingResult {
  return ranking('channel', [])
}

/** The query a new report starts from, as the builder's default draft sends it. */
export const newReportQuery: ReportingQuery = {
  metrics: ['total_sales', 'orders'],
  dimensions: [{ name: 'completed_at', grain: 'day' }],
  time_range: { preset: 'last_4_weeks' },
  compare: 'previous_period',
}

/** A ranking of channels by sales, highest first. */
export const channelQuery: ReportingQuery = {
  metrics: ['total_sales', 'orders'],
  dimensions: ['channel'],
  time_range: { preset: 'last_4_weeks' },
  sort: '-total_sales',
  limit: 50,
}

/**
 * What Spree answers a query it refuses, in its own words, as the browser-test
 * server answered an hourly report over the last twelve months.
 */
export const refusedQuery = {
  error: {
    code: 'invalid_reporting_query',
    message:
      'hour grain over this range produces 8784 points (the limit is 2000). Shorten the range or use a coarser grain: day, week, month.',
  },
}
