import type { ReportingQuery, ReportingResult } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { ReportView } from '../../../../../dashboard/src/components/spree/reporting/report-view'
import {
  channelQuery,
  channelRanking,
  customerRanking,
  dailySeries,
  emptyRanking,
  homeMetrics,
  hourlySeries,
  monthlySeries,
  newReportQuery,
  paymentStatusBreakdown,
  refusedQuery,
  reportingSchema,
  totalsOnly,
  weeklySeries,
} from '../../../fixtures/admin/reporting'

/**
 * A report's result (DA-RPT-02, DA-RPT-03), drawn as its query implies: a
 * chart over time with its table, a ranked table for a breakdown, or tiles
 * for figures alone. The width is the result column beside the builder at
 * 1280 pixels. Figures are invented, in the shapes Spree answers with.
 */
function View(props: ComponentProps<typeof ReportView>) {
  return (
    <div style={{ width: 620 }}>
      <ReportView {...props} />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/Reporting/Report view',
  component: View,
  tags: ['CMP-DA-G-17'],
  args: { query: newReportQuery, schema: reportingSchema, result: dailySeries() },
} satisfies Meta<typeof View>

export default meta
type Story = StoryObj<typeof meta>

const overTime = (
  metrics: string[],
  grain: 'hour' | 'day' | 'week' | 'month',
  fields: Partial<ReportingQuery> = {},
): ReportingQuery => ({
  metrics,
  dimensions: [{ name: 'completed_at', grain }],
  time_range: { preset: 'last_4_weeks' },
  ...fields,
})

const by = (dimension: string, fields: Partial<ReportingQuery> = {}): ReportingQuery => ({
  ...channelQuery,
  dimensions: [dimension],
  ...fields,
})

export const Compared: Story = { name: 'Over time, compared with the period before' }

export const NotCompared: Story = {
  name: 'Over time',
  args: {
    query: overTime(['total_sales', 'orders'], 'day'),
    result: dailySeries({ compare: false }),
  },
}

export const FiveFigures: Story = {
  name: 'Five figures over time',
  args: {
    query: overTime(homeMetrics, 'day', { compare: 'previous_period' }),
    result: dailySeries({ metrics: homeMetrics }),
  },
}

/** Choosing a tile draws that figure in the chart. */
export const AnotherFigure: Story = {
  name: 'Another figure chosen',
  args: FiveFigures.args,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /^Orders/ }))
    // A mouse click leaves no focus ring on the tile; the story's click does.
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

export const Weekly: Story = {
  name: 'By week',
  args: { query: overTime(['total_sales', 'orders'], 'week'), result: weeklySeries() },
}

export const Monthly: Story = {
  name: 'By month',
  args: {
    query: overTime(['gross_sales', 'discounts', 'returns', 'net_sales'], 'month', {
      time_range: { preset: 'last_12_months' },
    }),
    result: monthlySeries(),
  },
}

export const Hourly: Story = {
  name: 'By hour',
  args: {
    query: overTime(['orders'], 'hour', { time_range: { preset: 'today' } }),
    result: hourlySeries(),
  },
}

export const NoOrders: Story = {
  name: 'Over time, with no orders',
  args: { result: dailySeries({ empty: true }) },
}

export const Totals: Story = {
  name: 'Figures alone',
  args: {
    query: { metrics: homeMetrics, time_range: { preset: 'last_4_weeks' } },
    result: totalsOnly(false),
  },
}

export const TotalsCompared: Story = {
  name: 'Figures alone, compared',
  args: {
    query: {
      metrics: homeMetrics,
      time_range: { preset: 'last_4_weeks' },
      compare: 'previous_period',
    },
    result: totalsOnly(),
  },
}

export const Ranked: Story = {
  name: 'Ranked by channel',
  args: { query: channelQuery, result: channelRanking() },
}

export const RankedCompared: Story = {
  name: 'Ranked by channel, compared',
  args: {
    query: { ...channelQuery, compare: 'previous_period' },
    result: channelRanking(true),
  },
}

export const Customers: Story = {
  name: 'Ranked by customer',
  args: { query: by('customer'), result: customerRanking() },
}

export const PaymentStatus: Story = {
  name: 'By payment status',
  args: { query: by('payment_status'), result: paymentStatusBreakdown() },
}

export const Empty: Story = {
  name: 'No data for the period',
  args: { query: channelQuery, result: emptyRanking() },
}

/** A figure the schema does not describe keeps its name, as a saved report shows one the viewer cannot read. */
export const UnknownMetric: Story = {
  name: 'A figure the schema does not describe',
  args: {
    query: { ...channelQuery, metrics: ['total_sales', 'seller_payout'] },
    schema: {
      ...reportingSchema,
      metrics: reportingSchema.metrics.filter((metric) => metric.name !== 'seller_payout'),
    },
    result: ((): ReportingResult => {
      const result = channelRanking()
      return {
        ...result,
        meta: { ...result.meta, metrics: ['total_sales', 'seller_payout'] },
        totals: { ...result.totals, seller_payout: { value: 0 } },
        rows: result.rows.map((row) => ({
          ...row,
          metrics: { total_sales: row.metrics.total_sales, seller_payout: { value: 0 } },
        })),
      }
    })(),
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('seller_payout')).toBeVisible()
  },
}

export const Refused: Story = {
  name: 'Query refused',
  args: { result: undefined, error: new Error(refusedQuery.error.message) },
}

export const Loading: Story = {
  name: 'Loading',
  args: { result: undefined },
}
