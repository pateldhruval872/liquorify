import type { Product } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen } from 'storybook/test'
import { BulkVariantsDialog } from '../../../../../dashboard-core/src/products/bulk-variants-dialog'
import { withStore } from '../../../decorators/store'
import { clayMug, linenApron } from '../../../fixtures/admin/catalog'
import { ProductFormFor, productParameters } from './product-form'

/** The variants card's spreadsheet of every variant's details, behind its "Bulk edit" button. */
function BulkEdit({ product }: { product: Product }) {
  return (
    <ProductFormFor product={product}>
      {(form) => <BulkVariantsDialog form={form} open onOpenChange={fn()} />}
    </ProductFormFor>
  )
}

const meta = {
  title: 'Dashboard core/Product form/Bulk variants dialog',
  component: BulkEdit,
  tags: ['CMP-CORE-PF-02'],
  args: { product: linenApron },
  decorators: [withStore],
  parameters: productParameters({ product: linenApron, viewport: true }),
} satisfies Meta<typeof BulkEdit>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  play: async () => {
    await screen.findByText('Bulk edit variants')
  },
}

export const OneVariant: Story = {
  name: 'One variant',
  args: { product: clayMug },
  parameters: productParameters({ product: clayMug, viewport: true }),
  play: async () => {
    await screen.findByText('Bulk edit variants')
  },
}
