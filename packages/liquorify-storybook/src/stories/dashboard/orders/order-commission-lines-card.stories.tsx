import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen } from 'storybook/test'
import { CommissionLinesCard } from '../../../../../dashboard/src/components/spree/orders/order-commission-lines-card'
import { withStore } from '../../../decorators/store'
import { harbourOrder } from '../../../fixtures/admin/marketplace'
import { marketplaceRequests, noCommissionLines } from '../../../mocks/handlers/admin/marketplace'
import { readFailed, readHeld } from '../../../mocks/handlers/admin/records'
import { orderParameters } from './order-page'

const main = (first = marketplaceRequests()) =>
  orderParameters({ order: harbourOrder, column: 'main', first })

/**
 * What the marketplace charged a seller on an order (DA-ORD-04's main
 * column): each item's rate, fee, tax on the fee and total. Hidden when no
 * commission was charged.
 */
const meta = {
  title: 'Admin dashboard/Orders/Order commission lines card',
  component: CommissionLinesCard,
  tags: ['CMP-DA-G-11'],
  args: { order: harbourOrder },
  decorators: [withStore],
  parameters: main(),
} satisfies Meta<typeof CommissionLinesCard>

export default meta
type Story = StoryObj<typeof meta>

export const Lines: Story = { name: 'A percentage rate with tax' }
export const NoneCharged: Story = {
  name: 'None charged (hidden)',
  parameters: main(noCommissionLines),
}
export const Loading: Story = {
  name: 'Loading (hidden)',
  parameters: main(readHeld('commission_lines')),
}
// What a role without a seller scope sees on every seller's order (work item §2.7).
export const Failed: Story = {
  name: 'Failing to load',
  parameters: main(readFailed('commission_lines')),
  play: async () => {
    await screen.findByText('Failed to load', undefined, { timeout: 20_000 })
  },
}
