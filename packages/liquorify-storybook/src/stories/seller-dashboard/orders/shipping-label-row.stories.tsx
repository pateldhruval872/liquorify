import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { ShippingLabelRow } from '../../../../../seller-dashboard/src/components/orders/shipping-label-row'
import { partialOrder } from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'
import { owedParcel, uploadedLabel } from './fulfillment-fixtures'

/** The label on a parcel, printed or removed from here (SP-ORD-02, inside a fulfillment). */
const meta = {
  title: 'Seller panel/Orders/Shipping label row',
  component: ShippingLabelRow,
  tags: ['CMP-SP-G-02'],
  args: { orderId: partialOrder.id, fulfillmentId: owedParcel.id, label: uploadedLabel },
  parameters: panelParameters({
    page: 'orders/$orderId',
    path: `orders/${partialOrder.id}`,
    column: 'inSellerFulfillment',
  }),
} satisfies Meta<typeof ShippingLabelRow>

export default meta
type Story = StoryObj<typeof meta>

export const Uploaded: Story = {}

export const FilePending: Story = {
  name: 'File still being stored',
  args: { label: { ...uploadedLabel, file_pending: true, download_url: null } },
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
    await userEvent.click(await screen.findByRole('menuitem', { name: /remove|delete/i }))
    await screen.findByText(/Remove this label\?/)
  },
}
