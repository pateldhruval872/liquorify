import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { SellerOnboardingCard } from '../../../../../dashboard/src/components/spree/sellers/seller-onboarding-card'
import { withStore } from '../../../decorators/store'
import { harbourCask, juniper, stonecrop } from '../../../fixtures/admin/marketplace'
import { readHeld } from '../../../mocks/handlers/admin/records'
import { sellerParameters } from './seller-page'

/**
 * The seller's onboarding checklist, as the operator reviews it (DA-SEL-02's
 * main column): each requirement's status, what the seller sent, the
 * operator's note, and accept, send back and waive.
 */
const meta = {
  title: 'Admin dashboard/Sellers/Seller onboarding card',
  component: SellerOnboardingCard,
  tags: ['CMP-DA-G-18'],
  args: { seller: stonecrop, canEdit: true },
  decorators: [withStore],
  parameters: sellerParameters({ seller: stonecrop, column: 'main' }),
} satisfies Meta<typeof SellerOnboardingCard>

export default meta
type Story = StoryObj<typeof meta>

export const UnderReview: Story = { name: 'A submission under review' }

export const SentBack: Story = {
  name: 'A submission sent back',
  args: { seller: harbourCask },
  parameters: sellerParameters({ column: 'main' }),
}

export const AllDone: Story = {
  name: 'All done, folded',
  args: { seller: juniper },
  parameters: sellerParameters({ seller: juniper, column: 'main' }),
}

export const AllDoneOpen: Story = {
  name: 'All done, with waived requirements',
  args: { seller: juniper },
  parameters: sellerParameters({ seller: juniper, column: 'main' }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: /onboarding/i }))
    await screen.findAllByText('Waived')
  },
}

export const ReadOnly: Story = { name: 'Read-only', args: { canEdit: false } }

export const Loading: Story = {
  parameters: sellerParameters({
    seller: stonecrop,
    column: 'main',
    first: readHeld('sellers/:id/onboarding'),
  }),
}

export const SendBackConfirm: Story = {
  name: 'Send back confirmation',
  parameters: sellerParameters({ seller: stonecrop, column: 'main', viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Send back' }))
    await screen.findByText('Send back?')
  },
}

// The requirement's menu button has no name of its own, so it is found in
// the requirement's row.
export const WaiveConfirm: Story = {
  name: 'Waive confirmation',
  parameters: sellerParameters({ seller: stonecrop, column: 'main', viewport: true }),
  play: async () => {
    const row = (await screen.findByText('Accept terms')).closest('li') as HTMLElement
    const buttons = within(row).getAllByRole('button')
    await userEvent.click(buttons[buttons.length - 1])
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Waive for this seller' }))
    await screen.findByText('Waive this requirement?')
  },
}
