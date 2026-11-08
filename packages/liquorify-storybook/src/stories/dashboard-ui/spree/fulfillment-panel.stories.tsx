import { EllipsisVerticalIcon } from '@spree/dashboard-ui/icons'
import { FulfillmentItemList } from '@spree/dashboard-ui/spree/fulfillment-item-list'
import { FulfillmentPanel } from '@spree/dashboard-ui/spree/fulfillment-panel'
import { Button } from '@spree/dashboard-ui/ui/button'
import type { Meta, StoryObj } from '@storybook/react-vite'

const rows = [
  {
    key: 'li_2Mg6Kp8a',
    name: 'Clay mug',
    thumbnailUrl: '/fixtures/product-clay.png',
    displayPrice: '$24.00',
    quantity: 2,
  },
  {
    key: 'li_5Ap3Ln7b',
    name: 'Linen apron',
    optionsText: 'Color: Olive, Size: M',
    thumbnailUrl: '/fixtures/product-olive.png',
    displayPrice: '$38.00',
    quantity: 1,
  },
]

const menu = (
  <Button variant="ghost" size="icon-xs">
    <EllipsisVerticalIcon className="size-4" />
    <span className="sr-only">Actions</span>
  </Button>
)

/**
 * One parcel on an order page: its status, where it ships from, when it
 * shipped and its own menu, around what it holds. The admin dashboard and the
 * seller panel both draw a parcel with it.
 */
const meta = {
  title: 'Dashboard UI/Composed/Fulfillment panel',
  component: FulfillmentPanel,
  tags: ['CMP-DUI-C-26'],
  args: {
    status: 'unfulfilled',
    location: 'Shop location',
    actions: menu,
    children: <FulfillmentItemList rows={rows} />,
  },
  parameters: { liquorify: { column: 'inMainCard' } },
} satisfies Meta<typeof FulfillmentPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Unfulfilled: Story = {}

export const Fulfilled: Story = {
  args: {
    status: 'fulfilled',
    meta: <span className="text-muted-foreground text-xs">Fulfilled 2 days ago</span>,
  },
}

export const Delivered: Story = {
  args: {
    status: 'delivered',
    meta: <span className="text-muted-foreground text-xs">Fulfilled 2 days ago</span>,
  },
}

export const Canceled: Story = {
  args: { status: 'canceled' },
}

// The seller panel names the status itself.
export const NamedStatus: Story = {
  name: 'Named status',
  args: { status: 'unfulfilled', statusLabel: 'Ready to pack' },
}

// A long warehouse name is cut short rather than pushing the menu off the card.
export const LongLocation: Story = {
  name: 'Long location',
  args: { location: 'Harbor Kitchen Supply fulfilment centre, building C, bay 14 (overflow)' },
}

// Nothing to act on, and no location yet.
export const Bare: Story = {
  args: { location: null, actions: undefined },
}
