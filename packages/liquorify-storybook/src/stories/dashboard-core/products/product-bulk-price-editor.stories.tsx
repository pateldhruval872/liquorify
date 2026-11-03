import type { Product } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { ProductBulkPriceEditor } from '../../../../../dashboard-core/src/products/product-bulk-price-editor'
import { withStore } from '../../../decorators/store'
import { clayMug, linenApron } from '../../../fixtures/admin/catalog'
import { ProductFormFor, productParameters } from './product-form'

/** The price grid inside the prices card, in one currency. */
function PriceGrid({ product, currency }: { product: Product; currency: 'USD' | 'EUR' }) {
  return (
    <ProductFormFor product={product}>
      {(form) => (
        <div className="overflow-hidden rounded border">
          <ProductBulkPriceEditor form={form} currency={currency} productName={product.name} />
        </div>
      )}
    </ProductFormFor>
  )
}

const meta = {
  title: 'Dashboard core/Product form/Product bulk price editor',
  component: PriceGrid,
  tags: ['CMP-CORE-PF-05'],
  args: { product: linenApron, currency: 'USD' },
  decorators: [withStore],
  parameters: productParameters({ product: linenApron, column: 'inMainCard' }),
} satisfies Meta<typeof PriceGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Dollars: Story = {
  play: async () => {
    await screen.findByDisplayValue('48.00')
  },
}

export const Euros: Story = {
  args: { currency: 'EUR' },
  play: async () => {
    await screen.findByDisplayValue('41.00')
  },
}

export const OneVariant: Story = {
  name: 'One variant',
  args: { product: clayMug },
  parameters: productParameters({ column: 'inMainCard' }),
  play: async () => {
    await screen.findByDisplayValue('18.00')
  },
}
