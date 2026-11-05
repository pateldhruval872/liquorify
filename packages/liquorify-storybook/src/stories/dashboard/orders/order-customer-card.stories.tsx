import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { CustomerCard } from '../../../../../dashboard/src/components/spree/orders/order-customer-card'
import { withStore } from '../../../decorators/store'
import {
  anonymousDraft,
  digitalOrder,
  erasedCustomerOrder,
  guestOrder,
  paidOrder,
} from '../../../fixtures/admin/orders'
import { orderParameters } from './order-page'

/**
 * Who an order is for and where it goes (DA-ORD-04's sidebar). The only place
 * a placed order's addresses can be changed: each one saves on its own.
 */
const meta = {
  title: 'Admin dashboard/Orders/Order customer card',
  component: CustomerCard,
  tags: ['CMP-DA-G-11'],
  args: { order: paidOrder },
  decorators: [withStore],
  parameters: orderParameters({ column: 'sidebar' }),
} satisfies Meta<typeof CustomerCard>

export default meta
type Story = StoryObj<typeof meta>

export const Customer: Story = {}

export const EmailOnly: Story = {
  name: 'Email only',
  args: { order: guestOrder },
  parameters: orderParameters({ order: guestOrder, column: 'sidebar' }),
}

export const NoCustomer: Story = {
  name: 'No customer or email',
  args: { order: anonymousDraft },
  parameters: orderParameters({ order: anonymousDraft, column: 'sidebar' }),
}

// A digital order has nowhere to ship.
export const NoShippingAddress: Story = {
  name: 'No shipping address',
  args: { order: digitalOrder },
  parameters: orderParameters({ order: digitalOrder, column: 'sidebar' }),
}

export const ErasedCustomer: Story = {
  name: 'Erased customer',
  args: { order: erasedCustomerOrder },
  parameters: orderParameters({ order: erasedCustomerOrder, column: 'sidebar' }),
}

export const Menu: Story = {
  name: 'Menu open',
  parameters: orderParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await screen.findByRole('menuitem', { name: 'Edit Billing Address' })
  },
}

export const EditShippingAddress: Story = {
  name: 'Edit shipping address',
  parameters: orderParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit Shipping Address' }))
    await screen.findByDisplayValue('214 Larkspur Lane')
  },
}

export const EditBillingAddress: Story = {
  name: 'Edit billing address',
  parameters: orderParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit Billing Address' }))
    await screen.findByDisplayValue('88 Fernhill Road')
  },
}
