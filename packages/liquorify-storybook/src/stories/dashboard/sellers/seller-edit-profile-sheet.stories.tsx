import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SellerEditProfileSheet } from '../../../../../dashboard/src/components/spree/sellers/seller-edit-profile-sheet'
import { withStore } from '../../../decorators/store'
import { fennelOak, harbourCask } from '../../../fixtures/admin/marketplace'
import { sellerParameters } from './seller-page'

/** The operator edits a seller's public profile on its behalf (DA-SEL-02's Edit). */
const meta = {
  title: 'Admin dashboard/Sellers/Seller edit profile sheet',
  component: SellerEditProfileSheet,
  tags: ['CMP-DA-G-18'],
  args: { seller: harbourCask, open: true, onOpenChange: fn() },
  decorators: [withStore],
  parameters: sellerParameters({ viewport: true }),
} satisfies Meta<typeof SellerEditProfileSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Filled: Story = {}
export const Blank: Story = {
  args: { seller: fennelOak },
  parameters: sellerParameters({ seller: fennelOak, viewport: true }),
}
