import type { Claim, Order } from '@spree/admin-sdk'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, screen, userEvent, within } from 'storybook/test'
import {
  CreateClaimDialog,
  CreateExchangeDialog,
  CreateReturnDialog,
  ResolveClaimDialog,
} from '../../../../../dashboard/src/components/spree/post-sale-create-dialogs'
import { withStore } from '../../../decorators/store'
import {
  approvedClaim,
  replacementClaim,
  shippedOrder,
  twoLineClaim,
  unpricedClaim,
} from '../../../fixtures/admin/after-sale'
import { orderParameters } from './order-page'

/**
 * What the order page's returns, exchanges and claims open (DA-ORD-04), as
 * the admin dashboard fills the shared dialogs: the store's return and claim
 * reasons, its locations with those that refuse returns marked and listed
 * last, the replacement variant searched from the catalog, and the amount a
 * claim is resolved for.
 */
function PostSaleDialog({
  dialog,
  order,
  claim,
}: {
  dialog: 'return' | 'exchange' | 'claim' | 'resolve'
  order: Order
  claim: Claim
}) {
  const close = fn()
  const submit = fn()
  if (dialog === 'return')
    return <CreateReturnDialog order={order} onClose={close} onSubmit={submit} />
  if (dialog === 'exchange')
    return <CreateExchangeDialog order={order} onClose={close} onSubmit={submit} />
  if (dialog === 'claim')
    return <CreateClaimDialog order={order} onClose={close} onSubmit={submit} />
  return <ResolveClaimDialog claim={claim} onClose={close} onSubmit={submit} />
}

const meta = {
  title: 'Admin dashboard/Orders/Post-sale create dialogs',
  component: PostSaleDialog,
  tags: ['CMP-DA-G-24'],
  args: { dialog: 'return', order: shippedOrder, claim: approvedClaim },
  decorators: [withStore],
  parameters: orderParameters({ order: shippedOrder, viewport: true }),
} satisfies Meta<typeof PostSaleDialog>

export default meta
type Story = StoryObj<typeof meta>

const open = async (name: string) => {
  const dialog = await screen.findByRole('dialog')
  await userEvent.click(await within(dialog).findByRole('combobox', { name }))
}

// ---------------------------------------------------------------------------
// Return
// ---------------------------------------------------------------------------

export const NewReturn: Story = {
  name: 'Return',
  play: async () => {
    await screen.findByRole('heading', { name: 'New return' })
  },
}

export const ReturnReasons: Story = {
  name: 'Return, reasons open',
  play: async () => {
    await open('Reason')
    await screen.findAllByRole('option')
  },
}

// Two locations refuse returns: they are marked and come last.
export const ReturnLocations: Story = {
  name: 'Return, locations open',
  play: async () => {
    await open('Return to')
    await screen.findByRole('option', { name: 'East coast depot (does not accept returns)' })
  },
}

// ---------------------------------------------------------------------------
// Exchange
// ---------------------------------------------------------------------------

export const NewExchange: Story = {
  name: 'Exchange',
  args: { dialog: 'exchange' },
  play: async () => {
    await screen.findByRole('heading', { name: 'New exchange' })
  },
}

// A unit counted in asks for its replacement, searched from the catalog.
export const ExchangeReplacement: Story = {
  name: 'Exchange, replacement searched',
  args: { dialog: 'exchange' },
  play: async () => {
    const dialog = await screen.findByRole('dialog')
    const [first] = within(dialog).getAllByRole('spinbutton')
    await userEvent.clear(first)
    await userEvent.type(first, '1')
    const [replacement] = await within(dialog).findAllByRole('combobox')
    await userEvent.type(replacement, 'apron')
    await screen.findAllByRole('option')
  },
}

// ---------------------------------------------------------------------------
// Claim
// ---------------------------------------------------------------------------

export const NewClaim: Story = {
  name: 'Claim',
  args: { dialog: 'claim' },
  play: async () => {
    await screen.findByRole('heading', { name: 'New claim' })
  },
}

// One mug claimed: the amount offered is what the customer paid for it.
export const ClaimOneMug: Story = {
  name: 'Claim, one mug',
  args: { dialog: 'claim' },
  play: async () => {
    const mugs = await screen.findByRole('spinbutton', { name: /^Clay mug/ })
    await userEvent.clear(mugs)
    await userEvent.type(mugs, '1')
  },
}

export const ClaimReasons: Story = {
  name: 'Claim, reasons open',
  args: { dialog: 'claim' },
  play: async () => {
    await open('Reason')
    await screen.findAllByRole('option')
  },
}

// ---------------------------------------------------------------------------
// Resolve
// ---------------------------------------------------------------------------

export const Resolve: Story = {
  args: { dialog: 'resolve' },
  play: async () => {
    await screen.findByRole('heading', { name: 'Resolve claim' })
  },
}

// Opened with no amount, so the refund offered is what the customer paid.
export const ResolveUnpriced: Story = {
  name: 'Resolve, claim with no amount',
  args: { dialog: 'resolve', claim: unpricedClaim },
  play: async () => {
    await screen.findByDisplayValue('25.92')
  },
}

export const ResolveReplacement: Story = {
  name: 'Resolve, replacement asked for',
  args: { dialog: 'resolve', claim: replacementClaim },
  play: async () => {
    await screen.findByRole('heading', { name: 'Resolve claim' })
  },
}

export const ResolveTwoLines: Story = {
  name: 'Resolve, two lines',
  args: { dialog: 'resolve', claim: twoLineClaim },
  play: async () => {
    await screen.findByRole('heading', { name: 'Resolve claim' })
  },
}
