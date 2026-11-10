import type { Meta, StoryObj } from '@storybook/react-vite'
import { CustomerLifetimeStatsCard } from '../../../../../dashboard/src/components/spree/customers/customer-lifetime-stats-card'
import { withStore } from '../../../decorators/store'
import { newCustomer, regularCustomer } from '../../../fixtures/admin/customers'
import { customerParameters } from './customer-page'

/**
 * A customer's figures under the page's header (DA-CUS-02): total spent,
 * orders, average order value, store credit available and how long they have
 * been a customer, in the store's currency.
 */
const meta = {
  title: 'Admin dashboard/Customers/Customer lifetime stats card',
  component: CustomerLifetimeStatsCard,
  tags: ['CMP-DA-G-07'],
  args: { customer: regularCustomer },
  decorators: [withStore],
  parameters: customerParameters({ column: 'page' }),
} satisfies Meta<typeof CustomerLifetimeStatsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Regular: Story = { name: 'With orders and credit' }

// No orders leaves nothing to average, so the average reads as a dash.
export const NoOrders: Story = {
  name: 'No orders',
  args: { customer: newCustomer },
  parameters: customerParameters({ customer: newCustomer, column: 'page' }),
}
