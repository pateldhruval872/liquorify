import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { VariantLink } from '../../../../../dashboard/src/components/spree/variant-link'
import { withStore } from '../../../decorators/store'
import { discontinuedLine, mugLine, toteLine } from '../../../fixtures/admin/inventory'
import { inventoryParameters, inventoryRoutes } from './inventory-page'

// A document line's product on a transfer or purchase order (DA-INV-04,
// DA-INV-08): its picture, name and SKU, linked to the product's page.
const meta = {
  title: 'Admin dashboard/Stock/Variant link',
  component: VariantLink,
  tags: ['CMP-DA-G-24'],
  args: {
    productId: mugLine.product_id,
    name: mugLine.name,
    sku: mugLine.sku,
    thumbnailUrl: mugLine.thumbnail_url,
  },
  decorators: [withStore],
  parameters: inventoryParameters({ route: inventoryRoutes.transfer }),
} satisfies Meta<typeof VariantLink>

export default meta
type Story = StoryObj<typeof meta>

export const Linked: Story = {
  play: async () => {
    await screen.findByRole('link', { name: /Clay mug/ })
  },
}

// A product without a picture shows the package icon in its place.
export const NoPicture: Story = {
  name: 'No picture',
  args: {
    productId: toteLine.product_id,
    name: toteLine.name,
    sku: toteLine.sku,
    thumbnailUrl: null,
  },
}

// A line whose variant has since been deleted keeps its name and SKU, as
// plain text with nothing to link to.
export const Discontinued: Story = {
  args: {
    productId: null,
    name: discontinuedLine.name,
    sku: discontinuedLine.sku,
    thumbnailUrl: null,
  },
  play: async () => {
    await screen.findByText('Speckled bowl')
  },
}

export const NoSku: Story = {
  name: 'No SKU',
  args: { sku: null },
}
