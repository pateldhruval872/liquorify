import type { Meta, StoryObj } from '@storybook/react-vite'
import { SellerStatusCard } from '../../../../../dashboard/src/components/spree/sellers/seller-status-card'
import { withStore } from '../../../decorators/store'
import {
  copperline,
  fennelOak,
  harbourCask,
  juniper,
  larkspur,
  northgate,
  stonecrop,
  withdrawnSeller,
} from '../../../fixtures/admin/marketplace'
import { sellerParameters } from './seller-page'

/** Where a seller stands, with a line on what that status means (DA-SEL-02's sidebar). */
const meta = {
  title: 'Admin dashboard/Sellers/Seller status card',
  component: SellerStatusCard,
  tags: ['CMP-DA-G-18'],
  args: { seller: harbourCask },
  decorators: [withStore],
  parameters: sellerParameters({ column: 'sidebar' }),
} satisfies Meta<typeof SellerStatusCard>

export default meta
type Story = StoryObj<typeof meta>

export const Approved: Story = {}
export const Pending: Story = { args: { seller: fennelOak } }
export const Invited: Story = { args: { seller: larkspur } }
export const Onboarding: Story = { args: { seller: stonecrop } }
export const ReadyForReview: Story = { name: 'Ready for review', args: { seller: juniper } }
export const Rejected: Story = { args: { seller: northgate } }
export const Suspended: Story = { args: { seller: copperline } }
// No workflow reaches canceled at the pinned revision; the label is shown as the screens carry it.
export const Canceled: Story = { args: { seller: withdrawnSeller } }
