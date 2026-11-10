import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { ReturnsCard } from '../../../../../seller-dashboard/src/components/orders/returns-card'
import { newOrder, shippedOrder, shippedOrderReturns } from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'
import { receivedReturn, refundedReturn, requestedReturn, returnIn } from './post-sale-fixtures'

const card = (returns = shippedOrderReturns, viewport = false) =>
  panelParameters({
    page: 'orders/$orderId',
    path: `orders/${shippedOrder.id}`,
    column: 'main',
    viewport,
    returns,
  })

/** Goods coming back on the order (SP-ORD-02's main column). */
const meta = {
  title: 'Seller panel/Orders/Returns card',
  component: ReturnsCard,
  tags: ['CMP-SP-G-02'],
  args: { order: shippedOrder },
  parameters: card(),
} satisfies Meta<typeof ReturnsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Approved: Story = { name: 'Approved, awaiting the bottle' }

export const Requested: Story = { parameters: card([requestedReturn]) }

export const Received: Story = {
  name: 'Received, not resellable',
  parameters: card([receivedReturn]),
}

export const Refunded: Story = { parameters: card([refundedReturn]) }

export const Canceled: Story = {
  parameters: card([returnIn('canceled', { canceled_at: '2026-10-01T11:00:00.000Z' })]),
}

export const Empty: Story = { name: 'Nothing returned', parameters: card([]) }

export const NothingShipped: Story = {
  name: 'Nothing shipped to return',
  args: { order: newOrder },
  parameters: card([]),
}

export const ActionsMenu: Story = {
  name: 'Return actions',
  parameters: card(shippedOrderReturns, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await screen.findByRole('menuitem', { name: 'Receive' })
  },
}

export const Receiving: Story = {
  name: 'Receiving',
  parameters: card(shippedOrderReturns, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Receive' }))
    await screen.findByRole('dialog')
  },
}

export const Refunding: Story = {
  name: 'Refunding',
  parameters: card([receivedReturn], true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Refund' }))
    await screen.findByRole('dialog')
  },
}

export const CancelConfirm: Story = {
  name: 'Cancel confirmation',
  parameters: card(shippedOrderReturns, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Cancel' }))
    await screen.findByText('Cancel this return?')
  },
}
