import type { Meta, StoryObj } from '@storybook/react-vite'
import { BalanceSummary } from '../../../../../seller-dashboard/src/components/finance/balance-summary'
import { balances } from '../../../fixtures/seller/balances'

const meta = {
  title: 'Seller panel/Finance/Balance summary',
  component: BalanceSummary,
  tags: ['CMP-SP-G-01'],
  args: { balances },
  parameters: { liquorify: { panel: 'seller', sellerId: 'seller_2Wd7Np3c' } },
} satisfies Meta<typeof BalanceSummary>

export default meta
type Story = StoryObj<typeof meta>

export const TwoCurrencies: Story = { name: 'Two currencies, one converted' }

export const OneCurrency: Story = { name: 'One currency', args: { balances: balances.slice(0, 1) } }

export const Empty: Story = { args: { balances: [] } }
