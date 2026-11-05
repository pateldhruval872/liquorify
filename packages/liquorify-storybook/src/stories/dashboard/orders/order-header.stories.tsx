import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { OrderHeader } from '../../../../../dashboard/src/components/spree/orders/order-header'
import { withStore } from '../../../decorators/store'
import {
  approvedOrder,
  authorizedOrder,
  canceledOrder,
  draftOrder,
  fulfilledOrder,
  paidOrder,
  riskyOrder,
  supportRules,
} from '../../../fixtures/admin/orders'
import { orderParameters } from './order-page'

/**
 * The top of an order's page (DA-ORD-04): its number, its payment and
 * fulfilment statuses, when it was placed, the edit and complete actions, and
 * the menu with what else can be done to it.
 */
const meta = {
  title: 'Admin dashboard/Orders/Order header',
  component: OrderHeader,
  tags: ['CMP-DA-G-11'],
  args: { order: paidOrder },
  decorators: [withStore],
  parameters: orderParameters({ column: 'page' }),
} satisfies Meta<typeof OrderHeader>

export default meta
type Story = StoryObj<typeof meta>

const openMenu = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'More actions' }))
}

export const Paid: Story = {
  play: async () => {
    await screen.findByText('R100241')
  },
}

export const Authorized: Story = {
  args: { order: authorizedOrder },
  parameters: orderParameters({ order: authorizedOrder, column: 'page' }),
}

// Every unit has shipped, so there is nothing left an edit could change.
export const Fulfilled: Story = {
  args: { order: fulfilledOrder },
  parameters: orderParameters({ order: fulfilledOrder, column: 'page' }),
}

export const Canceled: Story = {
  args: { order: canceledOrder },
  parameters: orderParameters({ order: canceledOrder, column: 'page' }),
}

// A draft has no statuses yet; it is completed or thrown away.
export const Draft: Story = {
  args: { order: draftOrder },
  parameters: orderParameters({ order: draftOrder, column: 'page' }),
  play: async () => {
    await screen.findByRole('button', { name: 'Complete Order' })
  },
}

export const PlacedMenu: Story = {
  name: 'Placed, menu open',
  parameters: orderParameters({ column: 'page', viewport: true }),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Resend Confirmation' })
  },
}

// Approve is offered only while a risky order waits for someone.
export const RiskyMenu: Story = {
  name: 'Risky, menu open',
  args: { order: riskyOrder },
  parameters: orderParameters({ order: riskyOrder, column: 'page', viewport: true }),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Approve' })
  },
}

export const ApproveConfirmation: Story = {
  name: 'Approve confirmation',
  args: { order: riskyOrder },
  parameters: orderParameters({ order: riskyOrder, column: 'page', viewport: true }),
  play: async () => {
    await openMenu()
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Approve' }))
    await screen.findByText('Approve this order?')
  },
}

export const ApprovedMenu: Story = {
  name: 'Approved, menu open',
  args: { order: approvedOrder },
  parameters: orderParameters({ order: approvedOrder, column: 'page', viewport: true }),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Cancel order' })
  },
}

export const CanceledMenu: Story = {
  name: 'Canceled, menu open',
  args: { order: canceledOrder },
  parameters: orderParameters({ order: canceledOrder, column: 'page', viewport: true }),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Resend Confirmation' })
  },
}

export const DraftMenu: Story = {
  name: 'Draft, menu open',
  args: { order: draftOrder },
  parameters: orderParameters({ order: draftOrder, column: 'page', viewport: true }),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Delete' })
  },
}

export const CompleteConfirmation: Story = {
  name: 'Complete confirmation',
  args: { order: draftOrder },
  parameters: orderParameters({ order: draftOrder, column: 'page', viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Complete Order' }))
    await screen.findByText('Complete this draft order now?')
  },
}

export const DeleteConfirmation: Story = {
  name: 'Delete confirmation',
  args: { order: draftOrder },
  parameters: orderParameters({ order: draftOrder, column: 'page', viewport: true }),
  play: async () => {
    await openMenu()
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await screen.findByText('Delete draft order R100251? This cannot be undone.')
  },
}

// A role that may read orders but not delete them: the draft's menu has no Delete.
export const DraftMenuSupport: Story = {
  name: 'Draft, menu open, support role',
  args: { order: draftOrder },
  parameters: orderParameters({
    order: draftOrder,
    column: 'page',
    viewport: true,
    rules: supportRules,
  }),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'View as JSON' })
  },
}

export const OpensCancelDialog: Story = {
  name: 'Cancel dialog opened',
  parameters: orderParameters({ column: 'page', viewport: true }),
  play: async () => {
    await openMenu()
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Cancel order' }))
    await screen.findByRole('heading', { name: 'Cancel order?' })
  },
}
