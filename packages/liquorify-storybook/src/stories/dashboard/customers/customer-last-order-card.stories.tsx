import type { Meta, StoryObj } from '@storybook/react-vite'
import { CustomerLastOrderCard } from '../../../../../dashboard/src/components/spree/customers/customer-last-order-card'
import { withStore } from '../../../decorators/store'
import { lastPlacedOrder } from '../../../fixtures/admin/customers'
import { partlyRefundedOrder } from '../../../fixtures/admin/orders'
import { customerParameters } from './customer-page'

/**
 * The last order the customer placed (DA-CUS-02's main column), with its
 * payment and fulfilment, its total and its first five items. Shown only when
 * the customer has placed an order.
 */
const meta = {
  title: 'Admin dashboard/Customers/Customer last order card',
  component: CustomerLastOrderCard,
  tags: ['CMP-DA-G-07'],
  args: { order: lastPlacedOrder },
  decorators: [withStore],
  parameters: customerParameters({ column: 'main' }),
} satisfies Meta<typeof CustomerLastOrderCard>

export default meta
type Story = StoryObj<typeof meta>

export const Paid: Story = { name: 'Paid, not shipped' }

export const PartlyRefunded: Story = {
  name: 'Partly refunded',
  args: { order: partlyRefundedOrder },
}
