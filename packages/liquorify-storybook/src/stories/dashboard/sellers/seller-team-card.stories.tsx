import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent, within } from 'storybook/test'
import { SellerTeamCard } from '../../../../../dashboard/src/components/spree/sellers/seller-team-card'
import { withStore } from '../../../decorators/store'
import { fennelOak, harbourCask } from '../../../fixtures/admin/marketplace'
import { readHeld } from '../../../mocks/handlers/admin/records'
import { sellerParameters, sellerViewerRules } from './seller-page'

/** Who runs the seller from the seller panel, and who has been invited to (DA-SEL-02's main column). */
const meta = {
  title: 'Admin dashboard/Sellers/Seller team card',
  component: SellerTeamCard,
  tags: ['CMP-DA-G-18'],
  args: { seller: harbourCask, onInvite: fn() },
  decorators: [withStore],
  parameters: sellerParameters({ column: 'main' }),
} satisfies Meta<typeof SellerTeamCard>

export default meta
type Story = StoryObj<typeof meta>

export const MemberAndInvitation: Story = { name: 'A member and a pending invitation' }

export const Empty: Story = {
  name: 'Nobody yet',
  args: { seller: fennelOak },
  parameters: sellerParameters({ column: 'main', team: false }),
}

export const Loading: Story = {
  parameters: sellerParameters({ column: 'main', first: readHeld('sellers/:id/team') }),
}

export const ReadOnly: Story = {
  name: 'Read-only',
  parameters: sellerParameters({ column: 'main', rules: sellerViewerRules }),
}

const rowMenu = async (text: string) => {
  const row = (await screen.findByText(text)).closest('.justify-between') as HTMLElement
  await userEvent.click(await within(row).findByRole('button', { name: 'Open actions' }))
}

export const RemoveConfirm: Story = {
  name: 'Remove confirmation',
  parameters: sellerParameters({ column: 'main', viewport: true }),
  play: async () => {
    await rowMenu('ines.carvalho@harbour-cask.example.com')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }))
    await screen.findByText('Remove team member?')
  },
}

export const RevokeConfirm: Story = {
  name: 'Revoke confirmation',
  parameters: sellerParameters({ column: 'main', viewport: true }),
  play: async () => {
    await rowMenu('cellar@harbour-cask.example.com')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Revoke' }))
    await screen.findByText('Revoke invitation?')
  },
}
