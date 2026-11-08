import { Card } from '@spree/dashboard-ui/ui/card'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShippingDocuments } from '../../../../../dashboard/src/components/spree/orders/shipping-documents'
import { withStore } from '../../../decorators/store'
import { customsDocuments } from '../../../fixtures/admin/after-sale'
import { orderParameters } from './order-page'

/**
 * The paperwork a carrier files beside a label (DA-ORD-04), such as a
 * commercial invoice and a customs form for a parcel crossing a border. The
 * carrier hosts the files, so each opens in a new tab. Only a carrier
 * provider files any: with none connected the order page shows none.
 */
const meta = {
  title: 'Admin dashboard/Orders/Shipping documents',
  component: ShippingDocuments,
  tags: ['CMP-DA-G-11'],
  args: { documents: customsDocuments },
  decorators: [
    withStore,
    (Story) => (
      <Card variant="nested">
        <Story />
      </Card>
    ),
  ],
  parameters: orderParameters({ column: 'inMainCard' }),
} satisfies Meta<typeof ShippingDocuments>

export default meta
type Story = StoryObj<typeof meta>

// A kind Spree has no name for reads as the carrier wrote it.
export const Customs: Story = {}

export const One: Story = {
  args: { documents: [customsDocuments[0]] },
}
