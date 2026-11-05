import { adminClient } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { StockReceiptsCard } from '../../../../../dashboard/src/components/spree/stock-receipts-card'
import { withStore } from '../../../decorators/store'
import {
  inTransitTransfer,
  partiallyReceivedOrder,
  partiallyReceivedTransfer,
  receivedTransfer,
} from '../../../fixtures/admin/inventory'
import { receiptsFailed, receiptsHeld } from '../../../mocks/handlers/admin/inventory'
import { inventoryParameters, inventoryRoutes } from './inventory-page'

type Document = 'stock_transfers' | 'purchase_orders'

/**
 * The deliveries booked against a transfer or a purchase order, on its page
 * (DA-INV-04, DA-INV-08), read as the page reads them: each with its number,
 * when it came, its delivery note, what was accepted and refused and why.
 */
function Deliveries({ document, id }: { document: Document; id: string }) {
  const resource =
    document === 'stock_transfers' ? adminClient.stockTransfers : adminClient.purchaseOrders
  return (
    <StockReceiptsCard
      queryKey={[document, id, 'stock-receipts']}
      fetch={() => resource.stockReceipts.list(id, { expand: ['items'] })}
    />
  )
}

const deliveries = (options: Parameters<typeof inventoryParameters>[0] = {}) =>
  inventoryParameters({ route: inventoryRoutes.transfer, column: 'main', ...options })

const meta = {
  title: 'Admin dashboard/Stock/Stock receipts card',
  component: Deliveries,
  tags: ['CMP-DA-G-24'],
  args: { document: 'stock_transfers', id: partiallyReceivedTransfer.id },
  decorators: [withStore],
  parameters: deliveries(),
} satisfies Meta<typeof Deliveries>

export default meta
type Story = StoryObj<typeof meta>

// One drop so far, with a chipped mug refused as damaged.
export const OneDelivery: Story = {
  name: 'One delivery',
  play: async () => {
    await screen.findByText('R200031')
  },
}

// A transfer received over two drops, newest first.
export const TwoDeliveries: Story = {
  name: 'Two deliveries',
  args: { id: receivedTransfer.id },
  play: async () => {
    await screen.findByText('R200028')
  },
}

export const PurchaseOrder: Story = {
  name: 'Purchase order',
  args: { document: 'purchase_orders', id: partiallyReceivedOrder.id },
  parameters: deliveries({ route: inventoryRoutes.purchaseOrder }),
  play: async () => {
    await screen.findByText('Packing slip 5531')
  },
}

export const None: Story = {
  args: { id: inTransitTransfer.id },
  play: async () => {
    await screen.findByText('No deliveries yet')
  },
}

// While the request is out, the card says there are none.
export const Loading: Story = {
  parameters: deliveries({ first: receiptsHeld('stock_transfers') }),
}

export const Failed: Story = {
  parameters: deliveries({ first: receiptsFailed('stock_transfers') }),
  play: async () => {
    await screen.findByText('The deliveries could not be loaded.', undefined, { timeout: 10_000 })
  },
}
