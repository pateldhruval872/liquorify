import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { OrderCustomerCard } from '../../../../../seller-dashboard/src/components/orders/order-cards'
import { canceledOrder, ledgerOrder, newOrder } from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'

const order = (options: { viewport?: boolean } = {}) =>
  panelParameters({
    page: 'orders/$orderId',
    path: `orders/${newOrder.id}`,
    column: 'sidebar',
    ...options,
  })

/** Where the parcel goes and who the invoice names (SP-ORD-02's sidebar). */
const meta = {
  title: 'Seller panel/Orders/Order customer card',
  component: OrderCustomerCard,
  tags: ['CMP-SP-G-02'],
  args: { order: newOrder },
  parameters: order(),
} satisfies Meta<typeof OrderCustomerCard>

export default meta
type Story = StoryObj<typeof meta>

export const Addresses: Story = { name: 'Shipping and billing addresses' }

export const Canceled: Story = { name: 'Withdrawn, read-only', args: { order: canceledOrder } }

export const NoAddresses: Story = { name: 'No addresses (SD-3)', args: { order: ledgerOrder } }

export const ActionsMenu: Story = {
  name: 'Actions menu',
  parameters: order({ viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await screen.findByRole('menuitem', { name: /shipping address/i })
  },
}

export const EditShipping: Story = {
  name: 'Editing the shipping address',
  parameters: order({ viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /shipping address/i }))
    await screen.findByRole('dialog')
  },
}
