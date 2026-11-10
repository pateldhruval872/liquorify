import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { FulfillmentSplitDialog } from '../../../../../seller-dashboard/src/components/orders/fulfillment-split-dialog'
import { panelParameters } from '../seller-panel'
import { twoBottleOrder } from './fulfillment-fixtures'

const [parcel] = twoBottleOrder.fulfillments

/** Moving part of a parcel onto one of its own (SP-ORD-02). */
const meta = {
  title: 'Seller panel/Orders/Fulfillment split dialog',
  component: FulfillmentSplitDialog,
  tags: ['CMP-SP-G-02'],
  args: { orderId: twoBottleOrder.id, fulfillment: parcel, open: true, onOpenChange: fn() },
  parameters: panelParameters({
    page: 'orders/$orderId',
    path: `orders/${twoBottleOrder.id}`,
    viewport: true,
    orders: [twoBottleOrder],
  }),
} satisfies Meta<typeof FulfillmentSplitDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = { name: 'Two bottles, one moved' }

export const WouldEmpty: Story = {
  name: 'Moving everything',
  play: async () => {
    const quantity = await screen.findByRole('spinbutton')
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '2')
  },
}
