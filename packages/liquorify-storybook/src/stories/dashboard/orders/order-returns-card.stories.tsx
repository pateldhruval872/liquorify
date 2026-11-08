import type { Order, Return } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { OrderReturnsCard } from '../../../../../dashboard/src/components/spree/order-returns-card'
import { withStore } from '../../../decorators/store'
import {
  approvedReturn,
  awaitingOrder,
  canceledReturn,
  elsewhereReturn,
  labelledReturn,
  nothingOwedReturn,
  receivedReturn,
  refundedReturn,
  requestedReturn,
  shippedOrder,
  shortRefundedReturn,
  taxedReturn,
} from '../../../fixtures/admin/after-sale'
import { orderParameters } from './order-page'

/**
 * Returns on a placed order (DA-ORD-04): each with its status, what is coming
 * back and to which location, its prepaid label, and what has been or is
 * still to be refunded, with the one action its status allows next.
 */
const meta = {
  title: 'Admin dashboard/Orders/Order returns card',
  component: OrderReturnsCard,
  tags: ['CMP-DA-G-24'],
  args: { order: shippedOrder },
  decorators: [withStore],
  parameters: orderParameters({ order: shippedOrder, column: 'main' }),
} satisfies Meta<typeof OrderReturnsCard>

export default meta
type Story = StoryObj<typeof meta>

const holding = (returns: Return[], viewport = false, order: Order = shippedOrder) => ({
  args: { order },
  parameters: orderParameters({
    order,
    column: 'main',
    viewport,
    afterSale: { [order.id]: { returns } },
  }),
})
const openMenu = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
}
const choose = async (item: string) => {
  await openMenu()
  await userEvent.click(await screen.findByRole('menuitem', { name: item }))
}

export const None: Story = {
  name: 'No returns',
  ...holding([]),
}

// Nothing has been packed, so there is nothing to return against.
export const NothingToReturn: Story = {
  name: 'Nothing to return against',
  ...holding([], false, awaitingOrder),
}

export const Requested: Story = {
  ...holding([requestedReturn]),
}

export const RequestedMenu: Story = {
  name: 'Requested, menu open',
  ...holding([requestedReturn], true),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Approve' })
  },
}

export const CancelConfirmation: Story = {
  name: 'Cancel confirmation',
  ...holding([requestedReturn], true),
  play: async () => {
    await choose('Cancel')
    await screen.findByText(/Cancel this return\?/)
  },
}

// Buying charges the carrier account, so it asks first.
export const BuyLabelConfirmation: Story = {
  name: 'Buy return label confirmation',
  ...holding([requestedReturn], true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Buy return label' }))
    await screen.findByText(/Buy a prepaid return label\?/)
  },
}

export const ApprovedMenu: Story = {
  name: 'Approved, menu open',
  ...holding([approvedReturn], true),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Receive items' })
  },
}

export const Receiving: Story = {
  name: 'Receive items',
  ...holding([approvedReturn], true),
  play: async () => {
    await choose('Receive items')
    await screen.findByRole('heading', { name: 'Receive returned items' })
  },
}

// Two mugs promised, one came back, and it cannot be sold again.
export const PartlyReceived: Story = {
  name: 'Received in part, not resellable',
  ...holding([receivedReturn]),
}

export const Refunding: Story = {
  name: 'Refund',
  ...holding([receivedReturn], true),
  play: async () => {
    await choose('Refund')
    await screen.findByRole('heading', { name: 'Refund return' })
  },
}

export const RefundingTax: Story = {
  name: 'Refund, tax included',
  ...holding([taxedReturn], true),
  play: async () => {
    await choose('Refund')
    const dialog = await screen.findByRole('dialog')
    await within(dialog).findByText(/includes \$4\.96 of tax/)
  },
}

// Nothing was paid for what came back, so completing it moves no money.
export const NothingOwed: Story = {
  name: 'Nothing owed, complete',
  ...holding([nothingOwedReturn], true),
  play: async () => {
    await choose('Complete return')
    await screen.findByRole('heading', { name: 'Complete return' })
  },
}

export const Refunded: Story = {
  ...holding([refundedReturn]),
}

// Refunded for less than was owed: the card shows both figures.
export const RefundedShort: Story = {
  name: 'Refunded in part',
  ...holding([shortRefundedReturn]),
}

export const Canceled: Story = {
  ...holding([canceledReturn]),
}

export const Labelled: Story = {
  name: 'Label bought, with customs paperwork',
  ...holding([labelledReturn]),
}

export const Elsewhere: Story = {
  name: 'Returning to another location',
  ...holding([elsewhereReturn]),
}

export const EveryStatus: Story = {
  name: 'Every status',
  ...holding([
    requestedReturn,
    approvedReturn,
    receivedReturn,
    refundedReturn,
    shortRefundedReturn,
    canceledReturn,
  ]),
}

export const NewReturn: Story = {
  name: 'New return',
  ...holding([], true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'New return' }))
    await screen.findByRole('heading', { name: 'New return' })
  },
}
