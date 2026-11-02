import type { Product } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { InventorySection } from '../../../../../dashboard-core/src/products/inventory-section'
import { withStore } from '../../../decorators/store'
import { clayMug, linenApron } from '../../../fixtures/admin/catalog'
import { shellStore } from '../../../fixtures/admin/shell'
import { ProductFormFor, productParameters } from './product-form'

/** The stock grid inside the inventory card, one row per variant and location. */
function Stock({ product, linked = true }: { product: Product; linked?: boolean }) {
  return (
    <ProductFormFor product={product}>
      {(form) => (
        <div className="overflow-hidden rounded border">
          <InventorySection
            form={form}
            stockLocationHref={
              linked ? (id) => `/${shellStore.id}/settings/stock-locations?edit=${id}` : undefined
            }
          />
        </div>
      )}
    </ProductFormFor>
  )
}

const meta = {
  title: 'Dashboard core/Product form/Inventory section',
  component: Stock,
  tags: ['CMP-CORE-PF-03'],
  args: { product: clayMug },
  decorators: [withStore],
  parameters: productParameters({ column: 'inMainCard' }),
} satisfies Meta<typeof Stock>

export default meta
type Story = StoryObj<typeof meta>

// Low stock is marked; none at the counter.
export const OneVariant: Story = {
  name: 'One variant',
  play: async () => {
    await screen.findByDisplayValue('24')
  },
}

export const Variants: Story = {
  args: { product: linenApron },
  parameters: productParameters({ product: linenApron, column: 'inMainCard' }),
  play: async () => {
    await screen.findByText('SKU APRON-OLV-M')
  },
}

// A panel with no stock location page names locations without linking them.
export const WithoutLinks: Story = {
  name: 'Without location links',
  args: { linked: false },
  play: async () => {
    await screen.findByDisplayValue('24')
  },
}

// Double-clicking a count edits it; the switch beside it allows backorders.
export const Editing: Story = {
  play: async () => {
    await userEvent.dblClick(await screen.findByLabelText('On hand at East coast depot'))
    await userEvent.keyboard('12')
    await userEvent.click(
      await screen.findByRole('switch', { name: 'Allow backorder at Downtown counter' }),
    )
    await userEvent.keyboard(' ')
    await screen.findByRole('switch', { checked: true })
  },
}
