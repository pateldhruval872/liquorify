import { Button, TableCell, TableHead } from '@spree/dashboard-ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { DeferredProductMembershipCard } from '../../../../../dashboard/src/components/spree/deferred-product-membership-card'
import {
  listCollectionProductsPage,
  useCollectionProducts,
} from '../../../../../dashboard/src/hooks/use-collections'
import { storeParameters, withStore } from '../../../decorators/store'
import { withToaster } from '../../../decorators/toaster'
import { kitchenProducts } from '../../../fixtures/admin/merchandising'
import { shellStore } from '../../../fixtures/admin/shell'
import { membershipRequests, productPickerList } from '../../../mocks/handlers/admin/merchandising'
import { CategoryFormFor } from '../categories/category-form'

/**
 * The products card every curated grouping shares: categories, collections,
 * catalogs and price lists. Its category use has its own stories; these show
 * what the others switch on: a role that may only look, a collection whose
 * rules choose its products, a description, columns of the grouping's own and
 * a control beside Add products.
 */
const meta = {
  title: 'Admin dashboard/Product membership/Deferred product membership card',
  component: DeferredProductMembershipCard,
  tags: ['CMP-DA-G-24'],
  args: {
    parentId: 'col_2Sm4Rk6P',
    storeId: shellStore.id,
    useProducts: useCollectionProducts,
    listMembersPage: listCollectionProductsPage,
    translationNamespace: 'admin.collections',
  },
  decorators: [withStore, withToaster],
  parameters: {
    ...storeParameters(),
    liquorify: {
      ...storeParameters().liquorify,
      column: 'main',
      route: {
        pattern: '/$storeId/products/collections/$collectionId',
        path: `/${shellStore.id}/products/collections/col_2Sm4Rk6P`,
      },
    },
    msw: {
      handlers: {
        ...storeParameters().msw.handlers,
        members: membershipRequests('collections', kitchenProducts),
        products: productPickerList(),
      },
    },
  },
  render: (args) => (
    <CategoryFormFor>{() => <DeferredProductMembershipCard {...args} />}</CategoryFormFor>
  ),
} satisfies Meta<typeof DeferredProductMembershipCard>

export default meta
type Story = StoryObj<typeof meta>

export const Curated: Story = {
  args: { onReorder: fn(async () => undefined) },
  play: async () => {
    await screen.findByText('Clay mug')
    await screen.findByRole('button', { name: 'Add products' })
  },
}

// A teammate without permission to change the grouping sees its products only.
export const ViewOnly: Story = {
  name: 'View only',
  args: { canEdit: false, onReorder: fn(async () => undefined) },
  play: async () => {
    await screen.findByText('Clay mug')
    await expect(screen.queryByRole('button', { name: 'Add products' })).toBeNull()
    await expect(screen.queryByRole('button', { name: 'Drag to reorder' })).toBeNull()
  },
}

// An automatic collection: its rules choose the products, so the list cannot
// be changed by hand.
export const ChosenByRules: Story = {
  name: 'Chosen by rules',
  args: {
    readOnly: true,
    description: 'Members are set by the rules above and refresh automatically.',
  },
  play: async () => {
    await screen.findByText('Members are set by the rules above and refresh automatically.')
    await expect(screen.queryByRole('checkbox', { name: 'Select all' })).toBeNull()
  },
}

export const NoRuleMatches: Story = {
  name: 'No products match the rules',
  args: { readOnly: true },
  parameters: {
    msw: { handlers: { members: membershipRequests('collections', []) } },
  },
  play: async () => {
    await screen.findByText('No products match the rules yet.')
  },
}

// A catalog's quantity terms as a column of their own, and a control beside
// Add products for pricing the rows.
export const ExtraColumns: Story = {
  name: 'Extra columns and actions',
  args: {
    extraColumns: {
      columnCount: 1,
      headers: <TableHead className="w-24 text-right">Minimum</TableHead>,
      renderCells: (row) => (
        <TableCell className="text-right tabular-nums">
          {row.id === kitchenProducts[0].id ? 12 : 6}
        </TableCell>
      ),
    },
    headerActions: (
      <Button type="button" variant="outline" size="sm">
        Set prices
      </Button>
    ),
  },
  play: async () => {
    await screen.findByText('Minimum')
    await screen.findByRole('button', { name: 'Set prices' })
  },
}

export const SelectionReplacesActions: Story = {
  name: 'Selection replaces the actions',
  args: {
    headerActions: (
      <Button type="button" variant="outline" size="sm">
        Set prices
      </Button>
    ),
  },
  play: async () => {
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Select all' }))
    await screen.findByRole('button', { name: 'Remove' })
    await expect(screen.queryByRole('button', { name: 'Set prices' })).toBeNull()
  },
}
