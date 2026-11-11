import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent, within } from 'storybook/test'
import { DiscountsCard } from '../../../../../dashboard/src/components/spree/orders/order-discounts-sidebar-card'
import { withStore } from '../../../decorators/store'
import {
  discountedOrder,
  draftOrder,
  draftWithCodeOrder,
  giftCardOrder,
  orderGiftCard,
  paidOrder,
} from '../../../fixtures/admin/orders'
import { discountCodeRefused, giftCardRefused } from '../../../mocks/handlers/admin/orders'
import { orderParameters } from './order-page'

/**
 * The sidebar's discount code and gift card (DA-ORD-04). A code is applied or
 * removed only while the order is a draft; a gift card at any time.
 */
const meta = {
  title: 'Admin dashboard/Orders/Order discounts sidebar card',
  component: DiscountsCard,
  tags: ['CMP-DA-G-11'],
  args: { order: paidOrder },
  decorators: [withStore],
  parameters: orderParameters({ column: 'sidebar' }),
} satisfies Meta<typeof DiscountsCard>

export default meta
type Story = StoryObj<typeof meta>

const buttons = async () => screen.findAllByRole('button', { name: 'Apply' })

// Placed: the code is fixed, so only a gift card can be applied.
export const PlacedNoneApplied: Story = { name: 'Placed, none applied' }

export const PlacedApplied: Story = {
  name: 'Placed, code and gift card applied',
  args: { order: { ...discountedOrder, gift_card: orderGiftCard, gift_card_total: '25.00' } },
  parameters: orderParameters({ order: discountedOrder, column: 'sidebar' }),
}

export const DraftNoneApplied: Story = {
  name: 'Draft, none applied',
  args: { order: draftOrder },
  parameters: orderParameters({ order: draftOrder, column: 'sidebar' }),
}

// A code no promotion has taken up yet waits until the order qualifies.
export const DraftCodePending: Story = {
  name: 'Draft, code waiting to apply',
  args: { order: draftWithCodeOrder },
  parameters: orderParameters({ order: draftWithCodeOrder, column: 'sidebar' }),
}

export const GiftCardApplied: Story = {
  name: 'Gift card applied',
  args: { order: giftCardOrder },
  parameters: orderParameters({ order: giftCardOrder, column: 'sidebar' }),
}

export const CodeDialog: Story = {
  name: 'Code dialog, coupon promotions',
  args: { order: draftOrder },
  parameters: orderParameters({ order: draftOrder, column: 'sidebar', viewport: true }),
  play: async () => {
    const [codeButton] = await buttons()
    await userEvent.click(codeButton)
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(await within(dialog).findByRole('button', { name: /Loyal shoppers/ }))
  },
}

export const CodeRefused: Story = {
  name: 'Code dialog, code refused',
  args: { order: draftOrder },
  parameters: orderParameters({
    order: draftOrder,
    column: 'sidebar',
    viewport: true,
    first: discountCodeRefused,
  }),
  play: async () => {
    const [codeButton] = await buttons()
    await userEvent.click(codeButton)
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Code'), 'NOPE10')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }))
    await within(dialog).findByText(/doesn't exist/)
  },
}

export const RemoveCode: Story = {
  name: 'Remove code confirmation',
  args: { order: draftWithCodeOrder },
  parameters: orderParameters({ order: draftWithCodeOrder, column: 'sidebar', viewport: true }),
  play: async () => {
    const [removeCode] = await screen.findAllByRole('button', { name: 'Remove' })
    await userEvent.click(removeCode)
    await screen.findByText('Remove the discount code from this order?')
  },
}

export const GiftCardDialog: Story = {
  name: 'Gift card dialog',
  parameters: orderParameters({ column: 'sidebar', viewport: true }),
  play: async () => {
    const [giftButton] = await buttons()
    await userEvent.click(giftButton)
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Code'), 'GIFT-7QK2-M4PZ')
  },
}

// The server refuses an unknown code; the dialog stays open and says why.
export const GiftCardRefused: Story = {
  name: 'Gift card dialog, code refused',
  parameters: orderParameters({ column: 'sidebar', viewport: true, first: giftCardRefused }),
  play: async () => {
    const [giftButton] = await buttons()
    await userEvent.click(giftButton)
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Code'), 'GIFT-0000-0000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }))
    await within(dialog).findByText('The Gift Card was not found.')
  },
}

export const RemoveGiftCard: Story = {
  name: 'Remove gift card confirmation',
  args: { order: giftCardOrder },
  parameters: orderParameters({ order: giftCardOrder, column: 'sidebar', viewport: true }),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    await screen.findByText('Remove this gift card from the order?')
  },
}
