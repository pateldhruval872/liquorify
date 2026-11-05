import type { Meta, StoryObj } from '@storybook/react-vite'
import { InventoryStatusBadge } from '../../../../../dashboard/src/components/spree/inventory-status-badge'

// A stock transfer's or purchase order's status, on its list (DA-INV-02,
// DA-INV-06) and its page's header (DA-INV-04, DA-INV-08). A received
// document reads green, an over-received one amber.
const meta = {
  title: 'Admin dashboard/Stock/Inventory status badge',
  component: InventoryStatusBadge,
  tags: ['CMP-DA-G-24'],
  args: { status: 'draft', resource: 'stock_transfers' },
} satisfies Meta<typeof InventoryStatusBadge>

export default meta
type Story = StoryObj<typeof meta>

const transfer = (status: string): Story => ({ args: { status, resource: 'stock_transfers' } })
const order = (status: string): Story => ({ args: { status, resource: 'purchase_orders' } })

export const TransferDraft = transfer('draft')
export const TransferReadyToShip = transfer('ready_to_ship')
export const TransferInTransit = transfer('in_transit')
export const TransferPartiallyReceived = transfer('partially_received')
export const TransferReceived = transfer('received')
export const TransferOverReceived = transfer('over_received')
export const TransferCanceled = transfer('canceled')
export const PurchaseOrderDraft = order('draft')
export const PurchaseOrderOrdered = order('ordered')
export const PurchaseOrderPartiallyReceived = order('partially_received')
export const PurchaseOrderReceived = order('received')
export const PurchaseOrderOverReceived = order('over_received')
export const PurchaseOrderCanceled = order('canceled')
