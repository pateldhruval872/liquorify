import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, screen, userEvent, within } from 'storybook/test'
import { ReportBuilder } from '../../../../../dashboard/src/components/spree/reporting/report-builder'
import {
  draftFromQuery,
  EMPTY_QUERY,
  type ReportDraft,
} from '../../../../../dashboard/src/components/spree/reporting/report-draft'
import { storeParameters, withStore } from '../../../decorators/store'
import { channelQuery, reportingSchema } from '../../../fixtures/admin/reporting'
import { channels } from '../../../fixtures/admin/settings'
import { searchList } from '../../../mocks/handlers/admin/merchandising'

const newReport = draftFromQuery(EMPTY_QUERY, reportingSchema)

/**
 * The report's settings (DA-RPT-02, DA-RPT-03), driven by the schema Spree
 * answers with: metrics grouped by family, Group by and its grain, the time
 * range, the comparison, filters, and sort and limit for a breakdown. Each
 * change is kept, as the report page keeps it. The width is the builder's
 * column at 1280 pixels.
 */
function Builder({
  draft: initial,
  schema = reportingSchema,
}: {
  draft: ReportDraft
  schema?: typeof reportingSchema
}) {
  const [draft, setDraft] = useState(initial)
  return (
    <div style={{ width: 320 }}>
      <ReportBuilder draft={draft} onChange={setDraft} schema={schema} />
    </div>
  )
}

const meta = {
  title: 'Admin dashboard/Reporting/Report builder',
  component: Builder,
  tags: ['CMP-DA-G-17'],
  args: { draft: newReport },
  decorators: [withStore],
  parameters: storeParameters(),
} satisfies Meta<typeof Builder>

export default meta
type Story = StoryObj<typeof meta>

const byChannel = draftFromQuery(channelQuery, reportingSchema)

/** A menu or list opens outside the builder's card, so its story captures the viewport. */
const inViewport = {
  ...storeParameters(),
  liquorify: { ...storeParameters().liquorify, capture: 'viewport' },
}

/** Opens one of the builder's menus. */
const openMenu = (name: string) => async () => {
  await userEvent.click(await screen.findByRole('combobox', { name }))
  await screen.findByRole('listbox')
}

export const NewReport: Story = { name: 'A new report' }

export const NoMetric: Story = {
  name: 'No metric picked',
  args: { draft: { ...newReport, metrics: [] } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Pick at least one metric.')
  },
}

/** Ticking a payments metric switches the report to that family, rather than being refused. */
export const AnotherFamily: Story = {
  name: 'A metric from another family',
  play: async ({ canvasElement }) => {
    const builder = within(canvasElement)
    await userEvent.click(builder.getByRole('checkbox', { name: 'Payments received' }))
    await expect(builder.getByRole('checkbox', { name: 'Payments received' })).toBeChecked()
    await expect(builder.getByRole('checkbox', { name: 'Total sales' })).not.toBeChecked()
    // A mouse click leaves no focus ring on the box; the story's click does.
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

export const GroupedByChannel: Story = {
  name: 'Grouped by channel, with sort and limit',
  args: { draft: byChannel },
}

/**
 * A line-item dimension cannot break down order-level figures, which are
 * greyed out. Product is offered only once every ticked metric is one it can
 * break down, so the report holds net sales and units sold.
 */
export const GroupedByProduct: Story = {
  name: 'Grouped by product',
  args: {
    draft: draftFromQuery(
      {
        ...channelQuery,
        metrics: ['net_sales', 'units_sold'],
        dimensions: ['product'],
        sort: '-net_sales',
      },
      reportingSchema,
    ),
  },
}

export const ChoosingGroup: Story = {
  name: 'Choosing what to group by',
  parameters: inViewport,
  play: openMenu('Group by'),
}

export const ChoosingGrain: Story = {
  name: 'Choosing the interval',
  parameters: inViewport,
  play: openMenu('Interval'),
}

export const ChoosingRange: Story = {
  name: 'Choosing the time range',
  parameters: inViewport,
  play: openMenu('Time range'),
}

export const CustomRange: Story = {
  name: 'A custom range',
  args: { draft: { ...newReport, timeRange: { since: '2026-09-07', until: '2026-09-20' } } },
}

export const NotCompared: Story = {
  name: 'Not compared',
  args: { draft: { ...newReport, compare: false } },
}

export const AddingFilter: Story = {
  name: 'Adding a filter',
  parameters: inViewport,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Add filter' }))
    await screen.findByRole('menuitem', { name: 'Payment status' })
  },
}

/** A status filter lists its values; a channel filter picks channels by name. */
export const Filtered: Story = {
  name: 'Filtered by payment status and channel',
  args: {
    draft: {
      ...byChannel,
      dimension: 'completed_at',
      filters: [
        { dimension: 'payment_status', values: ['paid', 'partially_refunded'] },
        { dimension: 'channel', values: [channels[0].id] },
      ],
    },
  },
  parameters: {
    ...storeParameters(),
    msw: {
      handlers: {
        ...storeParameters().msw.handlers,
        channels: [searchList('/api/v3/admin/channels', channels, (channel) => channel.name)],
      },
    },
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText(channels[0].name)
  },
}
