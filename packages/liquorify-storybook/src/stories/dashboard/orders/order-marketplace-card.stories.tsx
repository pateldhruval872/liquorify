import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, http } from 'msw'
import { MarketplaceCard } from '../../../../../dashboard/src/components/spree/orders/order-marketplace-card'
import { withStore } from '../../../decorators/store'
import { harbourOrder } from '../../../fixtures/admin/marketplace'
import { paidOrder } from '../../../fixtures/admin/orders'
import { marketplaceRequests } from '../../../mocks/handlers/admin/marketplace'
import { orderParameters } from './order-page'

const sidebar = (order = harbourOrder, first = marketplaceRequests()) =>
  orderParameters({ order, column: 'sidebar', first })

/**
 * Which seller an order belongs to, and that it was one part of a larger
 * purchase (DA-ORD-04's sidebar). The store's own orders show no card.
 */
const meta = {
  title: 'Admin dashboard/Orders/Order marketplace card',
  component: MarketplaceCard,
  tags: ['CMP-DA-G-11'],
  args: { order: harbourOrder },
  decorators: [withStore],
  parameters: sidebar(),
} satisfies Meta<typeof MarketplaceCard>

export default meta
type Story = StoryObj<typeof meta>

export const SellersOrder: Story = { name: "A seller's order, part of a larger purchase" }

// A role that may read orders but not sellers is refused the seller, so the
// card names it by its ID, as the order manager template saw it.
export const SellerUnreadable: Story = {
  name: 'The seller refused',
  parameters: sidebar(harbourOrder, [
    http.get('/api/v3/admin/sellers/:id', () =>
      HttpResponse.json(
        {
          error: { code: 'access_denied', message: 'You are not authorized to access this page.' },
        },
        { status: 403 },
      ),
    ),
  ]),
}

export const StoresOwn: Story = {
  name: "The store's own order (no card)",
  args: { order: paidOrder },
  parameters: sidebar(paidOrder),
}
