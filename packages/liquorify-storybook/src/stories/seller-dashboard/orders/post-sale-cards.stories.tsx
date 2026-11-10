import type { Meta, StoryObj } from '@storybook/react-vite'
import { screen, userEvent } from 'storybook/test'
import {
  ClaimsCard,
  ExchangesCard,
} from '../../../../../seller-dashboard/src/components/orders/post-sale-cards'
import { partialOrder, partialOrderClaims } from '../../../fixtures/seller/orders'
import { panelParameters } from '../seller-panel'
import { claimIn, exchangeIn } from './post-sale-fixtures'

const card = (records: Parameters<typeof panelParameters>[0] = {}, viewport = false) =>
  panelParameters({
    page: 'orders/$orderId',
    path: `orders/${partialOrder.id}`,
    column: 'main',
    viewport,
    ...records,
  })

/** Damage and loss the customer reported, and swaps (SP-ORD-02's main column). */
const meta = {
  title: 'Seller panel/Orders/Post-sale cards',
  component: ClaimsCard,
  tags: ['CMP-SP-G-02'],
  args: { order: partialOrder },
  parameters: card(),
} satisfies Meta<typeof ClaimsCard>

export default meta
type Story = StoryObj<typeof meta>

export const ClaimOpen: Story = { name: 'Claim, open with a partial refund' }

export const ClaimApproved: Story = {
  name: 'Claim, approved',
  parameters: card({ claims: [claimIn('approved', { approved_at: '2026-10-01T10:00:00.000Z' })] }),
}

export const ClaimResolved: Story = {
  name: 'Claim, resolved',
  parameters: card({
    claims: [
      claimIn('resolved', { resolution: 'refund', resolved_at: '2026-10-01T11:00:00.000Z' }),
    ],
  }),
}

export const ClaimDenied: Story = {
  name: 'Claim, denied',
  parameters: card({ claims: [claimIn('denied', { denied_at: '2026-10-01T11:00:00.000Z' })] }),
}

export const NoClaims: Story = { name: 'Claims, none', parameters: card({ claims: [] }) }

export const ClaimMenu: Story = {
  name: 'Claim actions',
  parameters: card({ claims: partialOrderClaims }, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await screen.findByRole('menuitem', { name: 'Deny' })
  },
}

export const DenyConfirm: Story = {
  name: 'Claim, deny confirmation',
  parameters: card({ claims: partialOrderClaims }, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Deny' }))
    await screen.findByText('Deny this claim?')
  },
}

export const Resolving: Story = {
  name: 'Claim, resolving',
  parameters: card({ claims: [claimIn('approved')] }, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Resolve' }))
    await screen.findByRole('dialog')
  },
}

export const ExchangeRequested: Story = {
  name: 'Exchange, requested',
  render: (args) => <ExchangesCard {...args} />,
  parameters: card({ exchanges: [exchangeIn('requested')] }),
}

export const ExchangeReceived: Story = {
  name: 'Exchange, received, replacement costs more',
  render: (args) => <ExchangesCard {...args} />,
  parameters: card({ exchanges: [exchangeIn('received', { price_difference: '6.00' })] }),
}

export const ExchangeFulfilled: Story = {
  name: 'Exchange, replacement sent',
  render: (args) => <ExchangesCard {...args} />,
  parameters: card({ exchanges: [exchangeIn('fulfilled')] }),
}

/** The card draws nothing while the order has no exchange. */
export const NoExchanges: Story = {
  name: 'Exchanges, none',
  render: (args) => <ExchangesCard {...args} />,
}

export const BalanceDueConfirm: Story = {
  name: 'Exchange, balance due confirmation',
  render: (args) => <ExchangesCard {...args} />,
  parameters: card({ exchanges: [exchangeIn('received', { price_difference: '6.00' })] }, true),
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: 'Actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Send replacement' }))
    await screen.findByText(/adds the difference to the order/)
  },
}
