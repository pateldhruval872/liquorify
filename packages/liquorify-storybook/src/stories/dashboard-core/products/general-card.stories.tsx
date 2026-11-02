import type { Product } from '@spree/admin-sdk'
import { GeneralCard } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { MediaRichTextEditor } from '../../../../../dashboard/src/components/spree/media-rich-text-editor'
import { withStore } from '../../../decorators/store'
import { clayMug } from '../../../fixtures/admin/catalog'
import { ProductFormFor, productParameters } from './product-form'

/**
 * The product page's first card (DA-PRD-02, DA-PRD-03), with the admin
 * dashboard's media-aware description editor, as both pages pass it.
 */
function General({ product, validate }: { product: Product | null; validate?: boolean }) {
  return (
    <ProductFormFor product={product} validate={validate}>
      {(form) => <GeneralCard form={form} descriptionEditor={MediaRichTextEditor} />}
    </ProductFormFor>
  )
}

const meta = {
  title: 'Dashboard core/Product form/General card',
  component: General,
  tags: ['CMP-CORE-PF-06'],
  args: { product: clayMug },
  decorators: [withStore],
  parameters: productParameters(),
} satisfies Meta<typeof General>

export default meta
type Story = StoryObj<typeof meta>

export const Filled: Story = {
  play: async () => {
    await screen.findByText(/thrown by hand/)
  },
}

export const NewProduct: Story = {
  name: 'New product',
  args: { product: null },
  parameters: productParameters({ product: null }),
}

// Saving without a name, which the form refuses before it asks the API.
export const NameRequired: Story = {
  name: 'Name required',
  args: { product: null, validate: true },
  parameters: productParameters({ product: null }),
  play: async () => {
    await screen.findByText(/required/i)
  },
}
