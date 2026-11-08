import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { FulfillmentEditDialog } from '../../../../../dashboard/src/components/spree/orders/fulfillment-edit-dialog'
import { withStore } from '../../../decorators/store'
import {
  freightFulfillment,
  freightPendingOrder,
  readyFulfillment,
  readyOrder,
} from '../../../fixtures/admin/after-sale'
import { fulfillmentWriteHeld } from '../../../mocks/handlers/admin/after-sale'
import { orderParameters } from './order-page'

/**
 * Where a parcel ships from and which priced service carries it (DA-ORD-04),
 * as the admin dashboard fills the shared dialog: every location in the
 * store, those without the stock to cover the parcel marked and listed last,
 * and the parcel's quoted rates, freight still waiting on its quote included.
 */
const meta = {
  title: 'Admin dashboard/Orders/Fulfillment edit dialog',
  component: FulfillmentEditDialog,
  tags: ['CMP-DA-G-11'],
  args: { order: readyOrder, fulfillment: readyFulfillment, open: true, onOpenChange: fn() },
  decorators: [withStore],
  parameters: orderParameters({ order: readyOrder, viewport: true }),
} satisfies Meta<typeof FulfillmentEditDialog>

export default meta
type Story = StoryObj<typeof meta>

const moveTo = async (name: string) => {
  await userEvent.click(await screen.findByRole('combobox', { name: 'Ships from' }))
  await userEvent.click(await screen.findByRole('option', { name }))
}

export const Default: Story = {
  play: async () => {
    await screen.findByRole('heading', { name: 'Edit fulfillment' })
  },
}

// The downtown counter holds none of this parcel's stock.
export const Locations: Story = {
  name: 'Locations, by stock',
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Ships from' }))
    await screen.findByRole('option', { name: 'Downtown counter — Out of stock' })
  },
}

export const Methods: Story = {
  name: 'Delivery methods',
  play: async () => {
    await userEvent.click(await screen.findByRole('combobox', { name: 'Delivery method' }))
    await screen.findByRole('option', { name: 'Free over $75 — Free' })
  },
}

export const OriginMoved: Story = {
  name: 'Origin moved',
  play: async () => {
    await moveTo('East coast depot')
    await screen.findByRole('button', { name: 'Move and re-quote' })
  },
}

export const Moving: Story = {
  name: 'Moving',
  parameters: orderParameters({
    order: readyOrder,
    viewport: true,
    first: fulfillmentWriteHeld('patch /:fulfillmentId'),
  }),
  play: async () => {
    await moveTo('East coast depot')
    await userEvent.click(await screen.findByRole('button', { name: 'Move and re-quote' }))
    await screen.findByRole('button', { name: 'Saving…' })
  },
}

export const NoRates: Story = {
  name: 'No rates',
  args: {
    fulfillment: { ...readyFulfillment, delivery_rates: [], selected_delivery_rate_id: null },
  },
  play: async () => {
    await screen.findByText('No delivery methods are quoted for this fulfillment.')
  },
}

export const Freight: Story = {
  name: 'Freight, quoted after review',
  args: { order: freightPendingOrder, fulfillment: freightFulfillment },
  parameters: orderParameters({ order: freightPendingOrder, viewport: true }),
  play: async () => {
    await screen.findByText('Pallet freight — Quoted after review')
  },
}
