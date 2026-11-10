import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SellerSettlementCard } from '../../../../../dashboard/src/components/spree/sellers/seller-settlement-card'
import { withStore } from '../../../decorators/store'
import { fennelOak, harbourCask } from '../../../fixtures/admin/marketplace'
import { sellerParameters } from './seller-page'

/**
 * Who remits the tax, when the seller is paid and the least they are paid
 * (DA-SEL-02's sidebar). Only the operator sees these.
 */
const meta = {
  title: 'Admin dashboard/Sellers/Seller settlement card',
  component: SellerSettlementCard,
  tags: ['CMP-DA-G-18'],
  args: { seller: harbourCask, canEdit: true, onEdit: fn() },
  decorators: [withStore],
  parameters: sellerParameters({ column: 'sidebar' }),
} satisfies Meta<typeof SellerSettlementCard>

export default meta
type Story = StoryObj<typeof meta>

export const OwnSchedule: Story = { name: 'Its own schedule and minimum' }
export const StoreDefault: Story = { name: "The store's default", args: { seller: fennelOak } }
export const ReadOnly: Story = { name: 'Read-only', args: { canEdit: false } }
