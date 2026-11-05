import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { OrderPurchaseOrderCard } from '../../../../../dashboard/src/components/spree/orders/order-purchase-order-card'
import { withStore } from '../../../decorators/store'
import { freightOrder, paidOrder } from '../../../fixtures/admin/orders'
import { orderParameters } from './order-page'

/**
 * The buyer's own purchase order reference and the document behind it
 * (DA-ORD-04's sidebar), which can be corrected after the order is placed.
 * Every order page shows it; purchase orders as a wholesale feature are
 * batch 12's.
 */
const meta = {
  title: 'Admin dashboard/Orders/Order purchase order card',
  component: OrderPurchaseOrderCard,
  tags: ['CMP-DA-G-11'],
  args: { order: paidOrder },
  decorators: [withStore],
  parameters: orderParameters({ column: 'sidebar' }),
} satisfies Meta<typeof OrderPurchaseOrderCard>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const WithNumberAndDocument: Story = {
  name: 'With a number and document',
  args: { order: freightOrder },
  parameters: orderParameters({ order: freightOrder, column: 'sidebar' }),
}

export const EditingEmpty: Story = {
  name: 'Editing, empty',
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    await screen.findByRole('textbox', { name: 'PO number' })
  },
}

export const Editing: Story = {
  name: 'Editing, with a document',
  args: { order: freightOrder },
  parameters: orderParameters({ order: freightOrder, column: 'sidebar' }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    await screen.findByDisplayValue('HKS-PO-20931')
  },
}
