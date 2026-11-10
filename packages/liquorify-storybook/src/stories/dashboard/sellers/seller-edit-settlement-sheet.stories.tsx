import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SellerEditSettlementSheet } from '../../../../../dashboard/src/components/spree/sellers/seller-edit-settlement-sheet'
import { withStore } from '../../../decorators/store'
import { fennelOak, harbourCask } from '../../../fixtures/admin/marketplace'
import { sellerParameters } from './seller-page'

/** The operator's own settings for a seller: tax remittance, payout schedule and minimum. */
const meta = {
  title: 'Admin dashboard/Sellers/Seller edit settlement sheet',
  component: SellerEditSettlementSheet,
  tags: ['CMP-DA-G-18'],
  args: { seller: harbourCask, open: true, onOpenChange: fn() },
  decorators: [withStore],
  parameters: sellerParameters({ viewport: true }),
} satisfies Meta<typeof SellerEditSettlementSheet>

export default meta
type Story = StoryObj<typeof meta>

export const OwnSchedule: Story = { name: 'Its own schedule and minimum' }
export const StoreDefault: Story = {
  name: "The store's default",
  args: { seller: fennelOak },
  parameters: sellerParameters({ seller: fennelOak, viewport: true }),
}
