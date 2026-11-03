import type { Product } from '@spree/admin-sdk'
import { PricesCard } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { withStore } from '../../../decorators/store'
import { clayMug, linenApron, slateCap } from '../../../fixtures/admin/catalog'
import { ProductFormFor, productParameters } from './product-form'

/** Each variant's price and compare-at price in one of the store's two currencies, US dollars and euros. */
function Prices({ product }: { product: Product }) {
  return (
    <ProductFormFor product={product}>
      {(form) => <PricesCard form={form} productName={product.name} />}
    </ProductFormFor>
  )
}

const meta = {
  title: 'Dashboard core/Product form/Prices card',
  component: Prices,
  tags: ['CMP-CORE-PF-06'],
  args: { product: clayMug },
  decorators: [withStore],
  parameters: productParameters(),
} satisfies Meta<typeof Prices>

export default meta
type Story = StoryObj<typeof meta>

export const OneVariant: Story = {
  name: 'One variant',
  play: async () => {
    await screen.findByDisplayValue('18.00')
  },
}

export const Euros: Story = {
  parameters: productParameters({ viewport: true }),
  play: async () => {
    await screen.findByDisplayValue('18.00')
    await userEvent.click(await screen.findByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'EUR' }))
    await screen.findByDisplayValue('16.50')
  },
}

// Four variants, one of them on sale with a compare-at price.
export const Variants: Story = {
  args: { product: linenApron },
  parameters: productParameters({ product: linenApron }),
  play: async () => {
    await screen.findByDisplayValue('48.00')
  },
}

// No euro price yet: the row is empty until one is typed.
export const NoPriceInCurrency: Story = {
  name: 'No price in this currency',
  args: { product: slateCap },
  parameters: productParameters({ product: slateCap }),
  play: async () => {
    await screen.findByDisplayValue('24.00')
    await userEvent.click(await screen.findByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'EUR' }))
  },
}
