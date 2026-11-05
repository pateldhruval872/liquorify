import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import { OrderDigitalLinksCard } from '../../../../../dashboard/src/components/spree/order-digital-links-card'
import { withStore } from '../../../decorators/store'
import { digitalOrder } from '../../../fixtures/admin/orders'
import { orderWriteHeld } from '../../../mocks/handlers/admin/orders'
import { orderParameters } from './order-page'

/**
 * The download links an order's digital items carry (DA-ORD-04): each file,
 * how many of its downloads are used, when it expires and whether it still
 * works, with a reset that gives the customer a fresh allowance and a resend
 * of the email that delivers them (EM-C-07).
 */
const meta = {
  title: 'Admin dashboard/Orders/Order digital links card',
  component: OrderDigitalLinksCard,
  tags: ['CMP-DA-G-24'],
  args: { order: digitalOrder },
  decorators: [withStore],
  parameters: orderParameters({ order: digitalOrder, column: 'main' }),
} satisfies Meta<typeof OrderDigitalLinksCard>

export default meta
type Story = StoryObj<typeof meta>

// Available, expired, used up, and one with no expiry.
export const Links: Story = {}

export const ResetConfirmation: Story = {
  name: 'Reset confirmation',
  parameters: orderParameters({ order: digitalOrder, column: 'main', viewport: true }),
  play: async () => {
    const [, expired] = await screen.findAllByRole('button', { name: 'Reset' })
    await userEvent.click(expired)
    await screen.findByText(/fresh set of downloads for "kiln-schedule.pdf"/)
  },
}

export const Resending: Story = {
  parameters: orderParameters({
    order: digitalOrder,
    column: 'main',
    first: orderWriteHeld('post', 'orders/:id/resend_digital_links'),
  }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Resend email' }))
  },
}
