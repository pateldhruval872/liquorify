import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProductSellerCard } from '../../../../../dashboard/src/components/spree/products/product-seller-card'
import { withStore } from '../../../decorators/store'
import { clayMug } from '../../../fixtures/admin/catalog'
import {
  approvedSellerProduct,
  proposedProduct,
  suspendedSellerProduct,
} from '../../../fixtures/admin/marketplace'
import { productParameters } from '../../dashboard-core/products/product-form'

/**
 * Who supplies a product, with the seller's status (DA-PRD-03's sidebar).
 * The store's own products show no card.
 */
const meta = {
  title: 'Admin dashboard/Products/Product seller card',
  component: ProductSellerCard,
  tags: ['CMP-DA-G-14'],
  args: { product: approvedSellerProduct },
  decorators: [withStore],
  parameters: productParameters({ product: approvedSellerProduct, column: 'sidebar' }),
} satisfies Meta<typeof ProductSellerCard>

export default meta
type Story = StoryObj<typeof meta>

export const ApprovedSeller: Story = { name: 'An approved seller' }
export const SuspendedSeller: Story = {
  name: 'A suspended seller',
  args: { product: suspendedSellerProduct },
  parameters: productParameters({ product: suspendedSellerProduct, column: 'sidebar' }),
}
// Without the seller expanded, the card names it and shows no status.
export const NameOnly: Story = {
  name: 'The seller by name alone',
  args: { product: proposedProduct },
  parameters: productParameters({ product: proposedProduct, column: 'sidebar' }),
}
export const StoresOwn: Story = {
  name: "The store's own product (no card)",
  args: { product: clayMug },
  parameters: productParameters({ product: clayMug, column: 'sidebar' }),
}
