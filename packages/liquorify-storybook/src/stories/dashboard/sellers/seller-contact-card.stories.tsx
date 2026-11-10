import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SellerContactCard } from '../../../../../dashboard/src/components/spree/sellers/seller-contact-card'
import { withStore } from '../../../decorators/store'
import { fennelOak, harbourCask } from '../../../fixtures/admin/marketplace'
import { sellerParameters } from './seller-page'

/** Where the marketplace reaches the seller, and where its bills go (DA-SEL-02's sidebar). */
const meta = {
  title: 'Admin dashboard/Sellers/Seller contact card',
  component: SellerContactCard,
  tags: ['CMP-DA-G-18'],
  args: { seller: harbourCask, canEdit: true, onEdit: fn() },
  decorators: [withStore],
  parameters: sellerParameters({ column: 'sidebar' }),
} satisfies Meta<typeof SellerContactCard>

export default meta
type Story = StoryObj<typeof meta>

export const BothEmails: Story = { name: 'Both emails' }
export const NoBillingEmail: Story = { name: 'No billing email', args: { seller: fennelOak } }
export const ReadOnly: Story = { name: 'Read-only', args: { canEdit: false } }
