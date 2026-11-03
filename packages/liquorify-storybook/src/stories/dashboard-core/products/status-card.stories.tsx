import type { Product } from '@spree/admin-sdk'
import { StatusCard } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { withStore } from '../../../decorators/store'
import { clayMug, sandTote, slateCap } from '../../../fixtures/admin/catalog'
import { ProductFormFor, productParameters } from './product-form'

/**
 * The product page's status card, with the three statuses an admin assigns.
 * A seller's product in review adds its review status and buttons, which the
 * marketplace batch covers.
 */
function Status({ product }: { product: Product }) {
  return <ProductFormFor product={product}>{(form) => <StatusCard form={form} />}</ProductFormFor>
}

const sidebar = (product: Product, viewport = false) =>
  productParameters({ product, column: 'sidebar', viewport })

const meta = {
  title: 'Dashboard core/Product form/Status card',
  component: Status,
  tags: ['CMP-CORE-PF-06'],
  args: { product: clayMug },
  decorators: [withStore],
  parameters: sidebar(clayMug),
} satisfies Meta<typeof Status>

export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {}

export const Draft: Story = {
  args: { product: slateCap },
  parameters: sidebar(slateCap),
}

export const Archived: Story = {
  args: { product: sandTote },
  parameters: sidebar(sandTote),
}

export const Choosing: Story = {
  parameters: sidebar(clayMug, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: 'Archived' })
  },
}
