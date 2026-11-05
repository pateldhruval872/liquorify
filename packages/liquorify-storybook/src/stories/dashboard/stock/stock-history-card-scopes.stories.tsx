import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { StockHistoryCard } from '../../../../../dashboard/src/components/spree/stock-history-card'
import { withStore } from '../../../decorators/store'
import { apronStockMovements } from '../../../fixtures/admin/catalog'
import { draftTransfer, placedOrder } from '../../../fixtures/admin/inventory'
import { stockLocations } from '../../../fixtures/admin/settings'
import { stockMovementList, stockMovementsHeld } from '../../../mocks/handlers/admin/catalog'
import { inventoryParameters, inventoryRoutes } from './inventory-page'

const card = (options: Parameters<typeof inventoryParameters>[0] = {}) =>
  inventoryParameters({ route: inventoryRoutes.transfer, column: 'main', ...options })

// The stock history as a card: at the foot of a stock location's sheet
// (DA-SET-18), and on a transfer's (DA-INV-04) and purchase order's
// (DA-INV-08) pages, titled for the document. The product page's dialog form
// has its own stories.
const meta = {
  title: 'Admin dashboard/Stock/Stock history card',
  component: StockHistoryCard,
  tags: ['CMP-DA-G-24'],
  args: { stockLocationId: stockLocations[0].id },
  decorators: [withStore],
  parameters: card({ column: 'inSheet' }),
} satisfies Meta<typeof StockHistoryCard>

export default meta
type Story = StoryObj<typeof meta>

// The shop's changes, as its sheet lists them.
export const Location: Story = {
  play: async () => {
    await screen.findByText('Chipped in storage')
  },
}

export const Transfer: Story = {
  args: {
    stockLocationId: undefined,
    stockTransferId: draftTransfer.id,
    title: 'Stock movements for this transfer',
  },
  parameters: card({
    first: stockMovementList(apronStockMovements.filter((each) => each.stock_transfer_id)),
  }),
  play: async () => {
    await screen.findByText('Stock movements for this transfer')
  },
}

export const PurchaseOrder: Story = {
  name: 'Purchase order',
  args: {
    stockLocationId: undefined,
    purchaseOrderId: placedOrder.id,
    title: 'Stock movements for this order',
  },
  parameters: card({
    route: inventoryRoutes.purchaseOrder,
    first: stockMovementList(apronStockMovements.filter((each) => each.purchase_order_id)),
  }),
  play: async () => {
    await screen.findByText('Stock movements for this order')
  },
}

export const NoChanges: Story = {
  name: 'Nothing changed yet',
  parameters: card({ column: 'inSheet', first: stockMovementList([]) }),
  play: async () => {
    await screen.findByText('Nothing has changed this stock yet')
  },
}

export const Loading: Story = {
  parameters: card({ column: 'inSheet', first: stockMovementsHeld }),
}
