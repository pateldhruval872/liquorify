import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { FulfillmentDeliveryDialog } from '../../../../../seller-dashboard/src/components/orders/fulfillment-delivery-dialog'
import { partialOrder } from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'
import { shippedParcel } from './fulfillment-fixtures'

/** Adding or correcting a tracking number by hand (SP-ORD-02). */
const meta = {
  title: 'Seller panel/Orders/Fulfillment delivery dialog',
  component: FulfillmentDeliveryDialog,
  tags: ['CMP-SP-G-02'],
  args: {
    orderId: partialOrder.id,
    fulfillmentId: shippedParcel.id,
    open: true,
    onOpenChange: fn(),
  },
  parameters: panelParameters({
    page: 'orders/$orderId',
    path: `orders/${partialOrder.id}`,
    viewport: true,
  }),
} satisfies Meta<typeof FulfillmentDeliveryDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Add: Story = { name: 'Adding tracking' }

export const Edit: Story = {
  name: 'Editing tracking',
  args: { delivery: shippedParcel.deliveries[0] },
}
