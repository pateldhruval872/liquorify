import type { Meta, StoryObj } from '@storybook/react-vite'
import { CustomerOrdersCard } from '../../../../../dashboard/src/components/spree/customers/customer-orders-card'
import { withStore } from '../../../decorators/store'
import { customerOrders, newCustomer, regularCustomer } from '../../../fixtures/admin/customers'
import { customerParameters } from './customer-page'

/**
 * A customer's most recent orders (DA-CUS-02's main column), each with its
 * status, payment and fulfilment, and a link to the order list filtered to the
 * customer when there are more than the card shows.
 */
const meta = {
  title: 'Admin dashboard/Customers/Customer orders card',
  component: CustomerOrdersCard,
  tags: ['CMP-DA-G-07'],
  args: {
    customer: regularCustomer,
    orders: customerOrders,
    totalCount: customerOrders.length,
    isLoading: false,
  },
  decorators: [withStore],
  parameters: customerParameters({ column: 'main' }),
} satisfies Meta<typeof CustomerOrdersCard>

export default meta
type Story = StoryObj<typeof meta>

export const Orders: Story = { name: 'Every order shown' }

export const ViewAll: Story = {
  name: 'More orders than shown',
  args: { totalCount: 12 },
}

export const NoOrders: Story = {
  name: 'No orders',
  args: { customer: newCustomer, orders: [], totalCount: 0 },
  parameters: customerParameters({ customer: newCustomer, column: 'main' }),
}

export const Loading: Story = { args: { orders: [], totalCount: 0, isLoading: true } }
