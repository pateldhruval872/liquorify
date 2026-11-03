import type { Product } from '@spree/admin-sdk'
import { InventoryCard } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { StockHistoryDialog } from '../../../../../dashboard/src/components/spree/stock-history-card'
import { withStore } from '../../../decorators/store'
import { clayMug, linenApron } from '../../../fixtures/admin/catalog'
import { shellStore } from '../../../fixtures/admin/shell'
import { stockLocationList } from '../../../mocks/handlers/admin/settings'
import { ProductFormFor, productParameters } from './product-form'

/**
 * Stock on hand and backorders at each of the store's locations, with the
 * stock history behind its button, as the product page shows them.
 */
function Inventory({ product }: { product: Product | null }) {
  const variantIds = product ? [product.default_variant_id] : []
  return (
    <ProductFormFor product={product}>
      {(form) => (
        <InventoryCard
          form={form}
          stockLocationHref={(id) => `/${shellStore.id}/settings/stock-locations?edit=${id}`}
          actions={product ? <StockHistoryDialog variantIds={variantIds} /> : undefined}
        />
      )}
    </ProductFormFor>
  )
}

const meta = {
  title: 'Dashboard core/Product form/Inventory card',
  component: Inventory,
  tags: ['CMP-CORE-PF-06'],
  args: { product: clayMug },
  decorators: [withStore],
  parameters: productParameters(),
} satisfies Meta<typeof Inventory>

export default meta
type Story = StoryObj<typeof meta>

// Twenty-four at the shop, six at the depot and none at the counter.
export const OneVariant: Story = {
  name: 'One variant',
  play: async () => {
    await screen.findByDisplayValue('24')
  },
}

// Each variant under its own heading; the slate medium is out of stock but takes backorders.
export const Variants: Story = {
  args: { product: linenApron },
  parameters: productParameters({ product: linenApron }),
  play: async () => {
    await screen.findByText('SKU APRON-SLT-M')
  },
}

export const NewProduct: Story = {
  name: 'New product',
  args: { product: null },
  parameters: productParameters({ product: null }),
}

export const NoLocations: Story = {
  name: 'No stock locations',
  parameters: productParameters({ handlers: { stockLocations: stockLocationList([]) } }),
  play: async () => {
    await screen.findByText(/Add a stock location in Settings/)
  },
}

export const StockHistory: Story = {
  name: 'Stock history',
  parameters: productParameters({ viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Stock history' }))
    await screen.findByText(/PO-0007/)
  },
}
