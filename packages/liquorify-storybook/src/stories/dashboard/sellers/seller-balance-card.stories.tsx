import type { Meta, StoryObj } from '@storybook/react-vite'
import { HttpResponse, http } from 'msw'
import { screen, userEvent } from 'storybook/test'
import { SellerBalanceCard } from '../../../../../dashboard/src/components/spree/sellers/seller-balance-card'
import { withStore } from '../../../decorators/store'
import { harbourCask } from '../../../fixtures/admin/marketplace'
import { sellerParameters, sellerViewerRules } from './seller-page'

/**
 * What a seller has earned, been paid and is owed, per currency, with the
 * operator's Settle now (DA-SEL-02's sidebar).
 */
const meta = {
  title: 'Admin dashboard/Sellers/Seller balance card',
  component: SellerBalanceCard,
  tags: ['CMP-DA-G-18'],
  args: { seller: harbourCask },
  decorators: [withStore],
  parameters: sellerParameters({ column: 'sidebar' }),
} satisfies Meta<typeof SellerBalanceCard>

export default meta
type Story = StoryObj<typeof meta>

export const Owed: Story = { name: 'Owed, earned and paid' }

export const NothingYet: Story = {
  name: 'Nothing earned yet',
  parameters: sellerParameters({
    column: 'sidebar',
    first: [http.get('/api/v3/admin/sellers/:id/balances', () => HttpResponse.json({ data: [] }))],
  }),
}

export const WithoutWrite: Story = {
  name: 'Without write on payouts',
  parameters: sellerParameters({ column: 'sidebar', rules: sellerViewerRules }),
}

export const SettleConfirm: Story = {
  name: 'Settle confirmation',
  parameters: sellerParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Settle now' }))
    await screen.findByText('Settle this seller now?')
  },
}
