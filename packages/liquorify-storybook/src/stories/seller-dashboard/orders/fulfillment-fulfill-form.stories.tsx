import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { FulfillmentFulfillForm } from '../../../../../seller-dashboard/src/components/orders/fulfillment-fulfill-form'
import { panelParameters } from '../seller-panel'
import { twoBottleOrder } from './fulfillment-fixtures'

const [parcel] = twoBottleOrder.fulfillments

/** Shipping a parcel, whole or in part, with its tracking (SP-ORD-02, inside a fulfillment). */
const meta = {
  title: 'Seller panel/Orders/Fulfillment fulfill form',
  component: FulfillmentFulfillForm,
  tags: ['CMP-SP-G-02'],
  args: { order: twoBottleOrder, fulfillment: parcel, onDone: fn() },
  parameters: panelParameters({
    page: 'orders/$orderId',
    path: `orders/${twoBottleOrder.id}`,
    column: 'inSellerFulfillment',
    orders: [twoBottleOrder],
  }),
} satisfies Meta<typeof FulfillmentFulfillForm>

export default meta
type Story = StoryObj<typeof meta>

export const AllUnits: Story = { name: 'Every unit, no tracking yet' }

export const PartWithTracking: Story = {
  name: 'One of two units, with tracking',
  play: async () => {
    const quantity = await screen.findByRole('spinbutton')
    await userEvent.tripleClick(quantity)
    await userEvent.keyboard('1')
    await userEvent.type(
      screen.getByPlaceholderText('Tracking number or link'),
      '1Z999AA10123456784',
    )
  },
}

export const Carriers: Story = {
  name: 'Choosing a carrier',
  parameters: panelParameters({
    page: 'orders/$orderId',
    path: `orders/${twoBottleOrder.id}`,
    column: 'inSellerFulfillment',
    orders: [twoBottleOrder],
    viewport: true,
  }),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox'))
    await screen.findByRole('option', { name: 'UPS' })
  },
}
