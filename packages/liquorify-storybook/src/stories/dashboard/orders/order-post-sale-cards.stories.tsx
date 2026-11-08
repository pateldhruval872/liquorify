import type { Claim, Exchange, Order } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import {
  OrderClaimsCard,
  OrderExchangesCard,
} from '../../../../../dashboard/src/components/spree/order-post-sale-cards'
import { withStore } from '../../../decorators/store'
import {
  approvedClaim,
  approvedExchange,
  awaitingOrder,
  canceledClaim,
  canceledExchange,
  deniedClaim,
  evenExchange,
  fulfilledExchange,
  openClaim,
  receivedExchange,
  replacementClaim,
  requestedExchange,
  resolvedRefundClaim,
  resolvedReplacementClaim,
  shippedOrder,
  twoLineClaim,
  unpricedClaim,
} from '../../../fixtures/admin/after-sale'
import { orderParameters } from './order-page'

const cards = { exchanges: OrderExchangesCard, claims: OrderClaimsCard }

/**
 * The order page's exchanges and claims (DA-ORD-04). An exchange swaps what
 * came back for another variant and shows the difference in price; a claim
 * asks for a refund or a replacement for ordered items, whether or not they
 * shipped, and is settled when it is resolved.
 */
function PostSaleCard({ card, order }: { card: keyof typeof cards; order: Order }) {
  const Card = cards[card]
  return <Card order={order} />
}

const meta = {
  title: 'Admin dashboard/Orders/Order post-sale cards',
  component: PostSaleCard,
  tags: ['CMP-DA-G-24'],
  args: { card: 'exchanges', order: shippedOrder },
  decorators: [withStore],
  parameters: orderParameters({ order: shippedOrder, column: 'main' }),
} satisfies Meta<typeof PostSaleCard>

export default meta
type Story = StoryObj<typeof meta>

const exchanges = (records: Exchange[], viewport = false, order: Order = shippedOrder) => ({
  args: { card: 'exchanges' as const, order },
  parameters: orderParameters({
    order,
    column: 'main',
    viewport,
    afterSale: { [order.id]: { exchanges: records } },
  }),
})
const claims = (records: Claim[], viewport = false) => ({
  args: { card: 'claims' as const, order: shippedOrder },
  parameters: orderParameters({
    order: shippedOrder,
    column: 'main',
    viewport,
    afterSale: { [shippedOrder.id]: { claims: records } },
  }),
})
const openMenu = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
}
const choose = async (item: string) => {
  await openMenu()
  await userEvent.click(await screen.findByRole('menuitem', { name: item }))
}

// ---------------------------------------------------------------------------
// Exchanges
// ---------------------------------------------------------------------------

export const NoExchanges: Story = {
  name: 'Exchanges, none',
  ...exchanges([]),
}

export const NothingToExchange: Story = {
  name: 'Exchanges, nothing to exchange',
  ...exchanges([], false, awaitingOrder),
}

export const ExchangeRequestedMenu: Story = {
  name: 'Exchange requested, menu open',
  ...exchanges([requestedExchange], true),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Approve' })
  },
}

export const ExchangeCancelConfirmation: Story = {
  name: 'Exchange, cancel confirmation',
  ...exchanges([requestedExchange], true),
  play: async () => {
    await choose('Cancel')
    await screen.findByRole('button', { name: 'Cancel exchange' })
  },
}

export const ExchangeApprovedMenu: Story = {
  name: 'Exchange approved, menu open',
  ...exchanges([approvedExchange], true),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Receive items' })
  },
}

// The slate apron costs $6.00 more than the olive one that came back.
export const ExchangeReceived: Story = {
  name: 'Exchange received, costs more',
  ...exchanges([receivedExchange]),
}

// Shipping it leaves the customer owing the difference, so it asks first.
export const ExchangeBalanceDue: Story = {
  name: 'Exchange, balance due confirmation',
  ...exchanges([receivedExchange], true),
  play: async () => {
    await choose('Ship replacement')
    await screen.findByText(/The replacement costs more than what came back/)
  },
}

export const ExchangeEven: Story = {
  name: 'Exchange received, same price',
  ...exchanges([evenExchange]),
}

export const ExchangeEveryStatus: Story = {
  name: 'Exchanges, every status',
  ...exchanges([
    requestedExchange,
    approvedExchange,
    receivedExchange,
    fulfilledExchange,
    canceledExchange,
  ]),
}

export const NewExchange: Story = {
  name: 'New exchange',
  ...exchanges([], true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'New exchange' }))
    await screen.findByRole('heading', { name: 'New exchange' })
  },
}

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

export const NoClaims: Story = {
  name: 'Claims, none',
  ...claims([]),
}

export const ClaimOpenMenu: Story = {
  name: 'Claim open, menu open',
  ...claims([openClaim], true),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Deny' })
  },
}

export const ClaimDenyConfirmation: Story = {
  name: 'Claim, deny confirmation',
  ...claims([openClaim], true),
  play: async () => {
    await choose('Deny')
    await screen.findByText(/Deny this claim\?/)
  },
}

export const ClaimCancelConfirmation: Story = {
  name: 'Claim, cancel confirmation',
  ...claims([openClaim], true),
  play: async () => {
    await choose('Cancel')
    await screen.findByRole('button', { name: 'Cancel claim' })
  },
}

export const ClaimApprovedMenu: Story = {
  name: 'Claim approved, menu open',
  ...claims([approvedClaim], true),
  play: async () => {
    await openMenu()
    await screen.findByRole('menuitem', { name: 'Resolve' })
  },
}

export const Resolving: Story = {
  name: 'Claim, resolve',
  ...claims([approvedClaim], true),
  play: async () => {
    await choose('Resolve')
    await screen.findByRole('heading', { name: 'Resolve claim' })
  },
}

// Opened with no amount: resolving offers what the customer paid.
export const ResolvingUnpriced: Story = {
  name: 'Claim with no amount, resolve',
  ...claims([unpricedClaim], true),
  play: async () => {
    await choose('Resolve')
    await screen.findByDisplayValue('25.92')
  },
}

export const ResolvingReplacement: Story = {
  name: 'Claim asking for a replacement, resolve',
  ...claims([replacementClaim], true),
  play: async () => {
    await choose('Resolve')
    await screen.findByRole('heading', { name: 'Resolve claim' })
  },
}

export const TwoLines: Story = {
  name: 'Claim, two lines',
  ...claims([twoLineClaim]),
}

// The card shows the refund the claim asked for, whatever the resolution paid.
export const ResolvedByRefund: Story = {
  name: 'Claim resolved by refund',
  ...claims([resolvedRefundClaim]),
}

// Settled with a replacement, yet the card still reads as a refund total.
export const ResolvedByReplacement: Story = {
  name: 'Claim resolved by replacement',
  ...claims([resolvedReplacementClaim]),
}

export const ClaimEveryStatus: Story = {
  name: 'Claims, every status',
  ...claims([openClaim, approvedClaim, resolvedRefundClaim, deniedClaim, canceledClaim]),
}

export const NewClaim: Story = {
  name: 'New claim',
  ...claims([], true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'New claim' }))
    await screen.findByRole('heading', { name: 'New claim' })
  },
}
