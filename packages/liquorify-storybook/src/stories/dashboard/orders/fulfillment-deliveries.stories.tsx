import { Card } from '@spree/dashboard-ui/ui/card'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { FulfillmentDeliveries } from '../../../../../dashboard/src/components/spree/orders/fulfillment-deliveries'
import { withStore } from '../../../decorators/store'
import {
  everyCarrierStatus,
  freightDelivery,
  labelledFulfillment,
  trackedFulfillment,
  trackedOrder,
  upsDelivery,
  uspsDelivered,
} from '../../../fixtures/admin/after-sale'
import { orderParameters } from './order-page'

/**
 * A parcel's tracked consignments (DA-ORD-04): each number, linked to the
 * carrier's tracking page when Spree knows the carrier, with its carrier
 * status and a menu to mark it arrived, correct it or remove it.
 */
const meta = {
  title: 'Admin dashboard/Orders/Fulfillment deliveries',
  component: FulfillmentDeliveries,
  tags: ['CMP-DA-G-11'],
  args: {
    orderId: trackedOrder.id,
    fulfillmentId: trackedFulfillment.id,
    deliveries: [upsDelivery],
    onEdit: fn(),
  },
  decorators: [
    withStore,
    (Story) => (
      <Card variant="nested">
        <Story />
      </Card>
    ),
  ],
  parameters: orderParameters({ order: trackedOrder, column: 'inMainCard' }),
} satisfies Meta<typeof FulfillmentDeliveries>

export default meta
type Story = StoryObj<typeof meta>

const viewport = orderParameters({ order: trackedOrder, column: 'inMainCard', viewport: true })
const openMenu = async (index = 0) => {
  const menus = await screen.findAllByRole('button', { name: 'Actions' })
  await userEvent.click(menus[index])
}

export const One: Story = {}

// Two carriers Spree knows, and a forwarder it does not, with no tracking page.
export const Several: Story = {
  args: { deliveries: [upsDelivery, uspsDelivered, freightDelivery] },
}

export const EveryCarrierStatus: Story = {
  name: 'Every carrier status',
  args: { deliveries: everyCarrierStatus },
}

export const Menu: Story = {
  name: 'Menu open',
  parameters: viewport,
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Mark arrived' })
  },
}

// An arrived consignment starts the returns window, so it cannot be removed.
export const DeliveredMenu: Story = {
  name: 'Arrived, menu open',
  args: { deliveries: [uspsDelivered] },
  parameters: viewport,
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Edit' })
  },
}

// A label made this one, so refunding the label is the way to remove it.
export const LabelledMenu: Story = {
  name: 'From a label, menu open',
  args: {
    fulfillmentId: labelledFulfillment.id,
    deliveries: labelledFulfillment.deliveries,
  },
  parameters: viewport,
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Mark arrived' })
  },
}

export const RemoveConfirmation: Story = {
  name: 'Remove confirmation',
  parameters: viewport,
  play: async () => {
    await openMenu()
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await screen.findByText(/Remove this tracking number\?/)
  },
}
