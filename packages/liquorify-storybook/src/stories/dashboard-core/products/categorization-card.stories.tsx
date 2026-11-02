import type { Product } from '@spree/admin-sdk'
import { CategorizationCard } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { withStore } from '../../../decorators/store'
import { clayMug, linenApron } from '../../../fixtures/admin/catalog'
import { ProductFormFor, productParameters } from './product-form'

/** Product type, shipping profile, categories, collections and tags, in the product page's sidebar. */
function Categorization({ product }: { product: Product | null }) {
  return (
    <ProductFormFor product={product}>
      {(form) => <CategorizationCard form={form} />}
    </ProductFormFor>
  )
}

const sidebar = (product: Product | null, viewport = false) =>
  productParameters({ product, column: 'sidebar', viewport })

const meta = {
  title: 'Dashboard core/Product form/Categorization card',
  component: Categorization,
  tags: ['CMP-CORE-PF-06'],
  args: { product: clayMug },
  decorators: [withStore],
  parameters: sidebar(clayMug),
} satisfies Meta<typeof Categorization>

export default meta
type Story = StoryObj<typeof meta>

export const Filled: Story = {
  play: async () => {
    await screen.findByText('Gift ideas')
  },
}

// With no profile of its own, the product ships on the store's default.
export const NewProduct: Story = {
  name: 'New product',
  args: { product: null },
  parameters: sidebar(null),
  play: async () => {
    await screen.findByText('General')
  },
}

// The apron's type adds its options to new products, and the card names them.
export const TypeAddsOptions: Story = {
  name: 'Type adds options',
  args: { product: linenApron },
  parameters: sidebar(linenApron),
  play: async () => {
    await screen.findByText(/adds Color, Size/)
  },
}

export const ChoosingType: Story = {
  name: 'Choosing a type',
  parameters: sidebar(clayMug, true),
  play: async () => {
    const [type] = await screen.findAllByRole('combobox')
    await userEvent.click(type)
    await screen.findByRole('option', { name: 'Guide' })
  },
}

export const PickingCategory: Story = {
  name: 'Picking a category',
  parameters: sidebar(clayMug, true),
  play: async () => {
    const field = (await screen.findByText('Categories')).closest(
      '[data-slot="field"]',
    ) as HTMLElement
    await userEvent.type(within(field).getByRole('combobox'), 'a')
    await screen.findByRole('option', { name: /Aprons/ })
  },
}

export const AddingTag: Story = {
  name: 'Adding a tag',
  parameters: sidebar(clayMug, true),
  play: async () => {
    const field = (await screen.findByText('Tags')).closest('[data-slot="field"]') as HTMLElement
    await userEvent.type(within(field).getByRole('combobox'), 'gi')
    await screen.findByRole('option', { name: 'gift idea' })
  },
}
