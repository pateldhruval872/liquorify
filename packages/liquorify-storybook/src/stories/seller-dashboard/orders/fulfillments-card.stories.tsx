import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { FulfillmentsCard } from '../../../../../seller-dashboard/src/components/orders/fulfillments-card'
import {
  canceledOrder,
  newOrder,
  partialOrder,
  shippedOrder,
} from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'
import { labelledOrder } from './fulfillment-fixtures'

const card = (orderId: string, viewport = false) =>
  panelParameters({ page: 'orders/$orderId', path: `orders/${orderId}`, column: 'main', viewport })

/** Every parcel owed on the order, and what the seller can do with each (SP-ORD-02). */
const meta = {
  title: 'Seller panel/Orders/Fulfillments card',
  component: FulfillmentsCard,
  tags: ['CMP-SP-G-02'],
  args: { order: newOrder },
  parameters: card(newOrder.id),
} satisfies Meta<typeof FulfillmentsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Unfulfilled: Story = { name: 'One parcel to ship' }

export const PartlyShipped: Story = {
  name: 'One parcel shipped, one owed',
  args: { order: partialOrder },
  parameters: card(partialOrder.id),
}

export const Shipped: Story = {
  name: 'Shipped, with a tracked delivery',
  args: { order: shippedOrder },
  parameters: card(shippedOrder.id),
}

export const WithLabel: Story = {
  name: 'Owed parcel with an uploaded label',
  args: { order: labelledOrder },
  parameters: card(labelledOrder.id),
}

export const Canceled: Story = {
  name: 'Withdrawn',
  args: { order: canceledOrder },
  parameters: card(canceledOrder.id),
}

export const Empty: Story = {
  name: 'No parcels',
  args: { order: { ...newOrder, fulfillments: [], fulfillment_status: null } },
}

export const ActionsMenu: Story = {
  name: 'Parcel actions',
  parameters: card(newOrder.id, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await screen.findByRole('menuitem', { name: /split/i })
  },
}

export const Fulfilling: Story = {
  name: 'Fulfilling',
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole('button', { name: 'Mark as fulfilled' }),
    )
  },
}

export const CancelConfirm: Story = {
  name: 'Cancel parcel confirmation',
  parameters: card(newOrder.id, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Cancel parcel' }))
    await screen.findByText('Cancel this parcel?')
  },
}
