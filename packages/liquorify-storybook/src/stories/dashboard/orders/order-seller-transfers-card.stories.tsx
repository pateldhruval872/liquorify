import type { Meta, StoryObj } from '@storybook/react-vite'
import { SellerTransfersCard } from '../../../../../dashboard/src/components/spree/orders/order-seller-transfers-card'
import { withStore } from '../../../decorators/store'
import {
  completedPayout,
  harbourOrder,
  harbourOrderTransfers,
} from '../../../fixtures/admin/marketplace'
import { marketplaceRequests } from '../../../mocks/handlers/admin/marketplace'
import { orderParameters } from './order-page'

const main = (transfers = harbourOrderTransfers) =>
  orderParameters({
    order: harbourOrder,
    column: 'main',
    first: marketplaceRequests({ transfers }),
  })

/**
 * What the seller earned from an order, and the payout that settled it
 * (DA-ORD-04's main column). Hidden until the order earns a transfer.
 */
const meta = {
  title: 'Admin dashboard/Orders/Order seller transfers card',
  component: SellerTransfersCard,
  tags: ['CMP-DA-G-11'],
  args: { order: harbourOrder },
  decorators: [withStore],
  parameters: main(),
} satisfies Meta<typeof SellerTransfersCard>

export default meta
type Story = StoryObj<typeof meta>

export const NotSettled: Story = { name: 'Not paid out yet' }
export const Settled: Story = {
  name: 'Paid out, with its payout',
  parameters: main(
    harbourOrderTransfers.map((each) => ({ ...each, payout_id: completedPayout.id })),
  ),
}
export const NoTransfers: Story = { name: 'Nothing earned yet (hidden)', parameters: main([]) }
