import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, http } from 'msw'
import { fn, screen, userEvent } from 'storybook/test'
import { FulfillmentDeliveryDialog } from '../../../../../dashboard/src/components/spree/orders/fulfillment-delivery-dialog'
import { withStore } from '../../../decorators/store'
import {
  freightDelivery,
  fulfilledFulfillment,
  shippedOrder,
  upsDelivery,
} from '../../../fixtures/admin/after-sale'
import {
  fulfillmentWriteHeld,
  trackingCarriersHeld,
} from '../../../mocks/handlers/admin/after-sale'
import { orderParameters } from './order-page'

/**
 * What the order page opens to add a tracking number to a parcel, or to
 * correct one (DA-ORD-04): the number, and the carrier from Spree's list, or
 * left to be detected from the number.
 */
const meta = {
  title: 'Admin dashboard/Orders/Fulfillment delivery dialog',
  component: FulfillmentDeliveryDialog,
  tags: ['CMP-DA-G-11'],
  args: {
    orderId: shippedOrder.id,
    fulfillmentId: fulfilledFulfillment.id,
    open: true,
    onOpenChange: fn(),
  },
  decorators: [withStore],
  parameters: orderParameters({ order: shippedOrder, viewport: true }),
} satisfies Meta<typeof FulfillmentDeliveryDialog>

export default meta
type Story = StoryObj<typeof meta>

const duplicate = http.post('/api/v3/admin/orders/:id/fulfillments/:fulfillmentId/deliveries', () =>
  HttpResponse.json(
    {
      error: {
        code: 'validation_error',
        message: 'Tracking number has already been taken',
        details: {
          tracking_number: [{ code: 'taken', message: 'has already been taken', specific: false }],
        },
      },
    },
    { status: 422 },
  ),
)

const save = async (number: string) => {
  await userEvent.type(await screen.findByRole('textbox', { name: 'Tracking number' }), number)
  await userEvent.click(screen.getByRole('button', { name: 'Save' }))
}

export const Add: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'Add tracking' })
  },
}

export const Edit: Story = {
  args: { delivery: upsDelivery },
  play: async () => {
    await screen.findByRole('heading', { name: 'Edit tracking' })
    await screen.findByText('UPS')
  },
}

export const EditUnlistedCarrier: Story = {
  name: 'Edit, unlisted carrier',
  args: { delivery: freightDelivery },
  play: async () => {
    await screen.findByText('Harbor Line Freight')
  },
}

export const Carriers: Story = {
  name: "Spree's carriers",
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Shipping carrier' }))
    await screen.findByRole('option', { name: 'USPS' })
  },
}

// The carriers have not answered yet, so the list has nothing to offer.
export const CarriersLoading: Story = {
  name: 'Carriers loading',
  parameters: orderParameters({ order: shippedOrder, viewport: true, first: trackingCarriersHeld }),
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Shipping carrier' }))
    await screen.findByText('No results')
  },
}

// The parcel already carries this number.
export const Duplicate: Story = {
  name: 'Number already on the parcel',
  parameters: orderParameters({ order: shippedOrder, viewport: true, first: [duplicate] }),
  play: async () => {
    await save(upsDelivery.tracking_number)
    await screen.findByText('has already been taken')
    // Where focus lands after the refusal depends on how fast it came back.
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

export const Saving: Story = {
  parameters: orderParameters({
    order: shippedOrder,
    viewport: true,
    first: fulfillmentWriteHeld('post /:fulfillmentId/deliveries'),
  }),
  play: async () => {
    await save('1Z4E7W8A0312845577')
    await screen.findByRole('button', { name: 'Saving…' })
  },
}
