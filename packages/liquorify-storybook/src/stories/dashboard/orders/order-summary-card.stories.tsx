import type { Meta, StoryObj } from '@storybook/react-vite'
import { OrderSummaryCard } from '../../../../../dashboard/src/components/spree/orders/order-summary-card'
import { withStore } from '../../../decorators/store'
import {
  approvedOrder,
  canceledByKeyOrder,
  canceledOrder,
  discountedOrder,
  draftOrder,
  giftCardOrder,
  paidOrder,
  unpaidOrder,
  vatIncludedOrder,
} from '../../../fixtures/admin/orders'
import { orderParameters } from './order-page'

/**
 * An order's summary (DA-ORD-04): who made it and when, its channel, market,
 * locale and currency, the totals line by line, and what has been paid and is
 * still owed. A canceled order also says when, by whom and why.
 */
const meta = {
  title: 'Admin dashboard/Orders/Order summary card',
  component: OrderSummaryCard,
  tags: ['CMP-DA-G-11'],
  args: { order: paidOrder },
  decorators: [withStore],
  parameters: orderParameters({ column: 'main' }),
} satisfies Meta<typeof OrderSummaryCard>

export default meta
type Story = StoryObj<typeof meta>

export const Paid: Story = {}

export const Unpaid: Story = {
  name: 'Outstanding balance',
  args: { order: unpaidOrder },
}

// A draft made by a teammate on the wholesale channel, not yet placed.
export const Draft: Story = { args: { order: draftOrder } }

export const Discounted: Story = { args: { order: discountedOrder } }

export const VatIncluded: Story = {
  name: 'Tax included in prices',
  args: { order: vatIncludedOrder },
}

export const GiftCardAndCredit: Story = {
  name: 'Gift card and store credit',
  args: { order: giftCardOrder },
}

export const Canceled: Story = { args: { order: canceledOrder } }

// Canceled by an integration's key, which is marked as one.
export const CanceledByKey: Story = {
  name: 'Canceled by an API key',
  args: { order: canceledByKeyOrder },
}

export const Approved: Story = { args: { order: approvedOrder } }
