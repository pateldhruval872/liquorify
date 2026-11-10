import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { FulfillmentDeliveries } from '../../../../../seller-dashboard/src/components/orders/fulfillment-deliveries'
import { partialOrder } from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'
import { shippedParcel } from './fulfillment-fixtures'

const [delivery] = shippedParcel.deliveries

/** A parcel's tracked consignments (SP-ORD-02, inside a fulfillment). */
const meta = {
  title: 'Seller panel/Orders/Fulfillment deliveries',
  component: FulfillmentDeliveries,
  tags: ['CMP-SP-G-02'],
  args: {
    orderId: partialOrder.id,
    fulfillmentId: shippedParcel.id,
    deliveries: shippedParcel.deliveries,
    onEdit: fn(),
  },
  parameters: panelParameters({
    page: 'orders/$orderId',
    path: `orders/${partialOrder.id}`,
    column: 'inSellerFulfillment',
  }),
} satisfies Meta<typeof FulfillmentDeliveries>

export default meta
type Story = StoryObj<typeof meta>

export const Pending: Story = { name: 'Awaiting the carrier' }

export const InTransit: Story = {
  name: 'Two consignments, one delivered',
  args: {
    deliveries: [
      { ...delivery, status: 'in_transit', estimated_delivery_at: '2026-10-03T17:00:00.000Z' },
      {
        ...delivery,
        id: 'dlv_8Hq2Lw4Kx9',
        tracking_number: '9400111899223197428490',
        carrier: 'USPS',
        carrier_name: 'USPS',
        tracking_url: null,
        status: 'delivered',
        delivered_at: '2026-09-30T14:20:00.000Z',
      },
    ],
  },
}

export const Menu: Story = {
  name: 'Tracking actions',
  parameters: panelParameters({
    page: 'orders/$orderId',
    path: `orders/${partialOrder.id}`,
    column: 'inSellerFulfillment',
    viewport: true,
  }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await screen.findByRole('menuitem', { name: 'Delete' })
  },
}

export const DeleteConfirm: Story = {
  name: 'Remove confirmation',
  parameters: panelParameters({
    page: 'orders/$orderId',
    path: `orders/${partialOrder.id}`,
    column: 'inSellerFulfillment',
    viewport: true,
  }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await screen.findByText('Remove this tracking number?')
  },
}
