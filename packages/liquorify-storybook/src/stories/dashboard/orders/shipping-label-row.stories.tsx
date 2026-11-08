import { Card } from '@spree/dashboard-ui/ui/card'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { ShippingLabelRow } from '../../../../../dashboard/src/components/spree/orders/shipping-label-row'
import { withStore } from '../../../decorators/store'
import {
  filePendingLabel,
  purchasedLabel,
  refundedLabel,
  refundRequestedLabel,
  uploadedLabel,
} from '../../../fixtures/admin/after-sale'
import { orderParameters } from './order-page'

/**
 * The label on a parcel (DA-ORD-04), outbound or a return's: what the
 * postage cost, printing it, and giving it back. A label bought through a
 * carrier account is refunded through the carrier; one bought elsewhere and
 * uploaded has nothing to refund, so it is deleted instead.
 */
const meta = {
  title: 'Admin dashboard/Orders/Shipping label row',
  component: ShippingLabelRow,
  tags: ['CMP-DA-G-11'],
  args: { label: uploadedLabel, onRefund: fn(), onDelete: fn() },
  decorators: [
    withStore,
    (Story) => (
      <Card variant="nested">
        <Story />
      </Card>
    ),
  ],
  parameters: orderParameters({ column: 'inMainCard' }),
} satisfies Meta<typeof ShippingLabelRow>

export default meta
type Story = StoryObj<typeof meta>

const viewport = orderParameters({ column: 'inMainCard', viewport: true })

export const Uploaded: Story = {}

export const UploadedMenu: Story = {
  name: 'Uploaded, menu open',
  parameters: viewport,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await screen.findByRole('menuitem', { name: 'Delete label' })
  },
}

export const DeleteConfirmation: Story = {
  name: 'Delete confirmation',
  parameters: viewport,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete label' }))
    await screen.findByText(/Delete this label\?/)
  },
}

export const Purchased: Story = {
  args: { label: purchasedLabel },
}

export const RefundConfirmation: Story = {
  name: 'Refund confirmation',
  args: { label: purchasedLabel },
  parameters: viewport,
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Refund label' }))
    await screen.findByText(/Ask the carrier to refund this label\?/)
  },
}

export const Refunding: Story = {
  args: { label: purchasedLabel, isRefunding: true },
}

// The carrier has not decided yet; asking again re-files the refund.
export const RefundRequested: Story = {
  name: 'Refund requested',
  args: { label: refundRequestedLabel },
}

export const Refunded: Story = {
  args: { label: refundedLabel },
}

// The carrier is still producing the file, so there is nothing to print.
export const FilePending: Story = {
  name: 'File not ready',
  args: { label: filePendingLabel },
}
