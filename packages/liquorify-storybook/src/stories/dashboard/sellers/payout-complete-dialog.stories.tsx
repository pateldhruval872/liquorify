import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PayoutCompleteDialog } from '../../../../../dashboard/src/components/spree/sellers/payout-complete-dialog'
import { withStore } from '../../../decorators/store'
import { pendingPayout } from '../../../fixtures/admin/marketplace'
import { sellerParameters } from './seller-page'

/**
 * Records that a payout reached the seller, with the bank reference it went
 * under (DA-SEL-06's Mark as paid). It moves no money.
 */
const meta = {
  title: 'Admin dashboard/Sellers/Payout complete dialog',
  component: PayoutCompleteDialog,
  tags: ['CMP-DA-G-18'],
  args: { payout: pendingPayout, open: true, onOpenChange: fn() },
  decorators: [withStore],
  parameters: sellerParameters({ viewport: true }),
} satisfies Meta<typeof PayoutCompleteDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
