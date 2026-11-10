import type { Meta, StoryObj } from '@storybook/react-vite'
import { ReadRow } from '../../../../../dashboard/src/components/spree/sellers/seller-read-row'
import { sellerParameters } from './seller-page'

/** One label and value on a seller's read-only cards, or "Not provided" when there is none. */
const meta = {
  title: 'Admin dashboard/Sellers/Seller read row',
  component: ReadRow,
  tags: ['CMP-DA-G-18'],
  args: { label: 'Registration number', children: 'SC612044' },
  parameters: sellerParameters({ column: 'inSidebarCard' }),
} satisfies Meta<typeof ReadRow>

export default meta
type Story = StoryObj<typeof meta>

export const Value: Story = {}
export const NotProvided: Story = { name: 'Not provided', args: { children: null } }
