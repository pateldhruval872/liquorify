import type { Meta, StoryObj } from '@storybook/react-vite'
import { LineItemPriceSource } from '../../../../../dashboard/src/components/spree/orders/line-item-price-source'
import { withStore } from '../../../decorators/store'
import { cataloguedToteItem, pricedMugItem, pricedOrder } from '../../../fixtures/admin/after-sale'
import { orderParameters } from './order-page'

/**
 * Which agreement priced a line on the order page (DA-ORD-04), as a link to
 * it: a standalone price list, or the catalog that owns one. A line at the
 * shop's price, or one priced by hand, names nothing.
 */
const meta = {
  title: 'Admin dashboard/Orders/Line item price source',
  component: LineItemPriceSource,
  tags: ['CMP-DA-G-11'],
  args: { lineItem: pricedMugItem },
  decorators: [withStore],
  parameters: orderParameters({ order: pricedOrder }),
} satisfies Meta<typeof LineItemPriceSource>

export default meta
type Story = StoryObj<typeof meta>

export const PriceList: Story = { name: 'Price list' }

export const Catalog: Story = {
  args: { lineItem: cataloguedToteItem },
}

// A list that has lost its name since is named by its id.
export const Unnamed: Story = {
  name: 'Price list with no name',
  args: { lineItem: { ...pricedMugItem, price_list_name: null } },
}
