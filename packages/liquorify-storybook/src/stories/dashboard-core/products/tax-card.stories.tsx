import type { Product, Variant } from '@spree/admin-sdk'
import { TaxCard } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { withStore } from '../../../decorators/store'
import { clayMug, linenApron, taxCategories } from '../../../fixtures/admin/catalog'
import { ProductFormFor, productParameters } from './product-form'

function Tax({ product }: { product: Product }) {
  return <ProductFormFor product={product}>{(form) => <TaxCard form={form} />}</ProductFormFor>
}

// The large slate apron on the default rate, its own choice over the product's clothing rate.
const overriddenApron: Product = {
  ...linenApron,
  variants: (linenApron.variants as Variant[]).map((variant) =>
    variant.sku === 'APRON-SLT-L' ? { ...variant, tax_category_id: taxCategories[0].id } : variant,
  ),
}

const sidebar = (product: Product, viewport = false) =>
  productParameters({ product, column: 'sidebar', viewport })

const meta = {
  title: 'Dashboard core/Product form/Tax card',
  component: Tax,
  tags: ['CMP-CORE-PF-06'],
  args: { product: clayMug },
  decorators: [withStore],
  parameters: sidebar(clayMug),
} satisfies Meta<typeof Tax>

export default meta
type Story = StoryObj<typeof meta>

export const Chosen: Story = {
  play: async () => {
    await screen.findByText('Default')
  },
}

export const Choosing: Story = {
  parameters: sidebar(clayMug, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: 'Clothing' })
  },
}

// A new category on a product with variants applies to each one without its own.
export const ChangedWithVariants: Story = {
  name: 'Changed, with variants',
  args: { product: linenApron },
  parameters: sidebar(linenApron, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'Default' }))
    await screen.findByText(/applies to every variant/)
  },
}

export const VariantOverride: Story = {
  name: 'Variant with its own category',
  args: { product: overriddenApron },
  parameters: sidebar(overriddenApron),
  play: async () => {
    await screen.findByText('Variants with their own tax category')
  },
}
