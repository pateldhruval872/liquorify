import type { Order } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, http } from 'msw'
import { screen, userEvent, within } from 'storybook/test'
import { FulfillmentsCard } from '../../../../../dashboard/src/components/spree/orders/fulfillments-card'
import { withStore } from '../../../decorators/store'
import {
  addressedDraft,
  awaitingOrder,
  backorderedOrder,
  canceledFulfillmentOrder,
  customsOrder,
  deliveredOrder,
  everyStatusOrder,
  freightPendingOrder,
  labelledOrder,
  labelReadyOrder,
  noDeliveryRowOrder,
  partlyShippedOrder,
  pricedOrder,
  purchasedLabelOrder,
  readyOrder,
  replacementOrder,
  shippedOrder,
  splitOrder,
  trackedOrder,
  unaddressedDraft,
} from '../../../fixtures/admin/after-sale'
import { draftOrder } from '../../../fixtures/admin/orders'
import { fulfillmentWriteHeld } from '../../../mocks/handlers/admin/after-sale'
import { orderParameters } from './order-page'

/**
 * An order's fulfilments (DA-ORD-04): the units still waiting for a parcel,
 * and each parcel with its location, delivery method and cost, its label,
 * paperwork and tracking, what it holds, and what can be done with it at its
 * status. Every story is the card as the order page shows it.
 */
const meta = {
  title: 'Admin dashboard/Orders/Fulfillments card',
  component: FulfillmentsCard,
  tags: ['CMP-DA-G-11'],
  args: { order: readyOrder },
  decorators: [withStore],
  parameters: orderParameters({ order: readyOrder, column: 'main' }),
} satisfies Meta<typeof FulfillmentsCard>

export default meta
type Story = StoryObj<typeof meta>

const on = (order: Order, extra: Parameters<typeof orderParameters>[0] = {}) => ({
  args: { order },
  parameters: orderParameters({ order, column: 'main', ...extra }),
})
const openMenu = async (index = 0) => {
  const menus = await screen.findAllByRole('button', { name: 'Actions' })
  await userEvent.click(menus[index])
}
const choose = async (item: string) => {
  await userEvent.click(await screen.findByRole('menuitem', { name: item }))
}

// ---------------------------------------------------------------------------
// Before anything is packed
// ---------------------------------------------------------------------------

// A draft with no address has no parcel: its items wait until it is placed.
export const DraftUnclaimed: Story = {
  name: 'Draft, items unclaimed',
  ...on(unaddressedDraft),
}

// With an address the draft has its parcel, but nothing ships until it is placed.
export const DraftWithParcel: Story = {
  name: 'Draft, with its parcel',
  ...on(addressedDraft),
}

export const Empty: Story = {
  name: 'No items',
  ...on({ ...draftOrder, items: [], fulfillments: [] }),
}

// Placed, with every unit still waiting for a parcel.
export const Awaiting: Story = {
  name: 'Placed, items still to fulfil',
  ...on(awaitingOrder),
}

export const AddFulfillment: Story = {
  name: 'Add fulfilment',
  ...on(awaitingOrder, { viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add fulfillment' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Ships from' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Shop location' }))
    const mugs = within(dialog).getByRole('spinbutton', { name: /^Clay mug/ })
    await userEvent.clear(mugs)
    await userEvent.type(mugs, '2')
  },
}

// Someone packed a mug meanwhile. The server's reason shows in the dialog,
// which has no field to hang it on.
export const AddFulfillmentRefused: Story = {
  name: 'Add fulfilment, refused',
  ...on(awaitingOrder, {
    viewport: true,
    first: [
      http.post('/api/v3/admin/orders/:id/fulfillments', () =>
        HttpResponse.json(
          {
            error: {
              code: 'validation_error',
              message:
                'Requested quantity (2) for item Clay mug exceeds its unfulfilled quantity (1)',
              details: {},
            },
          },
          { status: 422 },
        ),
      ),
    ],
  }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add fulfillment' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Ships from' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Shop location' }))
    const mugs = within(dialog).getByRole('spinbutton', { name: /^Clay mug/ })
    await userEvent.clear(mugs)
    await userEvent.type(mugs, '2')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }))
    await within(dialog).findByRole('alert')
    // Where focus lands after the refusal depends on how fast it came back.
    ;(document.activeElement as HTMLElement | null)?.blur()
  },
}

// ---------------------------------------------------------------------------
// A parcel ready to ship
// ---------------------------------------------------------------------------

export const Ready: Story = {
  name: 'Ready to ship',
  ...on(readyOrder),
}

export const ReadyMenu: Story = {
  name: 'Ready, menu open',
  ...on(readyOrder, { viewport: true }),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Print packing slip' })
  },
}

export const Fulfilling: Story = {
  name: 'Mark as fulfilled',
  ...on(readyOrder),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Mark as fulfilled' }))
    await screen.findByRole('button', { name: 'Fulfill items' })
  },
}

export const Edit: Story = {
  name: 'Edit dialog',
  ...on(readyOrder, { viewport: true }),
  play: async () => {
    await openMenu()
    await choose('Edit')
    await screen.findByRole('heading', { name: 'Edit fulfillment' })
  },
}

export const Split: Story = {
  name: 'Split dialog',
  ...on(readyOrder, { viewport: true }),
  play: async () => {
    await openMenu()
    await choose('Split')
    await screen.findByRole('heading', { name: 'Split fulfillment' })
  },
}

// Moving every unit would leave the parcel empty, which a split refuses.
export const SplitWouldEmpty: Story = {
  name: 'Split, would empty the parcel',
  ...on(readyOrder, { viewport: true }),
  play: async () => {
    await openMenu()
    await choose('Split')
    const quantity = await screen.findByRole('spinbutton', { name: 'Quantity to move' })
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '3')
    await screen.findByText(/Leave at least one unit behind/)
  },
}

export const SplitConfirmation: Story = {
  name: 'Split confirmation',
  ...on(readyOrder, { viewport: true }),
  play: async () => {
    await openMenu()
    await choose('Split')
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Split' }))
    await screen.findByText(/Move these units into a new fulfillment\?/)
  },
}

export const CancelConfirmation: Story = {
  name: 'Cancel confirmation',
  ...on(readyOrder, { viewport: true }),
  play: async () => {
    await openMenu()
    await choose('Cancel')
    await screen.findByText('Cancel this fulfillment?')
  },
}

export const AddTracking: Story = {
  name: 'Add tracking, before it ships',
  ...on(readyOrder, { viewport: true }),
  play: async () => {
    await openMenu()
    await choose('Add tracking')
    await screen.findByRole('heading', { name: 'Add tracking' })
  },
}

export const UploadLabel: Story = {
  name: 'Upload label',
  ...on(readyOrder, { viewport: true }),
  play: async () => {
    await openMenu()
    await choose('Upload label')
    await screen.findByRole('heading', { name: 'Upload label' })
  },
}

// Nothing on the shelf: the parcel reads like any other, and the order says "Backorder".
export const Backordered: Story = {
  ...on(backorderedOrder),
}

// The second location adds its own delivery cost.
export const TwoLocations: Story = {
  name: 'From two locations',
  ...on(splitOrder),
}

export const Priced: Story = {
  name: 'Lines priced by a price list and a catalog',
  ...on(pricedOrder),
}

// Freight waiting on the forwarder's quote, which is not the same as free.
export const Freight: Story = {
  name: 'Freight, quoted after review',
  ...on(freightPendingOrder),
}

// No method and nothing to pay: the delivery row steps aside.
export const NoDeliveryRow: Story = {
  name: 'No delivery method or cost',
  ...on(noDeliveryRowOrder),
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export const LabelUploaded: Story = {
  name: 'Label uploaded',
  ...on(labelledOrder),
}

// The method's provider buys labels, so buying one comes before shipping.
export const LabelToBuy: Story = {
  name: 'Label to buy',
  ...on(labelReadyOrder),
}

export const BuyLabelConfirmation: Story = {
  name: 'Buy label confirmation',
  ...on(labelReadyOrder, { viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Buy label' }))
    await screen.findByText(/Buy a Standard label for \$8\.00\?/)
  },
}

export const BuyingLabel: Story = {
  name: 'Buying a label',
  ...on(labelReadyOrder, {
    viewport: true,
    first: fulfillmentWriteHeld('post /:fulfillmentId/labels'),
  }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Buy label' }))
    await screen.findByText(/Buy a Standard label for \$8\.00\?/)
    const buttons = screen.getAllByRole('button', { name: 'Buy label' })
    await userEvent.click(buttons[buttons.length - 1])
    await screen.findByRole('button', { name: 'Saving…' })
  },
}

export const LabelPurchased: Story = {
  name: 'Label bought',
  ...on(purchasedLabelOrder),
}

// ---------------------------------------------------------------------------
// After it ships
// ---------------------------------------------------------------------------

// Sent with a number the carrier has not picked up yet.
export const Shipped: Story = {
  ...on(shippedOrder),
}

export const ShippedMenu: Story = {
  name: 'Shipped, menu open',
  ...on(shippedOrder, { viewport: true }),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Add tracking' })
  },
}

// Two carriers Spree knows, and a freight forwarder it does not.
export const Tracked: Story = {
  name: 'Three consignments',
  ...on(trackedOrder),
}

export const EveryCarrierStatus: Story = {
  name: 'Every carrier status',
  ...on(everyStatusOrder),
}

export const CustomsPaperwork: Story = {
  name: 'Bought label and customs paperwork',
  ...on(customsOrder),
}

export const Delivered: Story = {
  ...on(deliveredOrder),
}

// The mugs went out first; the apron still waits.
export const PartlyShipped: Story = {
  name: 'Partly shipped',
  ...on(partlyShippedOrder),
}

// An exchange's replacement ships in its own parcel, at no charge.
export const Replacement: Story = {
  name: 'Replacement parcel',
  ...on(replacementOrder),
}

// Canceled before it shipped. Its units stay on it, so the card offers no new parcel for them.
export const Canceled: Story = {
  name: 'Canceled',
  ...on(canceledFulfillmentOrder),
}
