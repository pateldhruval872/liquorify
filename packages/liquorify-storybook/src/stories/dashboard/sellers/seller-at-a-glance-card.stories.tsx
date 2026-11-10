import type { Meta, StoryObj } from '@storybook/react-vite'
import { SellerAtAGlanceCard } from '../../../../../dashboard/src/components/spree/sellers/seller-at-a-glance-card'
import { withStore } from '../../../decorators/store'
import { fennelOak, harbourCask } from '../../../fixtures/admin/marketplace'
import { sellerParameters } from './seller-page'

/** How many products and team members a seller has, and when it was created (DA-SEL-02). */
const meta = {
  title: 'Admin dashboard/Sellers/Seller at a glance card',
  component: SellerAtAGlanceCard,
  tags: ['CMP-DA-G-18'],
  args: { seller: harbourCask },
  decorators: [withStore],
  parameters: sellerParameters({ column: 'sidebar' }),
} satisfies Meta<typeof SellerAtAGlanceCard>

export default meta
type Story = StoryObj<typeof meta>

export const Trading: Story = {}
export const New: Story = { name: 'New seller', args: { seller: fennelOak } }
