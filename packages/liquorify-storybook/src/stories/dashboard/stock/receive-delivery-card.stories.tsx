import type { PurchaseOrder as Order, StockTransfer } from '@spree/admin-sdk'
import { Subject } from '@spree/dashboard-core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import {
  type ReceivableLine,
  ReceiveDeliveryCard,
} from '../../../../../dashboard/src/components/spree/receive-delivery-card'
import { withStore } from '../../../decorators/store'
import {
  inTransitTransfer,
  partiallyReceivedOrder,
  partiallyReceivedTransfer,
  stockViewerRules,
} from '../../../fixtures/admin/inventory'
import { templateRules } from '../../../fixtures/admin/shell'
import { inventoryParameters, inventoryRoutes } from './inventory-page'

/** A document's lines as the page hands them to the card. */
function receivable(document: StockTransfer | Order): ReceivableLine[] {
  return (document.items ?? []).map((item) => ({
    id: item.id,
    product_id: item.product_id,
    variant_name: item.variant_name,
    variant_sku: item.variant_sku,
    thumbnail_url: item.thumbnail_url,
    quantity_expected: 'quantity_shipped' in item ? item.quantity_shipped : item.quantity_ordered,
    quantity_received: item.quantity_received,
    quantity_rejected: item.quantity_rejected,
    outstanding: item.outstanding,
  }))
}

const card = (options: Parameters<typeof inventoryParameters>[0] = {}) =>
  inventoryParameters({ route: inventoryRoutes.transfer, column: 'main', ...options })

// Counting a delivery in, on a transfer in flight (DA-INV-04) or a placed
// purchase order (DA-INV-08): accepted and refused per line, with why each
// refusal was made.
const meta = {
  title: 'Admin dashboard/Stock/Receive delivery card',
  component: ReceiveDeliveryCard,
  tags: ['CMP-DA-G-24'],
  args: {
    lines: receivable(inTransitTransfer),
    expectedLabel: 'Shipped',
    subject: Subject.StockTransfer,
    pending: false,
    onReceive: fn(async () => undefined),
  },
  decorators: [withStore],
  parameters: card(),
} satisfies Meta<typeof ReceiveDeliveryCard>

export default meta
type Story = StoryObj<typeof meta>

const count = async (column: 'Accepted' | 'Rejected', row: number, value: string) => {
  const field = (await screen.findAllByRole('spinbutton', { name: column }))[row]
  await userEvent.clear(field)
  await userEvent.type(field, value)
}

// Nothing counted yet, so Receive waits.
export const Empty: Story = {
  play: async () => {
    await screen.findByText('0 accepted, 0 rejected in this delivery')
  },
}

export const Counted: Story = {
  play: async () => {
    await count('Accepted', 0, '12')
    await count('Accepted', 1, '6')
  },
}

// A refused unit needs a reason before the delivery can be booked.
export const RefusalWithoutReason: Story = {
  name: 'Refusal without a reason',
  play: async () => {
    await count('Accepted', 0, '11')
    await count('Rejected', 0, '1')
  },
}

export const DamagedOnArrival: Story = {
  name: 'Damaged on arrival',
  play: async () => {
    await count('Accepted', 0, '11')
    await count('Rejected', 0, '1')
    await userEvent.click(screen.getByRole('combobox', { name: 'Reason' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Damaged' }))
    await userEvent.type(screen.getByLabelText('Delivery note'), 'Van 2, second drop')
  },
}

// The second drop of a transfer already part received, with what came and
// what was refused the first time.
export const SecondDelivery: Story = {
  name: 'Second delivery',
  args: { lines: receivable(partiallyReceivedTransfer) },
  play: async () => {
    await screen.findByText('(1 rejected)')
  },
}

export const PurchaseOrder: Story = {
  name: 'Purchase order',
  args: {
    lines: receivable(partiallyReceivedOrder),
    expectedLabel: 'Ordered',
    subject: Subject.PurchaseOrder,
  },
  parameters: card({ route: inventoryRoutes.purchaseOrder }),
  play: async () => {
    await screen.findByText('(2 rejected)')
  },
}

export const Saving: Story = {
  args: { pending: true },
  play: async () => {
    await count('Accepted', 0, '12')
    await count('Accepted', 1, '6')
    await screen.findByRole('button', { name: 'Saving…' })
  },
}

// Reading stock and purchasing, writing neither: no Receive button.
export const ReadOnlyRole: Story = {
  name: 'Read-only role',
  parameters: card({ rules: stockViewerRules }),
  play: async () => {
    await screen.findByText('0 accepted, 0 rejected in this delivery')
  },
}

// The merchandiser template writes stock but holds no purchasing: a purchase
// order's card offers no Receive button.
export const MerchandiserOnPurchaseOrder: Story = {
  name: 'Merchandiser on a purchase order',
  args: {
    lines: receivable(partiallyReceivedOrder),
    expectedLabel: 'Ordered',
    subject: Subject.PurchaseOrder,
  },
  parameters: card({
    route: inventoryRoutes.purchaseOrder,
    rules: templateRules.merchandiser.rules,
  }),
}
