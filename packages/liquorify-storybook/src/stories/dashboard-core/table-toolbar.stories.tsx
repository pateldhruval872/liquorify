import { type FilterRule, getTable, TableToolbar } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { screen, userEvent } from 'storybook/test'
import '../../../../dashboard/src/tables/allowed-origins'
import '../../../../dashboard/src/tables/webhook-deliveries'

interface Props {
  tableKey: string
  search?: string
  filters?: FilterRule[]
}

// The toolbar above a settings table, holding what the operator sets as the
// table does, but in the story rather than the address.
function Toolbar({ tableKey, search: initialSearch = '', filters: initialFilters = [] }: Props) {
  const table = getTable(tableKey)
  const displayable = table.columns.filter((column) => column.displayable !== false)
  const [search, setSearch] = useState(initialSearch)
  const [filters, setFilters] = useState(initialFilters)
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>(
    table.defaultSort ?? { field: 'updated_at', direction: 'desc' },
  )
  const [visible, setVisible] = useState(
    displayable.filter((column) => column.default).map((column) => column.key),
  )
  return (
    <TableToolbar
      columns={displayable}
      visibleColumns={visible}
      onVisibleColumnsChange={setVisible}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={table.searchPlaceholder}
      sort={sort}
      onSortChange={setSort}
      filters={filters}
      onFiltersChange={setFilters}
      allColumns={table.columns}
    />
  )
}

const meta = {
  title: 'Dashboard core/Table toolbar',
  component: Toolbar,
  tags: ['CMP-CORE-37'],
  // The allowed origins page's toolbar (DA-SET-30): search, a date filter on
  // when each origin was added, sorting and the columns shown.
  args: { tableKey: 'allowed-origins' },
  parameters: { liquorify: { column: 'settings' } },
} satisfies Meta<typeof Toolbar>

export default meta
type Story = StoryObj<typeof meta>

// Menus and the filter panel render outside the story's root.
const viewport = { liquorify: { capture: 'viewport' } }

export const Default: Story = {}

export const WithASearch: Story = { name: 'With a search', args: { search: 'shop' } }

export const FilterPanelOpen: Story = {
  name: 'Filter panel open',
  parameters: viewport,
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Add filter' }))
    await screen.findByText('Filter by…')
  },
}

// A bounded date range is two rules shown as one chip.
export const DateRangeApplied: Story = {
  name: 'Date range applied',
  args: {
    filters: [
      { id: 'from', field: 'created_at', operator: 'gteq', value: '2026-08-01' },
      { id: 'to', field: 'created_at', operator: 'lteq', value: '2026-09-30' },
    ],
  },
}

export const SortOpen: Story = {
  name: 'Sort open',
  parameters: viewport,
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Sort' }))
    await screen.findByRole('menu')
  },
}

export const ColumnsOpen: Story = {
  name: 'Columns open',
  parameters: viewport,
  play: async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Columns' }))
    await screen.findByRole('menu')
  },
}

// The deliveries list on a webhook endpoint's page (DA-SET-29), filtered to
// the deliveries that failed.
export const DeliveriesFailed: Story = {
  name: 'Deliveries, failed only',
  args: {
    tableKey: 'webhook-deliveries',
    filters: [{ id: 'failed', field: 'success', operator: 'in', value: 'false' }],
  },
}
