import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, http } from 'msw'
import { fn, screen, userEvent } from 'storybook/test'
import { FulfillmentFulfillForm } from '../../../../../dashboard/src/components/spree/orders/fulfillment-fulfill-form'
import { withStore } from '../../../decorators/store'
import {
  backorderedFulfillment,
  backorderedOrder,
  readyFulfillment,
  readyOrder,
} from '../../../fixtures/admin/after-sale'
import { fulfillmentWriteHeld } from '../../../mocks/handlers/admin/after-sale'
import { orderParameters } from './order-page'

/**
 * What a parcel's "Mark as fulfilled" opens in its place (DA-ORD-04): every
 * unit ticked, a tracking number and carrier, and the shipment email on. Some
 * units split into a new parcel that ships while the rest stay.
 */
const meta = {
  title: 'Admin dashboard/Orders/Fulfillment fulfill form',
  component: FulfillmentFulfillForm,
  tags: ['CMP-DA-G-11'],
  args: { order: readyOrder, fulfillment: readyFulfillment, onDone: fn() },
  decorators: [withStore],
  parameters: orderParameters({ order: readyOrder, column: 'inMainCard' }),
} satisfies Meta<typeof FulfillmentFulfillForm>

export default meta
type Story = StoryObj<typeof meta>

const submit = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Fulfill items' }))
}

export const Everything: Story = {}

export const SomeUnits: Story = {
  name: 'Some units',
  play: async () => {
    const quantity = await screen.findByRole('spinbutton', { name: 'Quantity to ship of Clay mug' })
    // Clearing the field first would untick the line, so the 2 is replaced.
    await userEvent.type(quantity, '1', { initialSelectionStart: 0, initialSelectionEnd: 1 })
    await screen.findByText((_, element) => element?.textContent === 'Units to ship: 2 / 3')
  },
}

export const WithTracking: Story = {
  name: 'With tracking',
  play: async () => {
    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Tracking number' }),
      '1Z4E7W8A0312845560',
    )
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Send shipment notification to customer' }),
    )
  },
}

export const Carriers: Story = {
  name: 'Carriers open',
  parameters: orderParameters({ order: readyOrder, column: 'inMainCard', viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Shipping carrier' }))
    await screen.findByRole('option', { name: 'Royal Mail' })
  },
}

// Backordered units cannot be handed over until the stock arrives.
export const Backordered: Story = {
  name: 'Backordered, refused',
  args: { order: backorderedOrder, fulfillment: backorderedFulfillment },
  parameters: orderParameters({
    order: backorderedOrder,
    column: 'inMainCard',
    first: [
      http.patch('/api/v3/admin/orders/:id/fulfillments/:fulfillmentId/fulfill', () =>
        HttpResponse.json(
          {
            error: {
              code: 'validation_error',
              message: 'This fulfillment holds backordered units and cannot be handed over yet',
              details: {},
            },
          },
          { status: 422 },
        ),
      ),
    ],
  }),
  play: async () => {
    await submit()
    await screen.findByRole('alert')
    // Where focus lands after the refusal depends on how fast it came back.
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

export const Saving: Story = {
  parameters: orderParameters({
    order: readyOrder,
    column: 'inMainCard',
    first: fulfillmentWriteHeld('patch /:fulfillmentId/fulfill'),
  }),
  play: async () => {
    await submit()
    await screen.findByRole('button', { name: 'Saving…' })
  },
}
