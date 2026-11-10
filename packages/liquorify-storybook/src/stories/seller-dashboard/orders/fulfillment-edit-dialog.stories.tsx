import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { FulfillmentEditDialog } from '../../../../../seller-dashboard/src/components/orders/fulfillment-edit-dialog'
import { partialOrder } from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'
import { owedParcel } from './fulfillment-fixtures'

/** Where the owed parcel ships from and which quoted service carries it (SP-ORD-02). */
const meta = {
  title: 'Seller panel/Orders/Fulfillment edit dialog',
  component: FulfillmentEditDialog,
  tags: ['CMP-SP-G-02'],
  args: { orderId: partialOrder.id, fulfillment: owedParcel, open: true, onOpenChange: fn() },
  parameters: panelParameters({
    page: 'orders/$orderId',
    path: `orders/${partialOrder.id}`,
    viewport: true,
  }),
} satisfies Meta<typeof FulfillmentEditDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
