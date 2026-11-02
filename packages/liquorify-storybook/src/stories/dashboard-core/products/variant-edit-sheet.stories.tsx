import type { Product } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { VariantEditSheet } from '../../../../../dashboard-core/src/products/variant-edit-sheet'
import { withStore } from '../../../decorators/store'
import { clayMug, linenApron } from '../../../fixtures/admin/catalog'
import { packageTypeList } from '../../../mocks/handlers/admin/catalog'
import { ProductFormFor, productParameters } from './product-form'

/** One variant's details, as its row's edit button opens them. Changes save with the product. */
function EditVariant({ product, index }: { product: Product; index: number }) {
  return (
    <ProductFormFor product={product}>
      {(form) => <VariantEditSheet form={form} variantIndex={index} open onOpenChange={fn()} />}
    </ProductFormFor>
  )
}

const sheet = (product: Product, handlers = {}) =>
  productParameters({ product, viewport: true, handlers })

const meta = {
  title: 'Dashboard core/Product form/Variant edit sheet',
  component: EditVariant,
  tags: ['CMP-CORE-PF-07'],
  args: { product: linenApron, index: 3 },
  decorators: [withStore],
  parameters: sheet(linenApron),
} satisfies Meta<typeof EditVariant>

export default meta
type Story = StoryObj<typeof meta>

const section = async (title: string) => {
  const heading = await screen.findByText(title)
  heading.scrollIntoView({ block: 'start' })
  return heading
}

export const Identity: Story = {
  play: async () => {
    await screen.findByDisplayValue('APRON-SLT-L')
  },
}

export const DefaultVariant: Story = {
  name: 'Product without variants',
  args: { product: clayMug, index: 0 },
  parameters: sheet(clayMug),
  play: async () => {
    await screen.findByDisplayValue('MUG-CLAY')
  },
}

export const Packing: Story = {
  play: async () => {
    await screen.findByDisplayValue('APRON-SLT-L')
    await section('Packing')
  },
}

// No carton yet, so the packing section says where to add one.
export const NoCartons: Story = {
  name: 'No cartons',
  parameters: sheet(linenApron, { packageTypes: packageTypeList([]) }),
  play: async () => {
    await screen.findByDisplayValue('APRON-SLT-L')
    await section('Packing')
    await screen.findByText(/Add a carton type under/)
  },
}

export const CustomsAndOrdering: Story = {
  name: 'Customs and ordering',
  play: async () => {
    await screen.findByDisplayValue('APRON-SLT-L')
    await section('Customs')
  },
}

export const PreOrder: Story = {
  name: 'Pre-order',
  play: async () => {
    await screen.findByDisplayValue('APRON-SLT-L')
    await section('Availability')
    await userEvent.click(await screen.findByRole('switch', { name: /pre-order/i }))
    await screen.findByText('Ships by')
  },
}
