import type { Meta, StoryObj } from '@storybook/react-vite'
import { OrderSkeleton } from '../../../../../dashboard/src/components/spree/orders/order-skeleton'

/** What an order's page (DA-ORD-04) shows while the order loads. */
const meta = {
  title: 'Admin dashboard/Orders/Order skeleton',
  component: OrderSkeleton,
  tags: ['CMP-DA-G-11'],
  parameters: { liquorify: { column: 'page' } },
} satisfies Meta<typeof OrderSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {}
