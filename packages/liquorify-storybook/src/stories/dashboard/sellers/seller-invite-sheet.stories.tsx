import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent } from 'storybook/test'
import { SellerInviteSheet } from '../../../../../dashboard/src/components/spree/sellers/seller-invite-sheet'
import { withStore } from '../../../decorators/store'
import { fennelOak } from '../../../fixtures/admin/marketplace'
import { sellerParameters } from './seller-page'

/** Invites someone to run the seller from the seller panel (DA-SEL-02's Invite). */
const meta = {
  title: 'Admin dashboard/Sellers/Seller invite sheet',
  component: SellerInviteSheet,
  tags: ['CMP-DA-G-18'],
  args: { seller: fennelOak, open: true, onOpenChange: fn() },
  decorators: [withStore],
  parameters: sellerParameters({ seller: fennelOak, viewport: true }),
} satisfies Meta<typeof SellerInviteSheet>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}

export const NoAddress: Story = {
  name: 'No address',
  play: async () => {
    await userEvent.clear(await screen.findByLabelText(/email/i))
    await userEvent.click(screen.getByRole('button', { name: 'Send invitation' }))
    await screen.findByRole('alert')
  },
}
