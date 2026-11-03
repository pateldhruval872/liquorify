import type { Product, Variant } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { VariantsSection } from '../../../../../dashboard-core/src/products/variants-section'
import { withStore } from '../../../decorators/store'
import { clayMug, linenApron } from '../../../fixtures/admin/catalog'
import { ProductFormFor, productParameters } from './product-form'

/**
 * The options and the variant list inside the variants card. Changing the
 * options rebuilds the list; variants that no longer match are flagged
 * before the save removes them.
 */
function Section({
  product,
  productTypeId,
  seedFromType,
}: {
  product: Product | null
  productTypeId?: string
  seedFromType?: boolean
}) {
  return (
    <ProductFormFor
      product={product}
      values={productTypeId ? { product_type_id: productTypeId } : {}}
    >
      {(form) => <VariantsSection form={form} seedFromType={seedFromType} />}
    </ProductFormFor>
  )
}

const meta = {
  title: 'Dashboard core/Product form/Variants section',
  component: Section,
  tags: ['CMP-CORE-PF-09'],
  args: { product: linenApron },
  decorators: [withStore],
  parameters: productParameters({ product: linenApron }),
} satisfies Meta<typeof Section>

export default meta
type Story = StoryObj<typeof meta>

export const WithOptions: Story = {
  name: 'With options',
  play: async () => {
    await screen.findByDisplayValue('APRON-OLV-M')
  },
}

export const NoOptions: Story = {
  name: 'No options',
  args: { product: clayMug },
  parameters: productParameters(),
}

// Removing Slate leaves two variants matching nothing, which the save would delete.
export const NoLongerMatching: Story = {
  name: 'Variants no longer matching',
  play: async () => {
    await screen.findByDisplayValue('APRON-OLV-M')
    const [color] = await screen.findAllByRole('button', { name: 'Edit' })
    await userEvent.click(color)
    await userEvent.click(await screen.findByRole('button', { name: 'Slate', pressed: true }))
    await userEvent.click(await screen.findByRole('button', { name: 'Done' }))
    await screen.findByText(/no longer match/)
  },
}

// A new product given the apron type: its options are offered, waiting for values.
export const SeededFromType: Story = {
  name: 'Options from the product type',
  args: {
    product: null,
    productTypeId: linenApron.product_type_id ?? undefined,
    seedFromType: true,
  },
  parameters: productParameters({ product: null }),
  play: async () => {
    await screen.findByRole('button', { name: 'Done' })
  },
}

const unsaved: Product = {
  ...linenApron,
  product_type_id: linenApron.product_type_id,
  variants: (linenApron.variants as Variant[]).slice(0, 2),
  variant_count: 2,
}

export const RowActions: Story = {
  name: 'Two variants',
  args: { product: unsaved },
  parameters: productParameters({ product: unsaved }),
  play: async () => {
    const table = await screen.findByRole('table')
    await within(table).findByDisplayValue('APRON-OLV-L')
  },
}
