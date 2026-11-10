import type { Meta, StoryObj } from '@storybook/react-vite'
import { OrderSummaryCard } from '../../../../../seller-dashboard/src/components/orders/order-cards'
import {
  canceledOrder,
  ledgerOrder,
  newOrder,
  partialOrder,
  shippedOrder,
} from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'

const order = (path: string) => panelParameters({ page: 'orders/$orderId', path, column: 'main' })

/** What the sale came to and what was paid against it (SP-ORD-02's main column). */
const meta = {
  title: 'Seller panel/Orders/Order summary card',
  component: OrderSummaryCard,
  tags: ['CMP-SP-G-02'],
  args: { order: shippedOrder },
  parameters: order(`orders/${shippedOrder.id}`),
} satisfies Meta<typeof OrderSummaryCard>

export default meta
type Story = StoryObj<typeof meta>

export const Shipped: Story = { name: 'Shipped, with the marketplace fee' }

export const Placed: Story = { name: 'Placed, nothing shipped', args: { order: newOrder } }

export const PartlyShipped: Story = {
  name: 'Three bottles, two shipped',
  args: { order: partialOrder },
}

export const Canceled: Story = {
  name: 'Withdrawn, with reason and note',
  args: { order: canceledOrder },
}

export const NoItems: Story = { name: 'Placed with no items (SD-3)', args: { order: ledgerOrder } }
