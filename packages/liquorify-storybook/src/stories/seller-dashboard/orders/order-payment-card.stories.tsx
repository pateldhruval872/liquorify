import type { Meta, StoryObj } from '@storybook/react-vite'
import { OrderPaymentCard } from '../../../../../seller-dashboard/src/components/orders/order-payment-card'
import { canceledOrder, newOrder, shippedOrder } from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'

/** The seller's share of what the buyer paid (SP-ORD-02's main column). */
const meta = {
  title: 'Seller panel/Orders/Order payment card',
  component: OrderPaymentCard,
  tags: ['CMP-SP-G-02'],
  args: { order: shippedOrder },
  parameters: panelParameters({
    page: 'orders/$orderId',
    path: `orders/${shippedOrder.id}`,
    column: 'main',
  }),
} satisfies Meta<typeof OrderPaymentCard>

export default meta
type Story = StoryObj<typeof meta>

export const SplitBasket: Story = { name: 'Paid, a share of a two-seller basket' }

export const OneSeller: Story = { name: 'Paid, this seller alone', args: { order: newOrder } }

export const Voided: Story = { name: 'Voided on withdrawal', args: { order: canceledOrder } }
