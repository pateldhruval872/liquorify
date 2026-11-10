import type { Meta, StoryObj } from '@storybook/react-vite'
import { OrderEarningsCard } from '../../../../../seller-dashboard/src/components/orders/order-earnings-card'
import { newOrder, shippedOrder, shippedOrderTransfers } from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'

const order = (orderTransfers = shippedOrderTransfers) =>
  panelParameters({
    page: 'orders/$orderId',
    path: `orders/${shippedOrder.id}`,
    column: 'main',
    orderTransfers,
  })

/** What the order earned the seller (SP-ORD-02's main column). */
const meta = {
  title: 'Seller panel/Orders/Order earnings card',
  component: OrderEarningsCard,
  tags: ['CMP-SP-G-02'],
  args: { order: shippedOrder },
  parameters: order(),
} satisfies Meta<typeof OrderEarningsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Earned: Story = { name: 'Earned on shipping, not yet settled' }

export const Settled: Story = {
  name: 'Settled in a payout, with a reversal',
  parameters: order([
    { ...shippedOrderTransfers[0], status: 'paid', payout_id: 'vpo_EfhxLZ9ck8' },
    {
      ...shippedOrderTransfers[0],
      id: `${shippedOrderTransfers[0].id}r`,
      kind: 'refund_reversal',
      amount: `-${shippedOrderTransfers[0].amount}`,
    },
  ]),
}

/** The card draws nothing until the order has earned something. */
export const NotYetEarned: Story = { name: 'Nothing earned yet', args: { order: newOrder } }
