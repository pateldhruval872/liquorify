import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { SellerAddressCard } from '../../../../../dashboard/src/components/spree/sellers/seller-address-card'
import { withStore } from '../../../decorators/store'
import { harbourCask, harbourCaskAddressed } from '../../../fixtures/admin/marketplace'
import { sellerParameters } from './seller-page'

/**
 * A seller's billing or returns address (DA-SEL-02's sidebar). Only the
 * billing address is edited here; the returns address comes from the seller's
 * own stock location.
 */
const meta = {
  title: 'Admin dashboard/Sellers/Seller address card',
  component: SellerAddressCard,
  tags: ['CMP-DA-G-18'],
  args: { seller: harbourCask, addressKey: 'billing_address', canEdit: true },
  decorators: [withStore],
  parameters: sellerParameters({ column: 'sidebar' }),
} satisfies Meta<typeof SellerAddressCard>

export default meta
type Story = StoryObj<typeof meta>

export const BillingNotFilled: Story = { name: 'Billing, not filled' }
export const BillingFilled: Story = {
  name: 'Billing, filled',
  args: { seller: harbourCaskAddressed },
}
export const ReturnsNotFilled: Story = {
  name: 'Returns, not filled',
  args: { addressKey: 'returns_address' },
}
export const ReturnsFilled: Story = {
  name: 'Returns, filled',
  args: { seller: harbourCaskAddressed, addressKey: 'returns_address' },
}
export const ReadOnly: Story = {
  name: 'Read-only',
  args: { seller: harbourCaskAddressed, canEdit: false },
}
export const Editing: Story = {
  name: 'Editing the billing address',
  args: { seller: harbourCaskAddressed },
  parameters: sellerParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))
    await screen.findByRole('dialog')
  },
}
