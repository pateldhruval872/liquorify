import type { Order } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { HttpHandler } from 'msw'
import { screen, userEvent, within } from 'storybook/test'
import {
  FeesCard,
  OrderDiscountsCard,
  TaxLinesCard,
} from '../../../../../dashboard/src/components/spree/orders/order-adjustments-cards'
import { withStore } from '../../../decorators/store'
import {
  discountedOrder,
  draftOrder,
  exchangeFee,
  giftWrapFee,
  includedTaxLines,
  insuranceFee,
  manualDiscount,
  paidOrder,
  promotionDiscount,
  reasonedTaxLines,
  vatIncludedOrder,
} from '../../../fixtures/admin/orders'
import {
  adjustmentLinesFailed,
  adjustmentLinesHeld,
  type OrderLines,
  orderWriteHeld,
} from '../../../mocks/handlers/admin/orders'
import { orderParameters } from './order-page'

const cards = { taxes: TaxLinesCard, discounts: OrderDiscountsCard, fees: FeesCard }

/**
 * Three cards in an order's main column (DA-ORD-04), each listing one kind of
 * adjustment row the order's totals carry: its taxes, grouped by rate and
 * treatment; its discounts, from promotions and added by hand; and its fees.
 */
function AdjustmentsCard({ card, order }: { card: keyof typeof cards; order: Order }) {
  const Card = cards[card]
  return <Card order={order} />
}

const meta = {
  title: 'Admin dashboard/Orders/Order adjustments cards',
  component: AdjustmentsCard,
  tags: ['CMP-DA-G-11'],
  args: { card: 'taxes', order: paidOrder },
  decorators: [withStore],
  parameters: orderParameters({ column: 'main' }),
} satisfies Meta<typeof AdjustmentsCard>

export default meta
type Story = StoryObj<typeof meta>

const page = (order: Order, lines: OrderLines = {}, viewport = false, first: HttpHandler[] = []) =>
  orderParameters({ order, column: 'main', viewport, first, lines: { [order.id]: lines } })

const discounted = { discounts: [promotionDiscount, manualDiscount] }
const withFees = { fees: [giftWrapFee, exchangeFee, insuranceFee] }

// Oregon's rate is charged on each item and on delivery; the item rows collapse into one.
export const TaxesAdded: Story = { name: 'Taxes, added' }

export const TaxesIncluded: Story = {
  name: 'Taxes, included in prices',
  args: { order: vatIncludedOrder },
  parameters: page(vatIncludedOrder, { taxLines: includedTaxLines }),
}

// A zero-rated line and an exempt one each keep their own row and reason.
export const TaxabilityReasons: Story = {
  name: 'Taxes, with reasons',
  parameters: page(paidOrder, { taxLines: reasonedTaxLines }),
}

// A placed order with no tax rows had no rate for its address.
export const TaxesUnmatched: Story = {
  name: 'Taxes, no rate matched',
  parameters: page(paidOrder, { taxLines: [] }),
}

export const TaxesDraft: Story = {
  name: 'Taxes, none on a draft',
  args: { order: draftOrder },
  parameters: page(draftOrder, { taxLines: [] }),
}

export const TaxesLoading: Story = {
  name: 'Taxes, loading',
  parameters: orderParameters({ column: 'main', first: adjustmentLinesHeld }),
}

export const TaxesFailed: Story = {
  name: 'Taxes, failed to load',
  parameters: orderParameters({ column: 'main', first: adjustmentLinesFailed }),
}

export const NoDiscounts: Story = { name: 'Discounts, none', args: { card: 'discounts' } }

// A promotion's row cannot be deleted; a discount added by hand can.
export const Discounts: Story = {
  args: { card: 'discounts', order: discountedOrder },
  parameters: page(discountedOrder, discounted),
}

export const DeleteDiscount: Story = {
  name: 'Discounts, delete confirmation',
  args: { card: 'discounts', order: discountedOrder },
  parameters: page(discountedOrder, discounted, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await screen.findByText(/Remove the discount "Goodwill for the late delivery"/)
  },
}

const openAddDiscount = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Add discount' }))
  return screen.findByRole('dialog')
}

export const AddDiscountAmount: Story = {
  name: 'Add discount, by amount',
  args: { card: 'discounts' },
  parameters: page(paidOrder, {}, true),
  play: async () => {
    const dialog = await openAddDiscount()
    await userEvent.type(within(dialog).getByLabelText('Label'), 'Goodwill for the late delivery')
    await userEvent.type(within(dialog).getByLabelText('Value'), '5')
  },
}

// A percentage previews what it takes off the lines it applies to.
export const AddDiscountPercent: Story = {
  name: 'Add discount, by percent',
  args: { card: 'discounts' },
  parameters: page(paidOrder, {}, true),
  play: async () => {
    const dialog = await openAddDiscount()
    await userEvent.type(within(dialog).getByLabelText('Label'), 'Wholesale trial')
    await userEvent.type(within(dialog).getByLabelText('Value'), '15')
    const selects = within(dialog).getAllByRole('combobox')
    await userEvent.click(selects[0])
    await userEvent.click(await screen.findByRole('option', { name: 'Percent' }))
    await within(dialog).findByText('Estimated discount: $12.90')
  },
}

export const AddDiscountTargets: Story = {
  name: 'Add discount, choosing a line',
  args: { card: 'discounts' },
  parameters: page(paidOrder, {}, true),
  play: async () => {
    const dialog = await openAddDiscount()
    const selects = within(dialog).getAllByRole('combobox')
    await userEvent.click(selects[1])
    await screen.findByRole('option', { name: 'Linen apron' })
  },
}

export const AddDiscountSaving: Story = {
  name: 'Add discount, saving',
  args: { card: 'discounts' },
  parameters: page(paidOrder, {}, true, orderWriteHeld('post', 'orders/:id/discounts')),
  play: async () => {
    const dialog = await openAddDiscount()
    await userEvent.type(within(dialog).getByLabelText('Label'), 'Goodwill')
    await userEvent.type(within(dialog).getByLabelText('Value'), '5')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add discount' }))
    await within(dialog).findByRole('button', { name: 'Saving…' })
  },
}

export const NoFees: Story = { name: 'Fees, none', args: { card: 'fees' } }

// The exchange row is Spree's own; the insurance kind came from an extension.
export const Fees: Story = {
  args: { card: 'fees' },
  parameters: page(paidOrder, withFees),
}

export const DeleteFee: Story = {
  name: 'Fees, delete confirmation',
  args: { card: 'fees' },
  parameters: page(paidOrder, { fees: [giftWrapFee] }, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await screen.findByText(/Remove the fee "Gift wrap"/)
  },
}

export const AddFee: Story = {
  name: 'Add fee',
  args: { card: 'fees' },
  parameters: page(paidOrder, {}, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Add fee' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Label'), 'Gift wrap')
    await userEvent.type(within(dialog).getByLabelText('Amount'), '4.50')
    const selects = within(dialog).getAllByRole('combobox')
    await userEvent.click(selects[0])
    await screen.findByRole('option', { name: 'Cash on delivery' })
  },
}
