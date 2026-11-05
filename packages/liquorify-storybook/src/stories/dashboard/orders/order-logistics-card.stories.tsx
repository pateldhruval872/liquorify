import type { Meta, StoryObj } from '@storybook/react-vite'
import { OrderLogisticsCard } from '../../../../../dashboard/src/components/spree/orders/order-logistics-card'
import { freightOrder, incompleteFreightOrder } from '../../../fixtures/admin/orders'

/**
 * What a measured order ships as (DA-ORD-04's sidebar): its units, cartons,
 * pallets, volume and weight, as frozen when it was placed. An ordinary retail
 * order with nothing measured shows no card at all.
 */
const meta = {
  title: 'Admin dashboard/Orders/Order logistics card',
  component: OrderLogisticsCard,
  tags: ['CMP-DA-G-11'],
  args: { order: freightOrder },
  parameters: { liquorify: { column: 'sidebar' } },
} satisfies Meta<typeof OrderLogisticsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Measured: Story = {}

// One product had no carton size, so the figures are a floor.
export const Incomplete: Story = {
  name: 'Not fully measured',
  args: { order: incompleteFreightOrder },
}
