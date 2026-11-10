import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SellerBrandCard } from '../../../../../dashboard/src/components/spree/sellers/seller-brand-card'
import { withStore } from '../../../decorators/store'
import { fennelOak, harbourCask } from '../../../fixtures/admin/marketplace'
import { sellerParameters } from './seller-page'

/** The seller's public face: cover photo, logo, address and description (DA-SEL-02's main column). */
const meta = {
  title: 'Admin dashboard/Sellers/Seller brand card',
  component: SellerBrandCard,
  tags: ['CMP-DA-G-18'],
  args: { seller: harbourCask, canEdit: true, onEdit: fn() },
  decorators: [withStore],
  parameters: sellerParameters({ column: 'main' }),
} satisfies Meta<typeof SellerBrandCard>

export default meta
type Story = StoryObj<typeof meta>

export const Described: Story = {}
export const NotFilledIn: Story = { name: 'Not filled in', args: { seller: fennelOak } }
export const ReadOnly: Story = { name: 'Read-only', args: { canEdit: false } }
