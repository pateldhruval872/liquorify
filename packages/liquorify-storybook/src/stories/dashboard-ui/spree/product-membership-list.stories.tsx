import type { Product } from '@spree/admin-sdk'
import {
  ProductMembershipList,
  type ProductMembershipListLabels,
  type ProductMembershipRow,
} from '@spree/dashboard-ui/spree/product-membership-list'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { products } from '../../../fixtures/admin/catalog'

/** A category's products card (DA-PRD-08, DA-PRD-09), in its own words. */
const labels: ProductMembershipListLabels = {
  filterPlaceholder: 'Filter products…',
  clearFilter: 'Clear',
  noMatches: 'No products match your filter.',
  empty: 'No products in this category yet.',
  loading: 'Loading…',
  columnProduct: 'Product',
  selectAll: 'Select all',
  selectRow: 'Select product',
  remove: 'Remove from category',
  restore: 'Restore',
  pendingAddedBadge: 'New',
}

const row = (
  product: Product,
  pending?: ProductMembershipRow['pending'],
): ProductMembershipRow => ({
  id: product.id,
  name: product.name,
  thumbnailUrl: product.thumbnail_url,
  pending,
})

const members = products.slice(0, 4).map((product) => row(product))

/**
 * The membership table the category, collection, catalog and price list
 * pages share, with the selection held as the products card holds it.
 */
function Membership({
  rows = members,
  initialSelected = [],
  ...props
}: Partial<React.ComponentProps<typeof ProductMembershipList>> & {
  rows?: ProductMembershipRow[]
  initialSelected?: string[]
}) {
  const [selected, setSelected] = useState(initialSelected)
  return (
    <div className="rounded-xl border bg-card">
      <ProductMembershipList
        rows={rows}
        labels={labels}
        selected={selected}
        onSelectedChange={setSelected}
        {...props}
      />
    </div>
  )
}

const meta = {
  title: 'Dashboard UI/Composed/Product membership list',
  component: Membership,
  tags: ['CMP-DUI-C-35'],
  args: { onRemove: fn(), onRestore: fn(), reorderable: true, onReorder: fn() },
  // The products card fills the category page's main column.
  parameters: { liquorify: { column: 'main' } },
} satisfies Meta<typeof Membership>

export default meta
type Story = StoryObj<typeof meta>

export const Members: Story = {
  play: async () => {
    await expect(await screen.findAllByRole('checkbox', { name: 'Select product' })).toHaveLength(4)
  },
}

// Staged on a page whose changes wait for Save: one product added, one removed.
export const PendingChanges: Story = {
  name: 'Pending changes',
  args: {
    rows: [
      row(products[4], 'added'),
      ...members.slice(0, 2),
      row(products[2], 'removed'),
      members[3],
    ],
  },
  play: async () => {
    await screen.findByText('New')
    await screen.findByRole('button', { name: 'Restore' })
  },
}

export const Selected: Story = {
  args: { initialSelected: [members[0].id, members[2].id] },
  play: async () => {
    const rows = await screen.findAllByRole('checkbox', { name: 'Select product' })
    await expect(rows[0]).toBeChecked()
  },
}

export const SelectingAll: Story = {
  name: 'Selecting all',
  play: async () => {
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Select all' }))
    for (const box of screen.getAllByRole('checkbox', { name: 'Select product' }))
      await expect(box).toBeChecked()
  },
}

// A filtered view never reorders, so the drag handles go.
export const Filtering: Story = {
  play: async () => {
    await userEvent.type(await screen.findByPlaceholderText('Filter products…'), 'apron')
    await screen.findByText('Linen apron')
    await expect(screen.queryByRole('button', { name: 'Drag to reorder' })).toBeNull()
  },
}

export const NoMatches: Story = {
  name: 'No matches',
  play: async () => {
    await userEvent.type(await screen.findByPlaceholderText('Filter products…'), 'teapot')
    await screen.findByText('No products match your filter.')
  },
}

export const Empty: Story = {
  args: { rows: [] },
  play: async () => {
    await screen.findByText('No products in this category yet.')
  },
}

export const Loading: Story = {
  args: { loading: true },
  play: async () => {
    await screen.findByText('Loading…')
  },
}

// An automatic collection's members, which its rules set: no selection, handles or removal.
export const ReadOnly: Story = {
  name: 'Read only',
  args: { readOnly: true, reorderable: false },
  play: async () => {
    await screen.findByText('Clay mug')
    await expect(screen.queryByRole('checkbox')).toBeNull()
  },
}

export const Paginated: Story = {
  args: {
    meta: {
      page: 2,
      limit: 4,
      count: 9,
      pages: 3,
      from: 5,
      to: 8,
      previous: 1,
      next: 3,
    },
    onPageChange: fn(),
  },
  play: async () => {
    await screen.findByText('Clay mug')
    await screen.findByText('Page 2 of 3')
  },
}

// Moved with the keyboard; the position is counted across every page.
export const Reordering: Story = {
  play: async ({ args }) => {
    const [first] = await screen.findAllByRole('button', { name: 'Drag to reorder' })
    first.focus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard(' ')
    await expect(args.onReorder).toHaveBeenCalledWith(members[0].id, 1)
    const body = screen.getAllByRole('rowgroup')[1]
    await expect(within(body).getAllByRole('row')[1]).toHaveTextContent('Clay mug')
  },
}
