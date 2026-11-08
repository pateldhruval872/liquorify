import { FulfillmentItemList } from '@spree/dashboard-ui/spree/fulfillment-item-list'
import type { Meta, StoryObj } from '@storybook/react-vite'

const mug = {
  key: 'li_2Mg6Kp8a',
  name: 'Clay mug',
  thumbnailUrl: '/fixtures/product-clay.png',
  displayPrice: '$24.00',
  quantity: 2,
}
const apron = {
  key: 'li_5Ap3Ln7b',
  name: 'Linen apron',
  optionsText: 'Color: Olive, Size: M',
  thumbnailUrl: '/fixtures/product-olive.png',
  displayPrice: '$38.00',
  quantity: 1,
}

/**
 * What a parcel holds: each item's image, name and options, and its price
 * times the units in the parcel, with where the price came from when an
 * agreement set it. Read-only; the order's items are changed on the edit page.
 */
const meta = {
  title: 'Dashboard UI/Composed/Fulfillment item list',
  component: FulfillmentItemList,
  tags: ['CMP-DUI-C-25'],
  args: { rows: [mug, apron] },
  parameters: { liquorify: { column: 'inMainCard' } },
} satisfies Meta<typeof FulfillmentItemList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const PriceSource: Story = {
  name: 'Price source',
  args: {
    rows: [
      {
        ...mug,
        quantity: 12,
        displayPrice: '$19.50',
        priceSource: <span>Priced by Wholesale</span>,
      },
      { ...apron, quantity: 24, priceSource: <span>Priced by Trade catalog</span> },
    ],
  },
}

// A surface that does not expose images or prices shows the name and the count.
export const NameAndCountOnly: Story = {
  name: 'Name and count only',
  args: {
    rows: [
      { key: mug.key, name: mug.name, quantity: 2 },
      { key: apron.key, name: apron.name, optionsText: apron.optionsText, quantity: 1 },
    ],
  },
}

export const LongNames: Story = {
  name: 'Long names',
  args: {
    rows: [
      {
        ...apron,
        name: 'Linen apron with adjustable neck strap, two front pockets and a towel loop',
        optionsText: 'Color: Olive, Size: M, Embroidery: Initials on the chest pocket',
        priceSource: <span>Priced by Harbor Kitchen Supply negotiated trade catalog</span>,
      },
    ],
  },
}
