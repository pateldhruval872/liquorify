import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { FulfillmentLabelUploadDialog } from '../../../../../seller-dashboard/src/components/orders/fulfillment-label-upload-dialog'
import { partialOrder } from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'
import { owedParcel } from './fulfillment-fixtures'

/** Attaching a label bought elsewhere to the owed parcel (SP-ORD-02). */
const meta = {
  title: 'Seller panel/Orders/Fulfillment label upload dialog',
  component: FulfillmentLabelUploadDialog,
  tags: ['CMP-SP-G-02'],
  args: {
    orderId: partialOrder.id,
    fulfillmentId: owedParcel.id,
    currency: 'USD',
    open: true,
    onOpenChange: fn(),
  },
  parameters: panelParameters({
    page: 'orders/$orderId',
    path: `orders/${partialOrder.id}`,
    viewport: true,
  }),
} satisfies Meta<typeof FulfillmentLabelUploadDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}

export const NoFile: Story = {
  name: 'Saved with no file',
  play: async () => {
    const buttons = await screen.findAllByRole('button', { name: /upload/i })
    await userEvent.click(buttons[buttons.length - 1])
  },
}
