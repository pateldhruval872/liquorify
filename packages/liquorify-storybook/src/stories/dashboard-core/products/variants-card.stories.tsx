import type { Product } from '@spree/admin-sdk'
import { VariantsCard } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { withStore } from '../../../decorators/store'
import { clayMug, linenApron } from '../../../fixtures/admin/catalog'
import { ProductFormFor, productParameters } from './product-form'

/**
 * The product page's variants card. The new product page offers the options
 * a chosen product type adds; the variants section has stories of its own.
 */
function Variants({ product }: { product: Product | null }) {
  return (
    <ProductFormFor product={product}>
      {(form) => <VariantsCard form={form} seedFromType={!product} />}
    </ProductFormFor>
  )
}

const meta = {
  title: 'Dashboard core/Product form/Variants card',
  component: Variants,
  tags: ['CMP-CORE-PF-06'],
  args: { product: clayMug },
  decorators: [withStore],
  parameters: productParameters(),
} satisfies Meta<typeof Variants>

export default meta
type Story = StoryObj<typeof meta>

// One variant and no options.
export const NoOptions: Story = {
  name: 'No options',
}

export const WithOptions: Story = {
  name: 'With options',
  args: { product: linenApron },
  parameters: productParameters({ product: linenApron }),
  play: async () => {
    await screen.findByDisplayValue('APRON-SLT-L')
  },
}

export const NewProduct: Story = {
  name: 'New product',
  args: { product: null },
  parameters: productParameters({ product: null }),
}
