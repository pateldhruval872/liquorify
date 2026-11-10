import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { OrderCancelDialog } from '../../../../../seller-dashboard/src/components/orders/order-cancel-dialog'
import { newOrder } from '../../../fixtures/seller/orders'
import { sellerWriteHeld } from '../../../mocks/handlers/seller/panel'
import { panelParameters } from '../seller-panel'

const dialog = (first = sellerWriteHeld('orders/:id/cancel').slice(0, 0)) =>
  panelParameters({ page: 'orders/$orderId', path: `orders/${newOrder.id}`, viewport: true, first })

/** Withdrawing from an order the seller cannot fulfil (SP-ORD-02). */
const meta = {
  title: 'Seller panel/Orders/Order cancel dialog',
  component: OrderCancelDialog,
  tags: ['CMP-SP-G-02'],
  args: { orderId: newOrder.id, onClose: fn() },
  parameters: dialog(),
} satisfies Meta<typeof OrderCancelDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}

export const ReasonsOpen: Story = {
  name: 'Choosing a reason',
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: /out of stock/i })
  },
}

export const Canceling: Story = {
  name: 'Withdrawing',
  parameters: dialog(sellerWriteHeld('orders/:id/cancel')),
  play: async () => {
    const dialogs = await screen.findAllByRole('button', { name: /cancel order/i })
    await userEvent.click(dialogs[dialogs.length - 1])
  },
}
